let xp = Number(localStorage.getItem('r_xp')) || 0;
let gold = Number(localStorage.getItem('r_gold')) || 0;
let tasks = JSON.parse(localStorage.getItem('r_tasks')) || [];
let avatar = JSON.parse(localStorage.getItem('r_avatar')) || null;
let food = Number(localStorage.getItem('r_food')) || 0;
let filterType = 'all';

function getXpLimit(level) {
    let limit = 200;
    for (let i = 1; i < level; i++) {
        limit = Math.floor(limit * 1.25);
    }
    return limit;
}

function init() {
    if (!avatar) {
        document.getElementById('intro-overlay').classList.remove('hidden');
    } else {
        document.getElementById('intro-overlay').classList.add('hidden');
        updateUI();
    }
}

function updateUI() {
    let level = 1;
    let tempXp = xp;
    let limit = getXpLimit(level);
    while (tempXp >= limit) {
        tempXp -= limit;
        level++;
        limit = getXpLimit(level);
    }

    document.getElementById('player-lvl').innerText = level;
    document.getElementById('xp-fill').style.width = (tempXp / limit * 100) + "%";
    document.getElementById('xp-text').innerText = `${tempXp} / ${limit} XP`;
    
    document.getElementById('gold-tasks').innerText = gold;
    document.getElementById('gold-hatchery').innerText = gold;
    
    if (avatar) {
        document.getElementById('mini-avatar-icon').innerText = avatar.icon;
        document.getElementById('big-avatar').innerText = avatar.icon;
        document.getElementById('av-name-tasks').innerText = avatar.type;
        document.getElementById('av-lvl-tasks').innerText = avatar.lvl;
        document.getElementById('av-full-name').innerText = `Evo ${avatar.lvl} - ${avatar.type}`;
    }

    document.getElementById('food-val').innerText = food;
    document.getElementById('food-fill').style.width = (food / 5 * 100) + "%";
    document.getElementById('evolve-btn').classList.toggle('hidden', food < 5);

    renderTasks();
    save();
}

function renderTasks() {
    const pList = document.getElementById('pending-list');
    const dList = document.getElementById('done-list');
    pList.innerHTML = ''; dList.innerHTML = '';

    tasks.forEach((t, i) => {
        if (filterType !== 'all' && t.diff.toString() !== filterType) return;
        
        const li = document.createElement('li');
        li.className = 'task-item';

        const dateInfo = t.done
            ? `<span class="task-date">📅 ${t.createdAt || '?'} &nbsp;✅ ${t.doneAt || '?'}</span>`
            : `<span class="task-date">📅 ${t.createdAt || '?'}</span>`;

        if (li.dataset.editing) {
            // editační stav (viz níže)
        }

        li.innerHTML = `
            <div class="task-info">
                <strong>${t.text}</strong>
                <small>${t.diff} XP/G</small>
                ${dateInfo}
            </div>
            <div style="display:flex; gap:8px;">
                ${!t.done ? `
                    <button onclick="startEdit(${i})" class="btn-icon btn-edit">✏️</button>
                    <button onclick="completeTask(${i})" class="btn-icon btn-done">✓</button>
                ` : ''}
                <button onclick="deleteTask(${i})" class="btn-icon btn-del">✕</button>
            </div>
        `;
        t.done ? dList.appendChild(li) : pList.appendChild(li);
    });
}

window.chooseAvatar = (type, icon) => {
    avatar = { type, icon, lvl: 1 };
    init();
};

window.completeTask = (i) => {
    const oldLvl = getLevelAtXP(xp);
    tasks[i].done = true;
    tasks[i].doneAt = new Date().toLocaleDateString('cs-CZ');
    xp += tasks[i].diff;
    gold += tasks[i].diff;
    
    if (getLevelAtXP(xp) > oldLvl) {
        const modal = document.getElementById('level-up-overlay');
        modal.classList.add('active');
        setTimeout(() => modal.classList.remove('active'), 2000);
    }
    updateUI();
};

function getLevelAtXP(val) {
    let l = 1;
    let t = val;
    while (t >= getXpLimit(l)) {
        t -= getXpLimit(l);
        l++;
    }
    return l;
}

window.deleteTask = (i) => { tasks.splice(i, 1); updateUI(); };

window.feedAvatar = () => {
    if (gold >= 100 && food < 5) {
        gold -= 100; food++; updateUI();
    } else if (gold < 100) alert("Nedostatek zlata!");
};

window.triggerEvolve = () => {
    const char = document.getElementById('big-avatar');
    const flash = document.getElementById('evo-flash');
    
    char.classList.add('evolving-shake');
    setTimeout(() => {
        flash.classList.add('flash-active');
        avatar.lvl++;
        food = 0;
        setTimeout(() => {
            char.classList.remove('evolving-shake');
            flash.classList.remove('flash-active');
            updateUI();
        }, 400);
    }, 800);
};

window.toggleCollapse = (id) => {
    const el = document.getElementById(id);
    const arrow = document.getElementById('arrow-' + id);
    const isVisible = el.classList.toggle('show');
    arrow.innerText = isVisible ? '▼' : '▶';
};

window.changeTab = (tab) => {
    document.getElementById('view-tasks').classList.toggle('active', tab === 'tasks');
    document.getElementById('view-hatchery').classList.toggle('active', tab === 'hatchery');
    document.getElementById('tab-tasks').classList.toggle('active', tab === 'tasks');
    document.getElementById('tab-hatchery').classList.toggle('active', tab === 'hatchery');
};

window.setFilter = (val) => {
    filterType = val;
    document.querySelectorAll('.f-btn').forEach(b => b.classList.toggle('active', b.id === 'f-' + val));
    renderTasks();
};

document.getElementById('add-task-btn').onclick = () => {
    const inp = document.getElementById('task-input');
    if (!inp.value) return;
    tasks.unshift({ 
        text: inp.value, 
        diff: Number(document.getElementById('task-diff').value), 
        done: false,
        createdAt: new Date().toLocaleDateString('cs-CZ')
    });
    inp.value = '';
    
    document.getElementById('pending-list').classList.add('show');
    document.getElementById('arrow-pending-list').innerText = '▼';
    
    updateUI();
};

function save() {
    localStorage.setItem('r_xp', xp);
    localStorage.setItem('r_gold', gold);
    localStorage.setItem('r_tasks', JSON.stringify(tasks));
    localStorage.setItem('r_avatar', JSON.stringify(avatar));
    localStorage.setItem('r_food', food);
}

window.startEdit = (i) => {
    const pList = document.getElementById('pending-list');
    const items = pList.querySelectorAll('.task-item');
    
    // Najdeme správný li element podle indexu v tasks (s ohledem na filter)
    let visibleIndex = 0;
    tasks.forEach((t, idx) => {
        if (t.done) return;
        if (filterType !== 'all' && t.diff.toString() !== filterType) return;
        if (idx === i) {
            const li = items[visibleIndex];
            li.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
                    <input id="edit-input-${i}" value="${t.text}" style="width:100%; padding:8px; border-radius:8px;">
                    <div style="display:flex; gap:8px;">
                        <select id="edit-diff-${i}" style="flex:1; padding:8px; border-radius:8px;">
                            <option value="10" ${t.diff==10?'selected':''}>Lehký (10 XP)</option>
                            <option value="30" ${t.diff==30?'selected':''}>Střední (30 XP)</option>
                            <option value="50" ${t.diff==50?'selected':''}>Těžký (50 XP)</option>
                        </select>
                        <button onclick="saveEdit(${i})" style="background:var(--success);border:none;padding:8px 14px;border-radius:8px;cursor:pointer;color:white;font-weight:bold;">Uložit</button>
                        <button onclick="renderTasks()" style="background:#30363d;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;color:white;">Zrušit</button>
                    </div>
                </div>
            `;
        }
        visibleIndex++;
    });
};

window.saveEdit = (i) => {
    const newText = document.getElementById(`edit-input-${i}`).value.trim();
    const newDiff = Number(document.getElementById(`edit-diff-${i}`).value);
    if (!newText) return;
    tasks[i].text = newText;
    tasks[i].diff = newDiff;
    updateUI();
};

init();
