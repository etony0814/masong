import re

with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 添加 DB_PATH 定義
lines = content.split('\n')
new_lines = []
for line in lines:
    new_lines.append(line)
    if 'const AVATAR_PATH = path.join' in line:
        new_lines.append('const DB_PATH = path.join(__dirname, "data", "肉鬆的生活日誌.db");')

content = '\n'.join(new_lines)

# 修復 import/backup 函數
old_pattern = r"app\.post\('\/api\/import\/backup', requireAuth, backupUpload\.single\('backup'\), async \(req, res\) => \{\s*try\s*\{\s*const SQL = await initSqlJs\(\);\s*new SQL\.Database\(req\.file\.buffer\);\s*const zip = new AdmZip\(req\.file\.buffer\);\s*const dbFiles = zip\.getEntries\(\)\.filter\(e => e\.entryName\.endsWith\('.db'\)\);\s*if \(dbFiles\.length === 0\) return res\.status\(400\)\.json\({ error: '備份檔案中未找到 \.db 檔案' \}\);\s*fs\.mkdirSync\(path\.dirname\(DB_PATH\), \{ recursive: true \}\);\s*fs\.writeFileSync\(DB_PATH, Buffer\.from\(dbFiles\[0\]\.getData\(\)\)\);\s*zip\.getEntries\(\)\s*\s*\.filter\(e => e\.entryName\.startsWith\('uploads/'\)\s*\&\& !e\.isDirectory\)\s*\s*\.forEach\(entry => \{\s*const targetPath = path\.join\(__dirname, 'uploads', entry\.entryName\.replace\('uploads/', ''\) \);\s*fs\.mkdirSync\(path\.dirname\(targetPath\), \{ recursive: true \}\);\s*fs\.writeFileSync\(targetPath, Buffer\.from\(entry\.getData\(\)\)\);\s*\}\);\s*res\.json\({ success: true \}\);\s*}\s*catch \(e\) {\s*res\.status\(400\)\.json\({ error: '備份檔案格式錯誤，請上傳 \.zip 備份檔' \}\);\s*\}\}\);"

new_import = r"app.post('/api/import/backup', requireAuth, backupUpload.single('backup'), async (req, res) => {\n  try {\n    const zip = new AdmZip(req.file.buffer);\n    const dbFiles = zip.getEntries().filter(e => e.entryName.endsWith('.db'));\n    if (dbFiles.length === 0) return res.status(400).json({ error: '備份檔案中未找到 .db 檔案' });\n    // 寫入資料庫檔案\n    const dbData = dbFiles[0].getData();\n    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });\n    fs.writeFileSync(DB_PATH, Buffer.from(dbData));\n    // 寫入上傳的媒體檔案\n    zip.getEntries()\n      .filter(e => e.entryName.startsWith('uploads/') && !e.isDirectory)\n      .forEach(entry => {\n        const targetPath = path.join(__dirname, 'uploads', entry.entryName.replace('uploads/', ''));\n        fs.mkdirSync(path.dirname(targetPath), { recursive: true });\n        fs.writeFileSync(targetPath, Buffer.from(entry.getData()));\n      });\n    res.json({ success: true });\n  } catch (e) {\n    console.error(e);\n    res.status(400).json({ error: '備份檔案格式錯誤，請上傳 .zip 備份檔' });\n  }\n});"

content = re.sub(r"app\.post\('\/api\/import\/backup', requireAuth, backupUpload\.single\('backup'\), async \(req, res\) => \{[\s\S]*?\}\);", new_import, content, flags=re.DOTALL)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
