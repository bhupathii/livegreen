import pg from 'pg';

const connectionString = 'postgresql://postgres.nmoptmwoxwiwpwiocofj:fV1tHQreHSlK1ZA5@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

async function test() {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase Pooler...');
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS! Connected to Supabase Pooler. Current time:', res.rows[0]);
    await pool.end();
  } catch (err) {
    console.error('CONNECTION FAILED:', err.message);
  }
}

test();
