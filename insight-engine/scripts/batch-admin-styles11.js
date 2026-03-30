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
  // Remaining bg-t-btn with text-white
  ['bg-t-btn text-white rounded hover:bg-t-btn-hover text-sm', 'bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 text-white rounded text-sm'],
  ['bg-t-btn text-white rounded text-sm hover:bg-t-btn-hover', 'bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 text-white rounded text-sm'],
  ['bg-t-btn text-white rounded-lg text-sm hover:bg-t-btn-hover', 'bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 text-white rounded-lg text-sm'],
  ['bg-t-btn text-white text-xs px-2 py-0.5 rounded font-medium', 'bg-[#b8a9e8]/20 text-[#6b5fa8] text-xs px-2 py-0.5 rounded font-medium'],
  // Any remaining bg-t-btn
  ['bg-t-btn-hover', 'opacity-90'],
  ['bg-t-btn', 'bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5]'],
  // insight page tab active states (violet/rose → lavender/peach)
  ["'bg-violet-600 text-white shadow'", "'bg-[#b8a9e8]/30 text-[#6b5fa8] shadow'"],
  ["'bg-rose-600 text-white shadow'", "'bg-[#f5b8b5]/40 text-[#c47a7a] shadow'"],
  // insight page generate buttons (violet/rose gradient → lavender)
  ['bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all cursor-pointer', 'bg-gradient-to-r from-[#b8a9e8] to-[#a8d8ea] hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all cursor-pointer'],
  ['bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all cursor-pointer', 'bg-gradient-to-r from-[#f5b8b5] to-[#b8a9e8] hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all cursor-pointer'],
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
