// This is a utility script to fix all Container components to be responsive
// Run this script to update all Container maxWidth="lg" sx={{ py: 4 }} to responsive versions

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const responsiveContainerStyle = `maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}`;

// Find all TypeScript React files
const files = glob.sync('src/pages/**/*.tsx', { cwd: __dirname + '/..' });

files.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace the old container style with responsive version
  const oldPattern = /maxWidth="lg"\s+sx=\{\{\s*py:\s*4\s*\}\}/g;
  const newContent = content.replace(oldPattern, responsiveContainerStyle);
  
  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    console.log(`Updated: ${filePath}`);
  }
});

console.log('Container fix complete!');