# Markdown 樣式完整示範

這是一份展示所有 Markdown 樣式的示範文件，適合用於網站操作說明、技術文檔等內容。

---

## 目錄

- [文字格式](#文字格式)
- [標題層級](#標題層級)
- [清單](#清單)
- [程式碼](#程式碼)
- [引用與提示](#引用與提示)
- [表格](#表格)
- [連結與圖片](#連結與圖片)
- [進階元素](#進階元素)

---

## 文字格式

### 基本樣式

這是**粗體文字**，這是*斜體文字*，這是***粗斜體***。

這是~~刪除線文字~~，這是`行內程式碼`。

你也可以使用 <u>底線文字</u> 和 ==標記文字==（部分解析器支援）。

### 特殊符號

使用反斜線轉義特殊字元：\*不是斜體\* \`不是程式碼\`

---

## 標題層級

# H1 一級標題
## H2 二級標題
### H3 三級標題
#### H4 四級標題
##### H5 五級標題
###### H6 六級標題

---

## 清單

### 無序清單

- 第一項
- 第二項
  - 巢狀項目 2.1
  - 巢狀項目 2.2
    - 更深層巢狀 2.2.1
- 第三項

或使用不同符號：

* 星號項目
+ 加號項目
- 減號項目

### 有序清單

1. 第一步
2. 第二步
   1. 子步驟 2.1
   2. 子步驟 2.2
3. 第三步

### 任務清單

- [x] 已完成的任務
- [x] 另一個已完成的任務
- [ ] 待辦事項
- [ ] 另一個待辦事項
  - [x] 子任務已完成
  - [ ] 子任務待辦

---

## 程式碼

### 行內程式碼

使用 `npm install` 安裝套件，或按下 `Ctrl+C` 複製文字。

### 程式碼區塊（無語法高亮）

```
這是一段純文字程式碼區塊
不會套用語法高亮
適合顯示純文字內容
```

### JavaScript 程式碼

```javascript
// 這是 JavaScript 程式碼範例
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

const user = {
  name: 'Claude',
  age: 1
};

greet(user.name);
```

### Python 程式碼

```python
# 這是 Python 程式碼範例
def calculate_sum(numbers):
    """計算數字列表的總和"""
    total = sum(numbers)
    return total

data = [1, 2, 3, 4, 5]
result = calculate_sum(data)
print(f"總和為: {result}")
```

### HTML 程式碼

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>示範頁面</title>
</head>
<body>
    <h1>歡迎</h1>
    <p>這是一個 HTML 範例</p>
</body>
</html>
```

### CSS 程式碼

```css
/* 這是 CSS 樣式範例 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #0056b3;
}
```

### Shell 命令

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置專案
npm run build
```

---

## 引用與提示

### 基本引用

> 這是一段引用文字。
> 可以跨越多行。
> 
> 引用中也可以包含其他格式，例如**粗體**和`程式碼`。

### 巢狀引用

> 第一層引用
> 
> > 第二層巢狀引用
> > 
> > > 第三層巢狀引用

### 自訂提示框（使用 emoji 或自訂語法）

> 💡 **提示：** 這是一個有用的提示訊息。

> ⚠️ **警告：** 請注意這個操作可能會造成資料遺失。

> ❌ **錯誤：** 發生了一個錯誤，請檢查你的輸入。

> ✅ **成功：** 操作已成功完成！

> 📝 **注意：** 這裡有一些需要注意的事項。

### 使用自訂容器語法（需插件支援）

::: tip 提示
這是一個提示訊息框，適合顯示有用的建議。
:::

::: warning 警告
這是一個警告訊息框，用於提醒使用者注意。
:::

::: danger 危險
這是一個危險訊息框，表示可能造成嚴重後果的操作。
:::

::: info 資訊
這是一個資訊訊息框，用於顯示一般資訊。
:::

---

## 表格

### 基本表格

| 功能 | 說明 | 狀態 |
|------|------|------|
| 使用者登入 | 提供帳號密碼登入 | ✅ 已完成 |
| 資料匯出 | 匯出 CSV 格式 | 🚧 開發中 |
| API 整合 | 第三方 API 串接 | 📋 規劃中 |

### 對齊方式

| 靠左對齊 | 置中對齊 | 靠右對齊 |
|:---------|:--------:|---------:|
| 文字 A | 文字 B | 文字 C |
| 較長的文字內容 | 中間 | 123 |
| Short | Mid | 456789 |

### 複雜表格

| 參數名稱 | 類型 | 必填 | 預設值 | 說明 |
|----------|------|------|--------|------|
| `username` | string | ✅ | - | 使用者帳號，長度 3-20 字元 |
| `password` | string | ✅ | - | 使用者密碼，至少 8 字元 |
| `email` | string | ❌ | null | 電子郵件地址 |
| `role` | enum | ❌ | 'user' | 使用者角色：`admin`, `user`, `guest` |

---

## 連結與圖片

### 文字連結

這是一個 [外部連結](https://www.example.com)。

這是一個 [帶標題的連結](https://www.example.com "懸停顯示的標題")。

這是一個[內部錨點連結](#文字格式)，可以跳轉到本頁的其他章節。

### 參考式連結

這是 [參考式連結][ref1]，定義在文件底部。

這也是 [另一個參考][ref2]。

[ref1]: https://www.example.com
[ref2]: https://www.example.com "參考連結的標題"

### 自動連結

直接輸入 URL 也會自動轉換：https://www.example.com

或電子郵件：example@email.com

### 圖片

![替代文字](https://via.placeholder.com/600x300 "圖片標題")

*圖 1：這是圖片說明文字*

### 帶連結的圖片

[![可點擊的圖片](https://via.placeholder.com/400x200)](https://www.example.com)

### 參考式圖片

![Logo 圖片][logo]

[logo]: https://via.placeholder.com/150 "公司 Logo"

---

## 進階元素

### 鍵盤按鍵

按下 <kbd>Ctrl</kbd> + <kbd>C</kbd> 複製文字。

使用 <kbd>Alt</kbd> + <kbd>F4</kbd> 關閉視窗。

在 Mac 上使用 <kbd>⌘ Command</kbd> + <kbd>V</kbd> 貼上。

### 縮寫定義

HTML 是 *HyperText Markup Language* 的縮寫。

API 代表 *Application Programming Interface*。

### 上標與下標

水的化學式是 H<sub>2</sub>O。

E = mc<sup>2</sup> 是愛因斯坦的質能方程式。

### 腳註（部分解析器支援）

這裡有一個腳註引用[^1]，還有另一個[^2]。

[^1]: 這是第一個腳註的內容。
[^2]: 這是第二個腳註，可以包含**格式化文字**和`程式碼`。

### 定義清單

HTML
: 超文本標記語言，用於建構網頁內容。

CSS
: 層疊樣式表，用於描述網頁的呈現樣式。

JavaScript
: 一種程式語言，為網頁添加互動功能。

### 摺疊區塊

<details>
<summary>點擊展開查看詳細內容</summary>

這裡是摺疊的內容，預設是隱藏的。

- 可以包含清單
- **格式化文字**
- `程式碼`

```javascript
// 甚至程式碼區塊
console.log('Hello!');
```

</details>

<details>
<summary>常見問題：如何安裝？</summary>

1. 下載安裝檔
2. 執行安裝程式
3. 依照指示完成安裝

</details>

### 水平分隔線

以下是三種不同的分隔線寫法：

---

***

___

### 跳脫 HTML

如果需要使用 HTML 標籤：

<div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px;">
  <strong>這是 HTML 區塊</strong>
  <p>可以直接在 Markdown 中使用 HTML 標籤。</p>
</div>

### 徽章與標籤

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-stable-brightgreen)

### 數學公式（需插件支援，如 KaTeX 或 MathJax）

行內公式：$E = mc^2$

區塊公式：

$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

---

## 實際應用範例

### 操作步驟說明

> 📝 **開始之前**  
> 請確保已安裝 Node.js 14 或更高版本。

#### 步驟 1：安裝依賴

```bash
npm install
```

#### 步驟 2：設定環境變數

建立 `.env` 檔案：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
API_KEY=your_api_key_here
PORT=3000
```

#### 步驟 3：啟動應用

```bash
npm run dev
```

> ✅ **成功！** 應用程式現在運行於 `http://localhost:3000`

### API 文件範例

#### `POST /api/users`

建立新使用者

**請求參數：**

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| username | string | ✅ | 使用者名稱 |
| email | string | ✅ | 電子郵件 |
| password | string | ✅ | 密碼（最少 8 字元）|

**請求範例：**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePass123"
}
```

**回應範例：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 版本歷史

### v1.2.0 (2024-01-15)

- ✨ 新增深色模式支援
- 🐛 修復登入頁面的錯誤
- 📝 更新 API 文件

### v1.1.0 (2024-01-01)

- ✨ 新增使用者管理功能
- ⚡ 改善載入速度
- 🔧 重構配置系統

### v1.0.0 (2023-12-01)

- 🎉 初始版本發布

---

## 結語

這份文件展示了 Markdown 的所有常用樣式，你可以根據需求選擇合適的元素來撰寫操作說明或技術文件。

**相關資源：**

- [Markdown 官方文件](https://daringfireball.net/projects/markdown/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [CommonMark 規範](https://commonmark.org/)

---

*最後更新：2024-01-15*
