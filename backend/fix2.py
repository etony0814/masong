with open('server.js', 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'const AVATAR_PATH = path.join' in line:
        new_lines.append('const DB_PATH = path.join(__dirname, "data", "肉鬆的生活日誌.db");\n')
with open('server.js', 'w', encoding='utf-8-sig') as f:
    f.writelines(new_lines)
print('Added DB_PATH')
