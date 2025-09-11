// Fixed test

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
  return day === 0 ? 6 : day - 1;
}

// Test the date functions first
console.log('=== Date Function Test ===');
const testDate = '2025-09-09';
console.log(`Input: ${testDate}`);
console.log(`Parsed:`, parseDateJST(testDate));
console.log(`Formatted:`, formatDateJST(parseDateJST(testDate)));
console.log(`Weekday:`, getWeekdayJST(testDate));

function occursOnWeekly(targetDate, startDate, intervalN = 1, weekdays) {
  if (weekdays.length === 0) return false;
  
  // Use the date strings directly
  const targetWeekday = getWeekdayJST(formatDateJST(targetDate));
  if (!weekdays.includes(targetWeekday)) return false;
  
  const startWeekday = getWeekdayJST(formatDateJST(startDate));
  
  const startWeekStart = new Date(startDate);
  startWeekStart.setDate(startDate.getDate() - startWeekday);
  
  const targetWeekStart = new Date(targetDate);
  targetWeekStart.setDate(targetDate.getDate() - targetWeekday);
  
  const timeDiff = targetWeekStart.getTime() - startWeekStart.getTime();
  const weeksDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
  
  return timeDiff >= 0 && weeksDiff % intervalN === 0;
}

console.log('\n=== Weekly Task Test ===');
const startDate = parseDateJST('2025-09-09');
const weekdays = [1, 3];

['2025-09-09', '2025-09-11'].forEach(dateStr => {
  const targetDate = parseDateJST(dateStr);
  const targetWeekday = getWeekdayJST(dateStr);
  const inWeekdays = weekdays.includes(targetWeekday);
  const result = occursOnWeekly(targetDate, startDate, 1, weekdays);
  
  console.log(`${dateStr}: weekday=${targetWeekday}, inTarget=${inWeekdays}, result=${result}`);
});