const { execSync } = require('child_process');
try {
  execSync('bunx eslint . --format json', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
} catch (e) {
  const data = JSON.parse(e.stdout.trim());
  data.forEach(f => {
    if (f.errorCount > 0 || f.warningCount > 0) {
      console.log(f.filePath.replace(/\\/g, '/').split('/').slice(-4).join('/'));
      f.messages.forEach(m => {
        console.log(`  Line ${m.line}:${m.column || 0} [${m.ruleId || 'N/A'}] - ${m.message.split('\n')[0]}`);
      });
    }
  });
}
