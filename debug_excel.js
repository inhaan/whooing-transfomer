import * as XLSX from 'xlsx';
import fs from 'fs';

const file = fs.readFileSync('sample/우리은행샘플.xlsx');
const workbook = XLSX.read(file, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(sheet);

console.log('Headers:', Object.keys(jsonData[0]));
console.log('First Row:', jsonData[0]);
