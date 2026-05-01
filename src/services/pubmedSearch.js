// src/services/pubmedSearch.js
// PubMed E-utilities - No API key required (3 req/sec), free key available
// https://www.ncbi.nlm.nih.gov/books/NBK25501/

const ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

/**
 * Search PubMed for articles
 * @param {string} query - Search query
 * @param {number} maxResults - Max number of articles (default 5)
 * @returns {Promise<Array<{pmid, title, abstract, authors, journal, pubDate}>>}
 */
export async function searchPubMed(query, maxResults = 5) {
  try {
    // Step 1: Search for PMIDs
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmode: 'json',
      retmax: maxResults.toString(),
      sort: 'relevance'
    });

    const searchResp = await fetch(`${ESEARCH_URL}?${searchParams}`);
    if (!searchResp.ok) throw new Error(`PubMed search: ${searchResp.status}`);

    const searchData = await searchResp.json();
    const idList = searchData.esearchresult?.idlist || [];

    if (idList.length === 0) return [];

    // Step 2: Fetch article details
    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      id: idList.join(','),
      retmode: 'xml',
      rettype: 'abstract'
    });

    const fetchResp = await fetch(`${EFETCH_URL}?${fetchParams}`);
    if (!fetchResp.ok) throw new Error(`PubMed fetch: ${fetchResp.status}`);

    const xmlText = await fetchResp.text();
    return parsePubmedXML(xmlText);
  } catch (err) {
    console.error('PubMed search failed:', err);
    return [];
  }
}

/**
 * Parse PubMed XML response to structured data
 */
function parsePubmedXML(xml) {
  const articles = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  const pubmedArticles = doc.querySelectorAll('PubmedArticle');

  pubmedArticles.forEach(article => {
    const pmid = article.querySelector('PMID')?.textContent || '';
    const title = article.querySelector('ArticleTitle')?.textContent || '';
    const abstractEl = article.querySelector('AbstractText');
    const abstract = abstractEl ? abstractEl.textContent : '';

    // Authors
    const authorList = article.querySelectorAll('Author');
    const authors = [];
    authorList.forEach(a => {
      const ln = a.querySelector('LastName')?.textContent || '';
      const fn = a.querySelector('ForeName')?.textContent || '';
      if (ln || fn) authors.push(`${fn} ${ln}`.trim());
    });

    // Journal
    const journal = article.querySelector('Journal Title')?.textContent ||
                    article.querySelector('ISOAbbreviation')?.textContent ||
                    'Unknown Journal';

    // Publication date
    const pubDateEl = article.querySelector('PubDate');
    const year = pubDateEl?.querySelector('Year')?.textContent || '';
    const month = pubDateEl?.querySelector('Month')?.textContent || '';
    const day = pubDateEl?.querySelector('Day')?.textContent || '';
    const pubDate = [year, month, day].filter(Boolean).join('-');

    articles.push({
      pmid,
      title: title.trim(),
      abstract: abstract.trim().substring(0, 500),
      authors,
      journal: journal.trim(),
      pubDate,
      source: 'PubMed',
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
    });
  });

  return articles;
}

/**
 * Get article by PMID
 */
export async function getPubMedById(pmid) {
  try {
    const params = new URLSearchParams({
      db: 'pubmed',
      id: pmid,
      retmode: 'xml',
      rettype: 'abstract'
    });

    const resp = await fetch(`${EFETCH_URL}?${params}`);
    if (!resp.ok) throw new Error(`PubMed fetch: ${resp.status}`);

    const xml = await resp.text();
    const articles = parsePubmedXML(xml);
    return articles[0] || null;
  } catch (err) {
    console.error('PubMed get by ID failed:', err);
    return null;
  }
}

export default {
  searchPubMed,
  getPubMedById
};
