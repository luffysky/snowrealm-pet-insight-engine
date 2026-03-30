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
  // Input field patterns
  ['bg-white/50 border border-[#b8a9e8]/20 rounded-lg text-[#3d3155]', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-[#3d3155]'],
  // Remaining bg-slate patterns
  ['bg-slate-800/40', 'bg-white/30 backdrop-blur-sm'],
  ['bg-slate-800/80', 'bg-white/60 backdrop-blur-sm'],
  ['bg-slate-800', 'bg-white/50'],
  ['bg-slate-700', 'bg-[#b8a9e8]/10'],
  ['bg-slate-600', 'bg-[#b8a9e8]/15'],
  // More text-white fixes
  ['text-white font-medium', 'text-[#3d3155] font-medium'],
  [' text-white placeholder:', ' text-[#3d3155] placeholder:'],
  // border-slate-600 patterns
  ['border-slate-600', 'border-[#b8a9e8]/30'],
  ['border-slate-500', 'border-[#b8a9e8]/35'],
  // hover:bg-slate patterns
  ['hover:bg-slate-600', 'hover:bg-[#b8a9e8]/20'],
  ['hover:bg-slate-700', 'hover:bg-[#b8a9e8]/15'],
  ['hover:bg-slate-800', 'hover:bg-white/55'],
  // Placeholder colors
  ['placeholder:text-slate-600', 'placeholder:text-[#b5a8d0]'],
  ['placeholder:text-slate-500', 'placeholder:text-[#b5a8d0]'],
  ['placeholder:text-slate-400', 'placeholder:text-[#b5a8d0]'],
  // focus ring
  ['focus:ring-white/20', 'focus:ring-[#b8a9e8]/20'],
  ['focus:border-white/25', 'focus:border-[#b8a9e8]/40'],
  ['focus:ring-t-accent-border', 'focus:ring-[#b8a9e8]/30'],
  ['focus:border-t-accent-border', 'focus:border-[#b8a9e8]/40'],
  // option className in selects
  ['className="bg-slate-900 text-[#3d3155]"', 'className="bg-white text-[#3d3155]"'],
  ['className="bg-white/50"', 'className="bg-white text-[#3d3155]"'],
  // text colors
  ['text-slate-200', 'text-[#3d3155]'],
  ['text-slate-100', 'text-[#3d3155]'],
  ['text-slate-50', 'text-[#3d3155]'],
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
