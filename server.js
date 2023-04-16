const express = require('express');
const fs = require('fs');
const cron = require('node-cron');

const generateSitemap = require('./generate-sitemap');

const app = express();

app.get('/sitemap.xml', (req, res) => {

    const maxAge = 3600; // 1 hour

    fs.readFile('static/sitemap.xml', (err, data) => {

        if (err) {
            console.error(err);
            res.status(500).send('Error reading sitemap.xml file');
            return;
        }

        res.set({
            'Cache-Control': 'public, max-age=' + maxAge,
            'Content-Type': 'text/xml'
        });

        res.send(data);
    });
});

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const generateSitemapAndLog = async () => {
    const time = new Date().toISOString();
    let retryCount = 0;
    let sleepSeconds = 10;
    let retryLimit = 15;

    while (retryCount < retryLimit) {
        try {
            await generateSitemap();
            console.log(`[${time}] sitemap generated successfully.`);
            break;
        } catch (error) {
            console.error(`[[${time}] Error generating sitemap (attempt ${retryCount + 1}/${retryLimit}): `, error);
            retryCount++;
            if (retryCount < retryLimit) {
                await sleep(sleepSeconds);
                // if not successful after 15 tries, it will not run again until the next cron schedule
            }
        }
    }
};

// generate sitemap every 24 hours
cron.schedule('0 0 * * *', generateSitemapAndLog);

let port = process.env.PORT || 3012;

app.listen(port, async () => {
    console.log(`Server listening on port ${port}`);

    await generateSitemapAndLog();

});