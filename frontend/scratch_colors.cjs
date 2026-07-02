const fs = require('fs');

const colorsJsPath = 'src/theme/colors.js';
const indexCssPath = 'src/index.css';

const content = fs.readFileSync(colorsJsPath, 'utf-8');
const lines = content.split('\n');

const lightVars = [];
const darkVars = [];
const newLines = [];

for (let line of lines) {
  let m = line.match(/^(\s*)([a-zA-Z0-9_]+):\s*["']([^"']+)["'](,?)(.*)$/);
  if (m) {
    const space = m[1], key = m[2], val = m[3], comma = m[4], rest = m[5];
    
    if (val.startsWith('linear-gradient') || key === 'glass' || key === 'glassBorder' || key.startsWith('sidebar')) {
      // For gradients, glass colors and sidebar specific, maybe keep them as is or map them.
      // Actually sidebar colors should probably be CSS vars too.
      if (val.startsWith('linear-gradient')) {
         lightVars.push(`  --grad-${key}: ${val};`);
         darkVars.push(`  --grad-${key}: ${val};`);
         newLines.push(`${space}${key}: "var(--grad-${key})" ${comma}${rest}`);
      } else {
         lightVars.push(`  --color-${key}: ${val};`);
         darkVars.push(`  --color-${key}: ${val};`); // keep same for now unless we manually override
         newLines.push(`${space}${key}: "var(--color-${key})" ${comma}${rest}`);
      }
    } else {
      // Standard hex color
      lightVars.push(`  --color-${key}: ${val};`);
      
      let darkVal = val;
      if (key === 'bg') darkVal = '#0f172a';
      else if (key === 'bgMuted') darkVal = '#1e293b';
      else if (key === 'white') darkVal = '#1e293b'; 
      else if (key === 'border') darkVal = '#334155';
      else if (key === 'borderMuted') darkVal = '#1e293b';
      else if (key === 'surface') darkVal = '#0f172a';
      else if (key === 'navy') darkVal = '#f1f5f9';
      else if (key === 'slate') darkVal = '#cbd5e1';
      else if (key === 'slateMid') darkVal = '#94a3b8';
      else if (key === 'muted') darkVal = '#64748b';
      
      darkVars.push(`  --color-${key}: ${darkVal};`);
      newLines.push(`${space}${key}: "var(--color-${key})" ${comma}${rest}`);
    }
  } else {
    newLines.push(line);
  }
}

fs.writeFileSync(colorsJsPath, newLines.join('\n'));

const css = `
:root {
${lightVars.join('\n')}
}

[data-theme='dark'] {
${darkVars.join('\n')}
  /* Overrides for sidebar when dark mode is enabled so it doesn't look white */
  --color-sidebarBg: #0f172a;
  --color-sidebarBorder: rgba(255,255,255,0.06);
  --color-sidebarText: #94a3b8;
  --color-sidebarTextActive: #e2e8f0;
  --color-sidebarActive: rgba(99,102,241,0.18);
  --color-sidebarHover: rgba(255,255,255,0.05);
}
`;

fs.appendFileSync(indexCssPath, '\n/* --- Theme Variables --- */\n' + css);
console.log('Script completed successfully.');
