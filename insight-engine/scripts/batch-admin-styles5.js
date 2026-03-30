const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...getFiles(full));
    else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) results.push(full);
  });
  return results;
}

const dirs = [
  'src/app/(admin)',
  'src/components/admin',
];

const replacements = [
  // Fix typo: disabled:text-[#3d3155]0 -> disabled:text-[#b5a8d0]
  ['disabled:text-[#3d3155]0', 'disabled:text-[#b5a8d0]'],
  // Input fields with red danger borders
  ['bg-white/60 border border-red-500/30 rounded-lg text-white', 'bg-white/60 border border-red-500/30 rounded-lg text-[#3d3155]'],
  // Ghost buttons with lavender bg but white text
  ['bg-[#b8a9e8]/10 hover:bg-[#b8a9e8]/15 disabled:opacity-50 text-white', 'bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 disabled:opacity-50 text-[#6b5fa8]'],
  ['bg-[#b8a9e8]/10 hover:bg-[#b8a9e8]/15 text-white', 'bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8]'],
  ['bg-[#b8a9e8]/10 text-white rounded', 'bg-[#b8a9e8]/15 text-[#6b5fa8] border border-[#b8a9e8]/25 rounded'],
  // bg-t-btn/bg-t-btn-hover -> lavender gradient (for buttons that should be lavender)
  ['bg-t-btn hover:bg-t-btn-hover disabled:opacity-50 text-white', 'bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 disabled:opacity-50 text-white'],
  ['bg-t-btn hover:bg-t-btn-hover disabled:opacity-60 text-white', 'bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 disabled:opacity-60 text-white'],
  ['bg-t-btn hover:bg-t-btn-hover text-white', 'bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 text-white'],
  ['bg-t-btn hover:bg-t-btn-hover', 'bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90'],
];

let totalFiles = 0;
let totalChanges = 0;

dirs.forEach(dir => {
  getFiles(dir).forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    replacements.forEach(([from, to]) => {
      const escaped = from.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const re = new RegExp(escaped, 'g');
      const newContent = content.replace(re, to);
      if (newContent !== content) {
        changed = true;
        totalChanges++;
        content = newContent;
      }
    });
    if (changed) {
      fs.writeFileSync(file, content);
      totalFiles++;
    }
  });
});

console.log('Done. Files changed:', totalFiles, '/ replacements applied:', totalChanges);
