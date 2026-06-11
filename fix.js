const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.css')) {
            let content = fs.readFileSync(full, 'utf8');
            let updated = content
                .replace(/\.webp_(\d+)\.webp/g, '.png_$1.webp')
                .replace(/\.webp\.webp/g, '.png.webp');
            if (content !== updated) {
                fs.writeFileSync(full, updated);
                console.log(`Fixed ${full}`);
            }
        }
    });
}
walk(path.join(__dirname, 'src'));
