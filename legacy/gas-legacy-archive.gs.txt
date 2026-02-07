function checkAuth(token) {
  const adminPassword = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return adminPassword && token === adminPassword;
}

function doGet(e) {
  try {
    const token = e && e.parameter ? e.parameter.token : "";
    const isAdmin = checkAuth(token);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const getSheetData = (name) => {
      const sheet = ss.getSheetByName(name);
      return sheet ? sheet.getDataRange().getValues() : [];
    };

    const categories = getSheetData("Categories").slice(1).map(r => ({id: r[0], name: r[1], icon: r[2], type: r[3]}));
    const friends = getSheetData("Friends").slice(1).map(r => r[1]);
    const paymentMethods = getSheetData("PaymentMethods").slice(1).map(r => ({id: r[0], name: r[1], order: r[2]})); 
    const projects = getSheetData("Projects").slice(1).map(r => ({
      id: r[0], 
      name: r[1], 
      startDate: r[2] ? Utilities.formatDate(new Date(r[2]), "GMT+9", "yyyy-MM-dd") : "",
      endDate: r[3] ? Utilities.formatDate(new Date(r[3]), "GMT+9", "yyyy-MM-dd") : "",
      status: r[4]
    })); // 【新增】讀取 Projects 分頁

    const config = {};
    getSheetData("Config").slice(1).forEach(r => { config[r[0]] = r[1]; });

    const transData = getSheetData("Transactions").slice(1);
    const now = new Date();
    
    let monthlyLifeTotal = 0;   
    let allOneTimeTotal = 0;    
    let allLifeTotal = 0;       
    let netDebt = 0; 

    // --- 訪客/檢視模式：資料去識別化 Map ---
    let friendMap = {};
    let friendCounter = 1;
    function getAnonymizedName(originalName) {
         if (!originalName || originalName === "我") return originalName;
         // 拆分多個朋友 (例如 "John, Mary")
         return originalName.split(', ').map(n => {
             if (n === "我") return "我";
             if (!friendMap[n]) friendMap[n] = "友" + friendCounter++;
             return friendMap[n];
         }).join(', ');
    }
    // -------------------------------------

    // 遮蔽敏感資訊邏輯：若非 Admin，Note 欄位轉為 ***
    const transactions = transData.map((r, index) => {
      if (!r[0]) return null;
      
      const id = r[0];
      const entryDate = r[1];
      const spendDateStr = r[2]; 
      const utc = r[3];
      const type = r[4];
      const name = r[5];
      const categoryId = r[6];
      const amount = parseFloat(r[7] || 0);
      const originalCurrency = r[8] || "JPY";
      const paymentMethod = r[9];
      const isOneTime = r[10] === true;
      const isSplit = r[11] === true;
      const personalShare = parseFloat(r[12] || 0);
      const debtAmount = parseFloat(r[13] || 0);
      const projectId = r[17] || "";
      
      let note = r[14];
      let friendName = r[15];
      let payer = r[16] || "我";

      // 若非管理員，進行去識別化
      if (!isAdmin) {
          note = note ? "***" : ""; 
          friendName = getAnonymizedName(friendName);
          payer = getAnonymizedName(payer);
      }

      if (type === '支出') {
        netDebt += debtAmount; 
        if (isOneTime) allOneTimeTotal += personalShare;
        else {
          allLifeTotal += personalShare;
          const spendDateObj = new Date(spendDateStr);
          if (spendDateObj.getMonth() === now.getMonth() && spendDateObj.getFullYear() === now.getFullYear()) {
            monthlyLifeTotal += personalShare;
          }
        }
      } else if (type === '收款') {
        netDebt -= amount; 
      }

      return {
        row: index + 2, 
        id, 
        entryDate,
        spendDate: spendDateStr,
        utc,
        type, 
        name, 
        categoryId, 
        amount,
        amountJPY: originalCurrency === 'JPY' ? amount : 0, 
        amountTWD: originalCurrency === 'TWD' ? amount : 0,
        paymentMethod,
        isOneTime, 
        isSplit,
        friendName: friendName, 
        note: note,
        personalShare, 
        payer: payer, 
        debtAmount,
        originalCurrency: originalCurrency,
        projectId: projectId 
      };
    }).filter(t => t !== null).reverse();

    // 處理最終輸出的朋友列表 (若非管理員，只回傳代號)
    let finalFriends = friends;
    if (!isAdmin) {
        // 確保所有朋友都已進入 Map (即使沒有交易紀錄)
        friends.forEach(f => getAnonymizedName(f)); 
        finalFriends = Object.values(friendMap).filter(n => n !== "我");
        finalFriends = [...new Set(finalFriends)];
        
        // 隱藏敏感 Config
        if (config.user_name) config.user_name = "User";
    }

    const output = { 
      categories, friends: finalFriends, paymentMethods, projects, config, 
      transactions: transactions.slice(0, 150),
      stats: { monthlyLifeTotal, allOneTimeTotal, allLifeTotal, totalInvestment: allLifeTotal + allOneTimeTotal, debtTotal: netDebt },
      is_admin: isAdmin 
    };

    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const token = params.token;
    
    // Auth Check
    if (!checkAuth(token)) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "401 Unauthorized" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 處理系統設定更新
    if (params.action === 'updateConfig') {
      const configSheet = ss.getSheetByName("Config");
      const data = configSheet.getDataRange().getValues();
      
      if (params.fx_rate) {
        configSheet.getRange(2, 2).setValue(params.fx_rate); 
      }
      if (params.user_name) {
        configSheet.getRange(3, 2).setValue(params.user_name); 
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 處理專案新增/更新 (簡單實作)
    if (params.action === 'updateProject') {
       const projectSheet = ss.getSheetByName("Projects");
       if (!projectSheet) {
         // 若無此表則自動建立 (通常應已有，但防呆)
         const pSheet = ss.insertSheet("Projects");
         pSheet.appendRow(["ID", "Name", "StartDate", "EndDate", "Status"]);
       }
       const pSheet = ss.getSheetByName("Projects");
       
       const newRow = [
         params.id || "proj_" + new Date().getTime(),
         params.name,
         params.startDate,
         params.endDate,
         params.status || "Active"
       ];

       // 檢查是否為編輯現有
       let isEdit = false;
       if (params.id) {
         const data = pSheet.getDataRange().getValues();
         for (let i = 1; i < data.length; i++) {
           if (data[i][0] == params.id) {
             pSheet.getRange(i + 1, 1, 1, 5).setValues([newRow]);
             isEdit = true;
             break;
           }
         }
       }
       
       if (!isEdit) {
         pSheet.appendRow(newRow);
       }

       return ContentService.createTextOutput(JSON.stringify({ status: "success", project: newRow })).setMimeType(ContentService.MimeType.JSON);
    }

    // 原有的刪除邏輯
    const transSheet = ss.getSheetByName("Transactions");
    if (params.action === 'delete' && params.row) {
      transSheet.deleteRow(params.row);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 處理朋友名單更新
    if (params.payer && params.payer !== '我') saveFriend(ss, params.payer);
    if (params.friendName) params.friendName.split(', ').forEach(name => saveFriend(ss, name));

    const rowData = [
      params.id || "tx_" + new Date().getTime(),
      params.entryDate || new Date(),
      params.spendDate, // Store as string
      params.utc || "",
      params.type,
      params.name,
      params.categoryId,
      params.amount,
      params.currency,
      params.paymentMethod,
      params.isOneTime,
      params.isSplit,
      params.personalShare,
      params.debtAmount,
      params.note,
      params.friendName || "",
      params.payer || "我",
      params.projectId || ""
    ];

    if (params.action === 'edit' && params.row) {
      transSheet.getRange(params.row, 1, 1, 18).setValues([rowData]);
    } else {
      transSheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveFriend(ss, name) {
  const friendSheet = ss.getSheetByName("Friends");
  const data = friendSheet.getDataRange().getValues();
  const currentFriends = data.map(r => r[1]);
  if (name && !currentFriends.includes(name)) {
    friendSheet.appendRow(["fr_" + new Date().getTime(), name]);
  }
}