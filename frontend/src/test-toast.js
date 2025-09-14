// Simple test file to verify toast system works
import toastService from './services/toastService';

// Test all toast variants
console.log('Testing toast system...');

// Test success toast
setTimeout(() => {
  toastService.success('Test Success', 'This is a test success message');
}, 1000);

// Test error toast
setTimeout(() => {
  toastService.error('Test Error', 'This is a test error message');
}, 2000);

// Test warning toast
setTimeout(() => {
  toastService.warning('Test Warning', 'This is a test warning message');
}, 3000);

// Test info toast
setTimeout(() => {
  toastService.info('Test Info', 'This is a test info message');
}, 4000);

console.log('Toast tests scheduled!');
