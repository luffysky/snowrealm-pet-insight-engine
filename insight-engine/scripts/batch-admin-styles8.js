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
  // bg-slate-900 text-white in inputs/selects/textareas
  ['bg-slate-900 text-white px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm h-20', 'bg-white/60 text-[#3d3155] px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm h-20'],
  ['bg-slate-900 text-white px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm w-full', 'bg-white/60 text-[#3d3155] px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm w-full'],
  ['bg-slate-900 text-white px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm', 'bg-white/60 text-[#3d3155] px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm'],
  ['bg-slate-900 text-white px-3 py-1.5 rounded border border-[#b8a9e8]/30 text-sm', 'bg-white/60 text-[#3d3155] px-3 py-1.5 rounded border border-[#b8a9e8]/30 text-sm'],
  // Container bg-slate-900 divs
  ['bg-slate-900 rounded-xl border border-[#b8a9e8]/20', 'bg-white/40 backdrop-blur-sm rounded-[20px] border border-[#b8a9e8]/20'],
  ['bg-slate-900 rounded-xl border border-[#b8a9e8]/25', 'bg-white/40 backdrop-blur-sm rounded-[20px] border border-[#b8a9e8]/25'],
  ['bg-slate-900 rounded-lg border border-[#b8a9e8]/25', 'bg-white/40 backdrop-blur-sm rounded-[16px] border border-[#b8a9e8]/25'],
  ['bg-slate-900 rounded-lg p-3 flex items-center justify-between gap-3', 'bg-white/40 backdrop-blur-sm rounded-[14px] p-3 flex items-center justify-between gap-3'],
  ['bg-slate-900 rounded-xl p-4 space-y-3', 'bg-white/40 backdrop-blur-sm rounded-[20px] p-4 space-y-3'],
  // Remaining bg-slate-900
  ['bg-slate-900', 'bg-white/50'],
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
