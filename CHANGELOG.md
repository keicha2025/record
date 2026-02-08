# Changelog - 2026-02-06 Update (Guest & View Mode Refinement)

## 🌟 Guest Mode (體驗模式) Refinements
- **Data Logic Overhaul**:
  - **Separation of Local vs. Remote**: User-created data (Local) is now strictly separated from Demo data (Remote). Clearing or toggling "Import Data" will **not** delete your local entries.
  - **Always-On Metadata**: Even if "Import Data" is OFF, the app now fetches Categories, Payment Methods, and Config from the backend to ensure a seamless experience (menus won't be empty).
  - **Toggling Logic**: The "Import Data" toggle now only controls the visibility of Demo transactions.
- **Sorting Fix**: Fixed an issue where local transactions were forced to the bottom of the list. Now, all transactions (Local & Remote) are correctly sorted mixed by date (Newest First).
- **Payment Method Fix**: Resolved an issue where "Cash" and "PayPay" would appear as duplicates in the dropdown menu. Now strictly relies on backend configuration.

## 🚀 View Mode (Viewer) Polish
- **Dedicated Read-Only Page**:
  - Replaced the shared Edit Page with a new `ViewEditPage`.
  - **Removed**: "Start Editing" button, "Delete" button, and all input fields.
  - **Retained**: Full detail view including Splitwise details and Project tags.
- **Settings Page Clean-up**: Removed the intrusive "Read Only" badge from the settings card for a cleaner aesthetic.
- **Search & Filter**:
  - The "Clear Filter" (CLEAR) button is now **always visible** in History Mode, allowing users to easily reset views without guessing if a filter is active.

## 🐛 Bug Fixes & Technical
- **Date Normalization**: Standardized remote date formats to ensure consistent grouping in the History list.
- **Syntax Fixes**: Resolved a `SyntaxError` in `app.js` related to the fetch logic.

---

# Changelog - 2026-02-06 Update (View Mode & Features)

## 🚀 View Mode (Viewer)
- **New Architecture**: Created dedicated `view.html`, `js/view-app.js`, and `ViewDashboard` component to isolate Viewer logic from the main Admin/Guest app.
- **FX Rate Fix**: Fixed an issue where the exchange rate was defaulting to 0.22. Now correctly fetches `config.fx_rate` from GAS or Guest settings (e.g., 0.21).
- **Chart Reactivity**: Resolved a critical bug where Chart.js instances were wrapped in Vue proxies, causing `TypeError` and rendering failures. Implemented proper cleanup logic.
- **UI Improvements**: Updated the View Mode dashboard layout and currency toggle style.

## ✨ New Features
- **Project Search Integration**:
  - Added a "View Details" (查看明細) button to the Project Detail page.
  - Clicking "View Details" now filters the History page by the project's ID.
  - Enhanced the search bar to support searching by **Project Name** or **Project ID**.
- **Guest Mode Enhancements**:
  - **Settings Persistence**: Guest settings (User Name, FX Rate) now take precedence over remote default data during import.
  - **UI Refinement**: Renamed "Clear Data" and "Import Default Data" actions for clarity.

## 🐛 Bug Fixes
- **Layout Fixes**: Corrected the Project Detail page layout to center content vertically.
- **Event Handling**: Fixed missing event listeners for `view-history` in both `index.html` and `view.html`.


## 🎨 UI & Layout Updates
- **Global Layout Unification**:
  - `AppHeader` (Top Bar) and `AppFooter` (Navigation) are now consistently visible across all pages, including **Project Detail** and **Edit Page**.
  - Normalized padding and spacing for the main content area (`<main>`).
- **History Page**:
  - Fixed the "jump" issue caused by scrollbars appearing/disappearing by enforcing `scrollbar-gutter: stable`.
  - Refactored `SearchBar` to use a sticky positioning that stays within the layout boundaries.
- **Edit Page**:
  - Removed the redundant top navigation bar.
  - Integrated "Close/Cancel" and Title into the main content card for a cleaner look.
- **Project Detail Page**:
  - **Vertical Centering**: The read-only project summary view is now vertically centered within the card.
  - **Edit Mode Layout**: Improved the grid layout for Start/End Date inputs.
  - Removed duplicate "CANCEL" button in the header section.

## 🛠️ Refactoring
- **Component Separation**:
  - Extracted `AppHeader`, `AppFooter`, `SearchBar`, and `SystemModal` into verified standalone components in `js/components/`.
- **Search Logic**:
  - Centralized search and filter logic in `SearchBar` component.

## 🐛 Bug Fixes
- **Invalid Token Alert**: Fixed an issue where the "Invalid Token" alert would close immediately before the user could read it. Added `await` to ensure user confirmation.
- **Friend Filtering**: Fixed the issue where clicking a friend in Settings didn't show all relevant transactions. The filter now correctly checks both `friendName` (Beneficiary) and `payer`.

- **UI Tweaks**: Removed the unused cloud status icon from the header.

## ✨ New Features
- **Edit/Delete Feedback**:
  - Implemented a clear success dialog after editing or deleting a transaction.
  - Added a "Reload" (重新整理) action to these dialogs to ensure data consistency with the backend, alongside the standard "Return to Details" (返回明細) button.

## [2026-02-08T05:56:00Z] Unified Authorization & Persistent Backup

### Features & Improvements
- **Unified Authorization**: Implemented shared authorization scope for both `Export` and `Backup features`. Users now only need to provide consent once for both operations.
  - 統一授權機制：匯出與備份功能現共用授權，使用者僅需同意一次即可。
- **Persistent Auth & Auto-Retry**: Added `_fetchWithRetry` logic to `GoogleSheetsService` to automatically handle token expiration (401/403 errors) by triggering a re-auth flow or refreshing the token.
  - 持續性存取與自動重試：當 Token 過期時，系統將自動嘗試重新驗證，減少重複登入的困擾。
- **File Naming Convention**: Updated backup and export filenames to use the precision format `yyyymmddhhmmss` (e.g., `backup_20240208123045.json`).
  - 檔名格式更新：備份與匯出檔名現包含精確的時間戳記（年月日時分秒）。
- **Auto-Backup Fix**: Resolved an issue in `app.js` where `autoBackupIfNeeded` was calling a non-existent method and improved the daily trigger logic to ensure it runs on the first app open of the day.
  - 自動備份修復：修正自動備份的程式邏輯，確保每日首次開啟 App 時能正確執行備份。
- **UI Updates**: Updated the Backup destination description in Settings to clearly state "Google Drive '日日記' folder".
  - 介面文字更新：更清楚地說明備份檔案的儲存位置。

### Technical Details
- Modified `js/api.js` to include `invalidateGoogleToken`.
- Refactored `js/services/google-sheets-service.js` to include retry logic and updated file naming.
- Updated `js/pages/settings-page.js` to pass retry callbacks.
- Fixed `js/app.js` auto-backup logic.
---

## [2026-02-08T06:17:00Z] Added Favicon

### Features & Improvements
- **Favicon**: Added `favicon.ico` support to `index.html`, `view.html`, and `migration-tool.html` for better browser tab recognition.
  - 新增網頁圖示：為所有頁面加入 Favicon，提升辨識度。

### Technical Details
- Added `<link rel="icon" href="favicon.ico" type="image/x-icon">` to HTML heads.
# Changelog - 2026-02-08 Update (UX Optimization)

## [2026-02-08T07:15:00Z] Import Feature & UI Updates

### Features & Improvements
- **Import Data**: Added a new "Import Data" feature in Settings > Account. Users can now restore or overwrite data using a JSON backup file.
  - 新增資料匯入功能：位於設定頁面的帳號區塊，允許使用者匯入 JSON 備份檔以還原資料。
- **UI Text Updates**: Renamed "Export" button to "匯出" and "Backup" button to "備份" for simplicity and consistency.
  - 介面文字調整：簡化匯出與備份按鈕的文字標籤。
- **Visual Consistency**: The new Import button matches the design of the existing Logout button, maintaining a cohesive look and feel.
  - 視覺一致性：匯入按鈕的設計與登出按鈕保持一致。
- **UI Refinement**: Updated `ImportPage` to use a grayscale color palette matching `HistoryPage` and added a standard header.
  - 介面優化：匯入頁面改採與歷史紀錄頁面一致的灰階色系，並加入標準頁首。
- **Layout Adjustment**: Reverted "Backup" and "Export" buttons to a side-by-side grid layout for better accessibility.
  - 版面調整：將備份與匯出按鈕還原為並排網格佈局。
- **UI Refinement**: Adjusted the position of the backup description text to be above the buttons and left-aligned.
  - 介面優化：調整備份說明文字位置至按鈕上方並靠左對齊。
- **UX Improvement**: Implemented auto-reload after successful data import to ensure users see updated data immediately.
  - 使用者體驗優化：資料匯入成功後自動重新整理頁面，確保使用者即時看到最新資料。

### Technical Details
- Added `js/pages/import-page.js` component with file parsing and `API.importData` integration.
- Implemented batch write logic in `js/api.js` using `writeBatch` for efficient data import.
- Updated `js/pages/settings-page.js` to include the new button and routing event.
## ⚡️ Optimistic UI & Performance
- **Instant Feedback (Optimistic UI)**:
  - **Add/Edit/Delete**: Actions now reflect immediately on the UI without waiting for the server. Data synchronization happens in the background.
  - **Zero Latency**: Removed loading spinners for standard operations to improve perceived speed.
- **Payer Pre-selection**:
  - **Default to "Me"**: The payer field in the Add Page now strictly defaults to "Me" (我), reducing clicks for the most common use case.

