import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU2OTAxOSwiZXhwIjoyMDczMTQ1MDE5fQ.rACc-PmwtdPpAC63Z8BoJBudMN4YX20-B4601SuFxmY'
);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function fix() {
  // 1. Supabase重複削除
  console.log('=== Supabase重複削除 ===');
  const { data: supRecords } = await supabase.from('fuel_records').select('id, date, mileage');
  const seen = new Set();
  const toDelete = [];
  for (const r of supRecords) {
    const key = r.date + '|' + r.mileage;
    if (seen.has(key)) {
      toDelete.push(r.id);
    } else {
      seen.add(key);
    }
  }
  for (const id of toDelete) {
    await supabase.from('fuel_records').delete().eq('id', id);
  }
  console.log('Supabase削除:', toDelete.length, '件');

  // 2. manarieDB重複削除
  console.log('\n=== manarieDB重複削除 ===');
  const result = await pool.query(`
    DELETE FROM fuel_records
    WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY date, mileage ORDER BY created_at) as rn
        FROM fuel_records
      ) sub WHERE rn > 1
    )
  `);
  console.log('manarieDB削除:', result.rowCount, '件');

  // 確認
  const { count } = await supabase.from('fuel_records').select('*', { count: 'exact' });
  const pgCount = await pool.query('SELECT COUNT(*) FROM fuel_records');

  console.log('\n=== 結果 ===');
  console.log('Supabase:', count, '件');
  console.log('manarieDB:', pgCount.rows[0].count, '件');

  await pool.end();
}

fix().catch(console.error);
