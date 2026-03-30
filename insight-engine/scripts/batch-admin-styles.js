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
  ['text-2xl font-bold text-white', 'text-2xl font-bold text-[#3d3155]'],
  ['text-xl font-bold text-white', 'text-xl font-bold text-[#3d3155]'],
  ['text-3xl font-bold text-white', 'text-3xl font-bold text-[#3d3155]'],
  ['text-lg font-semibold text-white', 'text-lg font-semibold text-[#3d3155]'],
  ['text-lg font-bold text-white', 'text-lg font-bold text-[#3d3155]'],
  ['text-sm font-medium text-white', 'text-sm font-medium text-[#3d3155]'],
  ['font-semibold text-white', 'font-semibold text-[#3d3155]'],
  ['font-bold text-white', 'font-bold text-[#3d3155]'],
  ['bg-slate-900/60', 'bg-white/40 backdrop-blur-sm'],
  ['bg-slate-900/50', 'bg-white/40 backdrop-blur-sm'],
  ['bg-slate-900/40', 'bg-white/35 backdrop-blur-sm'],
  ['bg-slate-900/80', 'bg-white/55 backdrop-blur-sm'],
  ['bg-slate-800/50', 'bg-white/35 backdrop-blur-sm'],
  ['bg-slate-800/60', 'bg-white/40 backdrop-blur-sm'],
  ['bg-slate-700/50', 'bg-[#b8a9e8]/10'],
  ['bg-slate-700/40', 'bg-[#b8a9e8]/8'],
  ['bg-slate-700/20', 'bg-[#b8a9e8]/8'],
  ['bg-slate-700/30', 'bg-[#b8a9e8]/8'],
  ['hover:bg-slate-700/20', 'hover:bg-[#b8a9e8]/8'],
  ['hover:bg-white/5', 'hover:bg-[#b8a9e8]/10'],
  ['hover:bg-white/16', 'hover:bg-[#b8a9e8]/20'],
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
