const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  // Texts
  'text-white': 'text-foreground',
  'text-[hsl(250,85%,65%)]': 'text-primary',
  
  // Backgrounds
  'bg-[hsl(250,85%,65%)]': 'bg-primary',
  'bg-[hsl(var(--card))]': 'bg-card',
  
  // Borders
  'border-[hsl(250,85%,65%)]': 'border-primary',
  'focus-visible:ring-[hsl(250,85%,65%)]': 'focus-visible:ring-primary',
};

// Exclude text-white inside buttons maybe? No, btn-volt-primary has text-white. Let's just mass replace and check.
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  Object.keys(replacements).forEach(key => {
    // Escape string for regex, handle the brackets
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Using a regex with word boundaries where appropriate, but for brackets boundary is trickier.
    const regex = new RegExp(escapedKey, 'g');
    content = content.replace(regex, replacements[key]);
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
console.log("Refactoring Phase 2 complete.");
