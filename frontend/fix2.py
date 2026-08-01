path = r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\app.js'
content = open(path, 'r', encoding='utf-8').read()
# Add double-submit prevention
old = "  let memoryId = null;\n  try {"
new = "  // 防重複提交\n  const submitBtn = document.querySelector('#memoryForm .btn-primary');\n  if (submitBtn) submitBtn.disabled = true;\n  let memoryId = null;\n  try {"
content = content.replace(old, new)
# Re-enable button after try-catch
old2 = "  } catch (err) {\n    if (err.message !== '需要登入') {\n      showToast(err.message || '儲存失敗', 'error');\n      return;\n    }\n  }\n\n  // 上傳照片"
new2 = "  } catch (err) {\n    if (err.message !== '需要登入') {\n      showToast(err.message || '儲存失敗', 'error');\n    }\n  }\n  if (submitBtn) submitBtn.disabled = false;\n\n  // 上傳照片"
content = content.replace(old2, new2)
open(path, 'w', encoding='utf-8').write(content)
print('Fixed double-submit')
