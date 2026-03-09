// ── Color palette for auto-assigning member colors ─────────────────────────
const COLOR_PALETTE = [
    '#ff5c35', '#3b6fff', '#22c080', '#f59e0b',
    '#a855f7', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#84cc16', '#ef4444', '#06b6d4',
];

// ── State ───────────────────────────────────────────────────────────────────
let members     = [];   // [{ name, color }]
let ideas       = [
    { id: 1, text: 'Build a study planner',      author: 'Nimal', votes: 4, voted: false, ts: Date.now() - 1000*60*60*3 },
    { id: 2, text: 'Start a podcast',            author: 'Sara',  votes: 7, voted: false, ts: Date.now() - 1000*60*60*2 },
    { id: 3, text: 'Organize a coding workshop', author: 'Alex',  votes: 2, voted: false, ts: Date.now() - 1000*60*30  },
];

let nextId      = 4;
let activeUser  = null; // { name, color }
let activeFilter = 'all';
let activeSort  = 'newest';

// Seed initial authors as members
['Nimal','Sara','Alex'].forEach(name => addMember(name, false));

// ── Elements ─────────────────────────────────────────────────────────────────
const nameScreen        = document.getElementById('name-screen');
const boardScreen       = document.getElementById('board-screen');
const nameInput         = document.getElementById('name-input');
const joinBtn           = document.getElementById('join-btn');
const nameError         = document.getElementById('name-error');
const existingMembers   = document.getElementById('existing-members');
const membersChips      = document.getElementById('members-chips');

const ideaList          = document.getElementById('idea-list');
const ideaInput         = document.getElementById('idea-text');
const addBtn            = document.getElementById('add-btn');
const ideaCount         = document.getElementById('idea-count');
const charCount         = document.getElementById('char-count');
const emptyState        = document.getElementById('empty-state');
const toast             = document.getElementById('toast');
const userAvatars       = document.getElementById('user-avatars');
const filterTabs        = document.getElementById('filter-tabs');
const activeUserChip    = document.getElementById('active-user-chip');
const activeUserAvatar  = document.getElementById('active-user-avatar');
const activeUserName    = document.getElementById('active-user-name');
const addMemberBtn      = document.getElementById('add-member-btn');

const memberModal       = document.getElementById('member-modal');
const modalNameInput    = document.getElementById('modal-name-input');
const modalAddBtn       = document.getElementById('modal-add-btn');
const modalClose        = document.getElementById('modal-close');
const modalError        = document.getElementById('modal-error');

const sortBtns = document.querySelectorAll('.sort-btn');

// ── Helpers ──────────────────────────────────────────────────────────────────

function colorForMember(name) {
    const existing = members.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.color;
    return COLOR_PALETTE[members.length % COLOR_PALETTE.length];
}

function addMember(name, switchTo = true) {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const already = members.find(m => m.name.toLowerCase() === trimmed.toLowerCase());
    if (already) {
        if (switchTo) setActiveUser(already);
        return true;
    }

    const color = COLOR_PALETTE[members.length % COLOR_PALETTE.length];
    const member = { name: trimmed, color };
    members.push(member);

    if (switchTo) setActiveUser(member);
    return true;
}

function setActiveUser(member) {
    activeUser = member;
    activeUserAvatar.textContent = member.name[0].toUpperCase();
    activeUserName.textContent   = member.name;
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
    return `${Math.floor(h / 24)}d ago`;
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
}

function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getMemberColor(name) {
    const m = members.find(m => m.name.toLowerCase() === name.toLowerCase());
    return m ? m.color : '#888';
}

// ── Render Avatars ────────────────────────────────────────────────────────────

function renderAvatars() {
    userAvatars.innerHTML = '';
    members.forEach(member => {
        const btn = document.createElement('button');
        btn.className = 'avatar-btn' + (activeUser && member.name === activeUser.name ? ' active' : '');
        btn.dataset.name = member.name;
        btn.title = member.name;
        btn.textContent = member.name[0].toUpperCase();
        btn.style.setProperty('--user-color', member.color);
        if (activeUser && member.name === activeUser.name) {
            btn.style.background = member.color;
            btn.style.borderColor = member.color;
        }
        btn.addEventListener('click', () => setActiveUser(member));
        userAvatars.appendChild(btn);
    });
}

// ── Render Filter Tabs ────────────────────────────────────────────────────────

function renderFilterTabs() {
    filterTabs.innerHTML = '';

    // All button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn' + (activeFilter === 'all' ? ' active' : '');
    allBtn.dataset.filter = 'all';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => setFilter('all'));
    filterTabs.appendChild(allBtn);

    // One per member who has ideas
    const authorsWithIdeas = [...new Set(ideas.map(i => i.author))];
    members.filter(m => authorsWithIdeas.includes(m.name)).forEach(member => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (activeFilter === member.name ? ' active' : '');
        btn.dataset.filter = member.name;
        btn.textContent = member.name;
        btn.addEventListener('click', () => setFilter(member.name));
        filterTabs.appendChild(btn);
    });
}

// ── Render Ideas ──────────────────────────────────────────────────────────────

function getFilteredSorted() {
    let list = activeFilter === 'all' ? [...ideas] : ideas.filter(i => i.author === activeFilter);
    if (activeSort === 'newest') list.sort((a, b) => b.ts - a.ts);
    else if (activeSort === 'oldest') list.sort((a, b) => a.ts - b.ts);
    else if (activeSort === 'top') list.sort((a, b) => b.votes - a.votes);
    return list;
}

function renderList() {
    const list = getFilteredSorted();
    ideaList.innerHTML = '';

    if (list.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    list.forEach(idea => {
        const color = getMemberColor(idea.author);
        const li = document.createElement('li');
        li.className = 'idea-item';
        li.dataset.id = idea.id;
        li.style.setProperty('--item-color', color);

        li.innerHTML = `
            <div class="item-avatar" style="background:${color}">
                ${escapeHTML(idea.author[0].toUpperCase())}
            </div>
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

// ── Name Entry Screen ─────────────────────────────────────────────────────────

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

    // Show board
    nameScreen.classList.add('hidden');
    boardScreen.classList.remove('hidden');
    updateCount();
    renderList();
}

joinBtn.addEventListener('click', () => joinAs(nameInput.value));
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') joinAs(nameInput.value); });

// Show existing members as chips on the name screen
showExistingMembers();

// ── Add Member Modal ──────────────────────────────────────────────────────────

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

// ── Add Idea ──────────────────────────────────────────────────────────────────

function addIdea() {
    if (!activeUser) { showToast('Please select a user first.'); return; }
    const text = ideaInput.value.trim();
    if (!text) {
        ideaInput.classList.add('shake');
        setTimeout(() => ideaInput.classList.remove('shake'), 400);
        ideaInput.focus();
        return;
    }

    ideas.unshift({
        id: nextId++,
        text,
        author: activeUser.name,
        votes: 0,
        voted: false,
        ts: Date.now(),
    });

    ideaInput.value = '';
    charCount.textContent = '0 / 120';
    charCount.classList.remove('warn');

    updateCount();

    if (activeFilter !== 'all' && activeFilter !== activeUser.name) setFilter('all');
    else { renderList(); renderFilterTabs(); }

    showToast(`Idea added ✦`);
}

addBtn.addEventListener('click', addIdea);
ideaInput.addEventListener('keydown', e => { if (e.key === 'Enter') addIdea(); });

// ── Vote & Delete ──────────────────────────────────────────────────────────────

ideaList.addEventListener('click', e => {
    const voteBtn   = e.target.closest('.vote-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (voteBtn) {
        const id   = Number(voteBtn.dataset.id);
        const idea = ideas.find(i => i.id === id);
        if (!idea) return;
        idea.voted  = !idea.voted;
        idea.votes += idea.voted ? 1 : -1;
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
                updateCount();
                renderList();
                renderFilterTabs();
            }, { once: true });
        }
    }
});

// ── Filter ─────────────────────────────────────────────────────────────────────

function setFilter(filter) {
    activeFilter = filter;
    renderFilterTabs();
    renderList();
}

// ── Sort ───────────────────────────────────────────────────────────────────────

sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sortBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSort = btn.dataset.sort;
        renderList();
    });
});

// ── Char Counter ───────────────────────────────────────────────────────────────

ideaInput.addEventListener('input', () => {
    const len = ideaInput.value.length;
    charCount.textContent = `${len} / 120`;
    charCount.classList.toggle('warn', len > 100);
});

// ── Periodic refresh ───────────────────────────────────────────────────────────

setInterval(() => renderList(), 30000);
