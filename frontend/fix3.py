path = r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\app.js'
content = open(path, 'r', encoding='utf-8').read()
# Fix: /avatar -> /api/avatar in saveAvatarCrop
content = content.replace("fetch('/avatar', { method: 'POST'", "fetch('/api/avatar', { method: 'POST'")
open(path, 'w', encoding='utf-8').write(content)
print('Fixed avatar API path')
