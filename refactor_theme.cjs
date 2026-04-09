const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  // Backgrounds
  'bg-[hsl(220,15%,6%)]': 'bg-background',
  'bg-[hsl(220,12%,14%)]': 'bg-secondary',
  'bg-[hsl(220,15%,10%)]': 'bg-[hsl(var(--card))]',
  'bg-[hsl(220,12%,12%)]': 'bg-accent',
  'bg-[hsl(220,12%,10%)]': 'bg-muted',
  'bg-[hsl(220,12%,16%)]': 'bg-muted',
  'bg-[hsl(220,12%,18%)]': 'bg-muted',
  'bg-[hsl(220,15%,8%)]': 'bg-sidebar-background',
  
  // Texts
  'text-[hsl(220,10%,80%)]': 'text-foreground',
  'text-[hsl(220,10%,70%)]': 'text-muted-foreground',
  'text-[hsl(220,10%,60%)]': 'text-muted-foreground',
  'text-[hsl(220,10%,50%)]': 'text-muted-foreground',
  'text-[hsl(220,10%,45%)]': 'text-muted-foreground',
  'text-[hsl(220,10%,40%)]': 'text-muted-foreground',
  'text-[hsl(220,10%,30%)]': 'text-muted-foreground',
  'text-[hsl(220,10%,65%)]': 'text-muted-foreground',
  
  // Borders
  'border-[hsl(220,12%,14%)]': 'border-border',
  'border-[hsl(220,12%,12%)]': 'border-border',
  'border-[hsl(220,12%,20%)]': 'border-border',
  'border-[hsl(220,12%,18%)]': 'border-border',
  'border-[hsl(220,12%,30%)]': 'border-border',
  'border-[hsl(220,12%,50%)]': 'border-border',

  // Hover states
  'hover:bg-[hsl(220,12%,10%)]': 'hover:bg-accent',
  'hover:bg-[hsl(220,12%,12%)]': 'hover:bg-accent',
  'hover:bg-[hsl(220,12%,16%)]': 'hover:bg-accent',
  'hover:text-[hsl(220,10%,70%)]': 'hover:text-foreground',
  
  // Focus states
  'focus-within:border-[hsl(250,85%,65%)]/50': 'focus-within:border-primary/50',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  Object.keys(replacements).forEach(key => {
    // Escape string for regex, handle the brackets
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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
console.log("Refactoring complete.");
