const config = require('../config');
module.exports = {
    client: 'postgres',
    connection: {
        database: config.DB_NAME,
        user: config.DB_USER,
        password: process.env.DB_PASS
    },
    migrations: {
        directory: 'db/migrations'
    }
};
