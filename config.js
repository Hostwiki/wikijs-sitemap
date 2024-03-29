const fs = require("fs");
require('dotenv').config();

const isDockerized = fs.existsSync('/.dockerenv');

if (!isDockerized){
    require('dotenv').config();
}

if (process.env.DB_PASS_FILE) {
    try {
        process.env.DB_PASS = fs.readFileSync(process.env.DB_PASS_FILE, 'utf8').trim()
    } catch (err) {
        console.error(`Unable read DB_PASS_FILE secret env variable: ` + err)
        process.exit(1)
    }
}

let dbClient = '';

switch (process.env.DB_TYPE.toLowerCase()) {
    case 'mysql':
    case 'mariadb':
        dbClient = 'mysql2';
        break;
    default:
        dbClient = 'pg';
}

const knexConfig = {
    client: dbClient,
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : false,
    },
};

module.exports = knexConfig;