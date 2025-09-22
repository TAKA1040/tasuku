const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const tasks = data.allData.unified_tasks.sample || [];

console.log('全タスク数:', data.allData.unified_tasks.count);
console.log('サンプル数:', tasks.length);

// やることリストという名前のタスクを探す
const targetTask = tasks.find(t => t.title && t.title.includes('やることリスト'));
if (targetTask) {
  console.log('見つかったタスク:', JSON.stringify(targetTask, null, 2));
} else {
  console.log('やることリストという名前のタスクが見つかりません');
  console.log('利用可能なタスク:');
  tasks.forEach((t, i) => {
    console.log(`${i+1}. ${t.title} (due: ${t.due_date}, type: ${t.task_type})`);
  });
}