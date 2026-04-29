import fs from 'fs';
import { parse } from '@babel/parser';

const code = fs.readFileSync('c:/Users/Admin/Desktop/billkaro/src/App.jsx', 'utf8');

try {
  parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('✅ Syntax is correct!');
} catch (e) {
  console.error('❌ Syntax Error:');
  console.error(e.message);
  console.error(`At line ${e.loc.line}, column ${e.loc.column}`);
}
