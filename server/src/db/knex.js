const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    migrations: {
        directory: __dirname + '/migrations',
        tableName: 'knex_migrations',
    },
    seeds: {
        directory: __dirname + '/seeds',
    },
});

module.exports = db;
