const fs = require('fs');
const path = require('path');

const componentsPath = path.join(__dirname, 'src', 'components');

const replacements = {
  // Re-map the buttons that were given bg-primary but were originally dark slate
  // to be #0F1115 in dark mode per user request.
  'bg-primary hover:bg-primary/80 text-white': 'bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  Object.keys(replacements).forEach(key => {
    // Avoid double replacing
    if (content.includes('dark:bg-[#0F1115]')) return;
    
    // We only want to replace instances that are strictly buttons or known elements
    // so we just do a string replacement
    const regexKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    content = content.replace(new RegExp(regexKey, 'g'), replacements[key]);
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

traverseDirectory(componentsPath);
console.log("Restored #0F1115 for buttons in dark mode.");
