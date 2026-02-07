export const GoogleSheetsService = {
    // --- Drive Folder & File Helpers ---

    async ensureFolder(name, token) {
        let folder = await this.findFolder(name, token);
        if (!folder) folder = await this.createFolder(name, token);
        return folder;
    },

    async findFolder(name, token) {
        const q = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        return data.files?.[0];
    },

    async createFolder(name, token) {
        const res = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' })
        });
        if (!res.ok) throw new Error("Failed to create folder");
        return await res.json();
    },

    async moveFileToFolder(fileId, folderId, token) {
        // Get current parents to remove them (move operation)
        const getFile = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const fileData = await getFile.json();
        const prevParents = fileData.parents?.join(',') || '';

        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=${prevParents}`;
        await fetch(url, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    },

    async saveJsonFile(folderId, name, data, token) {
        const metadata = { name, parents: [folderId], mimeType: 'application/json' };
        const fileContent = JSON.stringify(data, null, 2);

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }, // Browser auto-sets Content-Type w/ boundary
            body: form
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "JSON Upload Failed");
        }
        return await res.json();
    },

    // --- Sheets API Helpers ---

    async createSpreadsheet(title, token) {
        const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ properties: { title } })
        });
        if (!response.ok) throw new Error("無法建立試算表");
        return await response.json();
    },

    async writeData(spreadsheetId, range, values, token) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values })
        });
        if (!response.ok) throw new Error("寫入資料失敗");
        return await response.json();
    },

    // --- High Level Functions ---

    /**
     * Backup Full Data to JSON in '/日日記' folder
     */
    async backupFullData(data, token) {
        const folder = await this.ensureFolder('日日記', token);
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const fileName = `backup_${dateStr}.json`;

        await this.saveJsonFile(folder.id, fileName, data, token);
        return { folder: folder.name, file: fileName };
    },

    /**
     * Export Readable Spreadsheet to '/日日記' folder
     */
    async exportReadableSheet(data, token) {
        const folder = await this.ensureFolder('日日記', token);
        const now = new Date();
        const title = `記帳匯出_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // 1. Create Sheet (Root)
        const ss = await this.createSpreadsheet(title, token);

        // 2. Move to Folder
        await this.moveFileToFolder(ss.spreadsheetId, folder.id, token);

        // 3. Prepare Readable Data
        const rows = this.prepareReadableRows(data);

        // 4. Write
        await this.writeData(ss.spreadsheetId, 'A1', rows, token);

        return { url: ss.spreadsheetUrl, folder: folder.name };
    },

    /**
     * Helper to convert IDs to Names for Export
     */
    prepareReadableRows(data) {
        const { transactions, categories, paymentMethods, projects } = data;
        const headers = ["日期", "項目名稱", "分類", "金額", "幣別", "支付方式", "分帳狀態", "個人金額", "備註", "付款人", "專案", "分帳對象"];
        const rows = [headers];

        transactions.forEach(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            const pm = paymentMethods.find(p => p.id === t.paymentMethod);
            const proj = projects.find(p => p.id === t.projectId);

            const catName = cat ? cat.name : (t.categoryId === 'income' ? '收入' : '其他');
            const pmName = pm ? pm.name : (t.paymentMethod || '');
            const projName = proj ? proj.name : '';

            // Format Friend Name (Split Object)
            // Logic: t.friendName string
            const friendName = t.friendName || '';

            rows.push([
                t.spendDate,
                t.name,
                catName,
                t.amount,
                t.originalCurrency || t.currency || 'JPY',
                pmName,
                t.isSplit ? '是' : '否',
                t.personalShare || t.amount,
                t.note || '',
                t.payer || '我',
                projName,
                friendName
            ]);
        });
        return rows;
    }
};
