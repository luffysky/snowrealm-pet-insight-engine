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
  // Remaining bg-slate patterns with opacity
  ['bg-slate-900/20', 'bg-white/20'],
  ['bg-slate-900/30', 'bg-white/25'],
  ['bg-slate-500/20', 'bg-[#b5a8d0]/20'],
  ['bg-slate-500/10', 'bg-[#b5a8d0]/10'],
  ['bg-slate-400/20', 'bg-[#b8a9e8]/15'],
  // text-slate remaining
  ['text-slate-400', 'text-[#8a7ca8]'],
  ['text-slate-500', 'text-[#b5a8d0]'],
  // Inline inputs that still have text-white
  [' text-xs text-white"', ' text-xs text-[#3d3155]"'],
  [' text-sm text-white"', ' text-sm text-[#3d3155]"'],
  // border issues from double border
  ['border-[#b8a9e8]/30/80', 'border-[#b8a9e8]/25'],
  // bg-linear-to-r -> bg-gradient-to-r (Tailwind v4 syntax issue)
  ['bg-linear-to-r', 'bg-gradient-to-r'],
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
