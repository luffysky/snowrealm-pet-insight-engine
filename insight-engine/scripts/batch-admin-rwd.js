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
  // Page headings: text-2xl fixed → responsive
  ['text-2xl font-bold text-[#3d3155]', 'text-xl sm:text-2xl font-bold text-[#3d3155]'],
  ['text-2xl font-semibold text-[#3d3155]', 'text-xl sm:text-2xl font-semibold text-[#3d3155]'],
  // Header flex wrapper gaps
  ['flex items-center justify-between flex-wrap gap-4', 'flex items-center justify-between flex-wrap gap-2 sm:gap-4'],
  ['flex items-center justify-between gap-4 flex-wrap', 'flex items-center justify-between gap-2 sm:gap-4 flex-wrap'],
  ['flex flex-wrap items-center justify-between gap-4', 'flex flex-wrap items-center justify-between gap-2 sm:gap-4'],
  // Section heading dividers with mb-4 padding → responsive
  ['mb-6 pb-4 border-b border-[#b8a9e8]/20', 'mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#b8a9e8]/20'],
  // Glass card common padding p-6 → responsive (generic admin cards)
  [' rounded-[20px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-6 shadow-[0_4px_20px_rgba(184,169,232,0.10)]',
   ' rounded-[20px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-4 sm:p-6 shadow-[0_4px_20px_rgba(184,169,232,0.10)]'],
  [' rounded-[20px] border border-[#b8a9e8]/20 bg-white/40 backdrop-blur-sm p-6',
   ' rounded-[20px] border border-[#b8a9e8]/20 bg-white/40 backdrop-blur-sm p-4 sm:p-6'],
  // Empty/loading state large padding
  ['"flex flex-col items-center justify-center p-12', '"flex flex-col items-center justify-center p-6 sm:p-12'],
  // Modal/form section padding
  ['rounded-[16px] border border-[#b8a9e8]/20 bg-white/50 p-6', 'rounded-[16px] border border-[#b8a9e8]/20 bg-white/50 p-4 sm:p-6'],
  ['rounded-[16px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-6', 'rounded-[16px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-4 sm:p-6'],
  // Grid gaps
  ['grid grid-cols-2 gap-4', 'grid grid-cols-2 gap-2 sm:gap-4'],
  ['grid grid-cols-3 gap-4', 'grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4'],
  ['grid grid-cols-4 gap-4', 'grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4'],
  // Header section padding
  ['className="p-6 border-b border-[#b8a9e8]/20"', 'className="p-4 sm:p-6 border-b border-[#b8a9e8]/20"'],
  ['className="p-6 border-b border-[#b8a9e8]/25"', 'className="p-4 sm:p-6 border-b border-[#b8a9e8]/25"'],
  // Section title gap
  ['space-y-6', 'space-y-4 sm:space-y-6'],
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
