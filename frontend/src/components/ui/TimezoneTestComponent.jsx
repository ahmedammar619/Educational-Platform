import React, { useState } from 'react';
import { convertTimeByOffset } from '../../utils/timezoneUtils';
import SessionDisplay from './SessionDisplay';

const TimezoneTestComponent = () => {
  const [testResults, setTestResults] = useState([]);

  const runTests = () => {
    const tests = [
      {
        name: 'Chicago to Cairo (8:00 AM)',
        time: '08:00',
        from: 'America/Chicago',
        to: 'Africa/Cairo',
        expected: '16:00'
      },
      {
        name: 'New York to London (2:00 PM)',
        time: '14:00',
        from: 'America/New_York',
        to: 'Europe/London',
        expected: '19:00'
      },
      {
        name: 'Los Angeles to Tokyo (10:00 AM)',
        time: '10:00',
        from: 'America/Los_Angeles',
        to: 'Asia/Tokyo',
        expected: '03:00'
      }
    ];

    const results = tests.map(test => {
      try {
        const result = convertTimeByOffset(test.time, test.from, test.to);
        const passed = result === test.expected;
        return {
          ...test,
          result,
          passed,
          status: passed ? '✅ PASS' : '❌ FAIL'
        };
      } catch (error) {
        return {
          ...test,
          result: 'ERROR',
          passed: false,
          status: '❌ ERROR',
          error: error.message
        };
      }
    });

    setTestResults(results);
  };

  // Test session data
  const testSessions = [
    {
      day: 'Sunday',
      startTime: '08:00',
      endTime: '09:00'
    }
  ];

  const getCurrentTimezone = () => {
    if (typeof window === 'undefined') return 'UTC';
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Timezone Conversion Test</h2>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">
          Current timezone: <strong>{getCurrentTimezone()}</strong>
        </p>
        <button
          onClick={runTests}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run Timezone Tests
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Test Results:</h3>
          <div className="space-y-2">
            {testResults.map((test, index) => (
              <div key={index} className="p-3 border rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{test.name}</span>
                  <span className={test.passed ? 'text-green-600' : 'text-red-600'}>
                    {test.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Input: {test.time} ({test.from}) → Expected: {test.expected} → Got: {test.result}
                </div>
                {test.error && (
                  <div className="text-sm text-red-600 mt-1">Error: {test.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Session Display Test:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Original Session (Chicago timezone):</h4>
            <SessionDisplay 
              sessions={testSessions}
              creatorTimezone="America/Chicago"
              showTimezoneInfo={true}
            />
          </div>
          <div>
            <h4 className="font-medium mb-2">Same Session (Cairo timezone):</h4>
            <SessionDisplay 
              sessions={testSessions}
              creatorTimezone="America/Chicago"
              showTimezoneInfo={true}
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p><strong>Note:</strong> The session display should show converted times when the creator's timezone differs from your local timezone.</p>
        <p>If you're in Cairo timezone, the Chicago session should show 16:00-17:00 instead of 08:00-09:00.</p>
      </div>
    </div>
  );
};

export default TimezoneTestComponent;
