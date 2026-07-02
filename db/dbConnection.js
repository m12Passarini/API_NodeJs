import pool from './db.js'; 

export async function dbConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Succesful connecting to database:', res.rows[0]);
  } catch (err) {
    console.error('Error connecting to database:', err.message);
  }
}

