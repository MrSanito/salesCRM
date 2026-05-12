const pg = require('pg');
require('dotenv').config();

async function checkColumns() {
  const connectionString = process.env.DATABASE_URL;
  console.log("Connecting to:", connectionString.split('@')[1]);
  const client = new pg.Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to DB");
    
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    console.log("Columns in 'users' table:");
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkColumns();
