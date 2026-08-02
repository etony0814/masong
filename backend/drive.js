// ============================================================
// GOOGLE DRIVE 服務模塊
// ============================================================
const { google } = require('googleapis');
const path = require('path');

let driveService = null;

// 根據環境取得正確的 redirect_uri
function getRedirectUri() {
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || '3000';
  const isProd = process.env.NODE_ENV === 'production' || host !== 'localhost';
  return isProd ? 'https://masong.onrender.com/auth/google/callback' : 'http://localhost:' + port + '/auth/google/callback';
}
let auth = null;

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

// 判斷 Google Drive 是否可用
function isDriveAvailable() {
  return !!(FOLDER_ID && CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN);
}

// 初始化 Google Drive 服務
async function initGoogleDrive() {
  if (!isDriveAvailable()) {
    console.warn('Google Drive 環境變數不完整，將使用本地儲存');
    return null;
  }
  try {
    auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({ refresh_token: REFRESH_TOKEN });
    await auth.getAccessToken();
    driveService = google.drive({ version: 'v3', auth });
    console.log('Google Drive 服務初始化成功');
    return driveService;
  } catch (err) {
    console.error('Google Drive 初始化失敗:', err.message);
    driveService = null;
    return null;
  }
}

// 獲取 drive 服務（確保已初始化）
async function getDrive() {
  if (driveService) return driveService;
  return await initGoogleDrive();
}

// 上傳文件到 Google Drive，返回 webContentLink
async function uploadToDrive(filename, content, mimeType) {
  const ds = await getDrive();
  if (!ds) throw new Error('Google Drive 服務未就緒');

  const ext = path.extname(filename) || '.bin';
  const safeName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;

  const response = await ds.files.create({
    resource: {
      name: safeName,
      parents: [FOLDER_ID],
      mimeType: mimeType
    },
    media: {
      body: Buffer.isBuffer(content) ? content : Buffer.from(content)
    },
    fields: 'id, webContentLink'
  });

  return response.data.webContentLink;
}

// 根據文件名在指定資料夾中查找文件
async function findFileByName(folderId, filename) {
  const ds = await getDrive();
  if (!ds) return null;

  const safeName = filename.replace(/'/g, "\\'");
  const response = await ds.files.list({
    q: `'\''${folderId}'\'' in parents and name = '\''${safeName}'\'' and trashed = false`,
    fields: 'files(id, name, mimeType, webContentLink)',
    pageSize: 1
  });

  return response.data.files && response.data.files.length > 0 ? response.data.files[0] : null;
}

// 刪除 Google Drive 文件
async function deleteFromDrive(fileId) {
  const ds = await getDrive();
  if (!ds) return;
  try {
    await ds.files.delete({ fileId });
  } catch (e) {
    console.error('刪除 Drive 檔案失敗:', e.message);
  }
}

// 將 Drive URL 轉換為可顯示 URL
function getDisplayUrl(driveUrl) {
  if (!driveUrl) return null;
  const match = driveUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return driveUrl;
}

// 下載 Google Drive 文件為 Buffer
async function downloadFromDrive(fileId) {
  const ds = await getDrive();
  if (!ds) return null;
  const response = await ds.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

// 產生 OAuth 授權 URL
function generateAuthUrl() {
  if (!isDriveAvailable()) return null;
  
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, getRedirectUri());
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    redirect_uri: getRedirectUri()
  });
}

// 用 authorization code 換取 tokens
async function exchangeCodeForToken(code) {
  if (!isDriveAvailable()) return null;
  
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, getRedirectUri());
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in
  };
}

module.exports = {
  initGoogleDrive,
  uploadToDrive,
  findFileByName,
  deleteFromDrive,
  getDisplayUrl,
  downloadFromDrive,
  generateAuthUrl,
  exchangeCodeForToken,
  isDriveAvailable,
  get drive() { return driveService; }
};

