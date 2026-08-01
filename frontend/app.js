const API = '/api';
let _isAuthenticated = false;
let _pendingAction = null;

// ===== 導航 =====
function navigateTo(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(section).classList.add('active');
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  document.querySelector('.nav')?.classList.remove('open');
  window.scrollTo(0, 0);
  if (section === 'home') loadOverview();
  if (section === 'timeline') loadTimeline();
  if (section === 'photos') loadPhotos();
  if (section === 'videos') loadVideos();
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(link.dataset.section);
  });
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.querySelector('.nav').classList.toggle('open');
});

document.querySelectorAll('.view-all').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(link.href.split('#')[1]);
  });
});

// ===== 通用 HTTP =====
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: options.headers || { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      showLoginModal();
      throw new Error('需要登入');
    }
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ===== Toast =====
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = `toast ${type}`;
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== 心情標籤 =====
const moodLabels = {
  happy: ['😊 開心', 'mood-happy'],
  excited: ['🤩 興奮', 'mood-excited'],
  sleepy: ['😴 困倦', 'mood-sleepy'],
  playful: ['🎾 調皮', 'mood-playful'],
  sick: ['🤒 不舒服', 'mood-sick'],
  shy: ['🙈 害羞', 'mood-shy'],
};
const categoryLabels = {
  daily: '📅 日常', health: '🏥 健康', play: '🎾 玩耍',
  training: '🎓 訓練', travel: '🚗 外出', food: '🍖 美食',
};

// ===== 認證相關 =====
async function checkAuth() {
  try {
    const data = await apiFetch(`${API}/check-auth`);
    _isAuthenticated = data.authenticated;
    updateAuthUI();
  } catch (e) {
    _isAuthenticated = false;
    updateAuthUI();
  }
}

function updateAuthUI() {
  const btn = document.getElementById('authBtn');
  const body = document.body;
  if (_isAuthenticated) {
    btn.classList.add('logged-in');
    btn.innerHTML = '<i class="fas fa-unlock"></i>';
    btn.title = '已登入，點擊登出';
    body.classList.add('authenticated');
  } else {
    btn.classList.remove('logged-in');
    btn.innerHTML = '<i class="fas fa-lock"></i>';
    btn.title = '需要登入';
    body.classList.remove('authenticated');
  }
}

function requireAuth(callback) {
  if (_isAuthenticated) {
    callback();
  } else {
    _pendingAction = callback;
    showLoginModal();
  }
}

function showLoginModal() {
  document.getElementById('loginModal').classList.add('open');
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginPassword').focus();
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('open');
  _pendingAction = null;
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: options.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (res.ok) {
      _isAuthenticated = true;
      updateAuthUI();
      closeLoginModal();
      showToast('登入成功！');
      if (_pendingAction) { _pendingAction(); _pendingAction = null; }
    } else {
      showToast(data.error || '登入失敗', 'error');
    }
  } catch (err) {
    showToast('網路錯誤', 'error');
  }
});

document.getElementById('authBtn').addEventListener('click', () => {
  if (_isAuthenticated) {
    fetch(`${API}/logout`, { method: 'POST' }).then(() => {
      _isAuthenticated = false;
      updateAuthUI();
      showToast('已登出');
    });
  } else {
    showLoginModal();
  }
});


// ===== 首頁 =====
async function loadOverview() {
  const showSkeleton = (id) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.loaded) el.innerHTML = '<div class="skeleton sk-card"></div>'.repeat(3);
  };
  showSkeleton('latestMemories');
  showSkeleton('milestonesList');
  showSkeleton('photoPreview');

  try {
    const [data, age, announcements] = await Promise.all([
      apiFetch(`${API}/overview`),
      apiFetch(`${API}/age`),
      apiFetch(`${API}/announcements`)
    ]);

    document.getElementById('statMemories').textContent = data.memoryCount;
    document.getElementById('statPhotos').textContent = data.photoCount;
    document.getElementById('statVideos').textContent = data.videoCount;
    document.getElementById('statMilestones').textContent = data.milestones.length;
    document.getElementById('statMemories').dataset.loaded = '1';
    document.getElementById('statPhotos').dataset.loaded = '1';
    document.getElementById('statVideos').dataset.loaded = '1';
    document.getElementById('statMilestones').dataset.loaded = '1';

    if (age.text) {
      document.getElementById('ageLine').textContent =
        `邊境牧羊犬 · ${age.months}個月又${age.days}天 🦴`;
    }

    loadAvatar();

    const mc = document.getElementById('latestMemories');
    if (data.latestMemory) {
      mc.innerHTML = createMemoryCard(data.latestMemory);
    } else {
      mc.innerHTML = `<div class="empty-state"><i class="fas fa-camera-retro"></i><p>還沒有記錄，快去新增第一筆吧！</p></div>`;
    }
    mc.dataset.loaded = '1';

    const msC = document.getElementById('milestonesList');
    if (data.milestones.length > 0) {
      msC.innerHTML = data.milestones.map(m => `
        <div class="milestone-card">
          <div class="milestone-header">
            <div class="milestone-icon">${m.icon}</div>
            <div class="milestone-title-area">
              <span class="milestone-date">${m.date}</span>
              <h4>${esc(m.title)}</h4>
            </div>
          </div>
          ${m.description ? `<div class="milestone-body">${esc(m.description)}</div>` : ""}
          <div class="milestone-actions">
            <button class="btn-edit-sm" onclick="requireAuth(()=>editMilestone(${m.id}))" title="編輯"><i class="fas fa-pen"></i></button>
            <button class="btn-danger" onclick="requireAuth(()=>deleteMilestone(${m.id}))" title="刪除"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('');
    } else {
      msC.innerHTML = `<div class="empty-state"><p>還沒有里程碑，記錄肉鬆的重要時刻！</p></div>`;
    }
    msC.dataset.loaded = '1';
    const photos = await apiFetch(`${API}/photos`);
    const photoC = document.getElementById('photoPreview');
    if (photos.length > 0) {
      photoC.innerHTML = photos.slice(0, 6).map((p, i) => `
        <div class="photo-item" onclick="openLightbox(${i})">
          <img src="/uploads/photos/${esc(p.filename)}" alt="${esc(p.caption)}" loading="lazy">
          <div class="photo-item-overlay">${esc(p.caption || p.filename)}</div>
        </div>
      `).join('');
    } else {
      photoC.innerHTML = `<div class="empty-state"><p>還沒有照片，快上傳肉鬆的可愛照片吧！</p></div>`;
    }
    photoC.dataset.loaded = '1';
    window._lightboxPhotos = photos;

    renderAnnouncements(announcements);
  } catch (e) {
    console.error('載入首頁失敗:', e);
    document.getElementById('latestMemories').innerHTML =
      `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>載入資料失敗，請稍後再試</p></div>`;
  }
}

// ===== 紀念日提醒 =====
function renderAnnouncements(data) {
  const section = document.getElementById('anniversarySection');
  const card = document.getElementById('anniversaryCard');
  const text = document.getElementById('anniversaryText');

  if (data.today) {
    text.textContent = `🎉 今天是「${data.today}」的日子！`;
    section.style.display = 'block';
  } else if (data.upcoming.length > 0) {
    const next = data.upcoming[0];
    text.textContent = `📅 ${next.daysUntil} 天後：「${next.title}」`;
    section.style.display = 'block';
  } else {
    section.style.display = 'none';
  }
}

// ===== 時間軸 =====
async function loadTimeline() {
  const container = document.getElementById('timelineContainer');
  container.innerHTML = '<div class="skeleton" style="height:100px;border-radius:var(--radius);margin-bottom:14px;"></div>'.repeat(3);
  try {
    const memories = await apiFetch(`${API}/memories`);
    const photos = await apiFetch(`${API}/photos`);
    const videos = await apiFetch(`${API}/videos`);
    window._allMemories = memories;
    window._allPhotos = photos;
    window._allVideos = videos;
    renderTimeline(memories, photos, videos);
    setupSearchFilter();
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>載入失敗</p></div>`;
  }
}

function renderTimeline(memories, photos, videos, filterFn) {
  const container = document.getElementById('timelineContainer');
  if (memories.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>還沒有記錄，開始記錄肉鬆的生活吧！</p></div>`;
    return;
  }
  const allPhotos = photos || [];
  const allVideos = videos || [];
  let list = filterFn ? memories.filter(filterFn) : memories;
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>沒有符合條件的記錄</p></div>`;
    return;
  }

  let html = '';
  let lastMonth = '';
  list.forEach(m => {
    const d = new Date(m.date);
    const monthKey = `${d.getFullYear()}/${d.getMonth() + 1}`;
    if (monthKey !== lastMonth) {
      html += `<div class="timeline-month-anchor">${monthKey} 月</div>`;
      lastMonth = monthKey;
    }
    const mood = moodLabels[m.mood] || ['😊', 'mood-happy'];
    const mPhotos = allPhotos.filter(p => p.memory_id === m.id).sort((a, b) => a.order_index - b.order_index);
    const mVideos = allVideos.filter(v => v.memory_id === m.id);
    html += `
      <div class="timeline-item">
        <div class="timeline-date">${m.date}</div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="mood-tag ${mood[1]}">${mood[0]}</span>
            <span class="category-tag">${categoryLabels[m.category] || m.category}</span>
            <h3>${esc(m.title)}</h3>
          </div>
          ${m.weight ? `<span class="weight-tag">⚖️ ${esc(m.weight)} kg</span>` : ''}
          <p class="timeline-desc">${esc(m.content || '')}</p>
          ${mPhotos.length > 0 ? `<div class="timeline-photos">${mPhotos.map(p =>
            `<img src="/uploads/photos/${esc(p.filename)}" alt="${esc(p.caption)}" onclick="openLightboxBySrc('/uploads/photos/${esc(p.filename)}')" loading="lazy">`
          ).join('')}</div>` : ''}
          ${mVideos.length > 0 ? `<div class="timeline-videos">${mVideos.map(v =>
            `<video src="/uploads/videos/${esc(v.filename)}" controls preload="metadata"></video>`
          ).join('')}</div>` : ''}
          <div class="timeline-actions">
            <button class="btn-edit-sm" onclick="requireAuth(()=>editMemory(${m.id}))"><i class="fas fa-pen"></i> 編輯</button>
            <button class="btn-danger" onclick="requireAuth(()=>deleteMemory(${m.id}))"><i class="fas fa-trash"></i> 刪除</button>
          </div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

// ===== 搜尋與篩選 =====
function setupSearchFilter() {
  const searchInput = document.getElementById('searchInput');
  const filterCat = document.getElementById('filterCategory');
  const filterMood = document.getElementById('filterMood');
  const filterDateFrom = document.getElementById('filterDateFrom');
  const filterDateTo = document.getElementById('filterDateTo');

  function applyFilter() {
    const query = searchInput.value.trim().toLowerCase();
    const cat = filterCat.value;
    const mood = filterMood.value;
    const from = filterDateFrom.value;
    const to = filterDateTo.value;

    const fn = m => {
      if (query && !`${m.title} ${m.content}`.toLowerCase().includes(query)) return false;
      if (cat && m.category !== cat) return false;
      if (mood && m.mood !== mood) return false;
      if (from && m.date < from) return false;
      if (to && m.date > to) return false;
      return true;
    };
    renderTimeline(window._allMemories || [], window._allPhotos || [], window._allVideos || [], fn);
  }

  searchInput.addEventListener('input', applyFilter);
  filterCat.addEventListener('change', applyFilter);
  filterMood.addEventListener('change', applyFilter);
  filterDateFrom.addEventListener('change', applyFilter);
  filterDateTo.addEventListener('change', applyFilter);
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterMood').value = '';
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  if (window._allMemories) renderTimeline(window._allMemories, window._allPhotos || [], window._allVideos || []);
}

// ===== 照片牆 =====
async function loadPhotos() {
  const container = document.getElementById('photoGallery');
  container.innerHTML = '<div class="skeleton" style="aspect-ratio:1"></div>'.repeat(6);
  try {
    const photos = await apiFetch(`${API}/photos`);
    window._allPhotos = photos;
    if (photos.length > 0) {
      container.innerHTML = photos.map((p, i) => `
        <div class="photo-item" onclick="openLightbox(${i})">
          <img src="/uploads/photos/${esc(p.filename)}" alt="${esc(p.caption)}" loading="lazy">
          <div class="photo-item-overlay">
            ${esc(p.caption || p.filename)}
            <button class="btn-danger" onclick="event.stopPropagation(); requireAuth(()=>deletePhoto(${p.id}))"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-images"></i><p>還沒有照片，快去上傳肉鬆的可愛模樣吧！</p></div>`;
    }
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>載入失敗</p></div>`;
  }
}

// ===== 影片牆 =====
async function loadVideos() {
  const container = document.getElementById('videoGallery');
  container.innerHTML = '<div class="skeleton" style="aspect-ratio:16/9;border-radius:var(--radius)"></div>'.repeat(2);
  try {
    const videos = await apiFetch(`${API}/videos`);
    window._allVideos = videos;
    if (videos.length > 0) {
      container.innerHTML = videos.map(v => `
        <div class="video-item">
          <video src="/uploads/videos/${esc(v.filename)}" controls preload="metadata"></video>
          <div class="video-info">
            <p>${esc(v.caption || v.filename)}</p>
            <button class="btn-danger" onclick="requireAuth(()=>deleteVideo(${v.id}))"><i class="fas fa-trash"></i> 刪除</button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-film"></i><p>還沒有影片，快記錄肉鬆的有趣時刻吧！</p></div>`;
    }
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>載入失敗</p></div>`;
  }
}

// ===== 建立記憶卡片 =====
function createMemoryCard(m) {
  const mood = moodLabels[m.mood] || ['😊', 'mood-happy'];
  return `
    <div class="memory-card">
      <div class="memory-header">
        <span class="mood-tag ${mood[1]}">${mood[0]}</span>
        <span class="category-tag">${categoryLabels[m.category] || m.category}</span>
      </div>
      <h3>${esc(m.title)}</h3>
      <p class="memory-date">${m.date}</p>
      <p class="memory-content">${esc(m.content ? (m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content) : '無內容')}</p>
      ${m.weight ? `<span class="weight-tag">⚖️ ${esc(m.weight)} kg</span>` : ''}
      <div class="memory-actions">
        <button class="btn-edit-sm" onclick="event.stopPropagation(); requireAuth(()=>editMemory(${m.id}))" title="編輯"><i class="fas fa-pen"></i></button>
        <button class="btn-danger" onclick="event.stopPropagation(); requireAuth(()=>deleteMemory(${m.id}))" title="刪除"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `;
}

// ===== 新增記錄表單 =====
document.getElementById('memoryForm').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('memoryTitle').value.trim();
  const content = document.getElementById('memoryContent').value.trim();
  const date = document.getElementById('memoryDate').value;
  const mood = document.getElementById('memoryMood').value;
  const category = document.getElementById('memoryCategory').value;
  const weight = document.getElementById('memoryWeight').value;
  const editId = document.getElementById('memoryTitle').dataset.editId;

  if (!title || !date) { showToast('請填寫標題和日期', 'error'); return; }

  let memoryId = null;
  try {
    if (editId) {
      await apiFetch(`${API}/memories/${editId}`, {
        method: 'PUT', body: JSON.stringify({ title, content, date, mood, category, weight })
      });
      memoryId = parseInt(editId);
      delete document.getElementById('memoryTitle').dataset.editId;
      showToast('記錄已更新！');
    } else {
      const result = await apiFetch(`${API}/memories`, {
        method: 'POST', body: JSON.stringify({ title, content, date, mood, category, weight })
      });
      memoryId = result.id;
      showToast('記錄已新增！');
    }
  } catch (err) {
    if (err.message !== '需要登入') {
      showToast(err.message || '儲存失敗', 'error');
      return;
    }
  }

  // 上傳照片
  const photoFiles = document.getElementById('memoryPhotos').files;
  for (let i = 0; i < photoFiles.length; i++) {
    const form = new FormData();
    form.append('photo', photoFiles[i]);
    form.append('memory_id', memoryId);
    form.append('order_index', i);
    try {
      const res = await fetch(`${API}/photos`, { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) { showLoginModal(); throw new Error("需要登入"); }
        console.error('Photo upload failed:', data.error);
      }
    } catch(e) { console.error('Photo upload error:', e); }
  }

  // 上傳影片
  const videoFiles = document.getElementById('memoryVideos').files;
  for (const file of videoFiles) {
    const form = new FormData();
    form.append('video', file);
    form.append('memory_id', memoryId);
    try {
      const res = await fetch(`${API}/videos`, { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) { showLoginModal(); throw new Error("需要登入"); }
        console.error('Video upload failed:', data.error);
      }
    } catch(e) { console.error('Video upload error:', e); }
  }

  e.target.reset();
  document.getElementById('memoryDate').value = new Date().toISOString().split('T')[0];
  navigateTo('home');
});

// ===== 照片預覽 =====
document.getElementById('memoryPhotos').addEventListener('change', e => {
  const list = document.getElementById('photoPreviewList');
  list.innerHTML = '';
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.innerHTML = `<img src="${ev.target.result}"><button class="remove-btn" onclick="this.parentElement.remove()">×</button>`;
      list.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
});

document.getElementById('memoryVideos').addEventListener('change', e => {
  const list = document.getElementById('videoPreviewList');
  list.innerHTML = '';
  Array.from(e.target.files).forEach(file => {
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `<video src="${URL.createObjectURL(file)}" muted></video><button class="remove-btn" onclick="this.parentElement.remove()">×</button>`;
    list.appendChild(div);
  });
});

// ===== Lightbox =====
function showLightboxImage() {
  const photos = window._lightboxPhotos || [];
  const idx = window._lightboxIndex || 0;
  if (photos[idx]) {
    document.getElementById('lightboxImg').src = `/uploads/photos/${esc(photos[idx].filename)}`;
    document.getElementById('lightboxCaption').textContent = esc(photos[idx].caption || photos[idx].filename);
  }
}

function openLightbox(idx) {
  window._lightboxIndex = idx;
  showLightboxImage();
  document.getElementById('lightbox').classList.add('open');
}

function openLightboxBySrc(src) {
  const photos = window._allPhotos || [];
  const idx = photos.findIndex(p => p.filename === src.replace('/uploads/photos/', ''));
  window._lightboxPhotos = photos;
  window._lightboxIndex = idx >= 0 ? idx : 0;
  showLightboxImage();
  document.getElementById('lightbox').classList.add('open');
}

function closeLightbox() { document.getElementById('lightbox').classList.remove('open'); }
function prevPhoto() {
  const photos = window._lightboxPhotos || [];
  window._lightboxIndex = (window._lightboxIndex - 1 + photos.length) % photos.length;
  showLightboxImage();
}
function nextPhoto() {
  const photos = window._lightboxPhotos || [];
  window._lightboxIndex = (window._lightboxIndex + 1) % photos.length;
  showLightboxImage();
}
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevPhoto();
  if (e.key === 'ArrowRight') nextPhoto();
});
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});

// ===== 里程碑 Modal =====
let _editingMilestoneId = null;

function showMilestoneModal(editId) {
  _editingMilestoneId = editId || null;
  const titleEl = document.getElementById('milestoneModalTitle');
  const submitBtn = document.querySelector('#milestoneForm .btn-primary');
  if (_editingMilestoneId) {
    titleEl.innerHTML = '<i class="fas fa-trophy"></i> 編輯里程碑';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> 儲存變更';
  } else {
    titleEl.innerHTML = '<i class="fas fa-trophy"></i> 新增里程碑';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> 儲存';
    document.getElementById('milestoneDate').value = new Date().toISOString().split('T')[0];
  }
  document.getElementById('milestoneModal').classList.add('open');
}
function closeMilestoneModal() {
  document.getElementById('milestoneModal').classList.remove('open');
  document.getElementById('milestoneForm').reset();
  _editingMilestoneId = null;
}

async function editMilestone(id) {
  try {
    const item = await apiFetch(`${API}/milestones/${id}`);
    if (!item) { showToast('找不到里程碑', 'error'); return; }
    document.getElementById('milestoneTitle').value = item.title;
    document.getElementById('milestoneDesc').value = item.description || '';
    document.getElementById('milestoneDate').value = item.date;
    document.getElementById('milestoneIcon').value = item.icon;
    showMilestoneModal(id);
  } catch (e) {
    showToast('載入里程碑失敗', 'error');
  }
}

document.getElementById('milestoneForm').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('milestoneTitle').value.trim();
  const description = document.getElementById('milestoneDesc').value.trim();
  const date = document.getElementById('milestoneDate').value;
  const icon = document.getElementById('milestoneIcon').value;
  if (!title || !date) { showToast('請填寫必要欄位', 'error'); return; }
  try {
    if (_editingMilestoneId) {
      await apiFetch(`${API}/milestones/${_editingMilestoneId}`, { method: 'PUT', body: JSON.stringify({ title, description, date, icon }) });
      showToast('里程碑已更新！');
    } else {
      await apiFetch(`${API}/milestones`, { method: 'POST', body: JSON.stringify({ title, description, date, icon }) });
      showToast('里程碑已新增！');
    }
  } catch (err) {
    if (err.message !== '需要登入') {
      showToast(err.message || '儲存失敗', 'error');
      return;
    }
  }
  closeMilestoneModal();
  loadOverview();
});

async function deletePhoto(id) {
  if (!confirm('確定要刪除這張照片？')) return;
  try {
    await apiFetch(`${API}/photos/${id}`, { method: 'DELETE' });
    showToast('照片已刪除');
    loadPhotos();
    loadOverview();
  } catch (err) {
    if (err.message !== '需要登入') showToast(err.message, 'error');
  }
}

async function deleteVideo(id) {
  if (!confirm('確定要刪除這支影片？')) return;
  try {
    await apiFetch(`${API}/videos/${id}`, { method: 'DELETE' });
    showToast('影片已刪除');
    loadVideos();
  } catch (err) {
    if (err.message !== '需要登入') showToast(err.message, 'error');
  }
}

async function deleteMilestone(id) {
  if (!confirm('確定要刪除這個里程碑？')) return;
  try {
    await apiFetch(`${API}/milestones/${id}`, { method: 'DELETE' });
    showToast('里程碑已刪除');
    loadOverview();
  } catch (err) {
    if (err.message !== '需要登入') showToast(err.message, 'error');
  }
}

async function deleteMemory(id) {
  if (!confirm('確定要刪除這筆記錄？')) return;
  try {
    await apiFetch(`${API}/memories/${id}`, { method: 'DELETE' });
    showToast('記錄已刪除');
    loadOverview();
    loadTimeline();
  } catch (err) {
    if (err.message !== '需要登入') showToast(err.message, 'error');
  }
}

// ===== 編輯記錄 =====
async function editMemory(id) {
  try {
    const m = await apiFetch(`${API}/memories/${id}`);
    document.getElementById('memoryTitle').value = m.title;
    document.getElementById('memoryContent').value = m.content || '';
    document.getElementById('memoryDate').value = m.date;
    document.getElementById('memoryMood').value = m.mood;
    document.getElementById('memoryCategory').value = m.category;
    document.getElementById('memoryWeight').value = m.weight || '';
    document.getElementById('memoryTitle').dataset.editId = id;
    document.getElementById('formTitle').textContent = '編輯生活記錄';
    navigateTo('add');
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    if (e.message !== '需要登入') showToast('載入編輯資料失敗', 'error');
  }
}

// 恢復表單標題
document.querySelector('[data-section="add"]')?.addEventListener('click', () => {
  if (!document.getElementById('memoryTitle').dataset.editId) {
    document.getElementById('formTitle').textContent = '新增生活記錄';
  }
});

// ===== 工具函數 =====
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== 頭像 =====
async function loadAvatar() {
  try {
    const res = await fetch(`${API}/avatar`);
    const data = await res.json();
    const img = document.getElementById('avatarImg');
    img.src = data.exists ? 'images/avatar.jpg?t=' + Date.now() : 'images/meSongs.jpg';
  } catch (e) {
    document.getElementById('avatarImg').src = 'images/meSongs.jpg';
  }
}

document.getElementById('avatarInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  requireAuth(async () => {
    const form = new FormData();
    form.append('avatar', file);
    try {
      const res = await fetch('/avatar', { method: 'POST', body: form });
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
});


// ===== 首頁標題 =====
async function loadHeroTitle() {
  try {
    const res = await fetch('/api/hero');
    const data = await res.json();
    if (data.title) {
      document.getElementById('heroTitle').innerHTML = data.title;
    }
  } catch (e) {}
}
function showHeroModal() {
  document.getElementById('heroTitleInput').value = document.getElementById('heroTitle').innerHTML;
  document.getElementById('heroModal').classList.add('open');
}
function closeHeroModal() {
  document.getElementById('heroModal').classList.remove('open');
}
async function saveHeroTitle() {
  const title = document.getElementById('heroTitleInput').value.trim();
  if (!title) { showToast('請輸入標題', 'error'); return; }
  try {
    await apiFetch('/api/hero', { method: 'POST', body: JSON.stringify({ title }) });
    document.getElementById('heroTitle').innerHTML = title;
    closeHeroModal();
    showToast('標題已更新！');
  } catch (err) {
    if (err.message !== '需要登入') showToast(err.message, 'error');
  }
}

// ===== 資料匯出 =====
function exportData(format) {
  if (!_isAuthenticated) {
    showLoginModal();
    return;
  }
  const urls = {
    json: '/api/export/json',
    csv: '/api/export/csv',
    db: '/api/export/db'
  };
  const filenames = {
    json: 'mesong-backup.json',
    csv: 'mesong-records.csv',
    db: 'mesong-database.db'
  };
  const a = document.createElement('a');
  a.href = urls[format] + '?t=' + Date.now();
  a.download = filenames[format];
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`已匯出 ${filenames[format]}`);
}

// ===== 頁面初始載入 =====
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadOverview();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker 註冊成功'))
      .catch(err => console.log('SW 註冊失敗:', err));
  }
});