import pg from 'pg';

const connectionString = 'postgresql://postgres:fV1tHQreHSlK1ZA5@db.nmoptmwoxwiwpwiocofj.supabase.co:5432/postgres';

async function test() {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase...');
    const res = await pool.query('SELECT NOW()');
    console.log('Connected! Current time:', res.rows[0]);
    await pool.end();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

test();
