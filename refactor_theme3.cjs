const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  // Calendar specific backgrounds
  'bg-[hsl(220,15%,7%)]': 'bg-accent/50',
  'bg-[hsl(220,12%,8%)]': 'bg-background',
  'bg-[hsl(220,12%,22%)]': 'bg-primary/80',
  'bg-[hsl(220,12%,20%)]': 'bg-accent',
  
  // Hovers
  'hover:bg-[hsl(220,12%,20%)]': 'hover:bg-accent',
  'hover:bg-[hsl(250,85%,60%)]': 'hover:bg-primary/80',
  'hover:bg-[hsl(250,85%,70%)]': 'hover:bg-primary/80',
  
  // Texts
  'text-[hsl(220,10%,55%)]': 'text-muted-foreground',
  'text-[hsl(220,10%,45%)]': 'text-muted-foreground',

  // Lines/Borders
  'border-t-[hsl(250,85%,65%)]': 'border-t-primary',

  // Gradients
  'from-[hsl(250,85%,65%)]': 'from-primary',
  'to-purple-800': 'to-primary/60',
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
console.log("calendar and extra refactoring complete.");
