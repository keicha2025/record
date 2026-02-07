export const GoogleSheetsService = {
    /**
     * Create a new Google Spreadsheet
     */
    async createSpreadsheet(title, token) {
        const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: { title }
            })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "無法建立試算表");
        }
        return await response.json();
    },

    /**
     * Find a spreadsheet by exact name using Drive API
     */
    async findSpreadsheetByName(title, token) {
        const q = `name = '${title.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "搜尋檔案失敗");
        }

        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0] : null;
    },

    /**
     * Write data to a specific range (e.g., 'Sheet1!A1')
     */
    async writeData(spreadsheetId, range, values, token) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "寫入資料失敗");
        }
        return await response.json();
    },

    /**
     * Add or clear a sheet (tab) and write values
     */
    async upsertSheet(spreadsheetId, sheetTitle, values, token) {
        // 1. Get spreadsheet metadata to see if sheet exists
        const metaResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const meta = await metaResponse.json();
        const existingSheet = meta.sheets.find(s => s.properties.title === sheetTitle);

        if (existingSheet) {
            // Clear existing data first
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}:clear`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } else {
            // Add new sheet
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [{
                        addSheet: { properties: { title: sheetTitle } }
                    }]
                })
            });
        }

        // 2. Write Data
        return await this.writeData(spreadsheetId, `${sheetTitle}!A1`, values, token);
    },

    /**
     * Standard Export to a NEW sheet
     */
    async exportToNewSheet(title, transactions, categories, token) {
        const rows = this.prepareRows(transactions, categories);
        const ss = await this.createSpreadsheet(title, token);
        await this.writeData(ss.spreadsheetId, 'A1', rows, token);
        return ss;
    },

    /**
     * Advanced Backup to a FIXED file with daily tabs
     */
    async backupTransactions(transactions, categories, token) {
        const fileName = "日日記-個人記帳資料備份";
        const now = new Date();
        const sheetTitle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}日日記備份`;

        // 1. Find or Create file
        let file = await this.findSpreadsheetByName(fileName, token);
        let spreadsheetId;
        if (!file) {
            const ss = await this.createSpreadsheet(fileName, token);
            spreadsheetId = ss.spreadsheetId;
        } else {
            spreadsheetId = file.id;
        }

        // 2. Prepare Data
        const rows = this.prepareRows(transactions, categories);

        // 3. Upsert Tab
        await this.upsertSheet(spreadsheetId, sheetTitle, rows, token);

        return {
            spreadsheetId,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
            sheetTitle
        };
    },

    prepareRows(transactions, categories) {
        const headers = ["日期", "項目名稱", "分類", "金額", "原始幣別", "支付方式", "分帳", "個人份額", "備註", "付款人", "專案ID"];
        const rows = [headers];
        transactions.forEach(t => {
            const catName = categories.find(c => c.id === t.categoryId)?.name || '其他';
            rows.push([
                t.spendDate, t.name, catName, t.amount, t.originalCurrency || t.currency || 'JPY',
                t.paymentMethod || '', t.isSplit ? '是' : '否', t.personalShare || t.amount,
                t.note || '', t.payer || '我', t.projectId || ''
            ]);
        });
        return rows;
    }
};
