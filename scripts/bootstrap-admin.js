/**
 * Helper to bootstrap admin privileges for an account.
 */
console.log('=== MeatGuide Admin Bootstrap Guide ===');
console.log('1. In Firebase Console, create an account under Authentication -> Users.');
console.log('2. Copy the UID of the newly created admin user.');
console.log('3. In Cloud Firestore, create document: /admins/{UID} with { role: "superadmin", createdAt: new Date() }');
console.log('4. The user now has full administrative rights to publish content and upload assets.');
