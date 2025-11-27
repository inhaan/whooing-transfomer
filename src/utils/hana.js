import * as XLSX from 'xlsx';
import { readExcel } from './excel';
import { validateRow, applySpecialRules } from './rules';

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

        // Skip empty rows or total row
        if (!rowData['거래일시'] || !rowData['거래일시'].trim()) return null;
        if (rowData['적요'] && rowData['적요'].replace(/\s/g, '') === '합 계') return null;

        const date = rowData['거래일시'];
        const memo = rowData['거래점'] || '';
        const item = rowData['적요'] || memo || '기타';
        const withdrawal = parseFloat((rowData['출금액'] || '0').toString().replace(/,/g, ''));
        const deposit = parseFloat((rowData['입금액'] || '0').toString().replace(/,/g, ''));
        const amount = withdrawal > 0 ? withdrawal : deposit;

        const accountAlias = '월급통장(하나은행)';
        let left = '';
        let right = '';

        if (withdrawal > 0) {
            right = accountAlias;
        } else if (deposit > 0) {
            left = accountAlias;
        }

        const newRow = {
            '날짜': date,
            '아이템(괄호)': item.trim(),
            '금액': amount,
            '왼쪽': left,
            '오른쪽': right,
            '메모': memo.trim(),
        };

        // Apply Hana Bank specific classification rules
        const rowItem = newRow['아이템(괄호)'];
        if (rowItem) {
            if (rowItem.startsWith('쿠팡 ')) {
                newRow['아이템(괄호)'] = '쿠페이머니 충전';
                newRow['왼쪽'] = '쿠페이';
            } else if (rowItem === '쿠쿠렌탈료') {
                newRow['왼쪽'] = '주거,통신';
            } else if (rowItem === 'LGU인터넷') {
                newRow['왼쪽'] = '주거,통신';
            } else if (rowItem === '하나카드') {
                newRow['왼쪽'] = '하나카드(인한)';
            } else if (rowItem.startsWith('토스 하미숙')) {
                newRow['아이템(괄호)'] = '동석페이백';
            } else if (rowItem.startsWith('토스 임유경')) {
                newRow['아이템(괄호)'] = '동석페이백';
            } else if (rowItem.startsWith('굿네이버스')) {
                newRow['왼쪽'] = '기부';
            } else if (rowItem.startsWith('토스 강진')) {
                newRow['아이템(괄호)'] = '컴퓨터계';
                newRow['왼쪽'] = '여가,유흥';
            } else if (rowItem.startsWith('쿠팡이츠')) {
                newRow['왼쪽'] = '외식,배달';
            } else if (rowItem.startsWith('(예금이자')) {
                newRow['오른쪽'] = '이자수익';
            }
        }

        return validateRow(applySpecialRules(newRow), index);
    }).filter(row => row !== null);
};
