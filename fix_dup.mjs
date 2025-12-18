import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://manarie_app:Apud284700@210.131.221.42:5432/manariedb?options=-csearch_path%3Dtasuku_5f7d'
});

async function main() {
  const client = await pool.connect();
  try {
    // 削除前の件数
    const before = await client.query('SELECT COUNT(*) FROM unified_tasks');
    console.log('削除前:', before.rows[0].count, '件');

    // 重複削除（各グループでcreated_atが最も古い1件を残す）
    const result = await client.query(`
      DELETE FROM unified_tasks
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
            ROW_NUMBER() OVER (PARTITION BY title, due_date ORDER BY created_at ASC) as rn
          FROM unified_tasks
        ) sub
        WHERE rn > 1
      )
    `);
    console.log('削除件数:', result.rowCount);

    // 削除後の件数
    const after = await client.query('SELECT COUNT(*) FROM unified_tasks');
    console.log('削除後:', after.rows[0].count, '件');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
