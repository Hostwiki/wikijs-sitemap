const fs = require('fs');
const { dbClient } = require('./config');

async function generateSitemap() {
    const client = await dbClient();

    const site_url = await client.query("SELECT * FROM public.settings WHERE key = 'host';");

    const hostname = site_url.rows[0].value.v;

    const pages_sql = 'SELECT id, path, title, "isPrivate", "isPublished", "updatedAt" ' +
        'FROM public.pages WHERE "isPrivate" = false and "isPublished" = true';

    const pages = await client.query(pages_sql);

    if (pages.rowCount > 0) {
        const page_list = pages.rows;

        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            '<!-- Wiki.js sitemap generator by https://hostwiki.com -->\n';

        page_list.forEach(function (page) {
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

    await client.end();
}

module.exports = generateSitemap;