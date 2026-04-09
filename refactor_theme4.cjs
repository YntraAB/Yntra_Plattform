const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  // DirectoryPage
  'border-l-[hsl(220,12%,14%)]': 'border-l-border',
  'border-[hsl(220,15%,8%)]': 'border-border',
  'bg-[hsl(220,12%,11%)]': 'bg-background',
  'border-[hsl(220,12%,15%)]': 'border-border',
  'bg-[hsl(220,15%,9%)]': 'bg-accent/30',
  'border-[hsl(220,10%,40%)]': 'border-muted-foreground/30',

  // LoginPage
  'focus:ring-[hsl(250,85%,65%)]': 'focus:ring-primary',
  'hover:bg-[hsl(220,12%,28%)]': 'hover:bg-primary/80',
  'hover:text-[hsl(250,85%,75%)]': 'hover:text-primary/80',

  // WorkNotesPage
  'text-[hsl(220,10%,90%)]': 'text-foreground',
  'text-[hsl(220,10%,75%)]': 'text-muted-foreground',
  'placeholder:text-[hsl(220,10%,35%)]': 'placeholder:text-muted-foreground/50',

  // Scheduler & Calendar & Others
  'ring-[hsl(250,85%,65%)]': 'ring-primary',
  'text-[hsl(220,10%,35%)]': 'text-muted-foreground/50',
  'border-[hsl(220,12%,25%)]': 'border-border',
  'hover:bg-[hsl(220,15%,14%)]': 'hover:bg-secondary',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  Object.keys(replacements).forEach(key => {
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
console.log("hsl refactoring complete 4.");
