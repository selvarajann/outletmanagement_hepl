const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const enterpriseRowTarget = 'sx={{ backgroundColor: C.white, transition: "background-color 0.15s ease", "&:hover": { backgroundColor: C.bgMuted }, "&:last-child td": { borderBottom: "none" } }}';

walkDir(srcDir, (filePath) => {
  if (!filePath.endsWith('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // 1. Tables: Replace the inline sx in TableRow with enterpriseRowSx
  if (content.includes(enterpriseRowTarget)) {
    content = content.replace(enterpriseRowTarget, 'sx={enterpriseRowSx}');
    if (!content.includes('enterpriseRowSx')) {
       // just a safety
    }
    if (!content.includes('import { enterpriseRowSx }')) {
      content = content.replace(/(import .*?;)(?=\n\s*(?:const|export|let|function|return|\n))/s, '$1\nimport { enterpriseRowSx } from "../../theme/styles";');
    }
  }

  // 2. Filters: Replace fieldSx definition and usage
  const fieldSxRegex = /const fieldSx = \{\s*"& \.MuiOutlinedInput-root": \{\s*borderRadius: 2, fontSize: 13, backgroundColor: C\.white,\s*"& fieldset": \{ borderColor: C\.border \},\s*"&:hover fieldset": \{ borderColor: C\.blue \},\s*"&\.Mui-focused fieldset": \{ borderColor: C\.blue \},\s*},\s*"& \.MuiInputLabel-root\.Mui-focused": \{ color: C\.blue \},\s*};\s*/;
  
  if (fieldSxRegex.test(content)) {
    content = content.replace(fieldSxRegex, ''); // Remove the local definition
    
    // Rename usage of fieldSx to filterFieldSx
    content = content.replace(/\.\.\.fieldSx/g, '...filterFieldSx');
    
    // Add import
    if (!content.includes('import { filterFieldSx')) {
      content = content.replace(/(import .*?;)(?=\n\s*(?:const|export|let|function|return|\n))/s, '$1\nimport { filterFieldSx, filterWrapperSx } from "../../theme/styles";');
    }
  }

  // 3. Filters: Replace Wrapper styling
  // E.g. <Box sx={{ p: 2, mb: 2.5, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", width: "100%" }}>
  const wrapperRegex1 = /<Box sx=\{\{ p: 2, mb: 2\.5, backgroundColor: C\.white, border: `1px solid \$\{C\.border\}`, borderRadius: "14px", width: "100%" \}\}>/;
  // ProductFilter specific
  const wrapperRegex2 = /<Box sx=\{\{ width: "100%", p: 2, backgroundColor: C\.white, borderRadius: "14px" \}\}>/;
  // Other variations
  const wrapperRegex3 = /<Box sx=\{\{ p: 2, backgroundColor: C\.white, border: `1px solid \$\{C\.border\}`, borderRadius: "14px" \}\}>/;

  if (wrapperRegex1.test(content) || wrapperRegex2.test(content) || wrapperRegex3.test(content)) {
    content = content.replace(wrapperRegex1, '<Box sx={filterWrapperSx}>');
    content = content.replace(wrapperRegex2, '<Box sx={filterWrapperSx}>');
    content = content.replace(wrapperRegex3, '<Box sx={filterWrapperSx}>');
    
    if (!content.includes('filterWrapperSx')) {
      if (!content.includes('import { filterFieldSx')) {
        content = content.replace(/(import .*?;)(?=\n\s*(?:const|export|let|function|return|\n))/s, '$1\nimport { filterFieldSx, filterWrapperSx } from "../../theme/styles";');
      } else {
        // already handled by fieldSx import logic
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Refactored', filePath);
  }
});
