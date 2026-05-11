const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, '../src/services/emotionalThreading.js');
let c = fs.readFileSync(fp, 'utf8');
const start = c.indexOf('const openDB');
const end = c.indexOf('export async function getThreadContext(userId)');
if (start !== -1 && end !== -1) {
  c = c.substring(0, start) + '\n' + c.substring(end);
  if (!c.includes('import { openDB }')) {
    c = "import { openDB } from '../lib/idb';\n" + c;
  }
  fs.writeFileSync(fp, c);
  console.log('Fixed');
}
