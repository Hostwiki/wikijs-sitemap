const isDocker = "is-docker";
const { Client } = require('pg');
const fs = require("fs");
require('dotenv').config();

if (!isDocker){
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

module.exports.dbClient = async () => {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: JSON.parse(process.env.DB_SSL),
    });
    await client.connect();
    return client;
};