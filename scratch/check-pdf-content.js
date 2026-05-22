const fs = require('fs');

const pdfPath = 'scratch/test.pdf';
if (!fs.existsSync(pdfPath)) {
  console.error("File does not exist:", pdfPath);
  process.exit(1);
}

const content = fs.readFileSync(pdfPath);
console.log("PDF File size:", content.length, "bytes");

// Search for typical PDF objects
const textString = content.toString('latin1');
const pagesMatches = textString.match(/\/Type\s*\/Page\b/g);
console.log("Number of Page objects found:", pagesMatches ? pagesMatches.length : 0);

const fontMatches = textString.match(/\/Type\s*\/Font\b/g);
console.log("Number of Font objects found:", fontMatches ? fontMatches.length : 0);

// Let's print out some plain text segments found in the PDF streams (deflate compressed usually, but pdfkit might have uncompressed parts depending on compression settings or font files)
const streamCount = (textString.match(/\/Length\s+\d+/g) || []).length;
console.log("Number of stream elements:", streamCount);

// Check if PDF starts with %PDF and ends with %%EOF
console.log("Starts with %PDF:", textString.startsWith('%PDF'));
console.log("Contains %%EOF:", textString.includes('%%EOF'));
