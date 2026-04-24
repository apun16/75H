const TASKS = [
  { id: 'water',    emoji: '💧', label: '1 Evian bottle (1.5 L)' },
  { id: 'run',      emoji: '🏃', label: '7 km run (4–5 mph)' },
  { id: 'workout',  emoji: '💪', label: 'abs + legs (30 min)' },
  { id: 'leetcode', emoji: '💻', label: '1 LeetCode problem' },
  { id: 'diet',     emoji: '🍎', label: 'no sugar + no salty food' },
  { id: 'reading',  emoji: '📖', label: '1 chapter notes + practice' },
];

const SWATCHES = [
  { bg: '#F5EDE0', text: '#7A5230' },
  { bg: '#E0EDE5', text: '#2E6B4A' },
  { bg: '#EDE0F0', text: '#6B3580' },
  { bg: '#EDE8D8', text: '#6B5A2E' },
  { bg: '#D8E8ED', text: '#2E5A6B' },
  { bg: '#F0E0E8', text: '#7A2E50' },
  { bg: '#F5F0E0', text: '#6B6020' },
  { bg: '#E0EDE8', text: '#206B58' },
];

function freshState() {
  const days = Array.from({ length: 75 }, (_, i) => ({
    id: i + 1,
    tasks: Object.fromEntries(TASKS.map(t => [t.id, false])),
    completedAt: null,
  }));
  return {
    startDate: null,
    days,
    moodboard: { manifestation: '', items: [] },
  };
}

function load() {
  try {
    const raw = localStorage.getItem('75hard-v2');
    if (raw) return JSON.parse(raw);
  } catch { }
  return freshState();
}

function save() {
  try {
    localStorage.setItem('75hard-v2', JSON.stringify(state));
    return true;
  } catch {
    toast('could not save — storage may be full or disabled', 5000);
    return false;
  }
}

let state = load();

function tasksDone(day) {
  return TASKS.filter(t => day.tasks[t.id]).length;
}

function isComplete(day) {
  return tasksDone(day) === TASKS.length;
}

function enrichedDays() {
  let seenCurrent = false;
  return state.days.map(day => {
    let status;
    if (isComplete(day)) {
      status = 'complete';
    } else if (!seenCurrent) {
      status = 'current';
      seenCurrent = true;
    } else {
      status = 'ready';
    }
    return { ...day, status, done: tasksDone(day) };
  });
}

function completedCount() {
  return state.days.filter(isComplete).length;
}

function currentStreak() {
  let streak = 0;
  for (let i = 0; i < state.days.length; i++) {
    if (isComplete(state.days[i])) streak++;
    else break;
  }
  return streak;
}

function dayDate(id) {
  if (!state.startDate) return null;
  const d = new Date(state.startDate + 'T00:00:00');
  d.setDate(d.getDate() + id - 1);
  return d;
}

function fmt(date, opts) {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
}

function render() {
  renderSidebar();
  renderActiveView();
}

function renderSidebar() {
  const done = completedCount();
  const streak = currentStreak();
  const pct = done / 75;
  const circ = 314.16;

  document.getElementById('ringFill').style.strokeDashoffset = circ - circ * pct;
  document.getElementById('ringNum').textContent = done;
  document.getElementById('streakLabel').textContent =
    streak === 0 ? 'start your streak' : `${streak} day streak 🔥`;

  document.getElementById('statDone').textContent = done;
  document.getElementById('statLeft').textContent = 75 - done;

  if (state.startDate) {
    const start = new Date(state.startDate + 'T00:00:00');
    const end = new Date(state.startDate + 'T00:00:00');
    end.setDate(end.getDate() + 74);
    document.getElementById('statStart').textContent = fmt(start, { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('statEnd').textContent = fmt(end, { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('startDateInput').value = state.startDate;
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayEl = document.getElementById('todayStr');
  if (todayEl) todayEl.textContent = `today is ${todayStr}`;
}

function renderActiveView() {
  const active = document.querySelector('.nav-link.active');
  if (active) renderView(active.dataset.view);
}

function renderView(name) {
  switch (name) {
    case 'board':     renderBoard(); break;
    case 'data':      renderData(); break;
    case 'upcoming':  renderUpcoming(); break;
    case 'complete':  renderComplete(); break;
    case 'moodboard': renderMoodboard(); break;
  }
}

function renderBoard() {
  fillGrid('boardGrid', enrichedDays());
}

function renderUpcoming() {
  const days = enrichedDays().filter(d => d.status === 'ready');
  fillGrid('upcomingGrid', days, '🌿', 'All caught up');
}

function renderComplete() {
  const days = enrichedDays().filter(d => d.status === 'complete');
  fillGrid('completeGrid', days, '✨', 'No completed days yet :(');
}

function fillGrid(id, days, emptyIcon, emptyMsg) {
  const grid = document.getElementById(id);
  if (!grid) return;
  if (!days.length && emptyMsg) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">${emptyIcon}</div>
        <p>${emptyMsg}</p>
      </div>`;
    return;
  }
  grid.innerHTML = days.map(cardHTML).join('');
  grid.querySelectorAll('.day-card').forEach(el => {
    el.addEventListener('click', () => openDayModal(+el.dataset.id));
  });
}

function cardHTML(day) {
  const date = dayDate(day.id);
  const dateLabel = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const dots = TASKS.map(t => `<div class="dot ${day.tasks[t.id] ? 'on' : ''}"></div>`).join('');
  const pct = (day.done / TASKS.length) * 100;
  const badgeText = day.status === 'ready' ? 'ready' : day.status;

  return `
    <div class="day-card s-${day.status}" data-id="${day.id}">
      <div class="card-head">
        <div>
          <div class="card-day-label">day ${String(day.id).padStart(2, '0')}</div>
          ${dateLabel ? `<div class="card-date">${dateLabel}</div>` : ''}
        </div>
        <span class="card-badge">${badgeText}</span>
      </div>
      <div class="card-dots">${dots}</div>
      <div class="card-bar">
        <div class="card-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function renderData() {
  const days = enrichedDays();
  const tbody = document.getElementById('dataBody');
  if (!tbody) return;

  tbody.innerHTML = days.map(day => {
    const date = dayDate(day.id);
    const dateStr = date ? fmt(date, { month: 'short', day: 'numeric' }) : '—';
    const statusColor = {
      current:  `background:var(--gold);color:#1A1917`,
      complete: `background:var(--sage);color:#fff`,
      ready:    `background:var(--border-light);color:var(--text3)`,
    }[day.status];
    const badgeText = day.status === 'ready' ? 'ready' : day.status;
    const pct = (day.done / TASKS.length) * 100;

    return `
      <tr>
        <td><strong>day ${String(day.id).padStart(2, '0')}</strong></td>
        <td style="color:var(--text2)">${dateStr}</td>
        ${TASKS.map(t => `<td><div class="chk ${day.tasks[t.id] ? 'yes' : 'no'}">${day.tasks[t.id] ? '✓' : ''}</div></td>`).join('')}
        <td>
          <span style="font-size:10px;padding:3px 8px;border-radius:20px;font-weight:500;letter-spacing:.04em;${statusColor}">
            ${badgeText}
          </span>
        </td>
        <td>
          <div class="tbl-bar">
            <div class="tbl-bar-fill" style="width:${pct}%"></div>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function renderMoodboard() {
  const el = document.getElementById('mbStatement');
  if (el && !el.textContent.trim() && state.moodboard.manifestation) {
    el.textContent = state.moodboard.manifestation;
  }

  const grid = document.getElementById('mbGrid');
  if (!grid) return;

  const { items } = state.moodboard;
  if (!items.length) {
    grid.innerHTML = `<div class="mb-empty">add images and affirmations to build your vision board</div>`;
    return;
  }

  grid.innerHTML = items.map(mbItemHTML).join('');
  grid.querySelectorAll('.mb-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      state.moodboard.items = state.moodboard.items.filter(i => i.id !== btn.dataset.id);
      save();
      renderMoodboard();
    });
  });
}

function mbItemHTML(item) {
  if (item.type === 'image') {
    return `
      <div class="mb-item type-image">
        <img src="${esc(item.src)}" alt="${esc(item.caption || 'vision')}" loading="lazy" class="mb-img" />
        ${item.caption ? `<div class="mb-caption">${esc(item.caption)}</div>` : ''}
        <button type="button" class="mb-del" data-id="${item.id}" title="Remove">×</button>
      </div>`;
  }
  const c = item.color || SWATCHES[0];
  return `
    <div class="mb-item type-text" style="background:${c.bg}">
      <p class="mb-affirm" style="color:${c.text}">${esc(item.content)}</p>
      <button type="button" class="mb-del" data-id="${item.id}" title="Remove">×</button>
    </div>`;
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let activeDayId = null;

function openDayModal(id) {
  activeDayId = id;
  const days = enrichedDays();
  const day = days.find(d => d.id === id);
  const dayObj = state.days[id - 1];

  document.getElementById('mdTitle').textContent = `day ${String(id).padStart(2, '0')}`;

  const date = dayDate(id);
  document.getElementById('mdDate').textContent = date ? fmt(date) : '';

  const badge = document.getElementById('mdBadge');
  badge.textContent = day.status === 'ready' ? 'ready to start' : day.status;
  badge.className = `badge ${day.status}`;

  renderModalTasks(dayObj, day.status);
  syncCompleteBtn(dayObj);

  document.getElementById('dayOverlay').classList.add('open');
}

function renderModalTasks(dayObj, status) {
  const container = document.getElementById('mdTasks');
  container.innerHTML = TASKS.map(t => `
    <div class="task-row ${dayObj.tasks[t.id] ? 'checked' : ''}" data-task="${t.id}">
      <div class="task-chk">${dayObj.tasks[t.id] ? '✓' : ''}</div>
      <span class="task-emoji">${t.emoji}</span>
      <span class="task-text">${t.label}</span>
    </div>`).join('');

  container.querySelectorAll('.task-row').forEach(row => {
    row.addEventListener('click', () => toggleTask(activeDayId, row.dataset.task, row));
  });
}

function toggleTask(dayId, taskId, rowEl) {
  const dayObj = state.days[dayId - 1];
  dayObj.tasks[taskId] = !dayObj.tasks[taskId];
  save();

  const checked = dayObj.tasks[taskId];
  rowEl.classList.toggle('checked', checked);
  rowEl.querySelector('.task-chk').textContent = checked ? '✓' : '';

  syncCompleteBtn(dayObj);
  render();

  if (isComplete(dayObj)) {
    setTimeout(() => toast(`✦ day ${dayId} complete — you're unstoppable ✦`), 250);
  }
}

function syncCompleteBtn(dayObj) {
  const btn = document.getElementById('mdComplete');
  const all = isComplete(dayObj);
  btn.disabled = !all;
}

function closeDayModal() {
  document.getElementById('dayOverlay').classList.remove('open');
  activeDayId = null;
}

let addType = null;
let selSwatch = SWATCHES[0];
let uploadDataUrl = null;

function openAddModal(type) {
  addType = type;
  selSwatch = SWATCHES[0];
  uploadDataUrl = null;

  document.getElementById('addTitle').textContent = type === 'image' ? 'add image' : 'add affirmation';
  const body = document.getElementById('addBody');

  if (type === 'image') {
    body.innerHTML = `
      <div class="form-group">
        <label class="form-label">Image URL</label>
        <input id="fImgUrl" type="text" class="form-input" placeholder="https://…" spellcheck="false" />
      </div>
      <div class="form-group" style="margin-top:-4px">
        <label class="form-label" style="margin-bottom:6px">— or upload a file —</label>
        <input id="fImgFile" type="file" accept="image/*" class="form-input" style="padding:7px 10px;cursor:pointer" />
      </div>
      <div class="form-group">
        <label class="form-label">Caption (optional)</label>
        <input id="fImgCap" type="text" class="form-input" placeholder="add a caption…" />
      </div>`;

    document.getElementById('fImgFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { uploadDataUrl = ev.target.result; };
      reader.readAsDataURL(file);
    });

  } else {
    body.innerHTML = `
      <div class="form-group">
        <label class="form-label">Affirmation</label>
        <textarea id="fText" class="form-input form-textarea" placeholder="I am becoming the best version of myself…"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Background</label>
        <div class="color-swatches">
          ${SWATCHES.map((c, i) => `
            <div class="swatch ${i === 0 ? 'sel' : ''}"
                 style="background:${c.bg}" data-i="${i}"></div>
          `).join('')}
        </div>
      </div>`;

    body.querySelectorAll('.swatch').forEach(el => {
      el.addEventListener('click', () => {
        body.querySelectorAll('.swatch').forEach(s => s.classList.remove('sel'));
        el.classList.add('sel');
        selSwatch = SWATCHES[+el.dataset.i];
      });
    });
  }

  document.getElementById('addOverlay').classList.add('open');
}

function finishMoodItemAdd() {
  save();
  closeAddModal();
  renderMoodboard();
  toast('added to your vision board ✦');
}

function confirmAdd() {
  if (!addType) return;
  if (addType === 'image') {
    const fileInput = document.getElementById('fImgFile');
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (file) {
      const capEl = document.getElementById('fImgCap');
      const capVal = capEl && capEl.value ? capEl.value.trim() : '';
      const reader = new FileReader();
      reader.onload = () => {
        state.moodboard.items.push({
          id: uid(),
          type: 'image',
          src: reader.result,
          caption: capVal || undefined,
        });
        finishMoodItemAdd();
      };
      reader.onerror = () => toast('could not read that file');
      reader.readAsDataURL(file);
      return;
    }
    const urlEl = document.getElementById('fImgUrl');
    const url = urlEl && urlEl.value ? urlEl.value.trim() : '';
    const src = uploadDataUrl || url;
    if (!src) { toast('please add an image url or choose a file'); return; }
    const capEl = document.getElementById('fImgCap');
    const cap = capEl && capEl.value ? capEl.value.trim() : '';
    state.moodboard.items.push({ id: uid(), type: 'image', src, caption: cap || undefined });
    finishMoodItemAdd();
    return;
  }

  if (addType === 'text') {
    const ta = document.getElementById('fText');
    const content = ta && typeof ta.value === 'string' ? ta.value.trim() : '';
    if (!content) { toast('please write your affirmation'); return; }
    state.moodboard.items.push({ id: uid(), type: 'text', content, color: selSwatch });
    finishMoodItemAdd();
    return;
  }
}

function closeAddModal() {
  document.getElementById('addOverlay').classList.remove('open');
  addType = null;
  uploadDataUrl = null;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

let toastTimer;

function toast(msg, durationMs) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  const ms = durationMs ?? 3000;
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function init() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      link.classList.add('active');
      document.getElementById(`view-${link.dataset.view}`).classList.add('active');
      renderView(link.dataset.view);
    });
  });

  document.getElementById('startDateInput').addEventListener('change', e => {
    state.startDate = e.target.value || null;
    save();
    render();
  });

  document.getElementById('btnCompleteToday').addEventListener('click', () => {
    const days = enrichedDays();
    const cur = days.find(d => d.status === 'current');
    if (!cur) { toast('all 75 days done — you\'re legendary 🏆'); return; }
    TASKS.forEach(t => { state.days[cur.id - 1].tasks[t.id] = true; });
    save();
    render();
    toast(`✦ day ${cur.id} complete — keep going ✦`);
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Reset all progress? This cannot be undone.')) return;
    const fresh = freshState();
    fresh.startDate = state.startDate;
    fresh.moodboard = state.moodboard;
    state = fresh;
    save();
    render();
    toast('challenge reset — fresh start ✦');
  });

  document.getElementById('mdClose').addEventListener('click', closeDayModal);
  document.getElementById('dayOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDayModal();
  });

  document.getElementById('mdComplete').addEventListener('click', () => {
    if (!activeDayId) return;
    const dayObj = state.days[activeDayId - 1];
    if (!isComplete(dayObj)) return;
    closeDayModal();
    render();
    toast(`✦ day ${activeDayId} complete — you're unstoppable ✦`);
  });

  document.getElementById('btnAddImg').addEventListener('click', () => openAddModal('image'));
  document.getElementById('btnAddAffirm').addEventListener('click', () => openAddModal('text'));
  document.getElementById('addCancel').addEventListener('click', closeAddModal);
  document.getElementById('addOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAddModal();
  });
  document.getElementById('addConfirm').addEventListener('click', confirmAdd);

  const stmt = document.getElementById('mbStatement');
  stmt.addEventListener('blur', () => {
    state.moodboard.manifestation = stmt.textContent.trim();
    save();
  });
  stmt.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); stmt.blur(); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeDayModal();
      closeAddModal();
    }
  });

  render();
  requestAnimationFrame(() => requestAnimationFrame(() => renderSidebar()));
}

document.addEventListener('DOMContentLoaded', init);
