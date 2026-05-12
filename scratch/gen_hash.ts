import bcrypt from 'bcrypt';

async function gen() {
  const hash = await bcrypt.hash('password', 10);
  console.log('Hash for "password":', hash);
}

gen();
