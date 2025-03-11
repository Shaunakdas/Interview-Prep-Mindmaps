const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
    // Regex pattern to match folders starting with "notes_"
    const folderPattern = /^notes_.+/;
    const folders = fs.readdirSync('.').filter(folder => 
        fs.statSync(folder).isDirectory() && folderPattern.test(folder)
    );

    if (folders.length === 0) {
        console.log("❌ No folders matching 'notes_*' found.");
        return;
    }

    for (const folder of folders) {
        console.log(`📂 Processing folder: ${folder}`);

        // Create subdirectories
        const htmlDir = path.join(folder, 'htmls');
        const pngDir = path.join(folder, 'pngs');
        const pdfDir = 'pdfs';

        fs.mkdirSync(htmlDir, { recursive: true });
        fs.mkdirSync(pngDir, { recursive: true });
        fs.mkdirSync(pdfDir, { recursive: true });

        // Convert Markdown to HTML (with space-free filenames)
        const mdFiles = fs.readdirSync(folder).filter(file => file.endsWith('.md'));
        for (const mdFile of mdFiles) {
            const sanitizedFileName = path.basename(mdFile, '.md').replace(/\s+/g, '_'); // Remove spaces
            const inputPath = path.join(folder, mdFile);
            const outputHtmlPath = path.join(htmlDir, `${sanitizedFileName}.html`);
            execSync(`markmap "${inputPath}" -o "${outputHtmlPath}"`);
            console.log(`✅ Converted: ${mdFile} → ${outputHtmlPath}`);
        }

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 }
        });
        const page = await browser.newPage();

        // Convert HTML to PNG
        const htmlFiles = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));
        for (const htmlFile of htmlFiles) {
            const sanitizedFileName = htmlFile.replace(/\s+/g, '_'); // Ensure filename is clean
            const htmlPath = path.join(htmlDir, htmlFile);
            const outputPngPath = path.join(pngDir, `${sanitizedFileName.replace('.html', '.png')}`);

            await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle2' });
            await page.screenshot({ path: outputPngPath, fullPage: true, type: 'png' });
            console.log(`📸 Captured: ${htmlFile} → ${outputPngPath}`);
        }

        await browser.close();

        // Convert PNGs to PDF
        const outputPdfPath = path.join(pdfDir, `${folder}.pdf`);
        const pngFiles = fs.readdirSync(pngDir).filter(file => file.endsWith('.png')).sort();
        if (pngFiles.length > 0) {
            const pngPaths = pngFiles.map(file => path.join(pngDir, file)).join(' ');
            execSync(`img2pdf ${pngPaths} -o "${outputPdfPath}"`);
            console.log(`📄 Generated PDF: ${outputPdfPath}`);
        } else {
            console.log(`⚠️ No PNGs found in ${folder}, skipping PDF creation.`);
        }
    }

    console.log("🎉 All matching folders processed successfully!");
})();
