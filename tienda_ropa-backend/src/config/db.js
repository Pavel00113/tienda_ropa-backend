const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        family: 4
      }
    : {
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl:      { rejectUnauthorized: false },
        family:   4
      }
);

pool.connect()
  .then(client => {
    console.log('✅ Conectado a PostgreSQL (Supabase)');
    client.release();
  })
  .catch(err => console.error('❌ Error de conexión:', err.message));

module.exports = pool;