import { validateRow, applySpecialRules } from './rules';

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
            left = ''; // Will be set to default by rules
            right = '쿠페이';
        } else if (amountRaw > 0 && line1.includes('취소')) { // Cancel/Refund
            left = '쿠페이';
            right = ''; // Will be set to default by rules
        } else if (amountRaw > 0 && line1.includes('충전')) { // Charge
            left = '쿠페이';
            right = '미지정(충전원천)'; // Keep specific logic if needed, or clear it? User said "if empty".
            // Let's keep specific logic for now, as "Charge source" is specific.
            // But wait, user said "if left is empty -> default".
            // If I leave it as '미지정(충전원천)', it's not empty.
            // I'll assume specific logic overrides default.
        } else {
            // Fallback
            left = '';
            right = '';
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
