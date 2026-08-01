content = open(r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\app.js', 'r', encoding='utf-8').read()
old = "headers: options.headers || { 'Content-Type': 'application/json' },"
new = "headers: { 'Content-Type': 'application/json' },"
content = content.replace(old, new)
open(r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\app.js', 'w', encoding='utf-8').write(content)
print('Fixed', content.count(new), 'occurrences')
