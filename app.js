// FocusFlow Application State and Business Logic

// Initial State
let state = {
    tasks: [],
    aspects: [
        { id: 'life', name: 'Life', color: '#a55eea', icon: '🌱' },
        { id: 'health', name: 'Health', color: '#20bf6b', icon: '🏃' },
        { id: 'work', name: 'Work', color: '#00f2fe', icon: '💼' },
        { id: 'personal', name: 'Personal Development', color: '#f7b731', icon: '🧘' },
        { id: 'wife', name: 'Wife', color: '#eb3b5a', icon: '❤️' }
    ],
    userStats: {
        level: 1,
        xp: 0,
        streak: 0,
        lastCompletedDate: null,
        completedCount: 0
    },
    activeAspectFilter: 'all',
    currentTab: 'dashboard'
};

// Ambient Sound Audio Nodes & AudioContext (lazy loaded)
let audioCtx = null;
let ambientNodes = {
    rain: null,
    waves: null,
    forest: null,
    white: null
};

// Pomodoro Timer State
let timerInterval = null;
let timerSecondsRemaining = 25 * 60;
let timerMode = 'work'; // 'work', 'short', 'long'
let timerRunning = false;

// Quotes Database
const quotes = {
    general: [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { text: "Your talent determines what you can do. Your motivation determines how much you are willing to do.", author: "Lou Holtz" },
        { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" }
    ],
    life: [
        { text: "The purpose of life is a life of purpose.", author: "Robert Byrne" },
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
        { text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" }
    ],
    health: [
        { text: "A healthy outer starts from the healthy inner.", author: "Robert Urich" },
        { text: "It is health that is real wealth and not pieces of gold and silver.", author: "Mahatma Gandhi" },
        { text: "The groundwork of all happiness is health.", author: "Leigh Hunt" }
    ],
    work: [
        { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
        { text: "Opportunity is missed by most people because it is dressed in overalls and looks like work.", author: "Thomas Edison" },
        { text: "Choose a job you love, and you will never have to work a day in your life.", author: "Confucius" }
    ],
    personal: [
        { text: "Growth begins at the end of your comfort zone.", author: "Neale Donald Walsch" },
        { text: "Be not afraid of growing slowly, be afraid only of standing still.", author: "Chinese Proverb" },
        { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" }
    ],
    wife: [
        { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
        { text: "A successful marriage requires falling in love many times, always with the same person.", author: "Mignon McLaughlin" },
        { text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott" }
    ]
};

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateDateDisplay();
    initializeUI();
    getNewQuote();
    requestNotificationPermission();
    
    // Set periodic status checking loop
    setInterval(updateDeadlinesAndCountdowns, 1000); // every second
    updateDeadlinesAndCountdowns();
});

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('focusflow_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
            // Ensure defaults exist
            if (!state.aspects) state.aspects = [];
            if (!state.tasks) state.tasks = [];
            if (!state.userStats) state.userStats = { level: 1, xp: 0, streak: 0, lastCompletedDate: null, completedCount: 0 };
        } catch (e) {
            console.error('Error loading state:', e);
        }
    } else {
        saveState();
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('focusflow_state', JSON.stringify(state));
}

// Update Date in Header
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date-display').innerText = new Date().toLocaleDateString('en-US', options);
}

// Initialize components & setup forms
function initializeUI() {
    renderUserStats();
    renderAspectChips();
    renderAspectSelectOptions();
    renderTasks();
    renderAspectsManager();
    renderDashboardMetrics();
    updateDeadlinesAndCountdowns();
}

// Switching tab views
window.switchTab = function(tabId) {
    state.currentTab = tabId;
    
    // Manage tab pane visibility
    document.querySelectorAll('.tab-pane').forEach(el => {
        el.classList.remove('active');
    });
    
    // Update Sidebar button active states
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activePane = document.getElementById(`tab-${tabId}`);
    const activeBtn = document.getElementById(`nav-${tabId}`);
    
    if (activePane) {
        activePane.style.display = 'flex';
        setTimeout(() => activePane.classList.add('active'), 50);
    }
    if (activeBtn) activeBtn.classList.add('active');
    
    // Page Title updates
    const titleMap = {
        'dashboard': 'Dashboard Overview',
        'tasks': 'Task Board',
        'focus': 'Focus Space',
        'categories': 'Manage Aspects'
    };
    document.getElementById('page-title').innerText = titleMap[tabId] || 'FocusFlow';
    
    // If returning to dashboard, refresh metrics
    if (tabId === 'dashboard') {
        renderDashboardMetrics();
    }
    
    // Hide New Task button on the Focus page
    const createTaskBtn = document.getElementById('create-task-btn');
    if (createTaskBtn) {
        if (tabId === 'focus') {
            createTaskBtn.classList.add('hidden-btn');
        } else {
            createTaskBtn.classList.remove('hidden-btn');
        }
    }
};

// Render gamified XP and Level stats
function renderUserStats() {
    const stats = state.userStats;
    const levelElement = document.getElementById('user-level');
    const xpTextElement = document.getElementById('xp-text');
    const xpBarElement = document.getElementById('xp-bar');
    const streakElement = document.getElementById('streak-count');
    
    // Mobile status elements
    const mobileLevelElement = document.getElementById('mobile-level-val');
    const mobileStreakElement = document.getElementById('mobile-streak-val');
    
    const xpNeeded = getXpNeededForLevel(stats.level);
    
    levelElement.innerText = stats.level;
    if (mobileLevelElement) mobileLevelElement.innerText = stats.level;
    
    xpTextElement.innerText = `${stats.xp} / ${xpNeeded} XP`;
    
    const progressPercent = Math.min((stats.xp / xpNeeded) * 100, 100);
    xpBarElement.style.width = `${progressPercent}%`;
    
    streakElement.innerText = stats.streak;
    if (mobileStreakElement) mobileStreakElement.innerText = stats.streak;
}

function getXpNeededForLevel(lvl) {
    return lvl * 100;
}

// Sound Synthesizer via Web Audio API (to avoid external asset requests)
function playTone(freq, type, duration) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq || 440, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.warn('Web Audio Context not supported or blocked by security rules:', e);
    }
}

function playCompletionChime() {
    playTone(523.25, 'triangle', 0.15); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.15), 100); // E5
    setTimeout(() => playTone(783.99, 'triangle', 0.3), 200); // G5
}

function playLevelUpChime() {
    playTone(523.25, 'sawtooth', 0.15); // C5
    setTimeout(() => playTone(659.25, 'sawtooth', 0.15), 120); // E5
    setTimeout(() => playTone(783.99, 'sawtooth', 0.15), 240); // G5
    setTimeout(() => playTone(1046.50, 'sawtooth', 0.5), 360); // C6
}

// Add XP points to user and check level up
function gainXp(amount) {
    state.userStats.xp += amount;
    const xpNeeded = getXpNeededForLevel(state.userStats.level);
    
    if (state.userStats.xp >= xpNeeded) {
        state.userStats.xp -= xpNeeded;
        state.userStats.level += 1;
        renderUserStats();
        playLevelUpChime();
        showCelebrationModal(`Level Up!`, `Incredible! You reached Level ${state.userStats.level}! Keep crushing your limits!`, amount, true);
    } else {
        renderUserStats();
    }
    saveState();
}

// Update Streak Daily Logic
function checkStreakProgress() {
    const todayStr = new Date().toISOString().split('T')[0];
    const stats = state.userStats;
    
    if (!stats.lastCompletedDate) {
        stats.streak = 1;
    } else {
        const lastDate = new Date(stats.lastCompletedDate);
        const today = new Date(todayStr);
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            stats.streak += 1;
        } else if (diffDays > 1) {
            stats.streak = 1; // broken, restart
        }
        // If diffDays === 0, it means another completion today; streak remains unchanged.
    }
    stats.lastCompletedDate = todayStr;
    saveState();
    renderUserStats();
}

// Dynamic motivational quotes generator
window.getNewQuote = function(aspectId = 'general') {
    const quotesList = quotes[aspectId] || quotes.general;
    const randomIndex = Math.floor(Math.random() * quotesList.length);
    const quote = quotesList[randomIndex];
    
    document.getElementById('motivational-quote-display').innerText = `"${quote.text}"`;
    document.getElementById('motivational-author-display').innerText = `— ${quote.author}`;
};

// Aspect List and options builder
function renderAspectChips() {
    const container = document.getElementById('task-aspect-chips');
    if (!container) return;
    
    let html = `<button class="filter-chip ${state.activeAspectFilter === 'all' ? 'active' : ''}" onclick="setAspectFilter('all')" style="border-color: rgba(255,255,255,0.1)">All</button>`;
    
    state.aspects.forEach(aspect => {
        const isActive = state.activeAspectFilter === aspect.id;
        const style = isActive ? `background-color: ${aspect.color}; color: #0b0c16; box-shadow: 0 4px 10px ${aspect.color}50; border-color: ${aspect.color}` : `border-color: ${aspect.color}60`;
        html += `<button class="filter-chip ${isActive ? 'active' : ''}" onclick="setAspectFilter('${aspect.id}')" style="${style}">
            ${aspect.icon} ${aspect.name}
        </button>`;
    });
    
    container.innerHTML = html;
}

window.setAspectFilter = function(aspectId) {
    state.activeAspectFilter = aspectId;
    renderAspectChips();
    renderTasks();
    if (aspectId !== 'all') {
        getNewQuote(aspectId);
    } else {
        getNewQuote('general');
    }
};

function renderAspectSelectOptions() {
    const select = document.getElementById('task-aspect-select');
    if (!select) return;
    
    let html = '';
    state.aspects.forEach(aspect => {
        html += `<option value="${aspect.id}">${aspect.icon} ${aspect.name}</option>`;
    });
    select.innerHTML = html;
}

// Dynamic Tasks Rendering
window.renderTasks = function() {
    const grid = document.getElementById('task-cards-grid');
    if (!grid) return;
    
    let filtered = [...state.tasks];
    
    // Filter by Aspect
    if (state.activeAspectFilter !== 'all') {
        filtered = filtered.filter(t => t.aspectId === state.activeAspectFilter);
    }
    
    // Search filter
    const searchVal = document.getElementById('task-search-input')?.value.toLowerCase();
    if (searchVal) {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(searchVal) || (t.whyPhrase && t.whyPhrase.toLowerCase().includes(searchVal)));
    }
    
    // Sort
    const sortVal = document.getElementById('task-sort-select')?.value || 'deadline-asc';
    filtered.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // completed tasks go to bottom
        }
        
        if (sortVal === 'deadline-asc') {
            return new Date(a.deadline) - new Date(b.deadline);
        } else if (sortVal === 'deadline-desc') {
            return new Date(b.deadline) - new Date(a.deadline);
        } else if (sortVal === 'priority-desc') {
            const weights = { high: 3, medium: 2, low: 1 };
            return weights[b.priority] - weights[a.priority];
        } else if (sortVal === 'xp-desc') {
            const xpA = 50 + (a.subtasks ? a.subtasks.length * 10 : 0);
            const xpB = 50 + (b.subtasks ? b.subtasks.length * 10 : 0);
            return xpB - xpA;
        }
        return 0;
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state glass-panel" style="grid-column: 1 / -1; width: 100%;">
                <p>🧘 No active tasks in this section. Ready to forge new achievements?</p>
                <button class="primary-btn btn-sm" onclick="openCreateTaskModal()" style="margin-top: 1rem;">Create a Task</button>
            </div>`;
        return;
    }
    
    let html = '';
    filtered.forEach(task => {
        const aspect = state.aspects.find(a => a.id === task.aspectId) || { name: 'Life', color: '#ccc', icon: '🌱' };
        const mainDeadline = new Date(task.deadline);
        const totalSub = task.subtasks ? task.subtasks.length : 0;
        const compSub = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
        const pctSub = totalSub > 0 ? Math.round((compSub / totalSub) * 100) : (task.completed ? 100 : 0);
        
        const now = new Date();
        const diffMs = mainDeadline - now;
        const isOverdue = diffMs < 0 && !task.completed;
        const isSoon = diffMs > 0 && diffMs < 24 * 60 * 60 * 1000 && !task.completed; // 24 hours
        
        let deadlineClass = 'countdown-safe';
        let statusText = 'Scheduled';
        if (task.completed) {
            statusText = 'Completed';
        } else if (isOverdue) {
            deadlineClass = 'countdown-overdue';
            statusText = 'Overdue';
        } else if (isSoon) {
            deadlineClass = 'countdown-soon';
            statusText = 'Due Soon';
        }
        
        const xpPotential = 50 + (totalSub * 10);
        
        html += `
        <div class="task-card glass-panel priority-${task.priority} ${task.completed ? 'completed-task' : ''}" id="task-${task.id}">
            <div class="task-card-header">
                <span class="task-aspect-label" style="background-color: ${aspect.color}15; color: ${aspect.color}">
                    ${aspect.icon} ${aspect.name}
                </span>
                <span class="task-priority-badge p-${task.priority}">
                    ${task.priority}
                </span>
            </div>
            
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            
            ${task.whyPhrase ? `<div class="task-why-phrase">"Why: ${escapeHtml(task.whyPhrase)}"</div>` : ''}
            
            <div class="task-countdown-row ${deadlineClass}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span id="countdown-${task.id}">${getCountdownString(mainDeadline, task.completed)}</span>
            </div>
            
            <!-- Subtasks Progress Bar -->
            <div class="task-subtasks-progress">
                <div class="progress-header">
                    <span>Subtasks</span>
                    <span>${compSub}/${totalSub} (${pctSub}%)</span>
                </div>
                <div class="xp-bar-bg" style="height: 4px;">
                    <div class="xp-bar-fill" style="width: ${pctSub}%; background: ${aspect.color}; box-shadow: 0 0 6px ${aspect.color}50;"></div>
                </div>
            </div>
            
            <!-- Subtasks Detail Area -->
            ${totalSub > 0 ? `
            <div class="task-subtasks-expander">
                <button class="expander-trigger" onclick="toggleSubtasksCollapse('${task.id}')" id="expander-btn-${task.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
                    Show sub-tasks (${totalSub})
                </button>
                <div class="subtasks-expand-list" id="subtasks-list-${task.id}" style="display: none;">
                    ${task.subtasks.map(subtask => {
                        const subDeadline = new Date(subtask.deadline);
                        const subDiff = subDeadline - now;
                        const subOverdue = subDiff < 0 && !subtask.completed;
                        const subSoon = subDiff > 0 && subDiff < 24 * 60 * 60 * 1000 && !subtask.completed;
                        let subBadgeStyle = `background-color: rgba(255,255,255,0.03); color: var(--color-text-secondary);`;
                        if (subtask.completed) {
                            subBadgeStyle = `background-color: var(--color-green-glow); color: var(--color-green);`;
                        } else if (subOverdue) {
                            subBadgeStyle = `background-color: var(--color-rose-glow); color: var(--color-rose);`;
                        } else if (subSoon) {
                            subBadgeStyle = `background-color: var(--color-amber-glow); color: var(--color-amber);`;
                        }
                        
                        return `
                        <div class="subtask-item ${subtask.completed ? 'sub-completed' : ''}">
                            <div class="subtask-left">
                                <div class="custom-checkbox" onclick="toggleSubtaskComplete('${task.id}', '${subtask.id}')"></div>
                                <span>${escapeHtml(subtask.title)}</span>
                            </div>
                            <span class="subtask-deadline-badge" style="${subBadgeStyle}">
                                ⏱️ ${formatSubDate(subDeadline)}
                            </span>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}

            <div class="task-card-actions">
                ${!task.completed ? `
                <button class="primary-btn btn-sm" onclick="completeMainTask('${task.id}')" style="background: ${aspect.color}; color: #0b0c16; box-shadow: 0 4px 10px ${aspect.color}30;">
                    ✓ Complete
                </button>
                ` : `
                <button class="secondary-btn btn-sm" disabled style="opacity: 0.5;">
                    🎉 Achieved (+${xpPotential} XP)
                </button>
                `}
                <button class="secondary-btn btn-sm" onclick="editTask('${task.id}')" style="max-width: 45px;">
                    ✏️
                </button>
                <button class="secondary-btn btn-sm" onclick="deleteTask('${task.id}')" style="max-width: 45px; color: var(--color-rose); border-color: rgba(235,59,90,0.2);">
                    🗑️
                </button>
            </div>
        </div>
        `;
    });
    
    grid.innerHTML = html;
    
    // Initialize collapse status (keep them collapsed by default)
}

// Collapsible logic for subtasks list
window.toggleSubtasksCollapse = function(taskId) {
    const list = document.getElementById(`subtasks-list-${taskId}`);
    const trigger = document.getElementById(`expander-btn-${taskId}`);
    if (!list || !trigger) return;
    
    if (list.style.display === 'none') {
        list.style.display = 'flex';
        trigger.classList.add('expanded');
    } else {
        list.style.display = 'none';
        trigger.classList.remove('expanded');
    }
};

// Toggle individual subtask completion
window.toggleSubtaskComplete = function(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;
    
    subtask.completed = !subtask.completed;
    playTone(subtask.completed ? 440 : 220, 'sine', 0.1);
    
    if (subtask.completed) {
        gainXp(10); // Award 10 XP for completing a subtask
        triggerConfetti(5);
    } else {
        // deduct XP if undone to prevent abuse
        state.userStats.xp = Math.max(0, state.userStats.xp - 10);
        renderUserStats();
    }
    
    saveState();
    renderTasks();
    renderDashboardMetrics();
};

// Complete entire task
window.completeMainTask = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    // Complete all subtasks first if any are pending
    let earnedXp = 50; // base reward
    if (task.subtasks) {
        task.subtasks.forEach(s => {
            if (!s.completed) {
                s.completed = true;
                earnedXp += 10; // gain points for completing remaining subtasks
            }
        });
    }
    
    // Check deadline bonus
    const deadline = new Date(task.deadline);
    const now = new Date();
    if (deadline > now) {
        earnedXp += 20; // 20 XP bonus for completion before deadline!
    }
    
    task.completed = true;
    state.userStats.completedCount += 1;
    
    playCompletionChime();
    checkStreakProgress();
    gainXp(earnedXp);
    
    const aspect = state.aspects.find(a => a.id === task.aspectId);
    const aspectLabel = aspect ? aspect.name : 'Goal';
    
    showCelebrationModal(`Task Completed!`, `Excellent job completing your "${task.title}" task under "${aspectLabel}". Your consistency shapes your destiny.`, earnedXp, false);
    
    saveState();
    renderTasks();
    renderDashboardMetrics();
};

// Delete Task
window.deleteTask = function(taskId) {
    if (confirm('Are you sure you want to delete this task? All achievements associated with it will be lost.')) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveState();
        renderTasks();
        renderDashboardMetrics();
    }
};

// Edit Task Modal Opening
window.editTask = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Populating modal form
    document.getElementById('task-id-field').value = task.id;
    document.getElementById('task-title-input').value = task.title;
    document.getElementById('task-aspect-select').value = task.aspectId;
    document.getElementById('task-priority-select').value = task.priority;
    document.getElementById('task-deadline-input').value = task.deadline;
    document.getElementById('task-motivation-input').value = task.whyPhrase || '';
    
    // Populating subtasks
    const container = document.getElementById('subtasks-fields-list');
    container.innerHTML = '';
    
    if (task.subtasks) {
        task.subtasks.forEach(s => {
            addSubtaskField(s.title, s.deadline, s.id, s.completed);
        });
    }
    
    document.getElementById('task-modal-title').innerText = 'Edit Task';
    openModal('task-modal');
};

// Dynamic Subtask Fields creator inside form modal
let subtaskFieldCounter = 0;
window.addSubtaskField = function(title = '', deadline = '', existingId = '', completed = false) {
    const container = document.getElementById('subtasks-fields-list');
    const id = existingId || `new_sub_${subtaskFieldCounter++}`;
    
    // Calculate default date for subtask (e.g. today or main task date)
    let dateVal = deadline;
    if (!dateVal) {
        const mainDeadline = document.getElementById('task-deadline-input').value;
        dateVal = mainDeadline || new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    }
    
    const row = document.createElement('div');
    row.className = 'subtask-field-row';
    row.id = `subtask-row-${id}`;
    row.dataset.completed = completed;
    
    row.innerHTML = `
        <div class="form-group" style="margin-bottom: 0;">
            <input type="text" placeholder="Sub-task name" value="${escapeHtml(title)}" required class="sub-title-field">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
            <input type="datetime-local" value="${dateVal}" required class="sub-deadline-field">
        </div>
        <button type="button" class="icon-btn btn-delete" onclick="removeSubtaskField('${id}')" style="margin-top: 0; padding: 0.6rem;">&times;</button>
    `;
    
    container.appendChild(row);
};

window.removeSubtaskField = function(rowId) {
    const row = document.getElementById(`subtask-row-${rowId}`);
    if (row) row.remove();
};

// Modal Controllers
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 50);
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

window.openCreateTaskModal = function() {
    document.getElementById('task-form').reset();
    document.getElementById('task-id-field').value = '';
    document.getElementById('subtasks-fields-list').innerHTML = '';
    document.getElementById('task-modal-title').innerText = 'Create New Task';
    
    // Set default deadline to tomorrow
    const tomorrow = new Date(Date.now() + 86400000);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    document.getElementById('task-deadline-input').value = tomorrow.toISOString().slice(0, 16);
    
    openModal('task-modal');
};

window.closeCreateTaskModal = function() {
    closeModal('task-modal');
};

// Save task from form
window.saveTask = function(event) {
    event.preventDefault();
    
    const id = document.getElementById('task-id-field').value;
    const title = document.getElementById('task-title-input').value;
    const aspectId = document.getElementById('task-aspect-select').value;
    const priority = document.getElementById('task-priority-select').value;
    const deadline = document.getElementById('task-deadline-input').value;
    const whyPhrase = document.getElementById('task-motivation-input').value;
    
    // Gather subtasks
    const subtasks = [];
    const subRows = document.querySelectorAll('.subtask-field-row');
    subRows.forEach(row => {
        const subTitle = row.querySelector('.sub-title-field').value;
        const subDeadline = row.querySelector('.sub-deadline-field').value;
        const subCompleted = row.dataset.completed === 'true';
        const subId = row.id.replace('subtask-row-', '');
        
        subtasks.push({
            id: subId.startsWith('new_sub_') ? 'sub_' + Math.random().toString(36).substr(2, 9) : subId,
            title: subTitle,
            deadline: subDeadline,
            completed: subCompleted
        });
    });
    
    if (id) {
        // Edit existing
        const index = state.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            state.tasks[index] = {
                ...state.tasks[index],
                title,
                aspectId,
                priority,
                deadline,
                whyPhrase,
                subtasks
            };
        }
    } else {
        // Create new
        state.tasks.push({
            id: 'task_' + Math.random().toString(36).substr(2, 9),
            title,
            aspectId,
            priority,
            deadline,
            whyPhrase,
            subtasks,
            completed: false
        });
        
        playTone(330, 'sine', 0.1);
        setTimeout(() => playTone(440, 'sine', 0.15), 100);
    }
    
    saveState();
    closeCreateTaskModal();
    renderTasks();
    renderDashboardMetrics();
};

// Celebration/Achievement Modals
window.showCelebrationModal = function(title, message, xp, isLevelUp = false) {
    document.getElementById('celebration-title').innerText = title;
    document.getElementById('celebration-message').innerText = message;
    document.getElementById('celebration-xp-value').innerText = `+${xp} XP`;
    document.getElementById('celebration-badge').innerText = isLevelUp ? '✨👑✨' : '🏆';
    
    openModal('celebration-modal');
    triggerConfetti(50);
};

window.closeCelebrationModal = function() {
    closeModal('celebration-modal');
};

function triggerConfetti(particleCount) {
    const container = document.getElementById('celebration-particles');
    if (!container) return;
    
    container.innerHTML = '';
    const colors = ['#00f2fe', '#9d4edd', '#20bf6b', '#eb3b5a', '#f7b731'];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        
        const size = Math.random() * 8 + 4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        particle.style.position = 'absolute';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.borderRadius = '50%';
        particle.style.opacity = Math.random();
        
        // CSS anim
        particle.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 + 100}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 1500 + 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });
        
        container.appendChild(particle);
    }
}

// Countdown Calculation helpers
function getCountdownString(targetDate, isCompleted) {
    if (isCompleted) return 'Task Completed';
    
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
        return 'Overdue!';
    }
    
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hrs = Math.floor(min / 60);
    const days = Math.floor(hrs / 24);
    
    if (days > 0) {
        return `${days}d ${hrs % 24}h remaining`;
    }
    if (hrs > 0) {
        return `${hrs}h ${min % 60}m remaining`;
    }
    if (min > 0) {
        return `${min}m ${sec % 60}s remaining`;
    }
    return `${sec}s remaining`;
}

function formatSubDate(date) {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

// Live Countdown loop updates
function updateDeadlinesAndCountdowns() {
    state.tasks.forEach(task => {
        const display = document.getElementById(`countdown-${task.id}`);
        if (display) {
            const deadline = new Date(task.deadline);
            display.innerText = getCountdownString(deadline, task.completed);
            
            // dynamically update styling classes in real-time
            const now = new Date();
            const parent = display.closest('.task-countdown-row');
            if (parent && !task.completed) {
                const diffMs = deadline - now;
                parent.className = 'task-countdown-row'; // clear
                if (diffMs < 0) {
                    parent.classList.add('countdown-overdue');
                } else if (diffMs < 24 * 60 * 60 * 1000) {
                    parent.classList.add('countdown-soon');
                } else {
                    parent.classList.add('countdown-safe');
                }
            }
        }
    });
    
    // Check if any task is near deadline to show visual warnings or native alert
    checkUpcomingAlerts();
}

// Browser notifications setup
let notifiedItems = new Set();
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

function checkUpcomingAlerts() {
    const now = new Date();
    state.tasks.forEach(task => {
        if (task.completed) return;
        
        const mainDeadline = new Date(task.deadline);
        const diffMs = mainDeadline - now;
        const key = `task_${task.id}_alert`;
        
        // Alert 1 hour before
        if (diffMs > 0 && diffMs <= 60 * 60 * 1000 && !notifiedItems.has(key)) {
            triggerNotification(`Deadline approaching!`, `"${task.title}" is due in less than an hour! Why you started: "${task.whyPhrase || 'No limits'}"`);
            notifiedItems.add(key);
        }
        
        // Subtasks alert
        if (task.subtasks) {
            task.subtasks.forEach(sub => {
                if (sub.completed) return;
                const subDeadline = new Date(sub.deadline);
                const subDiff = subDeadline - now;
                const subKey = `sub_${sub.id}_alert`;
                
                if (subDiff > 0 && subDiff <= 60 * 60 * 1000 && !notifiedItems.has(subKey)) {
                    triggerNotification(`Sub-task alert!`, `"${sub.title}" is due soon under task "${task.title}". Keep going!`);
                    notifiedItems.add(subKey);
                }
            });
        }
    });
}

function triggerNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: 'logo.png' });
    }
    // Also play simple notification chirp
    playTone(880, 'sine', 0.1);
    setTimeout(() => playTone(1100, 'sine', 0.2), 100);
}

// Dashboard metrics visualizer
function renderDashboardMetrics() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    const now = new Date();
    const overdue = state.tasks.filter(t => !t.completed && new Date(t.deadline) < now).length;
    
    document.getElementById('stat-total-tasks').innerText = total;
    document.getElementById('stat-pending-tasks').innerText = pending;
    document.getElementById('stat-completed-tasks').innerText = completed;
    document.getElementById('stat-overdue-tasks').innerText = overdue;
    
    // Overall completion percentage
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('progress-percentage-text').innerText = `${pct}%`;
    
    // SVG DashOffset animation
    const circle = document.getElementById('dashboard-progress-ring');
    if (circle) {
        const circ = 2 * Math.PI * 70; // r=70
        const offset = circ - (pct / 100) * circ;
        circle.style.strokeDashoffset = offset;
    }
    
    // Progress label subtitle text based on status
    const subtitle = document.getElementById('progress-status-desc');
    if (subtitle) {
        if (total === 0) {
            subtitle.innerText = "Add a task to unlock progress!";
        } else if (pct === 100) {
            subtitle.innerText = "Legendary! Absolute completion!";
        } else if (pct >= 75) {
            subtitle.innerText = "Phenomenal focus! Almost there!";
        } else if (pct >= 50) {
            subtitle.innerText = "Halfway done! Keep the momentum!";
        } else if (overdue > 0) {
            subtitle.innerText = "Careful! You have overdue tasks.";
        } else {
            subtitle.innerText = "Flow forward, one check at a time.";
        }
    }
    
    // Aspects progression breakdown list
    renderDashboardAspectList();
    
    // Urgency tasks list render
    renderDashboardUrgentTasks();
}

function renderDashboardAspectList() {
    const list = document.getElementById('dashboard-aspect-list');
    if (!list) return;
    
    let html = '';
    
    state.aspects.forEach(aspect => {
        const aspectTasks = state.tasks.filter(t => t.aspectId === aspect.id);
        const totalA = aspectTasks.length;
        const compA = aspectTasks.filter(t => t.completed).length;
        const pctA = totalA > 0 ? Math.round((compA / totalA) * 100) : 0;
        
        html += `
        <div class="aspect-bar-item">
            <div class="aspect-bar-header">
                <span class="aspect-bar-title">${aspect.icon} ${aspect.name}</span>
                <span class="aspect-bar-count">${compA}/${totalA} completed (${pctA}%)</span>
            </div>
            <div class="aspect-bar-track">
                <div class="aspect-bar-fill" style="width: ${pctA}%; background-color: ${aspect.color}; box-shadow: 0 0 6px ${aspect.color}50;"></div>
            </div>
        </div>
        `;
    });
    
    list.innerHTML = html || '<p class="empty-state">Configure Aspects first in the Aspects tab!</p>';
}

function renderDashboardUrgentTasks() {
    const container = document.getElementById('dashboard-urgent-tasks');
    const badge = document.getElementById('urgent-count');
    if (!container) return;
    
    const now = new Date();
    const urgentItems = [];
    
    state.tasks.forEach(task => {
        if (task.completed) return;
        
        const mainDeadline = new Date(task.deadline);
        const diffMs = mainDeadline - now;
        
        // Less than 24 hours remaining or Overdue
        if (diffMs < 24 * 60 * 60 * 1000) {
            urgentItems.push({
                type: 'task',
                taskRef: task,
                title: task.title,
                deadline: mainDeadline,
                diffMs: diffMs,
                aspectId: task.aspectId
            });
        }
        
        // check subtasks
        if (task.subtasks) {
            task.subtasks.forEach(sub => {
                if (sub.completed) return;
                const subDeadline = new Date(sub.deadline);
                const subDiff = subDeadline - now;
                if (subDiff < 24 * 60 * 60 * 1000) {
                    urgentItems.push({
                        type: 'subtask',
                        taskRef: task,
                        title: `[Subtask] ${sub.title}`,
                        deadline: subDeadline,
                        diffMs: subDiff,
                        aspectId: task.aspectId
                    });
                }
            });
        }
    });
    
    // Sort soonest / most overdue first
    urgentItems.sort((a, b) => a.diffMs - b.diffMs);
    
    badge.innerText = `${urgentItems.length} Impending`;
    badge.className = urgentItems.length > 0 ? 'badge badge-rose font-sm' : 'badge badge-cyan font-sm';
    
    if (urgentItems.length === 0) {
        container.innerHTML = `
        <div class="empty-state">
            <p>🎉 Excellent! No tasks are currently in urgent danger of passing deadlines.</p>
        </div>`;
        return;
    }
    
    let html = '';
    // Show top 4 urgent tasks
    urgentItems.slice(0, 4).forEach(item => {
        const aspect = state.aspects.find(a => a.id === item.aspectId) || { color: '#ccc', icon: '🌱' };
        const timeText = item.diffMs < 0 ? 'Overdue!' : getCountdownString(item.deadline, false);
        const styleText = item.diffMs < 0 ? 'color: var(--color-rose);' : 'color: var(--color-amber);';
        
        html += `
        <div class="urgent-item">
            <div class="urgent-title-area">
                <div class="urgent-dot" style="background-color: ${item.diffMs < 0 ? 'var(--color-rose)' : 'var(--color-amber)'}; box-shadow: 0 0 6px ${item.diffMs < 0 ? 'var(--color-rose)' : 'var(--color-amber)'}"></div>
                <span class="urgent-title">${escapeHtml(item.title)}</span>
                <span class="urgent-aspect-tag" style="background-color: ${aspect.color}15; color: ${aspect.color}">${aspect.icon}</span>
            </div>
            <div class="urgent-time" style="${styleText}">
                ⏱️ ${timeText}
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

// Tab 3: Pomodoro Focus Space logic
window.setTimerMode = function(mode) {
    if (timerRunning) {
        if (!confirm('A focus session is currently running. Switch modes and reset the clock?')) return;
        resetTimer();
    }
    
    timerMode = mode;
    document.querySelectorAll('.timer-modes .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`mode-${mode}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if (mode === 'work') {
        timerSecondsRemaining = 25 * 60;
        document.getElementById('timer-pulse').style.borderColor = 'var(--color-cyan)';
    } else if (mode === 'short') {
        timerSecondsRemaining = 5 * 60;
        document.getElementById('timer-pulse').style.borderColor = 'var(--color-green)';
    } else if (mode === 'long') {
        timerSecondsRemaining = 15 * 60;
        document.getElementById('timer-pulse').style.borderColor = 'var(--color-purple)';
    }
    
    updateTimerDisplay();
};

function updateTimerDisplay() {
    const mins = Math.floor(timerSecondsRemaining / 60);
    const secs = timerSecondsRemaining % 60;
    
    document.getElementById('timer-minutes').innerText = String(mins).padStart(2, '0');
    document.getElementById('timer-seconds').innerText = String(secs).padStart(2, '0');
}

window.toggleTimer = function() {
    const btn = document.getElementById('timer-toggle-btn');
    const pulse = document.getElementById('timer-pulse');
    
    if (timerRunning) {
        // Pause timer
        clearInterval(timerInterval);
        timerRunning = false;
        btn.innerText = 'Start Focus';
        pulse.classList.remove('active');
        playTone(330, 'sine', 0.2);
    } else {
        // Start timer
        timerInterval = setInterval(() => {
            timerSecondsRemaining -= 1;
            updateTimerDisplay();
            
            if (timerSecondsRemaining <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                btn.innerText = 'Start Focus';
                pulse.classList.remove('active');
                
                // Completed focus session!
                playLevelUpChime();
                
                if (timerMode === 'work') {
                    gainXp(30); // Award 30 XP for successfully focusing!
                    showCelebrationModal('Focus Achieved!', 'Exceptional work. You maintained pure focus and completed a session. Rest, recharge, and flow again.', 30, false);
                } else {
                    alert('Break finished! Ready to step back in the flow?');
                }
                resetTimer();
            }
        }, 1000);
        
        timerRunning = true;
        btn.innerText = 'Pause';
        pulse.classList.add('active');
        playTone(660, 'sine', 0.15);
    }
};

window.resetTimer = function() {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('timer-toggle-btn').innerText = 'Start Focus';
    document.getElementById('timer-pulse').classList.remove('active');
    setTimerMode(timerMode);
};

// Synth Audio Ambient Loops generator via dynamic noise generation
window.toggleAmbient = function(type) {
    const card = document.getElementById(`ambient-${type}`);
    if (!card) return;
    
    if (card.classList.contains('active')) {
        // Stop playing
        stopAmbientSound(type);
        card.classList.remove('active');
    } else {
        // Start playing
        startAmbientSound(type);
        card.classList.add('active');
    }
};

function startAmbientSound(type) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        // Check if already playing
        if (ambientNodes[type]) return;
        
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // Generate noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoiseSource = audioCtx.createBufferSource();
        whiteNoiseSource.buffer = noiseBuffer;
        whiteNoiseSource.loop = true;
        
        // Synthesizer setup for different styles
        const lowpassFilter = audioCtx.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        
        if (type === 'rain') {
            // Low rumbling rain
            lowpassFilter.frequency.value = 400;
            const volume = audioCtx.createGain();
            volume.gain.value = 0.45;
            
            whiteNoiseSource.connect(lowpassFilter);
            lowpassFilter.connect(volume);
            volume.connect(audioCtx.destination);
            
            whiteNoiseSource.start();
            ambientNodes.rain = { source: whiteNoiseSource, filter: lowpassFilter, volume: volume };
            
        } else if (type === 'waves') {
            // Wave sound with slow volume sweep
            lowpassFilter.frequency.value = 250;
            const volume = audioCtx.createGain();
            volume.gain.setValueAtTime(0.02, audioCtx.currentTime);
            
            whiteNoiseSource.connect(lowpassFilter);
            lowpassFilter.connect(volume);
            volume.connect(audioCtx.destination);
            
            whiteNoiseSource.start();
            
            // Sweep modulation
            const waveModulator = () => {
                if (!ambientNodes.waves) return;
                const now = audioCtx.currentTime;
                volume.gain.linearRampToValueAtTime(0.3, now + 4);
                volume.gain.linearRampToValueAtTime(0.02, now + 8);
                setTimeout(waveModulator, 8000);
            };
            
            ambientNodes.waves = { source: whiteNoiseSource, filter: lowpassFilter, volume: volume };
            waveModulator();
            
        } else if (type === 'forest') {
            // Dynamic wind blowing
            lowpassFilter.frequency.setValueAtTime(200, audioCtx.currentTime);
            const volume = audioCtx.createGain();
            volume.gain.value = 0.25;
            
            whiteNoiseSource.connect(lowpassFilter);
            lowpassFilter.connect(volume);
            volume.connect(audioCtx.destination);
            
            whiteNoiseSource.start();
            
            const windModulator = () => {
                if (!ambientNodes.forest) return;
                const now = audioCtx.currentTime;
                const nextFreq = Math.random() * 250 + 100;
                lowpassFilter.frequency.exponentialRampToValueAtTime(nextFreq, now + 3);
                setTimeout(windModulator, 3000);
            };
            
            ambientNodes.forest = { source: whiteNoiseSource, filter: lowpassFilter, volume: volume };
            windModulator();
            
        } else if (type === 'white') {
            // Pure white noise
            lowpassFilter.frequency.value = 1000;
            const volume = audioCtx.createGain();
            volume.gain.value = 0.15;
            
            whiteNoiseSource.connect(lowpassFilter);
            lowpassFilter.connect(volume);
            volume.connect(audioCtx.destination);
            
            whiteNoiseSource.start();
            ambientNodes.white = { source: whiteNoiseSource, filter: lowpassFilter, volume: volume };
        }
    } catch (e) {
        console.warn('Ambient noise synthesizer creation error:', e);
    }
}

function stopAmbientSound(type) {
    if (ambientNodes[type]) {
        try {
            ambientNodes[type].source.stop();
        } catch (e) {}
        ambientNodes[type] = null;
    }
}

// Tab 4: Aspects Manager logic
function renderAspectsManager() {
    const grid = document.getElementById('aspects-manager-grid');
    if (!grid) return;
    
    let html = '';
    
    state.aspects.forEach(aspect => {
        const tasksCount = state.tasks.filter(t => t.aspectId === aspect.id).length;
        const tasksDone = state.tasks.filter(t => t.aspectId === aspect.id && t.completed).length;
        
        html += `
        <div class="aspect-card-mgr" style="border-top: 4px solid ${aspect.color};">
            <div class="aspect-card-mgr-header">
                <span class="aspect-mgr-icon">${aspect.icon}</span>
                <div class="aspect-mgr-actions">
                    <button class="icon-btn" onclick="editAspect('${aspect.id}')" title="Edit Aspect">✏️</button>
                    <button class="icon-btn btn-delete" onclick="deleteAspect('${aspect.id}')" title="Delete Aspect">🗑️</button>
                </div>
            </div>
            <div>
                <h4 class="aspect-mgr-name">${escapeHtml(aspect.name)}</h4>
                <p class="aspect-mgr-stats">${tasksDone}/${tasksCount} tasks completed</p>
            </div>
        </div>
        `;
    });
    
    grid.innerHTML = html;
}

window.editAspect = function(aspectId) {
    const aspect = state.aspects.find(a => a.id === aspectId);
    if (!aspect) return;
    
    document.getElementById('aspect-id').value = aspect.id;
    document.getElementById('aspect-name').value = aspect.name;
    document.getElementById('aspect-color').value = aspect.color;
    document.getElementById('aspect-icon').value = aspect.icon;
    
    document.getElementById('aspect-form-title').innerText = 'Edit Aspect';
};

window.deleteAspect = function(aspectId) {
    // Check if aspect is used
    const tasksCount = state.tasks.filter(t => t.aspectId === aspectId).length;
    if (tasksCount > 0) {
        if (!confirm(`This aspect has ${tasksCount} task(s). Deleting it will re-assign them to a general aspect. Continue?`)) {
            return;
        }
        // Re-assign tasks
        state.tasks.forEach(t => {
            if (t.aspectId === aspectId) t.aspectId = 'life';
        });
    }
    
    state.aspects = state.aspects.filter(a => a.id !== aspectId);
    
    // reset filter if deleted
    if (state.activeAspectFilter === aspectId) {
        state.activeAspectFilter = 'all';
    }
    
    saveState();
    initializeUI();
};

window.saveAspect = function(event) {
    event.preventDefault();
    
    const id = document.getElementById('aspect-id').value;
    const name = document.getElementById('aspect-name').value;
    const color = document.getElementById('aspect-color').value;
    const icon = document.getElementById('aspect-icon').value;
    
    if (id) {
        // Edit existing
        const index = state.aspects.findIndex(a => a.id === id);
        if (index !== -1) {
            state.aspects[index] = { id, name, color, icon };
        }
    } else {
        // Create new
        const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'aspect_' + Math.random().toString(36).substr(2, 5);
        
        // Avoid duplicate ID
        if (state.aspects.some(a => a.id === newId)) {
            alert('An aspect with a similar name already exists!');
            return;
        }
        
        state.aspects.push({
            id: newId,
            name,
            color,
            icon
        });
    }
    
    // Reset form
    document.getElementById('aspect-form').reset();
    document.getElementById('aspect-id').value = '';
    document.getElementById('aspect-form-title').innerText = 'Create New Aspect';
    
    saveState();
    initializeUI();
};

// Escape helper to prevent HTML injection / script execution
function escapeHtml(str) {
    if (!str) return '';
    return str
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
