path_css = r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\style.css'
content = open(path_css, 'r', encoding='utf-8').read()

cropper_css = '''
/* ═══════════════════════════════
   頭像裁切器
   ═══════════════════════════════ */
.crop-modal { max-width: 420px; }
.crop-container {
  height: 320px;
  background: var(--bg-elevated);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 16px;
}
.crop-container img {
  max-width: 100%;
  display: block;
}
.crop-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}
.crop-controls .btn-secondary {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  border-radius: 50%;
}
'''

# Insert before the modal section
marker = '''/* ═══════════════════════════════
   Modal 彈窗
   ═══════════════════════════════ */'''
if marker in content and 'crop-container' not in content:
    content = content.replace(marker, cropper_css + marker)
    open(path_css, 'w', encoding='utf-8').write(content)
    print('Added cropper CSS')
else:
    print('CSS already added or marker not found')
