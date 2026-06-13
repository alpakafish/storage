// Viewer — handles navigation between screens and dot interactions
(function () {
  const state = {
    screen: 'main',
    currentShelf: null,
    data: null,
  };

  async function init() {
    showLoading(true);
    state.data = await window.StorageData.loadData();
    showLoading(false);
    renderMain();

    // Realtime updates — refresh current view when data changes
    window.StorageData.subscribeData(newData => {
      state.data = newData;
      if (state.screen === 'main') renderMain();
      else if (state.screen === 'shelf' && state.currentShelf) {
        const fresh = newData.items.find(i => i.id === state.currentShelf.id);
        if (fresh) renderShelf(fresh);
      }
    });
  }

  function showLoading(on) {
    const el = document.getElementById('loading');
    if (el) el.style.display = on ? 'flex' : 'none';
  }

  // ===== RENDER MAIN =====
  function renderMain() {
    state.screen = 'main';
    state.currentShelf = null;
    document.getElementById('screen-title').textContent = 'Кладовка — общий вид';
    document.getElementById('btn-back').classList.add('hidden');
    updateBreadcrumbs([{ label: 'Кладовка', active: true }]);

    const wrapper = document.getElementById('photo-wrapper');
    wrapper.innerHTML = '';

    const img = document.createElement('img');
    img.src = state.data.mainPhoto;
    img.alt = 'План кладовки';
    img.draggable = false;
    wrapper.appendChild(img);

    img.addEventListener('load', () => {
      placeDots(wrapper, state.data.items, item => {
        if (item.type === 'shelf-multi') renderShelf(item);
        else openModal(item.label, item.contents || []);
      });
    });
    if (img.complete) img.dispatchEvent(new Event('load'));

    updateLegend(['item', 'shelf-multi']);
  }

  // ===== RENDER SHELF =====
  function renderShelf(shelf) {
    state.screen = 'shelf';
    state.currentShelf = shelf;
    document.getElementById('screen-title').textContent = shelf.label;
    document.getElementById('btn-back').classList.remove('hidden');
    updateBreadcrumbs([
      { label: 'Кладовка', active: false, onClick: renderMain },
      { label: shelf.label, active: true }
    ]);

    const wrapper = document.getElementById('photo-wrapper');
    wrapper.innerHTML = '';

    const img = document.createElement('img');
    img.src = shelf.photo || state.data.mainPhoto;
    img.alt = shelf.label;
    img.draggable = false;
    wrapper.appendChild(img);

    img.addEventListener('load', () => {
      placeDots(wrapper, shelf.boxes || [], box => {
        openModal(box.label, box.contents || []);
      }, 'box');
    });
    if (img.complete) img.dispatchEvent(new Event('load'));

    updateLegend(['box']);
  }

  // ===== DOTS =====
  function placeDots(wrapper, items, onClick, forceType) {
    wrapper.querySelectorAll('.dot').forEach(d => d.remove());
    items.forEach(item => {
      const dot = document.createElement('button');
      dot.className = `dot type-${forceType || item.type}`;
      dot.title = item.label;
      dot.style.left = item.x + '%';
      dot.style.top = item.y + '%';
      dot.addEventListener('click', e => { e.stopPropagation(); onClick(item); });
      wrapper.appendChild(dot);
    });
  }

  // ===== MODAL =====
  let modalOverlay, modalTitle, modalList;

  function setupModal() {
    modalOverlay = document.getElementById('modal-overlay');
    modalTitle = document.getElementById('modal-title');
    modalList = document.getElementById('modal-list');
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  function openModal(title, contents) {
    modalTitle.textContent = title;
    modalList.innerHTML = '';
    if (!contents.length) {
      modalList.innerHTML = '<p class="empty">Список пуст</p>';
    } else {
      contents.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        modalList.appendChild(li);
      });
    }
    modalOverlay.classList.add('visible');
  }

  function closeModal() { modalOverlay.classList.remove('visible'); }

  // ===== BREADCRUMBS =====
  function updateBreadcrumbs(crumbs) {
    const el = document.getElementById('breadcrumbs');
    el.innerHTML = '';
    crumbs.forEach((crumb, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'sep'; sep.textContent = '›';
        el.appendChild(sep);
      }
      const span = document.createElement('span');
      span.textContent = crumb.label;
      span.className = crumb.active ? 'current' : 'crumb';
      if (!crumb.active) span.addEventListener('click', crumb.onClick);
      el.appendChild(span);
    });
  }

  // ===== LEGEND =====
  function updateLegend(types) {
    const map = {
      'item':        { color: 'var(--dot-single)', label: 'Предмет / полка (1 ряд) — нажмите для содержимого' },
      'shelf-multi': { color: 'var(--dot-multi)',  label: 'Полка с 2 рядами — нажмите для детального вида' },
      'box':         { color: 'var(--dot-box)',     label: 'Коробка — нажмите для содержимого' },
    };
    const el = document.getElementById('legend');
    el.innerHTML = '';
    types.forEach(type => {
      const { color, label } = map[type];
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-dot" style="background:${color}"></span><span>${label}</span>`;
      el.appendChild(item);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-back').addEventListener('click', renderMain);
    setupModal();
    init();
  });
})();
