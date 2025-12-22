import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    // 総数確認
    const total = await client.query('SELECT COUNT(*) FROM unified_tasks');
    console.log('総タスク数:', total.rows[0].count);

    // 重複確認
    const dups = await client.query(`
      SELECT title, due_date, COUNT(*) as cnt 
      FROM unified_tasks 
      GROUP BY title, due_date 
      HAVING COUNT(*) > 1 
      ORDER BY cnt DESC LIMIT 10
    `);
    console.log('\n重複タスク (title + due_date):');
    console.table(dups.rows);

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
