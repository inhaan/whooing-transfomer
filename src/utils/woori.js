import * as XLSX from 'xlsx';
import { readExcel } from './excel';
import { validateRow, applySpecialRules } from './rules';

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
            '왼쪽': row['왼쪽'] || '',
            '오른쪽': row['오른쪽'] || '',
            '메모': row['메모'] || '',
        };

        return validateRow(applySpecialRules(newRow), index);
    });
};
