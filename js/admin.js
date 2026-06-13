// Admin dashboard logic
(function () {
  let data;

  async function init() {
    data = await window.StorageData.loadData();
    renderPhotosTab();
    renderItemsTab();
    renderDotsTab();
    setupTabs();
  }

  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });
  }

  async function save() {
    await window.StorageData.saveData(data);
    showToast('Сохранено ✓');
  }

  function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  // ===== TAB 1: PHOTOS =====
  function renderPhotosTab() {
    const el = document.getElementById('tab-photos');
    el.innerHTML = `
      <div class="section main-photo-section">
        <div class="section-title">Главное фото кладовки</div>
        <div class="card">
          <div class="form-group">
            <label class="form-label">URL фотографии</label>
            <input class="input" id="main-photo-url" type="url" value="${escHtml(data.mainPhoto)}" placeholder="https://...">
          </div>
          <div class="photo-preview-wrap" id="main-photo-preview">
            <img src="${escHtml(data.mainPhoto)}" alt="Предпросмотр">
          </div>
          <div class="btn-row">
            <button class="btn btn-primary" onclick="AdminApp.saveMainPhoto()">Сохранить</button>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Фото полок (для 2-рядных)</div>
        ${data.items.filter(i => i.type === 'shelf-multi').map(shelf => `
          <div class="card">
            <div class="card-header">
              <div class="card-title">${escHtml(shelf.label)}<span class="type-badge shelf-multi">2 ряда</span></div>
            </div>
            <div class="form-group">
              <label class="form-label">URL фотографии полки</label>
              <input class="input" id="shelf-photo-${shelf.id}" type="url" value="${escHtml(shelf.photo || '')}" placeholder="https://...">
            </div>
            <div class="photo-preview-wrap">
              <img id="shelf-photo-preview-${shelf.id}" src="${escHtml(shelf.photo || '')}" alt="Предпросмотр" onerror="this.style.display='none'" style="${shelf.photo ? '' : 'display:none'}">
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" onclick="AdminApp.saveShelfPhoto('${shelf.id}')">Сохранить</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('main-photo-url').addEventListener('input', function () {
      document.querySelector('#main-photo-preview img').src = this.value;
    });
    data.items.filter(i => i.type === 'shelf-multi').forEach(shelf => {
      const inp = document.getElementById(`shelf-photo-${shelf.id}`);
      if (inp) inp.addEventListener('input', function () {
        const prev = document.getElementById(`shelf-photo-preview-${shelf.id}`);
        if (prev) { prev.src = this.value; prev.style.display = ''; }
      });
    });
  }

  window.AdminApp = window.AdminApp || {};

  window.AdminApp.saveMainPhoto = async function () {
    data.mainPhoto = document.getElementById('main-photo-url').value.trim();
    await save();
  };

  window.AdminApp.saveShelfPhoto = async function (shelfId) {
    const shelf = data.items.find(i => i.id === shelfId);
    if (shelf) {
      shelf.photo = document.getElementById(`shelf-photo-${shelfId}`).value.trim();
      await save();
    }
  };

  // ===== TAB 2: ITEMS =====
  function renderItemsTab() {
    const el = document.getElementById('tab-items');
    el.innerHTML = '';
    data.items.forEach(item => {
      const section = document.createElement('div');
      section.className = 'section';
      section.id = `item-section-${item.id}`;
      if (item.type === 'shelf-multi') {
        section.innerHTML = `
          <div class="section-title">${escHtml(item.label)} <span class="type-badge shelf-multi" style="margin-left:8px">2 ряда</span></div>
          ${(item.boxes || []).map(box => renderBoxCard(item.id, box)).join('')}
          <div class="btn-row" style="border:none;padding:0;margin-top:8px">
            <button class="btn btn-secondary" onclick="AdminApp.addBox('${item.id}')">+ Добавить коробку</button>
          </div>
        `;
      } else {
        section.innerHTML = `
          <div class="section-title">${escHtml(item.label)}</div>
          ${renderSingleItemCard(item)}
        `;
      }
      el.appendChild(section);
    });
  }

  function renderBoxCard(shelfId, box) {
    return `
      <div class="card" id="box-card-${box.id}">
        <div class="card-header">
          <div class="card-title">${escHtml(box.label)}</div>
          <button class="btn btn-danger" style="padding:5px 10px;font-size:0.8rem" onclick="AdminApp.deleteBox('${shelfId}','${box.id}')">Удалить</button>
        </div>
        <div class="form-group">
          <label class="form-label">Название коробки</label>
          <input class="input" id="box-label-${box.id}" value="${escHtml(box.label)}">
        </div>
        <div class="form-group">
          <label class="form-label">Содержимое</label>
          <div class="contents-list" id="contents-${box.id}">
            ${(box.contents || []).map((c, i) => contentItemHTML(box.id, i, c)).join('')}
          </div>
          <button class="btn-icon add" onclick="AdminApp.addContent('${box.id}')">+</button>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" onclick="AdminApp.saveBox('${shelfId}','${box.id}')">Сохранить</button>
        </div>
      </div>
    `;
  }

  function renderSingleItemCard(item) {
    return `
      <div class="card">
        <div class="form-group">
          <label class="form-label">Название</label>
          <input class="input" id="item-label-${item.id}" value="${escHtml(item.label)}">
        </div>
        <div class="form-group">
          <label class="form-label">Содержимое</label>
          <div class="contents-list" id="contents-${item.id}">
            ${(item.contents || []).map((c, i) => contentItemHTML(item.id, i, c)).join('')}
          </div>
          <button class="btn-icon add" onclick="AdminApp.addContent('${item.id}')">+</button>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" onclick="AdminApp.saveItem('${item.id}')">Сохранить</button>
        </div>
      </div>
    `;
  }

  function contentItemHTML(parentId, index, value) {
    return `
      <div class="content-item" id="ci-${parentId}-${index}">
        <input class="input" value="${escHtml(value)}" data-parent="${parentId}" data-idx="${index}">
        <button class="btn-icon" onclick="AdminApp.removeContent('${parentId}',${index})">✕</button>
      </div>
    `;
  }

  function getContents(parentId) {
    return Array.from(document.querySelectorAll(`#contents-${parentId} input`))
      .map(i => i.value.trim()).filter(Boolean);
  }

  window.AdminApp.saveItem = async function (itemId) {
    const item = data.items.find(i => i.id === itemId);
    if (!item) return;
    const labelEl = document.getElementById(`item-label-${itemId}`);
    if (labelEl) item.label = labelEl.value.trim();
    item.contents = getContents(itemId);
    await save();
  };

  window.AdminApp.saveBox = async function (shelfId, boxId) {
    const shelf = data.items.find(i => i.id === shelfId);
    if (!shelf) return;
    const box = (shelf.boxes || []).find(b => b.id === boxId);
    if (!box) return;
    const labelEl = document.getElementById(`box-label-${boxId}`);
    if (labelEl) box.label = labelEl.value.trim();
    box.contents = getContents(boxId);
    await save();
  };

  window.AdminApp.addContent = function (parentId) {
    const list = document.getElementById(`contents-${parentId}`);
    const idx = list.children.length;
    const div = document.createElement('div');
    div.innerHTML = contentItemHTML(parentId, idx, '');
    list.appendChild(div.firstElementChild);
  };

  window.AdminApp.removeContent = function (parentId, idx) {
    document.getElementById(`ci-${parentId}-${idx}`)?.remove();
    document.querySelectorAll(`#contents-${parentId} .content-item`).forEach((el, i) => {
      el.id = `ci-${parentId}-${i}`;
      el.querySelector('input').dataset.idx = i;
      el.querySelector('button').setAttribute('onclick', `AdminApp.removeContent('${parentId}',${i})`);
    });
  };

  window.AdminApp.addBox = async function (shelfId) {
    const shelf = data.items.find(i => i.id === shelfId);
    if (!shelf) return;
    const newBox = { id: `${shelfId}-box${Date.now()}`, label: 'Новая коробка', x: 50, y: 50, contents: [] };
    if (!shelf.boxes) shelf.boxes = [];
    shelf.boxes.push(newBox);
    await save();
    renderItemsTab(); renderDotsTab();
    showToast('Коробка добавлена');
  };

  window.AdminApp.deleteBox = async function (shelfId, boxId) {
    if (!confirm('Удалить коробку?')) return;
    const shelf = data.items.find(i => i.id === shelfId);
    if (shelf) shelf.boxes = (shelf.boxes || []).filter(b => b.id !== boxId);
    await save();
    renderItemsTab(); renderDotsTab();
  };

  // ===== TAB 3: DOTS =====
  function renderDotsTab() {
    const el = document.getElementById('tab-dots');
    el.innerHTML = `
      <div class="section">
        <div class="section-title">Точки на главном плане</div>
        <p class="dot-hint" style="margin-bottom:14px">Перетащите точки прямо на фото или введите координаты X/Y вручную (в % от размера изображения)</p>
        <div class="card">
          <div class="dot-canvas-wrap" id="main-dot-canvas">
            <img src="${escHtml(data.mainPhoto)}" alt="Главное фото" id="main-dot-img">
            ${data.items.map(item => dotCanvasPin(item, item.type)).join('')}
          </div>
          ${data.items.map(item => dotCoordRow(item)).join('')}
          <div class="btn-row">
            <button class="btn btn-primary" onclick="AdminApp.saveMainDots()">Сохранить все точки</button>
          </div>
        </div>
      </div>
      ${data.items.filter(i => i.type === 'shelf-multi').map(shelf => `
        <div class="section">
          <div class="section-title">Точки на полке: ${escHtml(shelf.label)}</div>
          <div class="card">
            <div class="dot-canvas-wrap" id="shelf-dot-canvas-${shelf.id}">
              <img src="${escHtml(shelf.photo || data.mainPhoto)}" alt="${escHtml(shelf.label)}">
              ${(shelf.boxes || []).map(box => dotCanvasPin(box, 'box', shelf.id)).join('')}
            </div>
            ${(shelf.boxes || []).map(box => dotCoordRow(box, shelf.id)).join('')}
            <div class="btn-row">
              <button class="btn btn-primary" onclick="AdminApp.saveShelfDots('${shelf.id}')">Сохранить точки полки</button>
            </div>
          </div>
        </div>
      `).join('')}
    `;
    document.querySelectorAll('.canvas-dot').forEach(dot => enableDotDrag(dot));
  }

  function dotCanvasPin(item, type, shelfId) {
    const colors = { item: 'var(--dot-single)', 'shelf-multi': 'var(--dot-multi)', box: 'var(--dot-box)' };
    const prefix = shelfId ? `shelf-dot-${shelfId}` : 'main-dot';
    return `<div class="canvas-dot" id="${prefix}-pin-${item.id}" data-id="${item.id}" data-shelf="${shelfId || ''}"
      style="left:${item.x}%;top:${item.y}%;background:${colors[type]}" title="${escHtml(item.label)}"></div>`;
  }

  function dotCoordRow(item, shelfId) {
    const prefix = shelfId ? `shelf-dot-${shelfId}` : 'main-dot';
    return `
      <div style="margin-top:10px;padding:10px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
        <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px">${escHtml(item.label)}</div>
        <div class="coords-row">
          <div class="coord-input-wrap">
            <span class="coord-label">X%</span>
            <input class="coord-input" id="${prefix}-x-${item.id}" type="number" min="0" max="100" step="0.1" value="${item.x}">
          </div>
          <div class="coord-input-wrap">
            <span class="coord-label">Y%</span>
            <input class="coord-input" id="${prefix}-y-${item.id}" type="number" min="0" max="100" step="0.1" value="${item.y}">
          </div>
        </div>
      </div>
    `;
  }

  function enableDotDrag(dot) {
    let dragging = false, startX, startY, origX, origY;
    const canvas = dot.closest('.dot-canvas-wrap');
    if (!canvas) return;

    function startDrag(cx, cy) {
      dragging = true;
      startX = cx; startY = cy;
      origX = parseFloat(dot.style.left);
      origY = parseFloat(dot.style.top);
    }

    function moveDrag(cx, cy) {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const newX = Math.max(0, Math.min(100, origX + ((cx - startX) / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, origY + ((cy - startY) / rect.height) * 100));
      dot.style.left = newX + '%';
      dot.style.top = newY + '%';
      const id = dot.dataset.id;
      const shelf = dot.dataset.shelf;
      const prefix = shelf ? `shelf-dot-${shelf}` : 'main-dot';
      const xEl = document.getElementById(`${prefix}-x-${id}`);
      const yEl = document.getElementById(`${prefix}-y-${id}`);
      if (xEl) xEl.value = newX.toFixed(1);
      if (yEl) yEl.value = newY.toFixed(1);
    }

    dot.addEventListener('mousedown', e => { startDrag(e.clientX, e.clientY); e.preventDefault(); });
    document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup', () => { dragging = false; });
    dot.addEventListener('touchstart', e => { startDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
    document.addEventListener('touchmove', e => { if (dragging) moveDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    document.addEventListener('touchend', () => { dragging = false; });
  }

  window.AdminApp.saveMainDots = async function () {
    data.items.forEach(item => {
      const xEl = document.getElementById(`main-dot-x-${item.id}`);
      const yEl = document.getElementById(`main-dot-y-${item.id}`);
      if (xEl) item.x = parseFloat(xEl.value) || item.x;
      if (yEl) item.y = parseFloat(yEl.value) || item.y;
    });
    await save();
  };

  window.AdminApp.saveShelfDots = async function (shelfId) {
    const shelf = data.items.find(i => i.id === shelfId);
    if (!shelf) return;
    (shelf.boxes || []).forEach(box => {
      const xEl = document.getElementById(`shelf-dot-${shelfId}-x-${box.id}`);
      const yEl = document.getElementById(`shelf-dot-${shelfId}-y-${box.id}`);
      if (xEl) box.x = parseFloat(xEl.value) || box.x;
      if (yEl) box.y = parseFloat(yEl.value) || box.y;
    });
    await save();
  };

  // Sync coord inputs → pins
  document.addEventListener('input', e => {
    if (!e.target.classList.contains('coord-input')) return;
    const match = e.target.id.match(/^(main-dot|shelf-dot-[^-]+(?:-[^-]+)*)-(x|y)-(.+)$/);
    if (!match) return;
    const [, prefix, axis, itemId] = match;
    const pin = document.getElementById(`${prefix}-pin-${itemId}`);
    if (pin) pin.style[axis === 'x' ? 'left' : 'top'] = e.target.value + '%';
  });

  window.AdminApp.resetAll = async function () {
    if (!confirm('Сбросить все данные к заводским настройкам?')) return;
    data = await window.StorageData.resetData();
    renderPhotosTab(); renderItemsTab(); renderDotsTab();
    showToast('Данные сброшены');
  };

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
