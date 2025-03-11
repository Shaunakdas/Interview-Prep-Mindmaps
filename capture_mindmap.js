const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } // Higher resolution
    });
    const page = await browser.newPage();

    const files = fs.readdirSync('.').filter(file => file.endsWith('.html'));

    for (const file of files) {
        const outputFile = file.replace('.html', '.png');
        await page.goto(`file://${__dirname}/${file}`, { waitUntil: 'networkidle2' });

        // Adjust zoom for better resolution
        // await page.evaluate(() => document.body.style.zoom = "1.0"); 

        await page.screenshot({
            path: outputFile,
            fullPage: true,
            type: 'png'
        });

        console.log(`Saved: ${outputFile}`);
    }

    await browser.close();
})();
