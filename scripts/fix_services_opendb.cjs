/**
 * fix_services_opendb.cjs
 * 
 * For each service file that has a locally-defined `openDB` function,
 * restore it from git and then surgically remove the local openDB definition,
 * replacing it with a centralised import from ../lib/idb.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Files that were touched by the unify_db.cjs run and may be corrupted
const targets = [
  'src/services/selfTrainingEngine.js',
  'src/services/translationService.js',
  'src/services/referralEngine.js',
  'src/services/questEngine.js',
  'src/services/milestoneEngine.js',
  'src/services/hybridAIEngine.js',
  'src/services/gemmaCache.js',
  'src/services/emotionalThreading.js',
  'src/services/educationEngine.js',
  'src/services/avatarCustomization.js',
  'src/services/communityEngine.js',
  'src/services/adaptiveReminders.js',
];

const root = path.resolve(__dirname, '..');

for (const rel of targets) {
  const fp = path.join(root, rel);
  console.log(`\nProcessing: ${rel}`);

  // 1. Hard-restore from git
  try {
    execSync(`git checkout -- "${rel}"`, { cwd: root });
    console.log(`  ✓ Restored from git`);
  } catch (e) {
    console.error(`  ✗ git checkout failed: ${e.message}`);
    continue;
  }

  // 2. Read restored file
  let src = fs.readFileSync(fp, 'utf8');

  // 3. Remove local openDB definition (handles several patterns)
  //    Pattern A: const openDB = async () => { ... };  (used by most engines)
  //    Pattern B: async function openDB() { ... }
  //    Pattern C: function openDB() { ... }            (gemmaCache / dataCache style)
  //    Pattern D: export function openDB() { ... }     (advancedRAG style)
  //    All patterns end at the matching closing brace of the function body.

  // We walk the source character by character to find function bounds robustly.
  function removeOpenDBFunction(source) {
    // Find start of openDB declaration (any variant)
    const patterns = [
      /(?:export\s+)?(?:const\s+openDB\s*=\s*async\s*\(\)\s*=>|async\s+function\s+openDB\s*\(\)|function\s+openDB\s*\(\))/,
    ];

    let matchStart = -1;
    let matchLen = 0;

    for (const p of patterns) {
      const m = p.exec(source);
      if (m && (matchStart === -1 || m.index < matchStart)) {
        matchStart = m.index;
        matchLen = m[0].length;
      }
    }

    if (matchStart === -1) {
      console.log('  - No openDB definition found (already clean)');
      return source;
    }

    // Find the opening brace after the match
    let braceStart = source.indexOf('{', matchStart + matchLen);
    if (braceStart === -1) return source;

    // Walk until matching close brace
    let depth = 0;
    let i = braceStart;
    while (i < source.length) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }
    // i is now at the closing '}'
    // For arrow functions: const openDB = async () => { ... };
    // skip trailing ';' and optional whitespace
    let end = i + 1;
    while (end < source.length && /[\s;]/.test(source[end])) end++;

    // Snip it out
    const removed = source.substring(matchStart, end);
    console.log(`  ✓ Removed openDB block (${removed.length} chars)`);
    return source.substring(0, matchStart) + source.substring(end);
  }

  // Also remove any idbPromise singleton variable left over
  function removeIdbPromise(source) {
    return source.replace(/^let\s+idbPromise\s*=\s*null;\s*\r?\n/m, '');
  }

  src = removeOpenDBFunction(src);
  src = removeIdbPromise(src);

  // 4. Inject the centralised import if not already present
  if (!src.includes("import { openDB }") && !src.includes('from \'../lib/idb\'')) {
    // Insert after the very first comment block / existing imports
    const firstImportOrCode = src.search(/^(?!\/\/|\/\*|\s*$)/m);
    if (firstImportOrCode === -1) {
      src = "import { openDB } from '../lib/idb';\n" + src;
    } else {
      src = src.substring(0, firstImportOrCode) +
            "import { openDB } from '../lib/idb';\n" +
            src.substring(firstImportOrCode);
    }
    console.log('  ✓ Injected import');
  } else {
    console.log('  - Import already present');
  }

  fs.writeFileSync(fp, src, 'utf8');
  console.log(`  ✓ Written`);
}

console.log('\nDone.');
