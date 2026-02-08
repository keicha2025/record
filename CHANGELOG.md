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
- **Unification**: Unified default settings (categories, payment methods) for Guest Mode and New Users by centralizing configuration.
  - 設定統一：統一訪客模式與新使用者的預設設定（類別、支付方式），集中管理配置。
- **Guest Mode Refinement**: Removed legacy import tool, fixed FX rate persistence, and enabled Project creation for guests.
  - 訪客模式優化：移除舊版匯入工具，修復匯率儲存問題，並開放訪客建立旅行計畫。
- **Fix**: Resolved issue where added friends were not persisting in Guest Mode.
  - 修正：解決訪客模式下新增朋友無法儲存的問題。
- **Feature**: Implemented "Guest Data Merge" on login. Users are prompted to save their guest data to their Google Account upon logging in.
  - 新功能：實作「訪客資料合併」功能。登入時若偵測到訪客資料，系統將詢問是否將其存入 Google 帳戶。
- **UI Update**: Renamed "Delete Account Data" to "Delete Bookkeeping Data" to better reflect the action's scope.
  - 介面更新：將「刪除帳戶資料」更名為「刪除記帳資料」，以更準確描述該功能。
- **Feature**: Implemented "Delete Account" functionality with enhanced security.
  - 新功能：實作「註銷帳戶」功能。改用 `reauthenticateWithPopup` 確保僅驗證且不切換登入狀態。
  - **Security**: Added identity verification to prevent session hijacking if wrong account is used.
  - **Fix**: Resolved an issue where app initialization prevented some event handlers from attaching correctly (refactored `app.js`).
- **UI Update**: Updated Delete Account confirmation text for clarity.
  - 介面更新：修改註銷確認視窗文字，強調「此操作無法復原」。
- **UI Update**: Updated Delete Account confirmation text for clarity.
  - 介面更新：修改註銷確認視窗文字，強調「此操作無法復原」。

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


# Changelog - 2026-02-08 Update (Viewer Mode & Security)

## [2026-02-08T12:12:00Z] Viewer Mode Refactor & Security Update

### Features & Improvements
- **Viewer Mode 2.0**:
  - **3-Layer Dashboard**: Completely redesigned the Overview page in Viewer Mode for better information hierarchy.
  - **Main Card**: Now successfully integrates User Name and Navigation shortcuts (Transactions/Stats) into a single cohesive card. Removed "Read-only" text for a cleaner look.
  - **Collection Section**: Introduced a new bottom section to display secondary information like FX Rate, Friends, and Projects.
  - **Simplified CTA**: Refined the "Guest Mode" call-to-action to be less intrusive.
  - 閱覽模式 2.0：全面重構總覽頁面。將導覽按鈕整合至主卡片，並新增 Collection 區塊顯示次要資訊。

### Technical Details
- **Firestore Security**:
  - Implemented `firestore.rules` to secure the database while allowing public read access for Shared Links (`sharedId`).
  - Fixed `Missing or insufficient permissions` error by properly defining access rules.
  - 資料庫安全：實作 Firestore 安全規則，在保護資料的同時允許分享連結的正常讀取。
- **App Logic**:
  - Implemented `hasMultipleCurrencies` to intelligently toggle the currency switcher only when needed.
  - Fixed duplicate import syntax error in `view-dashboard.js`.


---

# Changelog - 2026-02-08 Update (Shared Links Polish & Privacy)

## 🚀 Shared Links Enhancements (分享連結優化)
- **Viewer Experience (檢視模式)**:
  - **Date Range Display**: Added a dedicated date range display below the title.
    - **All Records**: Shows the range from the first to the last transaction.
    - **Custom Range**: Shows the configured start and end dates.
    - **Project**: Shows the project's start and end dates.
  - **Clean Title**: Removed the hardcoded "的生活筆記" suffix from the viewer title for a cleaner look.
  - **Smart Loading**: If "Exclude Project Expenses" is enabled, project data is completely excluded from the viewer payload for better privacy and performance.

- **Editor UI (編輯介面)**:
  - **Default Name Logic**: Restored "的生活筆記" as a default suffix when creating a new link, but allowing full user customization.
  - **Simplified Actions**: Replaced the top-left "Back" arrow with a clear "Cancel" (取消) text button at the top-right.
  - **Dynamic Options**: The "Hide Project Names" option now automatically hides if "Exclude Project Expenses" is selected (since project data is already excluded).

## 🔒 Privacy & Security (隱私與安全)
- **Friend Masking Fix**:
  - Resolved an issue where the user "Me" (我) was incorrectly masked as "Friend" (友) when "Hide Friend Names" was enabled.
  - Added masking for the `friendName` field (used in "Help Friend Pay" transactions) to ensuring full privacy.
- **Permission Hardening**:
  - Validated Firestore security rules for `shared_links` collection access.
  - Implemented UID-based direct access path to bypass complex index requirements and improve loading speed.

## 🐛 Bug Fixes (錯誤修正)
- **Syntax Error**: Fixed a critical `SyntaxError` in `app.js` caused by an invalid import statement.
- **Code Refinement**: Cleaned up duplicated logic in `app.js` to prevent race conditions during data loading.

---

# Changelog - 2026-02-08 Update (Add Page UX & Stability)

## ⚡️ Add Page Enhancements (新增頁面體驗優化)
- **Fluid Project Creation (流暢的計畫建立流程)**:
    - **Silent Creation**: Removed the interruption of "Project Created" alert dialogs.
    - **Auto-Selection**: Newly created projects are now automatically selected in the form, allowing you to continue tracking immediately.
    - **Conflict Resolution**: Fixed an issue where the date-based auto-selection would overwrite the newly created project.

- **Tactile "Confirm & Save" Button (按鈕回饋優化)**:
    - **Animation**: Added a subtle scale/spring animation on press.
    - **Haptic Feedback**: Added vibration feedback for mobile users.
    - **Double-Submit Prevention**: The button now instantly disables upon click to prevent accidental duplicate entries.

## 🐛 Bug Fixes (錯誤修復)
- **App Stability**: Fixed syntax errors in `app.js` (duplicate declarations, object closure) that caused startup crashes.
- **Form Logic**: Fixed `add-page.js` syntax errors and optimized the project watcher logic.

---

# Changelog - 2026-02-08 Update (Account & Data Deletion Fixes)

## [2026-02-08T23:40:00Z] Refined Account Deletion & Data Clearing Logic

### Features & Improvements
- **Robust Account Deletion**:
    - **Simplified Targeting**: Corrected `deleteFullAccount` to target only actual subcollections (`transactions`, `shared_links`). Removed redundant deletion attempts for fields like `projects` and `categories`, resolving the "Missing or insufficient permissions" error.
    - **Chunked Deletion**: Implemented a chunked batching mechanism (`_deleteCollectionChunked`) to handle large datasets effectively, bypassing the Firestore 500-document batch limit.
    - **Thorough Cleanup**: Added `shared_links` to the deletion process to ensure complete removal of user-associated data.
    - 帳戶註銷優化：修正權限錯誤，改為僅針對子集合進行手動刪除，並實作分段批次處理以應對大量交易資料，確保註銷過程穩定徹底。

- **Fixed Bookkeeping Data Clearing**:
    - **Implemented logic**: Fully implemented `clearAccountData` to delete all documents in the `transactions` subcollection while preserving the account itself.
    - **Logout Integration**: Ensuring a clean state by logging out and forcing a refresh after data clearing.
    - 刪除記帳資料修正：實作 transactions 子集合的完整清空邏輯，並確保在操作完成後自動登出並重整頁面。

- **Synchronized Page Reload**:
    - **Alert-Triggered Refresh**: Updated `handleDeleteAccount` and `handleClearAccountData` to ensure the page reloads or redirects **only after** the user clicks the "Confirm" button on the success or error dialogs. This improves UX by allowing users to read the final outcome before the application state is reset.
    - 同步重整機制：優化重整時機，確保使用者在看完成功或失敗提示並點擊按鈕後，頁面才會進行重整，提升操作體驗。

- **Add Page UX Enhancement**:
    - **Auto-Scroll to Top**: Implemented immediate scroll-to-top when clicking "Confirm & Save" on the Add Page. This ensures users instantly see the entry result or error messages regardless of the form length.
    - 新增頁面體驗優化：實作「儲存並確認」按鈕按下後自動滑動至最上方，確保使用者能立即看清新增結果或錯誤提示。

- **Improved Currency Switcher**:
    - **Forced Visibility**: The currency switcher in the header is now always visible on Overview and Stats pages, facilitating easier analysis regardless of current data diversity.
    - **Smart Detection**: Implemented automatic base currency detection. Upon loading, the app identifies the currency of the most recent transaction and automatically sets the base currency (JPY/TWD) to match.
    - **Full Viewer Support**: Extended currency toggling and smart detection to Viewer mode (shared links), ensuring a consistent experience for all users.
    - 貨幣切換器優化：Header 顯示邏輯調整為總覽與統計頁面永遠顯示。新增「智慧判斷」功能，系統載入時會自動依據最新一筆交易之幣別（日幣或台幣）切換顯示基準，且同步支援分享連結之唯讀模式。

### Technical Details
- Updated `js/api.js` with `_deleteCollectionChunked` helper and refined `deleteFullAccount`.
- Updated `js/app.js` with `await` on all `dialog.alert` calls, refined `finally` block logic, added `window.scrollTo` to `handleSubmit`, and implemented smart currency detection in `loadData`.
- Updated `js/view-app.js` and `view.html` to support the header switcher and base currency management in Viewer mode.
- 修正 `js/api.js` 與 `js/app.js` 的非同步操作流程與批次刪除限制，優化 `handleSubmit` 的捲動回饋，並全面整合貨幣智慧切換邏輯。
