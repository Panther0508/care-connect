import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { pipeline, env } from '@xenova/transformers';

// ── Configuration ─────────────────────────────────────────────────────────────

// The source Excel file MUST be placed in the scripts/ folder.
// This is the official VF_Hackathon_Dataset_India_Large.xlsx provided by the
// Virtue Foundation × Databricks challenge organisers.
const EXCEL_PATH = path.join(process.cwd(), 'scripts', 'VF_Hackathon_Dataset_India_Large.xlsx');

// Output paths
const OFFLINE_OUTPUT_PATH = path.join(process.cwd(), 'public', 'facilities_offline.json');
const ENRICHED_OUTPUT_PATH = path.join(process.cwd(), 'public', 'enriched_dataset.json');

// Skip browser download checks – we're running in Node
env.allowLocalModels = false;
env.useBrowserCache = false;

// ── Helper Functions ───────────────────────────────────────────────────────────

function parseArrayField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(v => v);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(v => v);
      } catch { /* fall back to string split */ }
    }
    return value.split(/[;,]/).map(v => v.trim()).filter(v => v.length > 0);
  }
  return [];
}

function generateId(index) {
  return `fac-${String(index + 1).padStart(4, '0')}`;
}

// ── Main Enrichment Process ───────────────────────────────────────────────────

async function enrich() {
  console.log('='.repeat(60));
  console.log('VitaChain Dataset Enrichment');
  console.log('='.repeat(60));

  // 1. Read Excel
  console.log(`\n[1/4] Reading Excel file: ${EXCEL_PATH}`);
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('ERROR: Excel file not found!');
    console.error(`Please place VF_Hackathon_Dataset_India_Large.xlsx in: ${path.dirname(EXCEL_PATH)}`);
    console.error('Download it from the Virtue Foundation × Databricks challenge resource page.');
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`       Loaded ${rows.length} rows from sheet "${sheetName}".`);

  // 2. Extract and clean fields
  console.log('\n[2/4] Extracting and cleaning fields...');
  const facilities = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name || row.Name || row.Facility_Name || '';
    if (!name) continue;

    const description = row.description || row.Description || row.summary || '';

    facilities.push({
      id: generateId(facilities.length),
      name: String(name).trim(),
      description: String(description).trim(),
      specialties: parseArrayField(row.specialties || row.Specialties),
      procedure: parseArrayField(row.procedure || row.Procedures || row.Services),
      equipment: parseArrayField(row.equipment || row.Equipment),
      capability: parseArrayField(row.capability || row.Capabilities),
      address_line1: String(row.address_line1 || '').trim(),
      address_city: String(row.address_city || row.City || row.city || '').trim(),
      address_stateOrRegion: String(row.address_stateOrRegion || row.State || row.state || '').trim(),
      address_zipOrPostcode: String(row.address_zipOrPostcode || '').trim(),
      address_country: String(row.address_country || '').trim(),
      latitude: row.latitude != null ? parseFloat(row.latitude) : null,
      longitude: row.longitude != null ? parseFloat(row.longitude) : null,
      phone_numbers: parseArrayField(row.phone_numbers || row.officialPhone),
      email: String(row.email || ''),
      websites: parseArrayField(row.websites || row.officialWebsite),
      facilityTypeId: String(row.facilityTypeId || ''),
      numberDoctors: row.numberDoctors != null ? (parseInt(row.numberDoctors, 10) || null) : null,
      capacity: row.capacity != null ? (parseInt(row.capacity, 10) || null) : null,
    });
  }

  console.log(`       Kept ${facilities.length} valid facilities after filtering.`);

  // 3. Generate embeddings using local Transformers.js
  console.log('\n[3/4] Loading Transformers.js model (Xenova/all-MiniLM-L6-v2)...');
  console.log('       This runs entirely locally – no API key needed.');
  console.log('       First run will download the model (~100MB) to cache.\n');

  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('       Model loaded. Generating embeddings...\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < facilities.length; i++) {
    const facility = facilities[i];
    const textToEmbed = facility.description || facility.name || '';

    try {
      const output = await extractor(textToEmbed, {
        pooling: 'mean',
        normalize: true
      });
      // Round to 6 decimal places to reduce JSON size (~8KB → ~3KB per embedding)
      facility.embedding = Array.from(output.data).map(v => Math.round(v * 1e6) / 1e6);
      successCount++;
    } catch (err) {
      console.warn(`       Warning: Failed to generate embedding for "${facility.name}" (${i + 1}/${facilities.length}):`, err.message);
      failCount++;
      facility.embedding = new Array(384).fill(0);
    }

    if ((i + 1) % 500 === 0 || i === facilities.length - 1) {
      console.log(`       Progress: ${i + 1}/${facilities.length} processed (${successCount} success, ${failCount} failed)`);
    }
  }

  console.log(`\n       Embedding generation complete: ${successCount} success, ${failCount} failed.`);

  // 4. Write output files
  console.log('\n[4/4] Writing output files...');

  if (!fs.existsSync(path.dirname(OFFLINE_OUTPUT_PATH))) {
    fs.mkdirSync(path.dirname(OFFLINE_OUTPUT_PATH), { recursive: true });
  }

  fs.writeFileSync(OFFLINE_OUTPUT_PATH, JSON.stringify(facilities, null, 2));
  console.log(`       -> ${OFFLINE_OUTPUT_PATH} (${facilities.length} facilities with embeddings)`);

  fs.writeFileSync(ENRICHED_OUTPUT_PATH, JSON.stringify(facilities, null, 2));
  console.log(`       -> ${ENRICHED_OUTPUT_PATH} (${facilities.length} facilities with 384-dim embeddings)`);

  // 5. Upload to Vercel KV if credentials are available
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    console.log('\n[5/5] Vercel KV credentials detected – uploading to KV...');
    try {
      const { createClient } = await import('@vercel/kv');
      const kv = createClient({ url: kvUrl, token: kvToken });

      console.log('       Uploading enriched dataset to KV key "facilities"...');
      await kv.set('facilities', facilities);
      console.log('       ✅ Successfully uploaded to Vercel KV.');
    } catch (err) {
      console.error('       ❌ Failed to upload to Vercel KV:', err.message);
      console.error('       Ensure KV_REST_API_URL and KV_REST_API_TOKEN are correct.');
    }
  } else {
    console.log('\n[5/5] Skipping KV upload (KV_REST_API_URL / KV_REST_API_TOKEN not set).');
    console.log('       Set these environment variables to upload automatically.');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('ENRICHMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total facilities:        ${facilities.length}`);
  console.log(`Embeddings generated:    ${successCount}`);
  console.log(`Embeddings failed:       ${failCount}`);
  console.log(`Offline cache:           ${facilities.length} records (with embeddings)`);
  console.log(`Output files:            ${OFFLINE_OUTPUT_PATH}`);
  console.log(`                         ${ENRICHED_OUTPUT_PATH}`);
  console.log('='.repeat(60));
}

// Run
enrich().catch(err => {
  console.error('Enrichment failed:', err);
  process.exit(1);
});
