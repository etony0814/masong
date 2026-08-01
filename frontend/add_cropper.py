# Add Cropper.js CDN to index.html
path_html = r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\index.html'
content = open(path_html, 'r', encoding='utf-8').read()

# Add Cropper CSS before </head>
content = content.replace(
    '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">',
    '''  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css">'''
)

# Add avatar cropper modal before </body>
cropper_modal = '''
  <!-- 頭像裁切 Modal -->
  <div class="modal" id="avatarCropModal">
    <div class="modal-content crop-modal">
      <h3><i class="fas fa-crop-alt"></i> 調整頭像</h3>
      <div class="crop-container">
        <img id="avatarCropImage" src="" alt="裁切預覽">
      </div>
      <div class="crop-controls">
        <button class="btn-secondary" onclick="zoomCrop(-0.1)"><i class="fas fa-minus"></i></button>
        <button class="btn-secondary" onclick="zoomCrop(0.1)"><i class="fas fa-plus"></i></button>
        <button class="btn-secondary" onclick="rotateCrop(-90)"><i class="fas fa-undo"></i></button>
        <button class="btn-secondary" onclick="rotateCrop(90)"><i class="fas fa-redo"></i></button>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeAvatarCrop()">取消</button>
        <button type="button" class="btn-primary" onclick="saveAvatarCrop()"><i class="fas fa-check"></i> 儲存頭像</button>
      </div>
    </div>
  </div>
'''
content = content.replace('</body>', cropper_modal + '</body>')

open(path_html, 'w', encoding='utf-8').write(content)
print('Updated index.html')
