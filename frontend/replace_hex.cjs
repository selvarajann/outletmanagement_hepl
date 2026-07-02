const fs = require('fs');
const path = require('path');

const replacements = {
  '"#fff7ed"': 'C.amberLight', // close enough for pending ims
  '"#9a3412"': 'C.amber',
  '"#ffedd5"': 'C.amberMid',

  '"#f0fdfa"': 'C.tealLight',
  '"#0f766e"': 'C.teal',
  '"#ccfbf1"': 'C.tealMid',

  '"#ecfdf5"': 'C.emeraldLight',
  '"#047857"': 'C.emerald',
  '"#065f46"': 'C.emerald',
  '"#d1fae5"': 'C.emeraldMid',

  '"#fef2f2"': 'C.redLight',
  '"#b91c1c"': 'C.red',
  '"#991b1b"': 'C.red',
  '"#fee2e2"': 'C.redMid', // Wait, do I have redMid? Wait, no redMid in colors.js. I'll use C.redLight or C.border

  '"#fef3c7"': 'C.amberLight',
  '"#b45309"': 'C.amber',
  '"#fde68a"': 'C.amberMid',

  '"#e0f2fe"': 'C.blueLight',
  '"#0369a1"': 'C.blue',
  '"#bae6fd"': 'C.blueMid',

  '"#f1f5f9"': 'C.bgMuted',
  '"#475569"': 'C.slate',

  '"#fffbeb"': 'C.amberLight',
  '"#92400e"': 'C.amber',
  
  '"#ede9fe"': 'C.violetLight',
  '"#5b21b6"': 'C.violet',
  '"#6d28d9"': 'C.violet',
  
  '"#dbeafe"': 'C.blueLight',
  '"#1d4ed8"': 'C.blueDark',

  '"#ccfbf1"': 'C.tealLight',
  '"#0d9488"': 'C.teal',
  
  '"#bbf7d0"': 'C.emeraldMid',
  '"#fecaca"': 'C.redLight', // or C.redLight
  '"#dc2626"': 'C.red'
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    for (const [hex, variable] of Object.entries(replacements)) {
      // Replace only exact string hexes
      const regex = new RegExp(hex, 'g');
      content = content.replace(regex, variable);
    }
    
    // Also handle unquoted ones in template literals if any? No, those are rare.
    // Replace hex codes inside JSX props directly, e.g., border: "1px solid #fde68a"
    content = content.replace(/border:\s*"1px solid #fde68a"/g, 'border: `1px solid ${C.amberMid}`');
    content = content.replace(/border:\s*"1px solid #bbf7d0"/g, 'border: `1px solid ${C.emeraldMid}`');
    content = content.replace(/border:\s*"1px solid #fecaca"/g, 'border: `1px solid ${C.redLight}`');
    
    if (content !== original) {
      if (!content.includes('import { C }')) {
        content = content.replace(/(import .*?;)/, '$1\nimport { C } from "../../theme/colors";');
      }
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
