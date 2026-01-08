/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * manarieDB CLI for tasuku
 *
 * 使い方:
 *   node scripts/manariedb-cli.js backup create
 *   node scripts/manariedb-cli.js backup restore <file> --dry-run
 *   node scripts/manariedb-cli.js import csv <file> --table <name>
 *   node scripts/manariedb-cli.js export table <name>
 *   node scripts/manariedb-cli.js sql "SELECT * FROM users"
 *   node scripts/manariedb-cli.js tables
 */

// ===== 設定 =====
const CONFIG = {
  endpoint: 'https://manariedb.apaf.me',
  apiKey: 'mk_rw_K8j1rJr9ZbL7TUQx7KLcoGcHXVwGaf2k',
  schema: 'tasuku_5f7d',
};
// ================

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// コマンドライン引数を解析
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

// フラグを解析
const flags = {
  dryRun: args.includes('--dry-run'),
  confirm: args.includes('--confirm'),
  upsert: args.includes('--upsert'),
  json: args.includes('--json'),
};

// テーブル名などの値を取得
const getFlag = (name) => {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : null;
};

// API呼び出し
async function apiCall(method, apiPath, body = null) {
  const url = new URL(apiPath, CONFIG.endpoint);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'X-Schema': CONFIG.schema,
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// SQL実行
async function executeSQL(sql) {
  return apiCall('POST', '/api/external/query', { sql, schema: CONFIG.schema });
}

// テーブル一覧
async function getTables() {
  return apiCall('GET', `/api/external/tables?schema=${CONFIG.schema}`);
}

// バックアップ作成
async function backupCreate(outputFile) {
  console.log('バックアップ作成中...');

  const tablesResult = await getTables();
  if (!tablesResult.tables) {
    console.error('テーブル一覧の取得に失敗しました:', tablesResult);
    return;
  }

  const backup = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    schema: CONFIG.schema,
    tables: {},
  };

  for (const table of tablesResult.tables) {
    console.log(`  - ${table.name} をバックアップ中...`);
    const result = await executeSQL(`SELECT * FROM ${table.name}`);
    if (result.success) {
      backup.tables[table.name] = {
        columns: result.data.columns,
        rows: result.data.rows,
        rowCount: result.data.rowCount,
      };
      console.log(`    ${table.name}: ${result.data.rowCount} 行`);
    }
  }

  const filename = outputFile || `backup_${CONFIG.schema}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  console.log(`\nバックアップ完了: ${filename}`);
}

// バックアップ復元
async function backupRestore(file) {
  if (!file) {
    console.error('ファイルを指定してください');
    return;
  }

  if (!flags.dryRun && !flags.confirm) {
    console.log('安全のため --dry-run または --confirm が必要です');
    console.log('  --dry-run: 復元内容をプレビュー');
    console.log('  --confirm: 実際に復元を実行');
    return;
  }

  const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`バックアップファイル: ${path.basename(file)}`);
  console.log(`  作成日時: ${backup.createdAt}`);
  console.log(`  テーブル数: ${Object.keys(backup.tables).length}`);

  if (flags.dryRun) {
    console.log('\n=== DRY-RUN モード ===\n');
    for (const [tableName, data] of Object.entries(backup.tables)) {
      console.log(`${tableName}: ${data.rowCount} 行を復元予定`);
    }
    console.log('\n実際に復元するには --confirm を指定してください');
    return;
  }

  // 実際の復元
  console.log('\n復元を開始します...');
  for (const [tableName, data] of Object.entries(backup.tables)) {
    let success = 0, error = 0;
    for (const row of data.rows) {
      const columns = Object.keys(row).join(', ');
      const values = Object.values(row).map(v => formatValue(v)).join(', ');
      const sql = flags.upsert
        ? `INSERT INTO ${tableName} (${columns}) VALUES (${values}) ON CONFLICT (id) DO UPDATE SET ${Object.keys(row).filter(k => k !== 'id').map(k => `${k} = EXCLUDED.${k}`).join(', ')}`
        : `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;
      const result = await executeSQL(sql);
      if (result.success) { success++; } else { error++; }
    }
    console.log(`  ${tableName}: 成功 ${success} / エラー ${error}`);
  }
  console.log('\n復元完了');
}

// CSVインポート
async function importCSV(file) {
  const tableName = getFlag('--table');
  if (!tableName) {
    console.error('--table オプションでテーブル名を指定してください');
    return;
  }

  if (!flags.dryRun && !flags.confirm) {
    console.log('安全のため --dry-run または --confirm が必要です');
    return;
  }

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1);

  console.log(`CSVファイル: ${path.basename(file)}`);
  console.log(`  カラム: ${headers.join(', ')}`);
  console.log(`  行数: ${rows.length}`);

  if (flags.dryRun) {
    console.log('\n=== DRY-RUN モード ===');
    console.log('実際にインポートするには --confirm を指定してください');
    return;
  }

  let success = 0, error = 0;
  for (const row of rows) {
    const values = row.split(',').map(v => formatValue(v.trim()));
    const sql = `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values.join(', ')})`;
    const result = await executeSQL(sql);
    if (result.success) { success++; } else { error++; }
  }
  console.log(`\nインポート完了: 成功 ${success} / エラー ${error}`);
}

// テーブルエクスポート
async function exportTable(tableName) {
  if (!tableName) {
    console.error('テーブル名を指定してください');
    return;
  }

  const result = await executeSQL(`SELECT * FROM ${tableName}`);
  if (!result.success) {
    console.error('エクスポート失敗:', result.error);
    return;
  }

  if (flags.json) {
    console.log(JSON.stringify(result.data.rows, null, 2));
  } else {
    const filename = `${tableName}_${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(filename, JSON.stringify(result.data.rows, null, 2));
    console.log(`エクスポート完了: ${filename} (${result.data.rowCount} 行)`);
  }
}

// SQL実行
async function runSQL(sql) {
  const result = await executeSQL(sql);
  if (!result.success) {
    console.error('エラー:', result.error || result);
    return;
  }

  if (flags.json) {
    console.log(JSON.stringify(result.data.rows, null, 2));
  } else if (result.data.rows?.length > 0) {
    console.table(result.data.rows);
    console.log(`\n${result.data.rowCount} 行 (${result.data.executionTime})`);
  } else {
    console.log(result.data.message || '完了');
  }
}

// 値をSQL形式にフォーマット
function formatValue(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (Array.isArray(v)) return `'{${v.join(',')}}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

// ヘルプ表示
function showHelp() {
  console.log(`
manarieDB CLI for tasuku (schema: ${CONFIG.schema})

使い方:
  node scripts/manariedb-cli.js <command> [options]

コマンド:
  backup create [--output <file>]     バックアップ作成
  backup restore <file> [--dry-run|--confirm] [--upsert]  バックアップ復元

  import csv <file> --table <name> [--dry-run|--confirm]  CSVインポート

  export table <name> [--json]        テーブルエクスポート

  sql "<query>" [--json]              SQL実行

  tables                              テーブル一覧

オプション:
  --dry-run    プレビューのみ（データ変更なし）
  --confirm    実際に実行
  --upsert     重複時は更新
  --json       JSON形式で出力
`);
}

// メイン処理
async function main() {
  switch (command) {
    case 'backup':
      if (subCommand === 'create') await backupCreate(getFlag('--output'));
      else if (subCommand === 'restore') await backupRestore(args[2]);
      else console.log('使い方: backup create | backup restore <file>');
      break;

    case 'import':
      if (subCommand === 'csv') await importCSV(args[2]);
      else console.log('使い方: import csv <file> --table <name>');
      break;

    case 'export':
      if (subCommand === 'table') await exportTable(args[2]);
      else console.log('使い方: export table <name>');
      break;

    case 'sql':
      await runSQL(subCommand);
      break;

    case 'tables':
      const result = await getTables();
      if (result.tables) {
        console.log('テーブル一覧:');
        result.tables.forEach(t => console.log(`  ${t.name} (${t.rows} 行)`));
      } else {
        console.error('取得失敗:', result);
      }
      break;

    default:
      showHelp();
  }
}

main().catch(console.error);
