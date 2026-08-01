import re
with open("server.js", "r", encoding="utf-8-sig") as f:
    content = f.read()

start = content.find("app.post(\
/api/import/backup\)")
if start >= 0:
    brace = 0
    pos = start
    while pos < len(content) and brace > 0:
        if content[pos] == "{":
            brace += 1
        elif content[pos] == "}":
            brace -= 1
        pos += 1

    block = content[:pos]
    # 等等，這樣不行...

# 簡單方法：尋找匹配的大括號
def find_matching_brace(s, start_pos):
    brace = 0
    pos = start_pos
    while pos < len(s):
        if s[pos] == "{":
            brace += 1
        elif s[pos] == "}":
            brace -= 1
            if brace == 0:
                return pos + 1
        pos += 1
    return pos

end_pos = find_matching_brace(content, start)
block = content[start:end_pos]
first_pos = block.find("await db.init()")
if first_pos >= 0:
    new_block = block[:first_pos + len("await db.init()")]
    rest = block[first_pos + len("await db.init()"):]
    rest = rest.replace("await db.init()", "")
    new_block += rest
    content = content[:start] + new_block + content[end_pos:]
    with open("server.js", "w", encoding="utf-8-sig") as f:
        f.write(content)
    print("Cleaned duplicate db.init()")
