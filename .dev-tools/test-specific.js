// Test specific weekly cases

function parseDateJST(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateJST(date) {
  return date.toLocaleDateString('ja-CA');
}

function getWeekdayJST(dateString) {
  const date = parseDateJST(dateString);
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // 日曜(0) → 6, 月曜(1) → 0
}

function occursOnWeekly(targetDate, startDate, intervalN = 1, weekdays) {
  if (weekdays.length === 0) return false;
  
  console.log(`\nTesting ${formatDateJST(targetDate)}:`);
  
  const targetWeekday = getWeekdayJST(formatDateJST(targetDate));
  console.log(`  Target weekday: ${targetWeekday}`);
  
  if (!weekdays.includes(targetWeekday)) {
    console.log(`  ❌ Not in target weekdays [${weekdays}]`);
    return false;
  }
  console.log(`  ✅ Is in target weekdays`);
  
  const startWeekday = getWeekdayJST(formatDateJST(startDate));
  
  const startWeekStart = new Date(startDate);
  startWeekStart.setDate(startDate.getDate() - startWeekday);
  
  const targetWeekStart = new Date(targetDate);
  targetWeekStart.setDate(targetDate.getDate() - targetWeekday);
  
  console.log(`  Start week Monday: ${formatDateJST(startWeekStart)}`);
  console.log(`  Target week Monday: ${formatDateJST(targetWeekStart)}`);
  
  const timeDiff = targetWeekStart.getTime() - startWeekStart.getTime();
  const weeksDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
  
  console.log(`  Weeks difference: ${weeksDiff}`);
  console.log(`  Interval check (${weeksDiff} % ${intervalN}): ${weeksDiff % intervalN === 0}`);
  
  const result = timeDiff >= 0 && weeksDiff % intervalN === 0;
  console.log(`  Final result: ${result ? '✅' : '❌'}`);
  return result;
}

// Test the specific weekly task
const startDate = parseDateJST('2025-09-09'); // 火曜日
const weekdays = [1, 3]; // 火曜・木曜

console.log('Testing weekly task (Tue & Thu from 2025-09-09):');

const testDates = [
  '2025-09-09', // 火曜日 (start date)
  '2025-09-11', // 木曜日 (same week)
  '2025-09-16', // 火曜日 (next week) 
  '2025-09-18', // 木曜日 (next week)
];

testDates.forEach(dateStr => {
  const targetDate = parseDateJST(dateStr);
  const result = occursOnWeekly(targetDate, startDate, 1, weekdays);
});