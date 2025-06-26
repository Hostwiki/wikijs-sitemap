const fs = require('fs');
const knex = require("knex");
const knexConfig = require('./config');
const path = require("path");
const db = knex(knexConfig);

async function generateSitemap() {

    try {
        const site_url = await db('settings')
            .select('*')
            .where('key', 'host')
            .first();

        let hostname = '';
        if (process.env.DB_TYPE.toLowerCase() === 'mariadb') {
            hostname = JSON.parse(site_url.value).v;
        } else {
            hostname = site_url.value.v;
        }

        // Parse excluded paths from environment variable
        const excludedPaths = process.env.EXCLUDED_PATHS 
            ? process.env.EXCLUDED_PATHS.split(',').map(path => path.trim()).filter(path => path.length > 0)
            : [];

        if (excludedPaths.length > 0) {
            console.log(`Excluding paths from sitemap: ${excludedPaths.join(', ')}`);
        }

        const pages = await db('pages')
            .select('id', 'localeCode', 'path', 'title', 'isPrivate', 'isPublished', 'updatedAt')
            .where({isPrivate: false, isPublished: true});

        // Filter out excluded paths
        const filteredPages = pages.filter(page => {
            // Check if the page path starts with any of the excluded paths
            return !excludedPaths.some(excludedPath => {
                // Normalize paths by ensuring they start with '/' and don't end with '/' (unless it's just '/')
                const normalizedPagePath = page.path.startsWith('/') ? page.path : '/' + page.path;
                const normalizedExcludedPath = excludedPath.startsWith('/') ? excludedPath : '/' + excludedPath;
                
                // If excluded path is just '/', it should only match the root page exactly
                if (normalizedExcludedPath === '/') {
                    return normalizedPagePath === '/';
                }
                
                // Remove trailing slash from excluded path for consistent matching
                const cleanExcludedPath = normalizedExcludedPath.endsWith('/') && normalizedExcludedPath !== '/' 
                    ? normalizedExcludedPath.slice(0, -1) 
                    : normalizedExcludedPath;
                
                // Check if page path starts with the excluded path
                return normalizedPagePath === cleanExcludedPath || normalizedPagePath.startsWith(cleanExcludedPath + '/');
            });
        });

        const excludedCount = pages.length - filteredPages.length;
        if (excludedCount > 0) {
            console.log(`Excluded ${excludedCount} pages from sitemap based on EXCLUDED_PATHS`);
        }

        if (filteredPages.length > 0) {
            let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
                '<!-- Wiki.js sitemap generator by https://hostwiki.com -->\n';

            filteredPages.forEach(function (page) {
                const page_url = hostname + "/" + page.localeCode + "/" + page.path;
                const last_update = page.updatedAt;

                sitemap += '<url>\n' +
                    '    <loc>' + page_url + '</loc>\n' +
                    '    <lastmod>' + last_update + '</lastmod>\n' +
                    '  </url>\n';
            });

            sitemap += '</urlset>';

            const directoryPath = path.join(__dirname, 'static');

            if (!fs.existsSync(directoryPath)){
                fs.mkdirSync(directoryPath, { recursive: true });
            }

            fs.writeFileSync(path.join(directoryPath, 'sitemap.xml'), sitemap, 'utf-8');
        }

        await db.destroy();
    } catch (err) {
        throw new Error('Database connection error: ' + err.message);
    }
}

module.exports = generateSitemap;
