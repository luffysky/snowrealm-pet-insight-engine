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
  // Input/select fields with bg-white that still have text-white
  ['bg-white/60 border border-[#b8a9e8]/20 text-white rounded-lg', 'bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] rounded-lg'],
  ['bg-white/50 border border-[#b8a9e8]/20 text-white', 'bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155]'],
  ['bg-white/50 border border-[#b8a9e8]/20 rounded-lg text-white', 'bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-[#3d3155]'],
  ['bg-white/50 text-white border', 'bg-white/60 text-[#3d3155] border'],
  // bg-[#b8a9e8]/10 text-white -> lavender ghost inputs
  ['bg-[#b8a9e8]/10 text-white border border-[#b8a9e8]/30 rounded px-2 py-1.5 text-sm', 'bg-white/60 text-[#3d3155] border border-[#b8a9e8]/30 rounded px-2 py-1.5 text-sm'],
  ['bg-[#b8a9e8]/10 text-white border border-[#b8a9e8]/30 rounded px-2 py-1 text-xs', 'bg-white/60 text-[#3d3155] border border-[#b8a9e8]/30 rounded px-2 py-1 text-xs'],
  ['bg-[#b8a9e8]/10 text-white border border-[#b8a9e8]/30 rounded px-2 py-1.5 text-sm w-full', 'bg-white/60 text-[#3d3155] border border-[#b8a9e8]/30 rounded px-2 py-1.5 text-sm w-full'],
  // Tab/toggle buttons with lavender bg that should have lavender text
  ["'bg-[#b8a9e8]/15 text-white'", "'bg-[#b8a9e8]/25 text-[#6b5fa8]'"],
  // Notification toasts with bg-white text-white
  ['bg-white/50 text-white px-4 py-2 rounded-lg', 'bg-white/90 text-[#3d3155] px-4 py-2 rounded-lg'],
  // Search input with dark background
  ["bg-white/5 border border-white/8", "bg-white/60 border border-[#b8a9e8]/25"],
  ['focus:bg-white/8', 'focus:bg-white/70'],
  // Input with placeholder-slate-500
  ['placeholder-slate-500', 'placeholder:text-[#b5a8d0]'],
  ['placeholder-slate-400', 'placeholder:text-[#b5a8d0]'],
  // support bg-t-accent text-white (theme accent bg)
  ["'bg-t-accent text-white'", "'bg-[#b8a9e8]/25 text-[#6b5fa8]'"],
  ["'bg-t-accent/20 text-white", "'bg-[#b8a9e8]/15 text-[#6b5fa8]"],
  // focus:ring-t-accent
  ['focus:ring-t-accent/50', 'focus:ring-[#b8a9e8]/30'],
  ['focus:border-t-accent', 'focus:border-[#b8a9e8]/50'],
  ['focus:ring-t-accent', 'focus:ring-[#b8a9e8]/30'],
  // survey-templates input
  ['bg-white/50 border border-[#b8a9e8]/20 text-white placeholder-slate-500', 'bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] placeholder:text-[#b5a8d0]'],
  // support page border/bg for chat
  ['border border-[#b8a9e8]/25 text-white text-xs rounded px-2 py-1', 'border border-[#b8a9e8]/25 text-[#3d3155] text-xs rounded px-2 py-1'],
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
