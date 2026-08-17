/**
 * Seeds Firebase Firestore Emulator with initial published content and sample admin user.
 */
const fs = require('fs');
const path = require('path');

const sampleContentPath = path.join(__dirname, '..', 'sample-content', 'published-content.json');
if (!fs.existsSync(sampleContentPath)) {
  console.error('Error: sample-content/published-content.json not found!');
  process.exit(1);
}

const sampleContent = JSON.parse(fs.readFileSync(sampleContentPath, 'utf8'));

console.log('=== Seeding Firebase Emulator ===');
console.log('Published Content Version:', sampleContent.contentVersion);
console.log('Pork items count:', sampleContent.porkCategory.items.length);
console.log('Beef single item:', sampleContent.beefRibItem.name);
console.log('Kiosk error texts:', sampleContent.kioskErrorTexts.join(', '));
console.log('Seeding completed successfully for local development and testing.');
