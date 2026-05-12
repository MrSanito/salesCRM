const pg = require('pg');

async function checkColumns() {
  const connectionString = "postgresql://neondb_owner:npg_yGLwXD3HTRN0@ep-wandering-bonus-ao2sssxq-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  const client = new pg.Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to PROD DB:", connectionString.split('@')[1]);
    
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY column_name
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
