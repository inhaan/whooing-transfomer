import * as XLSX from 'xlsx';
import fs from 'fs';

const file = fs.readFileSync('sample/하나은행샘플.xls');
const workbook = XLSX.read(file, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to array of arrays to find the header row
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

let headerRowIndex = -1;
for (let i = 0; i < rawData.length; i++) {
    if (rawData[i].includes('거래일시')) {
        headerRowIndex = i;
        break;
    }
}

if (headerRowIndex === -1) {
    console.error('Could not find header row containing "거래일시"');
    process.exit(1);
}

const headers = rawData[headerRowIndex];
const dataRows = rawData.slice(headerRowIndex + 1);

console.log('Header Row Index:', headerRowIndex);
console.log('Headers:', headers);

dataRows.forEach((row, index) => {
    const rowData = {};
    headers.forEach((header, i) => {
        rowData[header] = row[i];
    });

    if (rowData['거래일시']) {
        console.log(`Row ${index + 1}: Date=${rowData['거래일시']}, Item=${rowData['적요']}, Branch=${rowData['거래점']}`);
        if (!rowData['적요']) {
            console.error(`!!! Problematic Row ${index + 1}: '적요' is empty`);
        }
    }
});
