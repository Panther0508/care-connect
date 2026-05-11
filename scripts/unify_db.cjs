const fs = require('fs');
const path = require('path');

const files = [
  'src/services/translationService.js',
  'src/services/selfTrainingEngine.js',
  'src/services/rewardsEngine.js',
  'src/services/referralEngine.js',
  'src/services/questEngine.js',
  'src/services/milestoneEngine.js',
  'src/services/hybridAIEngine.js',
  'src/services/gemmaCache.js',
  'src/services/emotionalThreading.js',
  'src/services/educationEngine.js',
  'src/services/dataCache.js',
  'src/services/communityEngine.js',
  'src/services/avatarCustomization.js',
  'src/services/aiCoreRouter.js',
  'src/services/advancedRAG.js',
  'src/services/adaptiveReminders.js'
];

const patterns = [
  // async const
  /const\s+openDB\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?req\.onerror\s*=\s*\(\)\s*=>\s*reject\(req\.error\);\s*\}\);\s*return\s+idbPromise;\s*\}/,
  // async function
  /async\s+function\s+openDB\s*\(\)\s*\{[\s\S]*?req\.onerror\s*=\s*\(\)\s*=>\s*reject\(req\.error\);\s*\}\);\s*return\s+idbPromise;\s*\}/,
  // function
  /function\s+openDB\s*\(\)\s*\{[\s\S]*?req\.onerror\s*=\s*\(\)\s*=>\s*reject\(req\.error\);\s*\}\);\s*return\s+idbPromise;\s*\}/,
  // let idbPromise = null; + function openDB()
  /let\s+idbPromise\s*=\s*null;(\r?\n)*async\s+function\s+openDB\(\)\s*\{[\s\S]*?req\.onerror\s*=\s*\(\)\s*=>\s*reject\(req\.error\);\s*\n\s*\}\);\s*\n\s*return\s+idbPromise;\s*\n\}/,
  // specific translationService pattern
  /let\s+idbPromise\s*=\s*null;[\s\S]*?async\s+function\s+openDB\(\)\s*\{[\s\S]*?return\s+idbPromise;\s*\}/,
  // specific advancedRAG pattern
  /export\s+function\s+openDB\(\)\s*\{[\s\S]*?return\s+idbPromise;\s*\}/,
  // selfTrainingEngine pattern (doesn't have idbPromise returning sometimes, just straight promise)
  /const\s+openDB\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?return\s+db;\s*\};\s*req\.onerror\s*=\s*\(e\)\s*=>\s*reject\(e\);\s*\}\);?\s*\}/,
  // fallback very generic pattern (dangerous but if it starts with function openDB and ends with return promise)
  /(?:export\s+)?(?:async\s+)?function\s+openDB\s*\(\)\s*\{[\s\S]{10,800}?(?:resolve|reject)[\s\S]{10,200}?\}/,
  /const\s+openDB\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]{10,800}?(?:resolve|reject)[\s\S]{10,200}?\}/
];

files.forEach(f => {
  try {
    const fullPath = path.resolve(__dirname, '..', f);
    if (!fs.existsSync(fullPath)) return;
    
    let c = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Remove any 'let idbPromise = null;' occurrences
    if (c.includes('let idbPromise = null;')) {
      c = c.replace(/let\s+idbPromise\s*=\s*null;(\r?\n)?/g, '');
      modified = true;
    }

    // Try all regex patterns to remove the openDB function definition
    for (let p of patterns) {
      if (p.test(c)) {
        c = c.replace(p, '');
        modified = true;
      }
    }

    if (modified) {
      // Add the import at the top if it doesn't exist
      if (!c.includes('import { openDB }')) {
        c = "import { openDB } from '../lib/idb';\n" + c;
      }
      fs.writeFileSync(fullPath, c);
      console.log('Fixed ' + f);
    } else {
      console.log('No matches found for ' + f);
    }
  } catch(e) {
    console.error('Error in ' + f + ': ' + e.message);
  }
});
