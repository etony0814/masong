path = r'D:\codex_worksapce\_Projects\Project20260731-001-狗狗生活日誌網\frontend\app.js'
content = open(path, 'r', encoding='utf-8').read()

# Fix 1: Add preview clearing to navigateTo for add section
old = """  if (section === 'home') loadOverview();
  if (section === 'timeline') loadTimeline();
  if (section === 'photos') loadPhotos();
  if (section === 'videos') loadVideos();"""
new = """  if (section === 'home') loadOverview();
  if (section === 'timeline') loadTimeline();
  if (section === 'photos') loadPhotos();
  if (section === 'videos') loadVideos();
  if (section === 'add') clearAddForm();"""
content = content.replace(old, new)

# Fix 2: Add clearAddForm function before the add section listener
old2 = """document.querySelector('[data-section="add"]')?.addEventListener('click', () => {
  if (!document.getElementById('memoryTitle').dataset.editId) {
    document.getElementById('formTitle').textContent = '新增生活記錄';
  }
});"""
new2 = """function clearAddForm() {
  document.getElementById('photoPreviewList').innerHTML = '';
  document.getElementById('videoPreviewList').innerHTML = '';
  const photoInput = document.getElementById('memoryPhotos');
  const videoInput = document.getElementById('memoryVideos');
  if (photoInput) photoInput.value = '';
  if (videoInput) videoInput.value = '';
}

document.querySelector('[data-section="add"]')?.addEventListener('click', () => {
  if (!document.getElementById('memoryTitle').dataset.editId) {
    document.getElementById('formTitle').textContent = '新增生活記錄';
    clearAddForm();
  }
});"""
content = content.replace(old2, new2)

# Fix 3: Also clear form in submit handler after successful save
old3 = """  e.target.reset();
  document.getElementById('memoryDate').value = new Date().toISOString().split('T')[0];
  navigateTo('home');"""
new3 = """  e.target.reset();
  document.getElementById('memoryDate').value = new Date().toISOString().split('T')[0];
  clearAddForm();
  navigateTo('home');"""
content = content.replace(old3, new3)

open(path, 'w', encoding='utf-8').write(content)
print('Fixed form clearing')
