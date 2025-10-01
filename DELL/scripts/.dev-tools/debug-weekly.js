// Debug weekly recurring logic

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

function debugWeekly() {
  const startDate = '2025-09-09'; // 火曜日
  const testDate = '2025-09-11';  // 木曜日
  const weekdays = [1, 3]; // 火曜・木曜
  
  console.log('=== Weekly Task Debug ===');
  console.log(`Start date: ${startDate}`);
  console.log(`Test date: ${testDate}`);
  console.log(`Target weekdays: ${weekdays} (火曜=1, 木曜=3)`);
  
  // Step 1: 曜日チェック
  const targetWeekday = getWeekdayJST(testDate);
  console.log(`\nStep 1 - Weekday check:`);
  console.log(`Test date weekday: ${targetWeekday}`);
  console.log(`Is in target weekdays: ${weekdays.includes(targetWeekday)}`);
  
  if (!weekdays.includes(targetWeekday)) {
    console.log('❌ Weekday check failed');
    return false;
  }
  
  // Step 2: 週差計算
  const startWeekday = getWeekdayJST(startDate);
  const targetWeekday2 = getWeekdayJST(testDate);
  
  console.log(`\nStep 2 - Week calculation:`);
  console.log(`Start weekday: ${startWeekday}`);
  console.log(`Target weekday: ${targetWeekday2}`);
  
  const startDateObj = parseDateJST(startDate);
  const targetDateObj = parseDateJST(testDate);
  
  const startWeekStart = new Date(startDateObj);
  startWeekStart.setDate(startDateObj.getDate() - startWeekday);
  
  const targetWeekStart = new Date(targetDateObj);
  targetWeekStart.setDate(targetDateObj.getDate() - targetWeekday2);
  
  console.log(`Start week start (Monday): ${formatDateJST(startWeekStart)}`);
  console.log(`Target week start (Monday): ${formatDateJST(targetWeekStart)}`);
  
  const timeDiff = targetWeekStart.getTime() - startWeekStart.getTime();
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  const weeksDiff = Math.floor(daysDiff / 7);
  
  console.log(`Time diff: ${timeDiff}ms`);
  console.log(`Days diff: ${daysDiff}`);
  console.log(`Weeks diff: ${weeksDiff}`);
  
  const intervalN = 1;
  const result = timeDiff >= 0 && weeksDiff % intervalN === 0;
  console.log(`Final result: ${result ? '✅' : '❌'}`);
  
  return result;
}

// Test different dates
const testDates = ['2025-09-09', '2025-09-11', '2025-09-16', '2025-09-18'];
console.log('Testing weekly task on different dates:\n');

testDates.forEach(date => {
  console.log(`\n🗓️  Testing ${date}:`);
  debugWeekly();
});