// Detailed debugging of weekly logic

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

console.log('=== Debugging Weekly Logic Step by Step ===\n');

// Test case: Start 2025-09-09 (火), check 2025-09-11 (木)
const startDateStr = '2025-09-09';
const targetDateStr = '2025-09-11';

console.log(`Start date: ${startDateStr} (火曜日)`);
console.log(`Target date: ${targetDateStr} (木曜日)`);

const startDate = parseDateJST(startDateStr);
const targetDate = parseDateJST(targetDateStr);

console.log(`Start date parsed: ${startDate}`);
console.log(`Target date parsed: ${targetDate}`);

// Step 1: Get weekdays
const startWeekday = getWeekdayJST(startDateStr);
const targetWeekday = getWeekdayJST(targetDateStr);

console.log(`\nStep 1 - Weekdays:`);
console.log(`Start weekday: ${startWeekday} (should be 1 for Tuesday)`);
console.log(`Target weekday: ${targetWeekday} (should be 3 for Thursday)`);

// Step 2: Calculate week starts
const startWeekStart = new Date(startDate);
startWeekStart.setDate(startDate.getDate() - startWeekday);

const targetWeekStart = new Date(targetDate);
targetWeekStart.setDate(targetDate.getDate() - targetWeekday);

console.log(`\nStep 2 - Week starts (Monday):`);
console.log(`Start week Monday: ${formatDateJST(startWeekStart)}`);
console.log(`Target week Monday: ${formatDateJST(targetWeekStart)}`);
console.log(`Should be same week: ${formatDateJST(startWeekStart) === formatDateJST(targetWeekStart)}`);

// Step 3: Calculate time difference
const timeDiff = targetWeekStart.getTime() - startWeekStart.getTime();
const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
const weeksDiff = Math.floor(daysDiff / 7);

console.log(`\nStep 3 - Time calculations:`);
console.log(`Time difference: ${timeDiff}ms`);
console.log(`Days difference: ${daysDiff} days`);
console.log(`Weeks difference: ${weeksDiff} weeks`);

// Step 4: Final check
const intervalN = 1;
const isValidInterval = weeksDiff % intervalN === 0;
const isAfterStart = timeDiff >= 0;

console.log(`\nStep 4 - Final checks:`);
console.log(`Is after start: ${isAfterStart}`);
console.log(`Is valid interval (${weeksDiff} % ${intervalN} === 0): ${isValidInterval}`);
console.log(`Final result: ${isAfterStart && isValidInterval}`);

// Let's also test next week
console.log(`\n=== Testing Next Week ===`);
const nextWeekTue = '2025-09-16'; // Next Tuesday
const nextWeekTarget = parseDateJST(nextWeekTue);
const nextWeekStart = new Date(nextWeekTarget);
nextWeekStart.setDate(nextWeekTarget.getDate() - getWeekdayJST(nextWeekTue));

const nextTimeDiff = nextWeekStart.getTime() - startWeekStart.getTime();
const nextWeeksDiff = Math.floor(nextTimeDiff / (1000 * 60 * 60 * 24 * 7));

console.log(`Next Tuesday: ${nextWeekTue}`);
console.log(`Next week Monday: ${formatDateJST(nextWeekStart)}`);
console.log(`Weeks difference: ${nextWeeksDiff}`);
console.log(`Should occur: ${nextWeeksDiff % 1 === 0 && nextTimeDiff >= 0}`);