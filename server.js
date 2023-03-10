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

const generateSitemapAndLog = () => {
    const time = new Date().toISOString();

    generateSitemap().then(() => {
        console.log(`[${time}] sitemap generated successfully.`);
    }).catch((error) => {
        console.error(`[[${time}] Error generating sitemap: `, error);
    });
};

// generate this sitemap 24 hours
cron.schedule('0 0 * * *', generateSitemapAndLog);

let port = process.env.PORT || 3012;

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);

    generateSitemapAndLog();

});
