import
re

with open("server.js", "r", encoding="utf-8-sig") as f:
    content = f.read()

lines = content.split("\\n")
in_import = False
for i, line in enumerate(lines):
    if "\x2fapi/import/backup" in line and "app.post" in line:
        in_import = True
    if in_import and "res.json({ success: true });" in line:
        lines.insert(i+1, "    await db.init();")
        break
content = "\\n".join(lines)
with open("server.js", "w", encoding="utf-8-sig") as f:
    f.write(content)
print("Added db.init()")
