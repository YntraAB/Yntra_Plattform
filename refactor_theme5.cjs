const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  'bg-sidebar-background': 'bg-sidebar',
  'border-sidebar-border': 'border-sidebar-border', // wait, config has `sidebar: { border: ... }` which is `border-sidebar-border`. That's fine.
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
console.log("Fix bg-sidebar deployed!");
