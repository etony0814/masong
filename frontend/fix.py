path = r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\app.js'
content = open(path, 'r', encoding='utf-8').read()
content = content.replace("form.append('avatar', file);", "uploadForm.append('avatar', file);")
open(path, 'w', encoding='utf-8').write(content)
print('Fixed avatar bug')
