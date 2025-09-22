const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log('期限なしタスクの数:', data.summary.no_date);
data.analysis.forEach(t => {
  if(!t.due_date && !t.completed) {
    console.log('期限なし:', t.title, 'due_date:', t.due_date)
  }
});