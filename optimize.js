const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'public/images');

async function optimizeImages(dir) {
    const files = fs.readdirSync(dir);
    let totalSavings = 0;

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
            totalSavings += await optimizeImages(filePath);
            continue;
        }

        if (!file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.jpeg')) continue;
        
        const originalSize = stats.size;
        
        // Output path
        const nameWithoutExt = file.replace(/\.(png|jpg|jpeg)$/i, '');
        const outName = `${nameWithoutExt}.webp`;
        const outPath = path.join(dir, outName);
        
        try {
            await sharp(filePath)
                .webp({ quality: 80 })
                .toFile(outPath);
                
            const newStats = fs.statSync(outPath);
            const saved = originalSize - newStats.size;
            totalSavings += saved;
            console.log(`Converted ${file} -> ${outName} (Saved ${(saved/1024/1024).toFixed(2)} MB)`);
            
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error(`Failed on ${file}:`, e.message);
        }
    }
    return totalSavings;
}

optimizeImages(baseDir).then(savings => {
    console.log(`\nTotal Space Saved globally: ${(savings/1024/1024).toFixed(2)} MB`);
});
