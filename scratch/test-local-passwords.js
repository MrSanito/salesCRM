const pg = require('pg');

async function checkPassword(password) {
  const connectionString = `postgresql://postgres:${password}@localhost:5432/postgres`;
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 2000 });
  try {
    const client = await pool.connect();
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    await pool.end();
    return false;
  }
}

async function main() {
  const passwords = ['', 'postgres', 'admin', 'root', 'password', '123456'];
  console.log("Testing common local PostgreSQL passwords...");
  for (const pwd of passwords) {
    const success = await checkPassword(pwd);
    if (success) {
      console.log(`Success! Password is: "${pwd}"`);
      return;
    }
  }
  console.log("None of the common passwords worked.");
}

main();
