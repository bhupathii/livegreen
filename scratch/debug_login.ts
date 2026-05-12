import pg from 'pg';
import bcrypt from 'bcrypt';

const connectionString = 'postgresql://postgres:fV1tHQreHSlK1ZA5@db.nmoptmwoxwiwpwiocofj.supabase.co:6543/postgres?pgbouncer=true';

async function debugLogin() {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Checking admin_users table...');
    const res = await pool.query('SELECT * FROM admin_users');
    console.log(`Found ${res.rows.length} users.`);
    
    if (res.rows.length > 0) {
      for (const user of res.rows) {
        const hash = user.passwordhash || user.passwordHash || user.passwordHash;
        console.log(`User: ${user.username}, Hash found: ${!!hash}`);
        if (hash) {
          const match = await bcrypt.compare('password', hash);
          console.log(`Password "password" matches: ${match}`);
        }
      }
    } else {
      console.log('NO ADMIN USERS FOUND. Seeding is required.');
    }
    
    await pool.end();
  } catch (err) {
    console.error('Debug failed:', err.message);
  }
}

debugLogin();
