const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smart_dashboard',
    password: process.env.DB_PASSWORD || 'postgre',
    port: process.env.DB_PORT || 5433,
});

// Test connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:', err.message);
    } else {
        console.log('✅ Connected to PostgreSQL database:', process.env.DB_NAME || 'smart_dashboard');
        release();
    }
});

module.exports = { pool };
