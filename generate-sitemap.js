const fs = require('fs');
const knex = require("knex");
const knexConfig = require('./config');
const db = knex(knexConfig);

async function generateSitemap() {

    try {
        const site_url = await db('settings')
            .select('*')
            .where('key', 'host')
            .first();

        let hostname = '';
        if (process.env.DB_TYPE.toLowerCase() === 'mariadb'){
            hostname = JSON.parse(site_url.value).v;
        } else {
            hostname = site_url.value.v;
        }

        const pages = await db('pages')
            .select('id', 'path', 'title', 'isPrivate', 'isPublished', 'updatedAt')
            .where({isPrivate: false, isPublished: true});

        if (pages.length > 0) {
            let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
                '<!-- Wiki.js sitemap generator by https://hostwiki.com -->\n';

            pages.forEach(function (page) {
                const page_url = hostname + "/" + page.path;
                const last_update = page.updatedAt;

                sitemap += '<url>\n' +
                    '    <loc>' + page_url + '</loc>\n' +
                    '    <lastmod>' + last_update + '</lastmod>\n' +
                    '  </url>\n';
            });

            sitemap += '</urlset>';

            fs.writeFileSync('static/sitemap.xml', sitemap, 'utf-8');
        }

        await db.destroy();
    } catch (err) {
        throw new Error('Database connection error: ' + err.message);
    }
}

module.exports = generateSitemap;