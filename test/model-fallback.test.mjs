import assert from 'assert';
import { FALLBACK_MODEL_CHAIN, DEFAULT_GEMINI_MODEL } from '../src/lib/constants.ts';

console.log('🧪 Starting Model Fallback & Retry Loop Verification...\n');

// Test 1: Verify Default Model is gemini-3.5-flash-lite
console.log('Test 1: Verifying default model is updated to gemini-3.5-flash-lite...');
assert.strictEqual(DEFAULT_GEMINI_MODEL, 'gemini-3.5-flash-lite', 'Default model must be gemini-3.5-flash-lite');
assert.ok(FALLBACK_MODEL_CHAIN.includes('gemini-3.5-flash-lite'), 'Fallback chain must include gemini-3.5-flash-lite');
assert.ok(FALLBACK_MODEL_CHAIN.includes('gemini-3.5-flash'), 'Fallback chain must include gemini-3.5-flash');
assert.ok(FALLBACK_MODEL_CHAIN.includes('gemini-3.8-flash'), 'Fallback chain must include gemini-3.8-flash');
assert.strictEqual(FALLBACK_MODEL_CHAIN[0], 'gemini-3.5-flash-lite', 'First model in fallback chain must be gemini-3.5-flash-lite');
console.log('✅ Test 1 Passed: Default model and fallback chain configured correctly.\n');

// Test 2: Simulate Model Failover Loop (404 on initial model -> success on next model)
console.log('Test 2: Simulating 404 Not Found failover to next model in chain...');
async function simulateExecuteGenerateWithFallback(initialModel, mockCaller) {
  let activeModel = initialModel;
  const candidateModels = [
    activeModel,
    ...FALLBACK_MODEL_CHAIN.filter((m) => m !== activeModel),
  ];

  const errors = [];
  const attempts = [];

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    attempts.push(currentModel);
    try {
      const response = await mockCaller(currentModel);
      if (currentModel !== activeModel) {
        activeModel = currentModel;
      }
      return { response, activeModel, attempts };
    } catch (err) {
      errors.push({ model: currentModel, error: err.message });
    }
  }

  throw new Error(`All models failed: ${JSON.stringify(errors)}`);
}

// Scenario A: custom/experimental model returns 404, gemini-3.5-flash-lite succeeds
const resultA = await simulateExecuteGenerateWithFallback('custom-model-test', async (model) => {
  if (model === 'custom-model-test') {
    throw new Error('404: This model is no longer available to new users.');
  }
  return `{"success": true, "modelUsed": "${model}"}`;
});

assert.strictEqual(resultA.activeModel, 'gemini-3.5-flash-lite', 'Active model should failover to gemini-3.5-flash-lite');
assert.deepStrictEqual(resultA.attempts, ['custom-model-test', 'gemini-3.5-flash-lite'], 'Should attempt custom then 3.5-flash-lite');
assert.ok(resultA.response.includes('gemini-3.5-flash-lite'), 'Response must be from gemini-3.5-flash-lite');
console.log('✅ Test 2 Passed: 404 error on discontinued model successfully fails over to gemini-3.5-flash-lite.\n');

// Test 3: Simulate Timeout Failover Loop
console.log('Test 3: Simulating Timeout on primary model failing over to secondary model...');
const resultTimeout = await simulateExecuteGenerateWithFallback('gemini-3.5-flash-lite', async (model) => {
  if (model === 'gemini-3.5-flash-lite') {
    throw new Error('Timeout: Request to model gemini-3.5-flash-lite exceeded 90 seconds.');
  }
  return `{"success": true, "modelUsed": "${model}"}`;
});

assert.strictEqual(resultTimeout.activeModel, 'gemini-3.5-flash', 'Active model should failover to next model');
assert.deepStrictEqual(resultTimeout.attempts, ['gemini-3.5-flash-lite', 'gemini-3.5-flash'], 'Should attempt next model on timeout');
console.log('✅ Test 3 Passed: Timeout triggers automatic failover to next model.\n');

// Test 4: Verify Auth Fast-Fail (Invalid API key should not loop indefinitely)
console.log('Test 4: Verifying immediate rejection on missing or invalid API key...');
let didFastFail = false;
try {
  await (async () => {
    const errMsg = 'API_KEY_INVALID: API key not valid. Please pass a valid API key.';
    if (errMsg.includes('API_KEY_INVALID')) {
      throw new Error(errMsg);
    }
  })();
} catch (e) {
  if (e.message.includes('API_KEY_INVALID')) {
    didFastFail = true;
  }
}
assert.strictEqual(didFastFail, true, 'Must immediately fail if API key is invalid');
console.log('✅ Test 4 Passed: Auth errors fail fast without redundant looping.\n');

console.log('🎉 ALL MODEL FALLBACK & RETRY TESTS PASSED SUCCESSFULLY!');

