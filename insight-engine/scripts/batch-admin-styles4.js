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
  // Fix partially-updated selects/inputs that still have text-white
  ['bg-white/50 border border-[#b8a9e8]/20 text-white rounded-lg', 'bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] rounded-lg'],
  ['bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-white', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-[#3d3155]'],
  ['bg-white/50 border border-[#b8a9e8]/30 text-white', 'bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155]'],
  // text-white opacity variants
  ['text-white/85', 'text-[#3d3155]'],
  ['text-white/90', 'text-[#3d3155]'],
  ['text-white/70', 'text-[#3d3155]'],
  ['text-white/50', 'text-[#b5a8d0]'],
  ['text-white/35', 'text-[#8a7ca8]'],
  ['text-white/30', 'text-[#8a7ca8]'],
  ['text-white/25', 'text-[#b5a8d0]'],
  ['text-white/20', 'text-[#b5a8d0]'],
  ['text-white/15', 'text-[#b5a8d0]'],
  ['text-white/10', 'text-[#b5a8d0]'],
  // bg-white/8 -> lighter lavender
  ['bg-white/8\\b', 'bg-[#b8a9e8]/8'],
  // min-h-screen bg-transparent text-white
  ['bg-transparent text-white', 'bg-transparent text-[#3d3155]'],
  // remaining standalone text-white (in spans, p, h1, etc. - not buttons)
  [' text-white p-', ' text-[#3d3155] p-'],
  [' text-white max-', ' text-[#3d3155] max-'],
  ['\"text-white\"', '\"text-[#3d3155]\"'],
  // bg-white/5 -> bg-[#b8a9e8]/8
  ['bg-white/5\\b', 'bg-[#b8a9e8]/8'],
  // Scrollbar and divider
  ['scrollbar-thin', 'scrollbar-none'],
  // border/bg for notification badges and tags
  ['bg-white/10', 'bg-[#b8a9e8]/12'],
  ['bg-white/12', 'bg-[#b8a9e8]/15'],
  ['bg-white/15', 'bg-[#b8a9e8]/15'],
  // hover:text-white in nav items (keep as-is or fix)
  ['hover:text-white', 'hover:text-[#3d3155]'],
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
