import * as XLSX from 'xlsx';
import { readExcel } from './excel';

// Helper to validate row
const validateRow = (row, rowIndex) => {
    const required = ['날짜', '아이템(괄호)', '금액', '왼쪽', '오른쪽'];
    for (const field of required) {
        if (!row[field] && row[field] !== 0) {
            throw new Error(`Row ${rowIndex + 1}: Missing required field '${field}'`);
        }
    }
    return row;
};

// Helper to apply special rules
const applySpecialRules = (row) => {
    // Example: If item contains 'Coupang', set left to 'Food', right to 'Card'
    if (row['아이템(괄호)'] && row['아이템(괄호)'].includes('쿠팡')) {
        // row['왼쪽'] = '식비';
        // row['오른쪽'] = '카드대금';
    }
    return row;
};

export const convertWoori = async (file) => {
    const workbook = await readExcel(file);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    return jsonData.map((row, index) => {
        const newRow = {
            '날짜': row['날짜'] || row['거래일자'] || row['Date'],
            '아이템(괄호)': row['아이템(괄호)'] || row['적요'] || row['내용'] || row['Item'],
            '금액': row['금액'] || (row['출금액'] || 0) + (row['입금액'] || 0) || row['Amount'],
            '왼쪽': row['왼쪽'] || '미지정',
            '오른쪽': row['오른쪽'] || '미지정',
            '메모': row['메모'] || '',
        };

        return validateRow(applySpecialRules(newRow), index);
    });
};

export const convertHana = async (file) => {
    const workbook = await readExcel(file);
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
        throw new Error('Could not find header row containing "거래일시"');
    }

    const headers = rawData[headerRowIndex];
    const dataRows = rawData.slice(headerRowIndex + 1);

    return dataRows.map((row, index) => {
        const rowData = {};
        headers.forEach((header, i) => {
            rowData[header] = row[i];
        });

        // Skip empty rows
        if (!rowData['거래일시']) return null;

        const date = rowData['거래일시'];
        const item = (rowData['적요'] || '') + (rowData['거래점'] ? ` ${rowData['거래점']}` : '');
        const withdrawal = parseFloat((rowData['출금액'] || '0').toString().replace(/,/g, ''));
        const deposit = parseFloat((rowData['입금액'] || '0').toString().replace(/,/g, ''));
        const amount = withdrawal > 0 ? withdrawal : deposit;

        const accountAlias = '하나은행';
        let left = '미지정(추후수정)';
        let right = '미지정(추후수정)';

        if (withdrawal > 0) {
            right = accountAlias;
            left = '미지정(추후수정)';
        } else if (deposit > 0) {
            left = accountAlias;
            right = '미지정(추후수정)';
        }

        const newRow = {
            '날짜': date,
            '아이템(괄호)': item.trim(),
            '금액': amount,
            '왼쪽': left,
            '오른쪽': right,
            '메모': '',
        };

        return validateRow(applySpecialRules(newRow), index);
    }).filter(row => row !== null);
};

export const convertCoupay = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    const result = [];

    for (let i = 0; i < lines.length; i += 5) {
        if (i + 4 >= lines.length) break; // Incomplete block

        const line1 = lines[i]; // Date | Type
        const line2 = lines[i + 1]; // Item
        const line3 = lines[i + 2]; // Payment Method
        const line4 = lines[i + 3]; // Amount

        // Parse Date
        const dateMatch = line1.match(/^(\d{4}\.\d{2}\.\d{2})/);
        const date = dateMatch ? dateMatch[1] : '';

        // Parse Item
        const item = line2;

        // Parse Amount
        const amountStr = line4.replace(/원/g, '').replace(/,/g, '');
        const amountRaw = parseFloat(amountStr);
        const amount = Math.abs(amountRaw);

        // Determine Left/Right
        let left = '';
        let right = '';

        if (amountRaw < 0) { // Expenditure
            left = '미지정(지출)';
            right = '쿠페이';
        } else if (amountRaw > 0 && line1.includes('취소')) { // Cancel/Refund
            left = '쿠페이';
            right = '미지정(지출취소/수입)';
        } else if (amountRaw > 0 && line1.includes('충전')) { // Charge
            left = '쿠페이';
            right = '미지정(충전원천)';
        } else {
            // Fallback
            left = '미지정';
            right = '미지정';
        }

        const newRow = {
            '날짜': date,
            '아이템(괄호)': item,
            '금액': amount,
            '왼쪽': left,
            '오른쪽': right,
            '메모': '',
        };

        result.push(validateRow(applySpecialRules(newRow), i / 5));
    }

    return result;
};
