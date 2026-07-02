const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  // Skip Login and Register as they have their own specific layouts
  if (['Login.jsx', 'Register.jsx', 'StockOrder.jsx', 'POSSales.jsx'].includes(file)) continue;

  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // We are looking for the main return statement of the component
  // Usually it looks like:
  // return (
  //   <Box>
  // or
  // return (
  //   <Box sx={{ p: 3 }}>

  // We will replace the very first occurrence of <Box> or <Box sx={...}> that comes after "return ("
  
  // A simple regex:
  const regex = /return\s*\(\s*<Box[^>]*>/;
  
  if (regex.test(content)) {
    // Check if it already imports C
    if (!content.includes('import { C }')) {
      // Add import C from "../theme/colors"; after the first import
      content = content.replace(/(import .*?;)/, '$1\nimport { C } from "../theme/colors";');
    }

    content = content.replace(regex, 'return (\n    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>');
    
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
  }
}
