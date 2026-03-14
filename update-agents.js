const fs = require('fs');
let content = fs.readFileSync('AGENTS.md', 'utf-8');
content = content.replace('14. 🔄 **Vocabulary Bank**', '14. ✅ **Vocabulary Bank**');
fs.writeFileSync('AGENTS.md', content);
