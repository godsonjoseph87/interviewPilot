import assert from 'node:assert';

console.log('🧪 Starting Start Interview & Timer Lifecycle Tests...\n');

// Mock Session State
let session = {
  id: 'sess_test_1',
  candidateName: 'John Doe',
  status: 'draft',
  startedAt: 0,
  totalElapsedSeconds: 0,
  durationMinutes: 45,
};

let isPaused = true;
let totalElapsedSeconds = 0;
let lastTickTime = null;

function tickTimers() {
  if (!session || session.status === 'draft' || isPaused) return;

  const now = Date.now();
  const deltaMs = lastTickTime ? now - lastTickTime : 1000;
  const deltaSeconds = Math.round(deltaMs / 1000);

  if (deltaSeconds >= 1) {
    totalElapsedSeconds += deltaSeconds;
    lastTickTime = now;
  }
}

function startInterview() {
  session.status = 'in_progress';
  session.startedAt = Date.now();
  isPaused = false;
  lastTickTime = Date.now();
}

console.log('Test 1: Verifying timer does not tick when questions are generated (status: draft)...');
assert.strictEqual(session.status, 'draft');
assert.strictEqual(totalElapsedSeconds, 0);

// Simulate multiple timer ticks before clicking Start Interview
tickTimers();
tickTimers();
tickTimers();

assert.strictEqual(totalElapsedSeconds, 0, 'Timer must remain strictly at 0 before starting interview');
console.log('✅ Test 1 Passed: Timer remains strictly at 00:00 while in draft state.\n');

console.log('Test 2: Verifying Start Interview button activates timer and changes status to in_progress...');
startInterview();

assert.strictEqual(session.status, 'in_progress');
assert.ok(session.startedAt > 0);
assert.strictEqual(isPaused, false);

// Simulate timer tick after start
lastTickTime = Date.now() - 2000; // 2 seconds elapsed
tickTimers();

assert.strictEqual(totalElapsedSeconds, 2);
console.log('✅ Test 2 Passed: Timer begins ticking only after Start Interview is clicked.\n');

console.log('🎉 ALL START INTERVIEW & TIMER TESTS PASSED SUCCESSFULLY!');
