path_html = r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\index.html'
content = open(path_html, 'r', encoding='utf-8').read()
# Add Cropper.js script before </body>
if 'cropper.min.js' not in content:
    content = content.replace(
        '</body>',
        '  <script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js"></script>\n</body>'
    )
    open(path_html, 'w', encoding='utf-8').write(content)
    print('Added Cropper.js script')
else:
    print('Already has cropper.js')
