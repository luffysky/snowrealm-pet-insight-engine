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
  // Input fields with dark bg
  ['bg-slate-900 border border-slate-600 rounded-lg text-white', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-[#3d3155]'],
  ['bg-slate-900 border border-[#b8a9e8]/20 rounded-lg text-white', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-[#3d3155]'],
  ['bg-slate-900 border border-[#b8a9e8]/30 rounded-lg text-white', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-[#3d3155]'],
  // Remaining bg-slate-900 in class strings
  ['bg-slate-900 border', 'bg-white/60 border'],
  ['bg-slate-950', 'bg-transparent'],
  ['bg-slate-900\\b', 'bg-white/50'],
  // Button bg-slate-700 hover:bg-slate-600 text-white -> lavender ghost button
  ['bg-slate-700 hover:bg-slate-600 text-white rounded-lg', 'bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] border border-[#b8a9e8]/25 rounded-lg'],
  ['bg-slate-700 hover:bg-slate-600 text-white rounded-xl', 'bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] border border-[#b8a9e8]/25 rounded-xl'],
  // text-white on labels/paragraphs (not buttons)
  ['className="text-white"', 'className="text-[#3d3155]"'],
  ['className="text-white ', 'className="text-[#3d3155] '],
  // bg-transparent text-sm text-white in inputs
  ['bg-transparent text-sm text-white', 'bg-transparent text-sm text-[#3d3155]'],
  // placeholder-white
  ['placeholder-white/20', 'placeholder-[#b5a8d0]'],
  ['placeholder-white/25', 'placeholder-[#b5a8d0]'],
  // remaining text-white patterns in page headings
  ['text-lg font-medium text-white', 'text-lg font-medium text-[#3d3155]'],
  ['text-sm text-white', 'text-sm text-[#3d3155]'],
  // min-h-screen bg-slate-950 text-white
  ['min-h-screen bg-slate-950 text-white', 'min-h-screen'],
  // divide-slate
  ['divide-slate-700', 'divide-[#b8a9e8]/15'],
  ['divide-slate-800', 'divide-[#b8a9e8]/15'],
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
