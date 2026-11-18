const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'furniture_db',
        port: process.env.DB_PORT || 5432,
      }
);

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client for database connection:', err.stack);
  } else {
    console.log('Successfully connected to PostgreSQL database!');
    release();
  }
});

module.exports = pool;