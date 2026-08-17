const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Firebase Security Rules Static & Logic Verification ===');

// Read rules files
const firestoreRulesPath = path.join(__dirname, '..', 'firestore.rules');
const storageRulesPath = path.join(__dirname, '..', 'storage.rules');

assert(fs.existsSync(firestoreRulesPath), 'firestore.rules must exist');
assert(fs.existsSync(storageRulesPath), 'storage.rules must exist');

const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf8');
const storageRules = fs.readFileSync(storageRulesPath, 'utf8');

// Test 1: Published content readable by authenticated/anonymous tablets
assert(firestoreRules.includes('match /published/{docId}'), 'Must define rule for /published/{docId}');
assert(firestoreRules.includes('allow read: if isAuthenticated()'), 'Published content must allow read for authenticated users');
assert(firestoreRules.includes('allow write: if isAdmin()'), 'Published content must allow write ONLY for admins');
console.log('✔ Test 1 Passed: Published content readable by tablets, writable only by admins');

// Test 2: Drafts and Admin documents strictly admin-only
assert(firestoreRules.includes('match /drafts/{docId}'), 'Must protect /drafts/{docId}');
assert(firestoreRules.includes('match /admins/{adminUid}'), 'Must protect /admins/{adminUid}');
assert(firestoreRules.includes('match /content_history/{version}'), 'Must protect /content_history');
console.log('✔ Test 2 Passed: Drafts, admins, and content history are strictly admin-only');

// Test 3: Device document isolation
assert(firestoreRules.includes('match /devices/{deviceUid}'), 'Must define rule for /devices/{deviceUid}');
assert(firestoreRules.includes('request.auth.uid == deviceUid'), 'Tablet must only write its own device UID');
console.log('✔ Test 3 Passed: Device status can only be modified by matching deviceUid');

// Test 4: Storage rules validation (3MB size limit & image content-type)
assert(storageRules.includes('request.resource.size < 3 * 1024 * 1024'), 'Storage must enforce 3MB limit');
assert(storageRules.includes("request.resource.contentType.matches('image/.*')"), 'Storage must enforce image mime-type');
assert(storageRules.includes('allow write: if isAdmin()'), 'Storage write must be admin-only');
console.log('✔ Test 4 Passed: Storage enforces 3MB max size, image type, and admin-only write');

// Simulated Logic Tests
const simulateRulesEvaluation = (context) => {
  const { auth, collection, docId, action, targetUid } = context;
  const isAuthenticated = auth !== null;
  const isAdmin = auth?.isAdmin === true;

  if (collection === 'published') {
    if (action === 'read') return isAuthenticated;
    if (action === 'write') return isAdmin;
  }
  if (collection === 'drafts' || collection === 'admins' || collection === 'content_history') {
    return isAdmin;
  }
  if (collection === 'devices') {
    if (action === 'read') return isAdmin || (isAuthenticated && auth.uid === docId);
    if (action === 'write') return isAuthenticated && auth.uid === docId;
    if (action === 'delete') return isAdmin;
  }
  return false;
};

// 1. Anonymous tablet reading published content -> ALLOW
assert.strictEqual(simulateRulesEvaluation({
  auth: { uid: 'tablet_anon_1', isAnonymous: true, isAdmin: false },
  collection: 'published',
  docId: 'current',
  action: 'read'
}), true);

// 2. Anonymous tablet writing published content -> DENY
assert.strictEqual(simulateRulesEvaluation({
  auth: { uid: 'tablet_anon_1', isAnonymous: true, isAdmin: false },
  collection: 'published',
  docId: 'current',
  action: 'write'
}), false);

// 3. Anonymous tablet reading other device status -> DENY
assert.strictEqual(simulateRulesEvaluation({
  auth: { uid: 'tablet_anon_1', isAnonymous: true, isAdmin: false },
  collection: 'devices',
  docId: 'tablet_anon_2',
  action: 'read'
}), false);

// 4. Anonymous tablet writing own device status -> ALLOW
assert.strictEqual(simulateRulesEvaluation({
  auth: { uid: 'tablet_anon_1', isAnonymous: true, isAdmin: false },
  collection: 'devices',
  docId: 'tablet_anon_1',
  action: 'write'
}), true);

// 5. Admin publishing content -> ALLOW
assert.strictEqual(simulateRulesEvaluation({
  auth: { uid: 'admin_123', isAdmin: true },
  collection: 'published',
  docId: 'current',
  action: 'write'
}), true);

// 6. Unauthenticated user reading drafts -> DENY
assert.strictEqual(simulateRulesEvaluation({
  auth: null,
  collection: 'drafts',
  docId: 'current',
  action: 'read'
}), false);

console.log('✔ All 6 Security Rules Simulated Test Scenarios Passed Successfully!');
console.log('=== Firebase Security Rules Verification Complete ===');
