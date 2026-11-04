const ExcelJS = require('exceljs');
const { Readable } = require('stream');

async function readSpreadsheetRows(file) {
    if (!/\.(xlsx|csv)$/i.test(file.originalname || '')) {
        throw new Error('Upload an .xlsx or .csv file');
    }
    const workbook = new ExcelJS.Workbook();
    if (/\.csv$/i.test(file.originalname)) {
        await workbook.csv.read(Readable.from([file.buffer]));
    } else {
        await workbook.xlsx.load(file.buffer);
    }
    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount < 2) return [];
    const headers = worksheet.getRow(1).values.slice(1).map(value => String(value ?? '').replace(/^\uFEFF/, '').trim());
    return worksheet.getRows(2, worksheet.rowCount - 1).map(row => Object.fromEntries(
        headers.map((header, index) => {
            const cell = row.getCell(index + 1).value;
            return [header, cell && typeof cell === 'object' && 'text' in cell ? cell.text : (cell ?? '')];
        }).filter(([header]) => header)
    ));
}

async function createWorkbook(sheets) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Zamcloth';
    sheets.forEach(({ name, columns, rows = [] }) => {
        const worksheet = workbook.addWorksheet(name);
        worksheet.columns = columns.map(header => ({
            header,
            key: header,
            width: Math.min(36, Math.max(14, header.length + 2)),
            style: /^(date|placedat|paidat)$/i.test(header)
                ? { numFmt: 'dd-mmm-yyyy hh:mm' }
                : /(amount|subtotal|discount|shipping|tax|total|due|order value|payments received|outstanding)/i.test(header)
                    ? { numFmt: '"₹"#,##0.00;[Red]-"₹"#,##0.00' }
                    : undefined,
        }));
        worksheet.getRow(1).font = { bold: true };
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];
        worksheet.addRows(rows.map(row => columns.map(column => row[column] ?? '')));
    });
    return Buffer.from(await workbook.xlsx.writeBuffer());
}

module.exports = { createWorkbook, readSpreadsheetRows };
