const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_yGLwXD3HTRN0@ep-winter-queen-aonfjhqi-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'lastCommunicatedAt'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

main().catch(console.error);
