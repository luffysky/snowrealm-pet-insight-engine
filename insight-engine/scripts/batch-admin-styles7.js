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
  // bg-[#b8a9e8]/15 text-white -> lavender ghost button
  ['bg-[#b8a9e8]/15 text-white rounded text-sm hover:bg-slate-500', 'bg-[#b8a9e8]/15 text-[#6b5fa8] rounded text-sm hover:bg-[#b8a9e8]/25'],
  ['bg-[#b8a9e8]/15 text-white rounded-lg text-sm hover:bg-slate-500', 'bg-[#b8a9e8]/15 text-[#6b5fa8] rounded-lg text-sm hover:bg-[#b8a9e8]/25'],
  ['bg-[#b8a9e8]/15 text-white rounded text-sm hover:bg-[#b8a9e8]/20', 'bg-[#b8a9e8]/15 text-[#6b5fa8] rounded text-sm hover:bg-[#b8a9e8]/25'],
  // Inactive dot color
  ['bg-slate-500}', 'bg-[#b5a8d0]}'],
  ["'bg-slate-500'", "'bg-[#b5a8d0]'"],
  // hover:bg-slate-500 -> lavender hover
  ['hover:bg-slate-500', 'hover:bg-[#b8a9e8]/20'],
  // Remaining text-white on inputs/spans
  [' text-white"', ' text-[#3d3155]"'],
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
