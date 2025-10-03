/**
 * Test script for timezone conversion functionality
 * Run this in browser console to test the conversion
 */

import { convertTimeByOffset, formatTimezoneDisplay } from './timezoneUtils.js';

// Test cases
const testCases = [
  {
    name: 'Chicago to Cairo (8:00 AM)',
    time: '08:00',
    from: 'America/Chicago',
    to: 'Africa/Cairo',
    expected: '16:00' // 8 hours difference
  },
  {
    name: 'New York to London (2:00 PM)',
    time: '14:00',
    from: 'America/New_York',
    to: 'Europe/London',
    expected: '19:00' // 5 hours difference
  },
  {
    name: 'Los Angeles to Tokyo (10:00 AM)',
    time: '10:00',
    from: 'America/Los_Angeles',
    to: 'Asia/Tokyo',
    expected: '03:00' // 17 hours difference (next day)
  }
];

export const runTimezoneTests = () => {
  console.log('🧪 Testing Timezone Conversion...\n');
  
  testCases.forEach((testCase, index) => {
    try {
      const result = convertTimeByOffset(testCase.time, testCase.from, testCase.to);
      const passed = result === testCase.expected;
      
      console.log(`Test ${index + 1}: ${testCase.name}`);
      console.log(`  Input: ${testCase.time} (${testCase.from})`);
      console.log(`  Expected: ${testCase.expected}`);
      console.log(`  Got: ${result}`);
      console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
      
      if (!passed) {
        console.error(`❌ Test failed! Expected ${testCase.expected}, got ${result}`);
      }
    } catch (error) {
      console.error(`❌ Test ${index + 1} threw an error:`, error);
    }
  });
  
  // Test timezone display formatting
  console.log('🌍 Testing Timezone Display Formatting...\n');
  
  const timezones = ['America/Chicago', 'Africa/Cairo', 'Europe/London', 'Asia/Tokyo'];
  timezones.forEach(tz => {
    try {
      const display = formatTimezoneDisplay(tz);
      console.log(`${tz}: ${display}`);
    } catch (error) {
      console.error(`Error formatting ${tz}:`, error);
    }
  });
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runTimezoneTests = runTimezoneTests;
  console.log('💡 Run window.runTimezoneTests() in the console to test timezone conversion');
}
