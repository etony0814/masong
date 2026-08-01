path_js = r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\app.js'
content = open(path_js, 'r', encoding='utf-8').read()

# Replace simple avatar upload with cropper flow
old_avatar = '''document.getElementById('avatarInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  requireAuth(async () => {
    const uploadForm = new FormData();
    uploadForm.append('avatar', file);
    try {
      const res = await fetch('/avatar', { method: 'POST', body: uploadForm });
      if (res.ok) {
        loadAvatar();
        showToast('頭像已更換！');
      } else {
        const data = await res.json();
        if (res.status === 401) showLoginModal();
        else showToast(data.error || '上傳失敗', 'error');
      }
    } catch (err) {
      showToast('上傳失敗', 'error');
    }
  });
  e.target.value = '';
});'''

new_avatar = '''// ===== 頭像裁切 =====
let avatarCropper = null;
let _pendingAvatarFile = null;

document.getElementById('avatarInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  requireAuth(async () => {
    _pendingAvatarFile = file;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.getElementById('avatarCropImage');
      img.src = ev.target.result;
      document.getElementById('avatarCropModal').classList.add('open');
      if (avatarCropper) avatarCropper.destroy();
      avatarCropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 0.9,
        responsive: true
      });
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
});

function closeAvatarCrop() {
  document.getElementById('avatarCropModal').classList.remove('open');
  if (avatarCropper) { avatarCropper.destroy(); avatarCropper = null; }
  _pendingAvatarFile = null;
}

function zoomCrop(factor) {
  if (avatarCropper) avatarCropper.zoom(factor);
}

function rotateCrop(deg) {
  if (avatarCropper) avatarCropper.rotate(deg);
}

async function saveAvatarCrop() {
  if (!avatarCropper || !_pendingAvatarFile) return;
  const canvas = avatarCropper.getCroppedCanvas({
    width: 300,
    height: 300,
    imageSmoothingQuality: 'high'
  });
  canvas.toBlob(async blob => {
    const form = new FormData();
    form.append('avatar', blob, 'avatar.jpg');
    try {
      const res = await fetch('/avatar', { method: 'POST', body: form });
      if (res.ok) {
        loadAvatar();
        showToast('頭像已更新！');
        closeAvatarCrop();
      } else {
        const data = await res.json();
        if (res.status === 401) showLoginModal();
        else showToast(data.error || '上傳失敗', 'error');
      }
    } catch (err) {
      showToast('上傳失敗', 'error');
    }
  }, 'image/jpeg', 0.92);
  closeAvatarCrop();
}'''

content = content.replace(old_avatar, new_avatar)
open(path_js, 'w', encoding='utf-8').write(content)
print('Replaced avatar upload with cropper')
