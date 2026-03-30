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
  // bg-white/60 inputs with text-white
  ['bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-3 py-2 text-white text-sm', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-3 py-2 text-[#3d3155] text-sm'],
  ['bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-3 py-2 text-white', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-3 py-2 text-[#3d3155]'],
  ['bg-white/60 border border-[#b8a9e8]/25 rounded-xl text-xs text-white', 'bg-white/60 border border-[#b8a9e8]/25 rounded-xl text-xs text-[#3d3155]'],
  ['bg-white/60 border border-[#b8a9e8]/20 rounded-lg px-3 py-2 text-white text-sm', 'bg-white/60 border border-[#b8a9e8]/20 rounded-lg px-3 py-2 text-[#3d3155] text-sm'],
  ['w-full px-2 py-1.5 bg-white/60 border border-[#b8a9e8]/30 rounded text-white text-xs', 'w-full px-2 py-1.5 bg-white/60 border border-[#b8a9e8]/30 rounded text-[#3d3155] text-xs'],
  ['bg-white/50 text-white px-2 py-1 rounded border border-[#b8a9e8]/30 text-sm', 'bg-white/60 text-[#3d3155] px-2 py-1 rounded border border-[#b8a9e8]/30 text-sm'],
  // bg-[#b8a9e8]/10 inputs with text-white
  ['bg-[#b8a9e8]/10 border border-[#b8a9e8]/30 rounded-lg px-2 py-1 text-white text-sm', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1 text-[#3d3155] text-sm'],
  ['bg-[#b8a9e8]/10 border border-[#b8a9e8]/30 rounded-lg px-2 py-1 text-white text-sm w-full', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1 text-[#3d3155] text-sm w-full'],
  ['bg-[#b8a9e8]/10 border border-[#b8a9e8]/30 rounded-xl px-4 py-3 text-white text-sm', 'bg-white/60 border border-[#b8a9e8]/30 rounded-xl px-4 py-3 text-[#3d3155] text-sm'],
  ['cursor-pointer [&>option]:bg-white/50', 'cursor-pointer [&>option]:bg-white [&>option]:text-[#3d3155]'],
  // Ghost buttons with lavender bg
  ['bg-[#b8a9e8]/12 hover:bg-[#b8a9e8]/15 text-white text-sm rounded-lg border border-white/10', 'bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] text-sm rounded-lg border border-[#b8a9e8]/25'],
  ['bg-[#b8a9e8]/12 hover:bg-[#b8a9e8]/15 text-white text-sm rounded-xl border border-white/10', 'bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] text-sm rounded-xl border border-[#b8a9e8]/25'],
  // team page ghost button
  ['border border-[#b8a9e8]/30 hover:bg-[#b8a9e8]/10 disabled:opacity-50 text-white rounded-lg', 'border border-[#b8a9e8]/30 hover:bg-[#b8a9e8]/15 disabled:opacity-50 text-[#6b5fa8] rounded-lg'],
  // subscription page input
  ['bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm', 'bg-white/60 border border-[#b8a9e8]/25 rounded-lg px-3 py-2 text-[#3d3155] text-sm'],
  // subscription table text
  ['td className="px-5 py-3 text-white text-right"', 'td className="px-5 py-3 text-[#3d3155] text-right"'],
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
