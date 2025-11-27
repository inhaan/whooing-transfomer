// Helper to validate row
export const validateRow = (row, rowIndex) => {
    const required = ['날짜', '아이템(괄호)', '금액', '왼쪽', '오른쪽'];
    for (const field of required) {
        if (!row[field] && row[field] !== 0) {
            throw new Error(`Row ${rowIndex + 1}: Missing required field '${field}'`);
        }
    }
    return row;
};

// Helper to apply special rules
export const applySpecialRules = (row) => {
    // Example: If item contains 'Coupang', set left to 'Food', right to 'Card'
    if (row['아이템(괄호)'] && row['아이템(괄호)'].includes('쿠팡')) {
        // row['왼쪽'] = '식비';
        // row['오른쪽'] = '카드대금';
    }

    // Default values for empty fields
    if (!row['왼쪽']) {
        row['왼쪽'] = '기타비용';
    }
    if (!row['오른쪽']) {
        row['오른쪽'] = '기타수익';
    }

    return row;
};
