const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  // Common strings from grep results
  'bg-primary hover:bg-primary/80 text-foreground': 'bg-primary hover:bg-primary/80 text-white',
  'bg-primary text-foreground': 'bg-primary text-white',
  'bg-primary/80 text-foreground': 'bg-primary/80 text-white',
  'bg-destructive text-foreground': 'bg-destructive text-white',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  Object.keys(replacements).forEach(key => {
    const regexKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    content = content.replace(new RegExp(regexKey, 'g'), replacements[key]);
  });
  
  // Advanced regex: look for any className string that contains bg-primary, bg-destructive, or bg-emerald/violet/amber-500 AND text-foreground
  // This regex matches `className="..."` or `className={`...`}`
  // It replaces `text-foreground` with `text-white` inside those boundaries.
  const advancedRegex = /className=(["'{`])(.*?)\1/gs;
  content = content.replace(advancedRegex, (match, quote, classStr) => {
    if (
      (classStr.includes('bg-primary') || classStr.includes('bg-destructive') || classStr.includes('bg-emerald-') || classStr.includes('bg-violet-') || classStr.includes('bg-amber-') || classStr.includes('bg-red-') || classStr.includes('bg-pink-') || classStr.includes('bg-blue-')) &&
      !classStr.includes('text-primary') && // Protect text-primary which might be used intentionally
      classStr.includes('text-foreground')
    ) {
      // Don't replace if it's explicitly styling a parent/child separately, but in most cases this is intended for the element itself.
      return match.replace('text-foreground', 'text-white');
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      traverseDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

traverseDirectory(directoryPath);
console.log("Text inversion on primary complete.");
