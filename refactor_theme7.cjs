const fs = require('fs');
const path = require('path');

const componentsPath = path.join(__dirname, 'src', 'components');

const replacements = {
  // Fix the regex error where text-white was placed improperly.
  // We want to turn bare `text-white` back into `text-foreground`, BUT KEEP `bg-primary text-white`.
  // Wait, the regex `replace(/text-white/g, 'text-foreground')` will ruin the buttons.
  // Let's do this: First replace `bg-primary text-white` with `__BG_PRIM_TEXT_W__`.
  // Same for destructive and gradients.
  'bg-primary text-white': '__BG_PRIM_TEXT_W__',
  'bg-primary hover:bg-primary/80 text-white': '__BG_PRIM_HOV_TEXT_W__',
  'bg-primary/80 text-white': '__BG_PRIM_80_TEXT_W__',
  'bg-destructive text-white': '__BG_DESC_TEXT_W__',
  
  // Also protect any string where we specifically meant text-white with a background
  // For CalendarView.tsx specifically:
  // "'w-8 h-8 mx-auto flex items-center justify-center bg-primary text-white rounded-full'"
  
  // Now replace rogue `text-white` and `text-[hsl(220,10%,80%)]` back to `text-foreground`
  // Actually, we can just strictly search for `: \'text-white\'` or `\'text-white\'` 
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Protect valid backgrounds
  content = content.replace(/bg-primary(.*?)text-white/g, 'bg-primary$1__TEXT_W__');
  content = content.replace(/bg-destructive(.*?)text-white/g, 'bg-destructive$1__TEXT_W__');

  // Any remaining text-white is an error of our script or legacy, map to foreground
  content = content.replace(/text-white/g, 'text-foreground');

  // Restore the white texts
  content = content.replace(/__TEXT_W__/g, 'text-white');

  // Fix the "purple weekends" by strictly replacing bg-accent/50 to bg-muted/50
  // and generic bg-accent to bg-muted in the scheduler/directory.
  // (We don't want to touch shadcn components inside ui/ !)
  if (!filePath.includes('/ui/') && !filePath.includes('\\ui\\')) {
    content = content.replace(/bg-accent\/50/g, 'bg-muted/50');
    content = content.replace(/bg-accent\/30/g, 'bg-muted/30');
    content = content.replace(/bg-accent(?!-)/g, 'bg-muted');
    content = content.replace(/hover:bg-accent/g, 'hover:bg-muted');
  }

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
console.log("Dark mode weekend purple bug and text-white bugs fixed.");
