/* =============================================
   HABIT TRACKER — script.js
   Vanilla JS · LocalStorage · No libraries
   Fitur: tambah, edit, hapus habit custom
   ============================================= */

// ---- Emoji pilihan cepat ----
const EMOJI_PRESETS = [
  '💧','📖','🏃','🌙','🧘','✍️','🥗','💊','🎯','🎸',
  '🧹','💻','📝','🚴','🏋️','🌿','🎨','🧠','💤','🌅',
  '🤸','📚','🍎','☕','🛁','🧘','🏊','🎵','🌞','❤️',
];

// ---- Motivations ----
const MOTIVATIONS = [
  'Konsisten lebih penting daripada sempurna.',
  'Sedikit demi sedikit menjadi bukit.',
  'Disiplin hari ini adalah hasil besok.',
  'Kebiasaan kecil menghasilkan perubahan besar.',
  'Mulai sekarang, bukan mulai sempurna.',
  'Setiap hari adalah kesempatan baru untuk berkembang.',
  'Kemajuan, bukan kesempurnaan yang dicari.',
  'Jangan berhenti karena lambat — berhenti karena berhenti.',
  'Bangun kebiasaan, bukan hanya niat.',
  'Orang sukses melakukan hal-hal yang orang biasa enggan lakukan.',
];

// ---- Habit bawaan (default) ----
const DEFAULT_HABITS = [
  { id: 1, emoji: '💧', name: 'Minum Air',        target: '8 gelas per hari',   isDefault: true },
  { id: 2, emoji: '📖', name: 'Membaca',           target: '30 menit per hari',  isDefault: true },
  { id: 3, emoji: '🏃', name: 'Olahraga',          target: '20 menit per hari',  isDefault: true },
  { id: 4, emoji: '🌙', name: 'Tidur Tepat Waktu', target: 'Sebelum jam 22.00',  isDefault: true },
];

// ---- Helpers ----
const todayKey   = () => new Date().toISOString().slice(0, 10);
const monthNames = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];
const weekdays   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d} ${monthNames[+m - 1]} ${y}`;
};

// ---- State modal ----
let modalMode     = 'add';   // 'add' | 'edit'
let editingId     = null;
let selectedEmoji = '⭐';
let calendarDate  = new Date();

// =============================================
// LOCAL STORAGE
// =============================================
function getAllHabits() {
  const custom = JSON.parse(localStorage.getItem('habit_custom') || '[]');
  return [...DEFAULT_HABITS, ...custom];
}
function getCustomHabits() {
  return JSON.parse(localStorage.getItem('habit_custom') || '[]');
}
function saveCustomHabits(arr) {
  localStorage.setItem('habit_custom', JSON.stringify(arr));
}
function getChecked(dateKey) {
  return JSON.parse(localStorage.getItem(`habits_${dateKey}`) || '[]');
}
function setChecked(dateKey, arr) {
  localStorage.setItem(`habits_${dateKey}`, JSON.stringify(arr));
}
function getHistory() {
  return JSON.parse(localStorage.getItem('habit_history') || '{}');
}
function saveHistory(dateKey, checkedIds) {
  const h = getHistory();
  h[dateKey] = checkedIds;
  localStorage.setItem('habit_history', JSON.stringify(h));
}
function getTheme()      { return localStorage.getItem('habit_theme') || 'light'; }
function saveTheme(t)    { localStorage.setItem('habit_theme', t); }
function getStreak()     { return parseInt(localStorage.getItem('habit_streak') || '0', 10); }
function setStreak(n)    { localStorage.setItem('habit_streak', String(n)); }
function getLastComplete(){ return localStorage.getItem('habit_last_complete') || ''; }
function setLastComplete(d){ localStorage.setItem('habit_last_complete', d); }

// ---- Generate unique ID ----
function genId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getTheme());
  initHeader();
  initMotivation();
  renderHabits();
  renderCalendar();
  renderHistory();
  bindNav();
  bindSidebar();
  bindThemeToggle();
  bindReset();
  bindModalOpen();
  buildEmojiGrid();
});

// =============================================
// HEADER
// =============================================
function initHeader() {
  const now  = new Date();
  const hour = now.getHours();
  let greeting = 'Selamat datang kembali.';
  if      (hour < 11) greeting = 'Selamat pagi! Mulai harimu dengan semangat.';
  else if (hour < 15) greeting = 'Selamat siang! Jangan lupa istirahat sejenak.';
  else if (hour < 18) greeting = 'Selamat sore! Tetap semangat menyelesaikan target.';
  else                greeting = 'Selamat malam! Jangan lupa cek target harimu.';

  document.getElementById('greetingText').textContent   = greeting;
  document.getElementById('dateDay').textContent        = String(now.getDate()).padStart(2,'0');
  document.getElementById('dateMonthYear').textContent  = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById('dateWeekday').textContent    = weekdays[now.getDay()];
}

// =============================================
// MOTIVATION
// =============================================
function initMotivation() {
  const idx = Math.floor(Math.random() * MOTIVATIONS.length);
  document.getElementById('motivationText').textContent = MOTIVATIONS[idx];
}

// =============================================
// RENDER HABITS
// =============================================
function renderHabits() {
  const list    = document.getElementById('habitList');
  const today   = todayKey();
  const checked = getChecked(today);
  const habits  = getAllHabits();

  list.innerHTML = '';

  habits.forEach(habit => {
    const done = checked.includes(habit.id);
    const card = document.createElement('div');
    card.className = `habit-card${done ? ' done' : ''}`;
    card.dataset.id = habit.id;

    card.innerHTML = `
      <div class="habit-check">
        <span class="habit-check-icon">✓</span>
      </div>
      <div class="habit-emoji">${habit.emoji}</div>
      <div class="habit-info">
        <div class="habit-name">${escHtml(habit.name)}</div>
        <div class="habit-target">Target: ${escHtml(habit.target)}</div>
      </div>
      <div class="habit-right">
        <span class="habit-status">${done ? '✓ Selesai' : 'Belum'}</span>
        <div class="habit-actions">
          <button class="habit-action-btn edit"
                  title="Edit habit"
                  data-id="${habit.id}">✎</button>
          ${habit.isDefault
            ? `<button class="habit-action-btn lock" title="Habit bawaan tidak bisa dihapus" disabled>🔒</button>`
            : `<button class="habit-action-btn delete" title="Hapus habit" data-id="${habit.id}">✕</button>`
          }
        </div>
      </div>
    `;

    // Toggle selesai (klik area utama, bukan tombol aksi)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.habit-actions')) return;
      toggleHabit(habit.id);
    });

    // Edit
    card.querySelector('.habit-action-btn.edit').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(habit.id);
    });

    // Delete (hanya custom)
    if (!habit.isDefault) {
      card.querySelector('.habit-action-btn.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeleteHabit(habit.id, habit.name);
      });
    }

    list.appendChild(card);
  });

  updateStats(checked, habits.length);
}

// =============================================
// TOGGLE HABIT
// =============================================
function toggleHabit(id) {
  const today   = todayKey();
  const checked = getChecked(today);
  const idx     = checked.indexOf(id);

  if (idx === -1) checked.push(id);
  else checked.splice(idx, 1);

  setChecked(today, checked);
  saveHistory(today, checked);

  // Update card tanpa re-render semua
  const card = document.querySelector(`.habit-card[data-id="${id}"]`);
  if (card) {
    const done = checked.includes(id);
    card.classList.toggle('done', done);
    card.querySelector('.habit-status').textContent = done ? '✓ Selesai' : 'Belum';
  }

  updateStats(checked, getAllHabits().length);
  checkStreak(checked);
  renderHistory();
}

// =============================================
// STATS & PROGRESS
// =============================================
function updateStats(checked, total) {
  const done = checked.length;
  const pct  = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('statTotal').textContent    = total;
  document.getElementById('statDone').textContent     = done;
  document.getElementById('statProgress').textContent = `${pct}%`;
  document.getElementById('statStreak').textContent   = getStreak();
  document.getElementById('progressPct').textContent  = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;

  if (done > 0 && done === total) {
    showToast('🎉 Hebat! Semua target hari ini berhasil diselesaikan!');
  }
}

// =============================================
// STREAK
// =============================================
function checkStreak(checkedToday) {
  const habits = getAllHabits();
  if (checkedToday.length !== habits.length) return;

  const today    = todayKey();
  const lastDate = getLastComplete();
  if (lastDate === today) return;

  let streak = getStreak();
  if (lastDate) {
    const diff = Math.round((new Date(today) - new Date(lastDate)) / 86400000);
    streak = diff === 1 ? streak + 1 : 1;
  } else {
    streak = 1;
  }

  setStreak(streak);
  setLastComplete(today);
  document.getElementById('statStreak').textContent = streak;
}

// =============================================
// RESET
// =============================================
function bindReset() {
  document.getElementById('btnReset').addEventListener('click', () => {
    showConfirm(
      'Reset Hari Ini',
      'Semua checklist hari ini akan dihapus. Yakin ingin mereset?',
      () => {
        const today = todayKey();
        setChecked(today, []);
        saveHistory(today, []);
        renderHabits();
        renderHistory();
        showToast('↺ Semua habit hari ini telah direset.');
      }
    );
  });
}

// =============================================
// MODAL — BUKA / TUTUP
// =============================================
function bindModalOpen() {
  document.getElementById('btnAdd').addEventListener('click', openAddModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalSave').addEventListener('click', saveHabit);

  // Tutup modal klik luar
  document.getElementById('habitModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('habitModal')) closeModal();
  });

  // Real-time validation
  document.getElementById('habitName').addEventListener('input', () => {
    clearError('habitName', 'habitNameHint');
  });
  document.getElementById('habitTarget').addEventListener('input', () => {
    clearError('habitTarget', 'habitTargetHint');
  });

  // Emoji custom input: sync selection
  document.getElementById('emojiCustom').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      selectedEmoji = val;
      // Hapus semua selected di grid
      document.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected'));
    }
  });
}

function openAddModal() {
  modalMode    = 'add';
  editingId    = null;
  selectedEmoji = '⭐';

  document.getElementById('modalTitle').textContent    = 'Tambah Habit Baru';
  document.getElementById('modalSave').textContent     = 'Simpan';
  document.getElementById('habitName').value           = '';
  document.getElementById('habitTarget').value         = '';
  document.getElementById('emojiCustom').value         = '';
  document.getElementById('habitNameHint').textContent = '';
  document.getElementById('habitTargetHint').textContent = '';

  resetEmojiSelection('⭐');
  showModal();
}

function openEditModal(id) {
  const habit = getAllHabits().find(h => h.id === id);
  if (!habit) return;

  modalMode     = 'edit';
  editingId     = id;
  selectedEmoji = habit.emoji;

  document.getElementById('modalTitle').textContent      = 'Edit Habit';
  document.getElementById('modalSave').textContent       = 'Simpan Perubahan';
  document.getElementById('habitName').value             = habit.name;
  document.getElementById('habitTarget').value           = habit.target;
  document.getElementById('habitNameHint').textContent   = '';
  document.getElementById('habitTargetHint').textContent = '';

  // Jika emoji ada di preset, pilih; kalau tidak, isi di input custom
  const presetMatch = EMOJI_PRESETS.includes(habit.emoji);
  if (presetMatch) {
    document.getElementById('emojiCustom').value = '';
    resetEmojiSelection(habit.emoji);
  } else {
    document.getElementById('emojiCustom').value = habit.emoji;
    resetEmojiSelection(null);
  }

  showModal();
}

function showModal() {
  document.getElementById('habitModal').classList.add('show');
  setTimeout(() => document.getElementById('habitName').focus(), 150);
}
function closeModal() {
  document.getElementById('habitModal').classList.remove('show');
}

// =============================================
// EMOJI GRID
// =============================================
function buildEmojiGrid() {
  const grid = document.getElementById('emojiGrid');
  grid.innerHTML = '';
  EMOJI_PRESETS.forEach(em => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-option';
    btn.textContent = em;
    btn.title = em;
    btn.addEventListener('click', () => {
      selectedEmoji = em;
      document.getElementById('emojiCustom').value = '';
      resetEmojiSelection(em);
    });
    grid.appendChild(btn);
  });
  // Default terpilih
  resetEmojiSelection('⭐');
}

function resetEmojiSelection(target) {
  document.querySelectorAll('.emoji-option').forEach(btn => {
    btn.classList.toggle('selected', btn.textContent === target);
  });
}

// =============================================
// SIMPAN HABIT (TAMBAH / EDIT)
// =============================================
function saveHabit() {
  const nameVal   = document.getElementById('habitName').value.trim();
  const targetVal = document.getElementById('habitTarget').value.trim();
  const customEm  = document.getElementById('emojiCustom').value.trim();

  // Pakai emoji custom jika diisi, kalau tidak pakai selectedEmoji
  const finalEmoji = customEm || selectedEmoji || '⭐';

  // Validasi
  let valid = true;
  if (!nameVal) {
    showError('habitName', 'habitNameHint', 'Nama habit tidak boleh kosong.');
    valid = false;
  }
  if (!targetVal) {
    showError('habitTarget', 'habitTargetHint', 'Target tidak boleh kosong.');
    valid = false;
  }
  if (!valid) return;

  const customs = getCustomHabits();

  if (modalMode === 'add') {
    // Cek duplikasi nama (case-insensitive)
    const allNames = getAllHabits().map(h => h.name.toLowerCase());
    if (allNames.includes(nameVal.toLowerCase())) {
      showError('habitName', 'habitNameHint', 'Nama habit sudah ada.');
      return;
    }

    const newHabit = {
      id:        genId(),
      emoji:     finalEmoji,
      name:      nameVal,
      target:    targetVal,
      isDefault: false,
    };
    customs.push(newHabit);
    saveCustomHabits(customs);
    showToast(`✅ Habit "${nameVal}" berhasil ditambahkan!`);

  } else if (modalMode === 'edit') {
    // Apakah default atau custom?
    const defIdx = DEFAULT_HABITS.findIndex(h => h.id === editingId);
    if (defIdx !== -1) {
      // Edit habit default: simpan override di localStorage
      const overrides = JSON.parse(localStorage.getItem('habit_overrides') || '{}');
      overrides[editingId] = { emoji: finalEmoji, name: nameVal, target: targetVal };
      localStorage.setItem('habit_overrides', JSON.stringify(overrides));
    } else {
      // Edit habit custom
      const idx = customs.findIndex(h => h.id === editingId);
      if (idx !== -1) {
        customs[idx].emoji  = finalEmoji;
        customs[idx].name   = nameVal;
        customs[idx].target = targetVal;
        saveCustomHabits(customs);
      }
    }
    showToast(`✏️ Habit "${nameVal}" berhasil diperbarui!`);
  }

  closeModal();
  renderHabits();
  renderHistory();
}

// =============================================
// HAPUS HABIT CUSTOM
// =============================================
function confirmDeleteHabit(id, name) {
  showConfirm(
    'Hapus Habit',
    `Yakin ingin menghapus habit "<strong>${escHtml(name)}</strong>"? Data checklist habit ini juga akan dihapus dari riwayat.`,
    () => deleteHabit(id, name)
  );
}

function deleteHabit(id, name) {
  // Hapus dari daftar custom
  const customs = getCustomHabits().filter(h => h.id !== id);
  saveCustomHabits(customs);

  // Hapus dari semua checklist tersimpan
  const history = getHistory();
  Object.keys(history).forEach(dateKey => {
    history[dateKey] = history[dateKey].filter(hid => hid !== id);
    // Sinkron juga checked hari ini
    setChecked(dateKey, history[dateKey]);
  });
  localStorage.setItem('habit_history', JSON.stringify(history));

  showToast(`🗑️ Habit "${name}" telah dihapus.`);
  renderHabits();
  renderHistory();
  renderCalendar();
}

// =============================================
// OVERRIDE UNTUK HABIT DEFAULT (edit nama/emoji/target)
// =============================================
// getAllHabits() perlu memperhitungkan overrides
function getAllHabitsWithOverrides() {
  const overrides = JSON.parse(localStorage.getItem('habit_overrides') || '{}');
  const defaults  = DEFAULT_HABITS.map(h => {
    if (overrides[h.id]) {
      return { ...h, ...overrides[h.id] };
    }
    return h;
  });
  const custom = getCustomHabits();
  return [...defaults, ...custom];
}

// Override getAllHabits agar pakai versi dengan overrides
// (redefine di atas agar seluruh kode pakai ini)
// Kita patch di sini:
window._getAllHabits = window.getAllHabits;

// =============================================
// CALENDAR
// =============================================
function renderCalendar() {
  const y       = calendarDate.getFullYear();
  const m       = calendarDate.getMonth();
  const grid    = document.getElementById('calGrid');
  const history = getHistory();
  const todayStr = todayKey();
  const habits  = getAllHabitsWithOverrides();

  document.getElementById('calTitle').textContent = `${monthNames[m]} ${y}`;
  grid.innerHTML = '';

  const firstDay    = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-cell empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso  = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    cell.textContent = d;
    cell.dataset.iso  = iso;

    if (iso === todayStr) cell.classList.add('today');

    const checked = history[iso] || [];
    if (checked.length > 0) {
      cell.classList.add('has-data');
      if (checked.length < habits.length) cell.classList.add('partial');
    }

    cell.addEventListener('click', () => showCalDetail(iso));
    grid.appendChild(cell);
  }

  document.getElementById('prevMonth').onclick = () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  };
  document.getElementById('nextMonth').onclick = () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  };
}

function showCalDetail(iso) {
  document.querySelectorAll('.cal-cell.selected').forEach(c => c.classList.remove('selected'));
  const cell = document.querySelector(`.cal-cell[data-iso="${iso}"]`);
  if (cell) cell.classList.add('selected');

  const history = getHistory();
  const detail  = document.getElementById('calDetail');
  const checked = history[iso] || [];
  const habits  = getAllHabitsWithOverrides();
  const pct     = habits.length > 0 ? Math.round((checked.length / habits.length) * 100) : 0;

  if (checked.length === 0) {
    detail.innerHTML = `
      <p class="cal-detail-title">${fmtDate(iso)}</p>
      <p class="cal-detail-empty">Tidak ada data habit untuk tanggal ini.</p>
    `;
    return;
  }

  const habitsHTML = habits.map(h => {
    const done = checked.includes(h.id);
    return `<div class="cal-habit-item ${done ? 'done' : ''}">
      ${done ? '✓' : '○'} ${h.emoji} ${escHtml(h.name)}
    </div>`;
  }).join('');

  detail.innerHTML = `
    <p class="cal-detail-title">${fmtDate(iso)}</p>
    <div class="cal-detail-progress">
      <span class="cal-detail-pct">${pct}%</span>
      <span class="cal-detail-label">selesai (${checked.length}/${habits.length})</span>
    </div>
    <div class="cal-detail-habits">${habitsHTML}</div>
  `;
}

// =============================================
// HISTORY
// =============================================
function renderHistory() {
  const list    = document.getElementById('historyList');
  const history = getHistory();
  const habits  = getAllHabitsWithOverrides();
  const keys    = Object.keys(history).sort((a, b) => b.localeCompare(a));

  list.innerHTML = '';

  const validEntries = keys.filter(iso => (history[iso] || []).length > 0);

  if (validEntries.length === 0) {
    list.innerHTML = '<div class="history-empty">📭 Belum ada riwayat kebiasaan.</div>';
    return;
  }

  validEntries.forEach(iso => {
    const checked  = history[iso] || [];
    const pct      = habits.length > 0 ? Math.round((checked.length / habits.length) * 100) : 0;
    const complete = checked.length >= habits.length;

    const badgesHTML = habits.map(h => {
      const done = checked.includes(h.id);
      return `<span class="habit-badge ${done ? 'done' : 'undone'}">
        ${done ? '✓' : '✗'} ${escHtml(h.name)}
      </span>`;
    }).join('');

    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-top">
        <span class="history-date">${fmtDate(iso)}</span>
        <span class="history-badge ${complete ? 'complete' : 'partial'}">
          ${complete ? '🌟 Sempurna' : `${pct}% Selesai`}
        </span>
      </div>
      <div class="history-track">
        <div class="history-fill" style="width: ${pct}%"></div>
      </div>
      <div class="history-badges">${badgesHTML}</div>
    `;
    list.appendChild(card);
  });
}

// =============================================
// NAVIGATION
// =============================================
function bindNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const target = item.dataset.section;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${target}`).classList.add('active');
      if (target === 'calendar') renderCalendar();
      if (target === 'history')  renderHistory();
      closeSidebar();
    });
  });
}

// =============================================
// SIDEBAR MOBILE
// =============================================
function bindSidebar() {
  document.getElementById('hamburger').addEventListener('click', toggleSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// =============================================
// THEME
// =============================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const dark = theme === 'dark';
  document.getElementById('themeIcon').textContent       = dark ? '☀️' : '🌙';
  document.getElementById('themeLabel').textContent      = dark ? 'Light Mode' : 'Dark Mode';
  document.getElementById('themeIconMobile').textContent = dark ? '☀️' : '🌙';
}
function bindThemeToggle() {
  const handler = () => {
    const cur  = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    applyTheme(next);
  };
  document.getElementById('themeToggle').addEventListener('click', handler);
  document.getElementById('themeToggleMobile').addEventListener('click', handler);
}

// =============================================
// TOAST
// =============================================
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}

// =============================================
// CONFIRM DIALOG
// =============================================
function showConfirm(title, message, onConfirm) {
  const existing = document.getElementById('confirmDialog');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.id = 'confirmDialog';
  overlay.innerHTML = `
    <div class="dialog-box">
      <div class="dialog-title">${title}</div>
      <div class="dialog-message">${message}</div>
      <div class="dialog-actions">
        <button class="dialog-btn cancel" id="dialogCancel">Batal</button>
        <button class="dialog-btn confirm" id="dialogConfirm">Hapus</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 250);
  };
  document.getElementById('dialogCancel').addEventListener('click', close);
  document.getElementById('dialogConfirm').addEventListener('click', () => { close(); onConfirm(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

// =============================================
// FORM VALIDATION HELPERS
// =============================================
function showError(inputId, hintId, msg) {
  document.getElementById(inputId).classList.add('error');
  document.getElementById(hintId).textContent = msg;
}
function clearError(inputId, hintId) {
  document.getElementById(inputId).classList.remove('error');
  document.getElementById(hintId).textContent = '';
}

// =============================================
// XSS PREVENTION
// =============================================
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =============================================
// PATCH getAllHabits → pakai versi dengan overrides
// =============================================
function getAllHabits() {
  return getAllHabitsWithOverrides();
}

