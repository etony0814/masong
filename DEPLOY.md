# Project: 肉鬆的生活日誌
# Deployment Guide

## 部署到 Render.com (免費方案)

### 步驟 1: 建立 GitHub 倉庫
1. 前往 https://github.com/new 建立新倉庫
2. 將本專案推送到 GitHub

### 步驟 2: 部署到 Render
1. 前往 https://render.com 註冊/登入
2. 點擊 New -> Web Service
3. 連接 GitHub 倉庫
4. 設定以下參數：
   - Name: mesong-diary
   - Environment: Node
   - Build Command: cd backend && npm install
   - Start Command: cd backend && node server.js
   - Instance Type: Free
5. 點擊 Create Web Service

### 步驟 3: 設定環境變數
在 Render dashboard 中設定：
- PORT: 10000 (Render 會自動分配)

### 注意事項
- 免費方案每 90 天會休眠一次（需點擊喚醒）
- 資料庫和上傳檔案會保留在儲存中
- 上傳的檔案在重新部署時可能丟失（建議定期備份）

## 部署到 Railway.app (推薦)

### 步驟 1: 安裝 Railway CLI
npm install -g @railway/cli

### 步驟 2: 登入
railway login

### 步驟 3: 初始化專案
cd backend
railway init

### 步驟 4: 部署
railway up

## 部署到 Fly.io

### 步驟 1: 安裝 Fly CLI
https://fly.io/docs/hands-on/install-flyctl/

### 步驟 2: 登入
fly auth login

### 步驟 3: 建立應用
fly launch

### 步驟 4: 部署
fly deploy
