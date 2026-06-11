const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.css')) {
            let content = fs.readFileSync(full, 'utf8');
            let updated = content
                .replace(/\.png\.png/g, '.png.webp')
                .replace(/\.png/g, '.webp')
                .replace(/\.jpg/g, '.webp')
                .replace(/\.jpeg/g, '.webp');
            if (content !== updated) {
                fs.writeFileSync(full, updated);
                console.log(`Updated ${full}`);
            }
        }
    });
}
walk(path.join(__dirname, 'src'));
