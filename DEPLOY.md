# 部署到 GitHub + Render.com 完整步驟

## 步驟 1: 在 GitHub 建立倉庫

1. 開啟 https://github.com/new
2. 填寫：
   - Repository name: mesong-diary 或你想要的名字
   - Description: 肉鬆的生活日誌 - 邊境牧羊犬成長記錄
   - 選擇 **Public** 或 **Private**
   - **不要**勾選 "Add a README file"
3. 點擊 "Create repository"
4. 複製倉庫 URL（如：https://github.com/你的用戶名/mesong-diary.git）

## 步驟 2: 推送到 GitHub

在專案資料夾開啟 PowerShell，執行以下命令：

\\\powershell
# 進入專案目錄
cd "D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網"

# 新增 remote（替換成你的倉庫 URL）
git remote add origin https://github.com/你的用戶名/mesong-diary.git

# 提交所有檔案
git add -A
git commit -m "初始版本：肉鬆的生活日誌網站"

# 推送至 GitHub
git branch -M main
git push -u origin main
\\\

## 步驟 3: 部署到 Render.com

1. 開啟 https://render.com 並登入
2. 點擊 "New +" -> "Web Service"
3. 連接你的 GitHub 帳號
4. 選擇 mesong-diary 倉庫
5. 設定以下參數：
   - **Name**: mesong-diary
   - **Environment**: Node
   - **Build Command**: \cd backend && npm install\
   - **Start Command**: \cd backend && node server.js\
   - **Instance Type**: Free
6. 點擊 "Create Web Service"
7. 等待部署完成（約 1-2 分鐘）
8. 取得網址如：https://mesong-diary.onrender.com

## 注意事項

- 免費方案每 90 天會休眠一次，需要登入 Render 點擊喚醒
- 建議定期從網站匯出 JSON 備份資料
- 上傳的照片和影片在免費方案中可能不持久保留
