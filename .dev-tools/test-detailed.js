// Detailed test with debug information

function parseDateJST(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getWeekdayJST(dateString) {
  const date = parseDateJST(dateString);
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // 日曜(0) → 6, 月曜(1) → 0
}

console.log('📅 Detailed recurring task analysis...\n');

// Test weekly task more carefully
const testDates = ['2025-09-09', '2025-09-10', '2025-09-11', '2025-09-12', '2025-09-13', '2025-09-14', '2025-09-15'];

console.log('Date analysis:');
testDates.forEach(date => {
  const weekday = getWeekdayJST(date);
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
  console.log(`${date}: ${dayNames[weekday]}曜日 (weekday=${weekday})`);
});

console.log('\nWeekly task should occur on 火曜(1) and 木曜(3):');
testDates.forEach(date => {
  const weekday = getWeekdayJST(date);
  const shouldOccur = [1, 3].includes(weekday); // 火曜・木曜
  console.log(`${date}: weekday=${weekday}, should occur: ${shouldOccur ? '✅' : '❌'}`);
});

// Test monthly task
console.log('\nMonthly task (15th of month):');
const monthlyDates = ['2025-09-14', '2025-09-15', '2025-09-16'];
monthlyDates.forEach(date => {
  const day = parseDateJST(date).getDate();
  const shouldOccur = day === 15;
  console.log(`${date}: day=${day}, should occur: ${shouldOccur ? '✅' : '❌'}`);
});

// Test interval task (every 2 days from 2025-09-10)
console.log('\nInterval task (every 2 days from 2025-09-10):');
testDates.forEach(date => {
  const targetDate = parseDateJST(date);
  const startDate = parseDateJST('2025-09-10');
  const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const shouldOccur = daysDiff >= 0 && daysDiff % 2 === 0;
  console.log(`${date}: daysDiff=${daysDiff}, should occur: ${shouldOccur ? '✅' : '❌'}`);
});