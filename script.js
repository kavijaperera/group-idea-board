/* ═══════════════════════════════════════════════
   UCSC Student Toolkit — script.js
═══════════════════════════════════════════════ */

// ── Color palette ─────────────────────────────
const COLOR_PALETTE = [
    '#8B0000','#3b6fff','#22c080','#f59e0b',
    '#a855f7','#ec4899','#14b8a6','#f97316',
    '#6366f1','#84cc16','#ef4444','#06b6d4',
];

// ── State ──────────────────────────────────────
const STORAGE_KEY_IDEAS   = 'ucsc-toolkit-ideas';
const STORAGE_KEY_MEMBERS = 'ucsc-toolkit-members';
const STORAGE_KEY_NEXTID  = 'ucsc-toolkit-nextid';
const STORAGE_KEY_STATS   = 'ucsc-toolkit-stats';

function loadFromStorage() {
    try {
        const savedIdeas = localStorage.getItem(STORAGE_KEY_IDEAS);
        const savedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS);
        const savedNextId = localStorage.getItem(STORAGE_KEY_NEXTID);
        const savedStats  = localStorage.getItem(STORAGE_KEY_STATS);
        return {
            ideas:   savedIdeas   ? JSON.parse(savedIdeas)   : null,
            members: savedMembers ? JSON.parse(savedMembers) : null,
            nextId:  savedNextId  ? parseInt(savedNextId)    : null,
            stats:   savedStats   ? JSON.parse(savedStats)   : null,
        };
    } catch(e) { return {}; }
}

function saveIdeas() {
    try { localStorage.setItem(STORAGE_KEY_IDEAS, JSON.stringify(ideas)); } catch(e) {}
    try { localStorage.setItem(STORAGE_KEY_NEXTID, String(nextId)); } catch(e) {}
}

function saveMembers() {
    try { localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members)); } catch(e) {}
}

function saveStats() {
    try { localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify({ totalMinutesStudied, totalSessions })); } catch(e) {}
}

const _saved = loadFromStorage();

const DEFAULT_IDEAS = [
    { id:1, text:'AI-Powered Resume Parser for Students', author:'Nimal', votes:4, voted:false, ts: Date.now()-1000*60*60*3 },
    { id:2, text:'Campus Food Delivery Web App',          author:'Sara',  votes:7, voted:false, ts: Date.now()-1000*60*60*2 },
    { id:3, text:'Peer-to-Peer Textbook Exchange',        author:'Alex',  votes:2, voted:false, ts: Date.now()-1000*60*30  },
];

let members = _saved.members || [];
let ideas   = _saved.ideas   || DEFAULT_IDEAS;
let nextId  = _saved.nextId  || 4;

let activeUser   = null;
let activeFilter = 'all';
let activeSort   = 'newest';
let darkMode     = false;

// Stats
let totalMinutesStudied = _saved.stats ? _saved.stats.totalMinutesStudied : 0;
let totalSessions       = _saved.stats ? _saved.stats.totalSessions       : 0;

if (!_saved.members) ['Nimal','Sara','Alex'].forEach(n => addMember(n, false));

// ── DOM: Navigation ───────────────────────────
const navBtns   = document.querySelectorAll('.nav-btn');
const pages     = document.querySelectorAll('.page');

// ── DOM: Idea Board ───────────────────────────
const nameScreen       = document.getElementById('name-screen');
const boardScreen      = document.getElementById('board-screen');
const nameInput        = document.getElementById('name-input');
const joinBtn          = document.getElementById('join-btn');
const nameError        = document.getElementById('name-error');
const existingMembers  = document.getElementById('existing-members');
const membersChips     = document.getElementById('members-chips');
const ideaList         = document.getElementById('idea-list');
const ideaInput        = document.getElementById('idea-text');
const addBtn           = document.getElementById('add-btn');
const ideaCount        = document.getElementById('idea-count');
const charCount        = document.getElementById('char-count');
const emptyState       = document.getElementById('empty-state');
const toast            = document.getElementById('toast');
const userAvatars      = document.getElementById('user-avatars');
const filterTabs       = document.getElementById('filter-tabs');
const activeUserChip   = document.getElementById('active-user-chip');
const activeUserAvatar = document.getElementById('active-user-avatar');
const activeUserName   = document.getElementById('active-user-name');
const addMemberBtn     = document.getElementById('add-member-btn');
const memberModal      = document.getElementById('member-modal');
const modalNameInput   = document.getElementById('modal-name-input');
const modalAddBtn      = document.getElementById('modal-add-btn');
const modalClose       = document.getElementById('modal-close');
const modalError       = document.getElementById('modal-error');
const sortBtns         = document.querySelectorAll('.sort-btn');

// ── DOM: Timer ────────────────────────────────
const timerDisplay      = document.getElementById('timer-display');
const timerSessionLabel = document.getElementById('timer-session-label');
const timerStartBtn     = document.getElementById('timer-start');
const timerPauseBtn     = document.getElementById('timer-pause');
const timerResetBtn     = document.getElementById('timer-reset');
const timerProgress     = document.getElementById('timer-progress');
const sessionCountEl    = document.getElementById('session-count');

// ── DOM: GPA ──────────────────────────────────
const gpaCoursesEl  = document.getElementById('gpa-courses');
const gpaAddRowBtn  = document.getElementById('gpa-add-row');
const gpaCalcBtn    = document.getElementById('gpa-calculate');
const gpaResult     = document.getElementById('gpa-result');
const gpaNumber     = document.getElementById('gpa-number');
const gpaLabelText  = document.getElementById('gpa-label-text');
const gpaBreakdown  = document.getElementById('gpa-breakdown');
const gpaError      = document.getElementById('gpa-error');

// ── DOM: Theme ────────────────────────────────
const toggleBtnNav = document.getElementById('theme-toggle-nav');

// ── DOM: Stats sidebar ────────────────────────
const statIdeas   = document.getElementById('stat-ideas');
const statSessions = document.getElementById('stat-sessions');
const statMinutes  = document.getElementById('stat-minutes');
const statGpa      = document.getElementById('stat-gpa');

/* ═══════════════════════════════════════════════
   PAGE NAVIGATION
═══════════════════════════════════════════════ */
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const pageId = 'page-' + btn.dataset.page;
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        pages.forEach(p => {
            if (p.id === pageId) {
                p.classList.add('active');
                p.classList.remove('hidden');
            } else {
                p.classList.remove('active');
                p.classList.add('hidden');
            }
        });
    });
});

/* ═══════════════════════════════════════════════
   DARK MODE
═══════════════════════════════════════════════ */
function applyTheme(dark) {
    darkMode = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('ucsc-toolkit-theme', dark ? 'dark' : 'light'); } catch(e) {}
}

function toggleTheme() {
    applyTheme(!darkMode);
    showToast(darkMode ? '🌙 Dark mode on' : '☀️ Light mode on');
}

try {
    const saved = localStorage.getItem('ucsc-toolkit-theme');
    if (saved === 'dark') applyTheme(true);
} catch(e) {}

toggleBtnNav.addEventListener('click', toggleTheme);

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function addMember(name, switchTo = true) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const already = members.find(m => m.name.toLowerCase() === trimmed.toLowerCase());
    if (already) { if (switchTo) setActiveUser(already); return true; }
    const color  = COLOR_PALETTE[members.length % COLOR_PALETTE.length];
    const member = { name: trimmed, color };
    members.push(member);
    saveMembers();
    if (switchTo) setActiveUser(member);
    return true;
}

function setActiveUser(member) {
    activeUser = member;
    activeUserAvatar.textContent      = member.name[0].toUpperCase();
    activeUserName.textContent        = member.name;
    activeUserChip.style.setProperty('--active-color', member.color);
    activeUserAvatar.style.background = member.color;
    renderAvatars();
    renderFilterTabs();
}

function timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function bumpCount() {
    ideaCount.classList.remove('bump');
    void ideaCount.offsetWidth;
    ideaCount.classList.add('bump');
}

function updateCount() {
    ideaCount.textContent = ideas.length;
    bumpCount();
    statIdeas.textContent = ideas.length;
}

function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getMemberColor(name) {
    const m = members.find(m => m.name.toLowerCase() === name.toLowerCase());
    return m ? m.color : '#888';
}

function updateSidebarStats() {
    statIdeas.textContent   = ideas.length;
    statSessions.textContent = totalSessions;
    statMinutes.textContent  = totalMinutesStudied;
}

/* ═══════════════════════════════════════════════
   IDEA BOARD
═══════════════════════════════════════════════ */

// Render Avatars
function renderAvatars() {
    userAvatars.innerHTML = '';
    members.forEach(member => {
        const btn = document.createElement('button');
        btn.className = 'avatar-btn' + (activeUser && member.name === activeUser.name ? ' active' : '');
        btn.dataset.name = member.name;
        btn.title        = member.name;
        btn.textContent  = member.name[0].toUpperCase();
        btn.style.setProperty('--user-color', member.color);
        if (activeUser && member.name === activeUser.name) {
            btn.style.background  = member.color;
            btn.style.borderColor = member.color;
        }
        btn.addEventListener('click', () => setActiveUser(member));
        userAvatars.appendChild(btn);
    });
}

// Render Filter Tabs
function renderFilterTabs() {
    filterTabs.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className      = 'filter-btn' + (activeFilter === 'all' ? ' active' : '');
    allBtn.dataset.filter = 'all';
    allBtn.textContent    = 'All';
    allBtn.addEventListener('click', () => setFilter('all'));
    filterTabs.appendChild(allBtn);

    const authorsWithIdeas = [...new Set(ideas.map(i => i.author))];
    members.filter(m => authorsWithIdeas.includes(m.name)).forEach(member => {
        const btn = document.createElement('button');
        btn.className     = 'filter-btn' + (activeFilter === member.name ? ' active' : '');
        btn.dataset.filter = member.name;
        btn.textContent   = member.name;
        btn.addEventListener('click', () => setFilter(member.name));
        filterTabs.appendChild(btn);
    });
}

// Render Ideas
function getFilteredSorted() {
    let list = activeFilter === 'all' ? [...ideas] : ideas.filter(i => i.author === activeFilter);
    if      (activeSort === 'newest') list.sort((a,b) => b.ts - a.ts);
    else if (activeSort === 'oldest') list.sort((a,b) => a.ts - b.ts);
    else if (activeSort === 'top')    list.sort((a,b) => b.votes - a.votes);
    return list;
}

function renderList() {
    const list = getFilteredSorted();
    ideaList.innerHTML = '';
    if (list.length === 0) { emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');

    list.forEach(idea => {
        const color = getMemberColor(idea.author);
        const li    = document.createElement('li');
        li.className  = 'idea-item';
        li.dataset.id = idea.id;
        li.style.setProperty('--item-color', color);

        li.innerHTML = `
            <div class="item-avatar" style="background:${color}">${escapeHTML(idea.author[0].toUpperCase())}</div>
            <div class="item-body">
                <div class="item-text">${escapeHTML(idea.text)}</div>
                <div class="item-meta">
                    <span class="item-author" style="color:${color}">${escapeHTML(idea.author)}</span>
                    <span class="item-time">${timeAgo(idea.ts)}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="vote-btn ${idea.voted ? 'voted' : ''}" data-id="${idea.id}" title="Upvote">
                    ${idea.voted ? '▲' : '△'}
                </button>
                <span class="vote-count">${idea.votes}</span>
                <button class="delete-btn" data-id="${idea.id}" title="Remove">✕</button>
            </div>
        `;
        ideaList.appendChild(li);
    });
}

// Name Entry
function showExistingMembers() {
    if (members.length === 0) { existingMembers.classList.add('hidden'); return; }
    existingMembers.classList.remove('hidden');
    membersChips.innerHTML = '';
    members.forEach(m => {
        const chip = document.createElement('button');
        chip.className = 'member-chip';
        chip.style.setProperty('--chip-color', m.color);
        chip.innerHTML = `<span class="chip-dot">${m.name[0].toUpperCase()}</span>${escapeHTML(m.name)}`;
        chip.addEventListener('click', () => joinAs(m.name));
        membersChips.appendChild(chip);
    });
}

function joinAs(name) {
    const trimmed = name.trim();
    if (!trimmed) { nameError.classList.remove('hidden'); return; }
    nameError.classList.add('hidden');
    addMember(trimmed, true);
    nameScreen.classList.add('hidden');
    boardScreen.classList.remove('hidden');
    updateCount();
    renderList();
}

joinBtn.addEventListener('click', () => joinAs(nameInput.value));
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') joinAs(nameInput.value); });
showExistingMembers();

// Add Member Modal
addMemberBtn.addEventListener('click', () => {
    memberModal.classList.remove('hidden');
    modalNameInput.value = '';
    modalError.classList.add('hidden');
    setTimeout(() => modalNameInput.focus(), 50);
});

modalClose.addEventListener('click', () => memberModal.classList.add('hidden'));
memberModal.addEventListener('click', e => { if (e.target === memberModal) memberModal.classList.add('hidden'); });

function doModalAdd() {
    const name = modalNameInput.value.trim();
    if (!name) { modalError.classList.remove('hidden'); return; }
    modalError.classList.add('hidden');
    const isNew = !members.find(m => m.name.toLowerCase() === name.toLowerCase());
    addMember(name, true);
    memberModal.classList.add('hidden');
    showToast(isNew ? `${name} joined the board! 👋` : `Switched to ${name}`);
    renderList();
}

modalAddBtn.addEventListener('click', doModalAdd);
modalNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doModalAdd(); });

// Add Idea
function addIdea() {
    if (!activeUser) { showToast('Please select a user first.'); return; }
    const text = ideaInput.value.trim();
    if (!text) {
        ideaInput.classList.add('shake');
        setTimeout(() => ideaInput.classList.remove('shake'), 400);
        ideaInput.focus();
        return;
    }
    // Duplicate check (case-insensitive)
    const duplicate = ideas.find(i => i.text.toLowerCase() === text.toLowerCase());
    if (duplicate) {
        ideaInput.classList.add('shake');
        setTimeout(() => ideaInput.classList.remove('shake'), 400);
        showToast('⚠️ This idea already exists!');
        ideaInput.focus();
        return;
    }
    ideas.unshift({ id: nextId++, text, author: activeUser.name, votes: 0, voted: false, ts: Date.now() });
    saveIdeas();
    ideaInput.value = '';
    charCount.textContent = '0 / 120';
    charCount.classList.remove('warn');
    updateCount();
    updateSidebarStats();
    if (activeFilter !== 'all' && activeFilter !== activeUser.name) setFilter('all');
    else { renderList(); renderFilterTabs(); }
    showToast('Idea added ✦');
}

addBtn.addEventListener('click', addIdea);
ideaInput.addEventListener('keydown', e => { if (e.key === 'Enter') addIdea(); });

// Vote & Delete
ideaList.addEventListener('click', e => {
    const voteBtn   = e.target.closest('.vote-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (voteBtn) {
        const id   = Number(voteBtn.dataset.id);
        const idea = ideas.find(i => i.id === id);
        if (!idea) return;
        idea.voted  = !idea.voted;
        idea.votes += idea.voted ? 1 : -1;
        saveIdeas();
        renderList();
        if (idea.voted) showToast('Voted! ▲');
    }

    if (deleteBtn) {
        const id = Number(deleteBtn.dataset.id);
        const li = ideaList.querySelector(`li[data-id="${id}"]`);
        if (li) {
            li.classList.add('removing');
            li.addEventListener('animationend', () => {
                ideas = ideas.filter(i => i.id !== id);
                saveIdeas();
                updateCount(); renderList(); renderFilterTabs(); updateSidebarStats();
            }, { once: true });
        }
    }
});

// Filter / Sort
function setFilter(filter) {
    activeFilter = filter;
    renderFilterTabs();
    renderList();
}

sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sortBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSort = btn.dataset.sort;
        renderList();
    });
});

// Char counter
ideaInput.addEventListener('input', () => {
    const len = ideaInput.value.length;
    charCount.textContent = `${len} / 120`;
    charCount.classList.toggle('warn', len > 100);
});

// Periodic refresh
setInterval(() => renderList(), 30000);

/* ═══════════════════════════════════════════════
   POMODORO STUDY TIMER
═══════════════════════════════════════════════ */
const POMODORO_SECONDS = 25 * 60;
let timerSecondsLeft = POMODORO_SECONDS;
let timerInterval    = null;
let timerRunning     = false;

function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateTimerUI() {
    timerDisplay.textContent = formatTime(timerSecondsLeft);
    const pct = (timerSecondsLeft / POMODORO_SECONDS) * 100;
    timerProgress.style.width = pct + '%';

    // Urgent styling in last 60s
    if (timerSecondsLeft <= 60 && timerRunning) {
        timerDisplay.classList.add('urgent');
    } else {
        timerDisplay.classList.remove('urgent');
    }
}

function startTimer() {
    if (timerRunning) return; // Prevent duplicate intervals
    timerRunning = true;
    timerStartBtn.disabled = true;
    timerPauseBtn.disabled = false;
    timerSessionLabel.textContent = '🔥 Stay focused!';

    timerInterval = setInterval(() => {
        timerSecondsLeft--;
        updateTimerUI();

        if (timerSecondsLeft <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            timerSecondsLeft = POMODORO_SECONDS;

            totalSessions++;
            totalMinutesStudied += 25;
            sessionCountEl.textContent = totalSessions;
            saveStats();
            updateSidebarStats();

            // Bell notification
            timerSessionLabel.textContent = '🎉 Session complete! Take a break.';
            timerDisplay.classList.remove('urgent');
            updateTimerUI();
            timerStartBtn.disabled = false;
            timerPauseBtn.disabled = true;

            showToast('⏰ Pomodoro complete! Great work.');

            // Try browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('UCSC Toolkit', { body: 'Pomodoro session complete! Time for a break 🎉' });
            }
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerRunning = false;
    timerStartBtn.disabled = false;
    timerPauseBtn.disabled = true;
    timerSessionLabel.textContent = '⏸ Paused';
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSecondsLeft = POMODORO_SECONDS;
    timerStartBtn.disabled = false;
    timerPauseBtn.disabled = true;
    timerSessionLabel.textContent = 'Ready to focus?';
    timerDisplay.classList.remove('urgent');
    updateTimerUI();
}

timerStartBtn.addEventListener('click', startTimer);
timerPauseBtn.addEventListener('click', pauseTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

updateTimerUI();

/* ═══════════════════════════════════════════════
   GPA CALCULATOR
═══════════════════════════════════════════════ */
const GRADE_POINTS = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F':  0.0
};

function getGpaLabel(gpa) {
    if (gpa >= 3.7) return '🏆 Dean\'s List';
    if (gpa >= 3.0) return '⭐ Good Standing';
    if (gpa >= 2.0) return '📚 Satisfactory';
    return '⚠️ Below Standard';
}

let gpaRowCount = 1;

function addGpaRow() {
    gpaRowCount++;
    const row = document.createElement('div');
    row.className     = 'gpa-row';
    row.dataset.row   = gpaRowCount;
    row.innerHTML = `
        <input class="gpa-input course-name" type="text" placeholder="Course name (optional)">
        <input class="gpa-input course-grade" type="text" placeholder="Grade (A, B+, C…)">
        <input class="gpa-input course-credits" type="number" placeholder="Credits" min="1" max="6">
        <button class="gpa-remove-btn" title="Remove">✕</button>
    `;
    row.querySelector('.gpa-remove-btn').addEventListener('click', () => {
        row.remove();
    });
    gpaCoursesEl.appendChild(row);
}

// Wire up initial remove button
document.querySelector('.gpa-remove-btn').addEventListener('click', function() {
    this.closest('.gpa-row').remove();
});

gpaAddRowBtn.addEventListener('click', addGpaRow);

gpaCalcBtn.addEventListener('click', () => {
    const rows = gpaCoursesEl.querySelectorAll('.gpa-row');
    let totalPoints  = 0;
    let totalCredits = 0;
    const breakdown  = [];
    let valid = false;

    rows.forEach(row => {
        const gradeRaw   = row.querySelector('.course-grade').value.trim().toUpperCase();
        const creditsRaw = parseFloat(row.querySelector('.course-credits').value);
        const name       = row.querySelector('.course-name').value.trim() || 'Course';

        if (!gradeRaw || isNaN(creditsRaw) || creditsRaw <= 0) return;
        const pts = GRADE_POINTS[gradeRaw];
        if (pts === undefined) return;

        valid = true;
        totalPoints  += pts * creditsRaw;
        totalCredits += creditsRaw;
        breakdown.push(`${name}: ${gradeRaw} (${creditsRaw} cr) → ${pts.toFixed(1)} pts`);
    });

    if (!valid || totalCredits === 0) {
        gpaError.classList.remove('hidden');
        gpaResult.classList.add('hidden');
        return;
    }

    gpaError.classList.add('hidden');

    const gpa = totalPoints / totalCredits;
    gpaNumber.textContent   = gpa.toFixed(2);
    gpaLabelText.textContent = getGpaLabel(gpa);
    gpaBreakdown.innerHTML  = breakdown.map(b => `<div>${b}</div>`).join('');
    gpaResult.classList.remove('hidden');

    // Update sidebar stat
    statGpa.textContent = gpa.toFixed(2);

    showToast(`GPA calculated: ${gpa.toFixed(2)} 🎓`);
});

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
updateSidebarStats();