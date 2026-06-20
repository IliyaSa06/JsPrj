class TodoApp {
    constructor() {
        this.todos = [];
        this.filter = 'all';
        this.currentEditId = null;
        this.timers = {};
        this.theme = 'light';

        // DOM Elements
        this.todoInput = document.getElementById('todoInput');
        this.timerInput = document.getElementById('timerInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.taskCount = document.getElementById('taskCount');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.pendingTasks = document.getElementById('pendingTasks');
        this.totalTime = document.getElementById('totalTime');
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggle.querySelector('.theme-icon');
        this.themeLabel = this.themeToggle.querySelector('.theme-label');

        // Initialize
        this.loadTheme();
        this.loadTodos();
        this.bindEvents();
        this.render();
        this.updateTotalTime();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('todo_theme');
        if (savedTheme) {
            this.theme = savedTheme;
            this.applyTheme(savedTheme);
        } else {
            // Detect system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.theme = 'dark';
                this.applyTheme('dark');
            }
        }
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.themeIcon.className = 'bi bi-sun-fill theme-icon';
            this.themeLabel.textContent = 'روشن';
        } else {
            document.documentElement.removeAttribute('data-theme');
            this.themeIcon.className = 'bi bi-moon-fill theme-icon';
            this.themeLabel.textContent = 'دارک';
        }
        localStorage.setItem('todo_theme', theme);
        this.theme = theme;
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);

        // Add animation effect
        this.themeToggle.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.themeToggle.style.transform = 'scale(1)';
        }, 200);
    }

    loadTodos() {
        const stored = localStorage.getItem('todos_timer');
        if (stored) {
            this.todos = JSON.parse(stored);
            // Restore timers state
            this.todos.forEach(todo => {
                if (todo.hasTimer && todo.timerRemaining !== undefined) {
                    this.timers[todo.id] = {
                        remaining: todo.timerRemaining,
                        isRunning: false,
                        interval: null
                    };
                }
            });
        }
    }

    saveTodos() {
        // Save timer remaining time
        this.todos.forEach(todo => {
            if (todo.hasTimer && this.timers[todo.id]) {
                todo.timerRemaining = this.timers[todo.id].remaining;
                todo.timerIsRunning = this.timers[todo.id].isRunning;
            }
        });
        localStorage.setItem('todos_timer', JSON.stringify(this.todos));
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.timerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
        });
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        const timerMinutes = parseInt(this.timerInput.value) || 0;

        if (!text) {
            this.todoInput.classList.add('is-invalid');
            this.todoInput.focus();
            setTimeout(() => {
                this.todoInput.classList.remove('is-invalid');
            }, 1500);
            this.showNotification('لطفاً متن وظیفه را وارد کنید', 'warning');
            return;
        }

        if (this.currentEditId) {
            this.updateTodo(this.currentEditId, text, timerMinutes);
            this.currentEditId = null;
            this.addBtn.innerHTML = '<i class="bi bi-plus-lg me-2"></i> افزودن';
            this.addBtn.className = 'btn btn-primary btn-lg px-4';
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            hasTimer: timerMinutes > 0,
            timerDuration: timerMinutes * 60,
            timerRemaining: timerMinutes * 60,
            timerIsRunning: false
        };

        this.todos.push(todo);

        if (todo.hasTimer) {
            this.timers[todo.id] = {
                remaining: todo.timerDuration,
                isRunning: false,
                interval: null
            };
        }

        this.saveTodos();
        this.render();
        this.updateTotalTime();
        this.showNotification('وظیفه با موفقیت اضافه شد', 'success');

        this.todoInput.value = '';
        this.timerInput.value = '25';
        this.todoInput.focus();
    }

    deleteTodo(id) {
        // Stop timer if running
        if (this.timers[id] && this.timers[id].interval) {
            clearInterval(this.timers[id].interval);
        }
        delete this.timers[id];

        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.render();
        this.updateTotalTime();
        this.showNotification('وظیفه حذف شد', 'danger');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;

            // Stop timer if task is completed
            if (todo.completed && this.timers[id]) {
                this.stopTimer(id);
            }

            this.saveTodos();
            this.render();
            this.updateTotalTime();
            const status = todo.completed ? 'انجام شد' : 'فعال شد';
            this.showNotification(`وظیفه ${status}`, 'info');
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.todoInput.value = todo.text;
            this.timerInput.value = todo.hasTimer ? Math.ceil(todo.timerDuration / 60) : 0;
            this.todoInput.focus();
            this.currentEditId = id;
            this.addBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i> ویرایش';
            this.addBtn.className = 'btn btn-warning btn-lg px-4';
            this.showNotification('در حال ویرایش وظیفه...', 'info');
        }
    }

    updateTodo(id, newText, timerMinutes) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;

            // Update timer
            const hadTimer = todo.hasTimer;
            const newHasTimer = timerMinutes > 0;
            const newDuration = timerMinutes * 60;

            if (newHasTimer && !hadTimer) {
                // Add timer
                todo.hasTimer = true;
                todo.timerDuration = newDuration;
                todo.timerRemaining = newDuration;
                todo.timerIsRunning = false;
                this.timers[id] = {
                    remaining: newDuration,
                    isRunning: false,
                    interval: null
                };
            } else if (newHasTimer && hadTimer) {
                // Update timer duration
                todo.timerDuration = newDuration;
                if (this.timers[id]) {
                    this.timers[id].remaining = newDuration;
                    this.timers[id].isRunning = false;
                    if (this.timers[id].interval) {
                        clearInterval(this.timers[id].interval);
                        this.timers[id].interval = null;
                    }
                }
            } else if (!newHasTimer && hadTimer) {
                // Remove timer
                todo.hasTimer = false;
                todo.timerDuration = 0;
                todo.timerRemaining = 0;
                todo.timerIsRunning = false;
                if (this.timers[id]) {
                    if (this.timers[id].interval) {
                        clearInterval(this.timers[id].interval);
                    }
                    delete this.timers[id];
                }
            }

            this.saveTodos();
            this.render();
            this.updateTotalTime();
            this.showNotification('وظیفه ویرایش شد', 'success');
        }
    }

    // Timer Controls
    startTimer(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo || todo.completed) return;

        if (this.timers[id] && this.timers[id].remaining > 0 && !this.timers[id].isRunning) {
            this.timers[id].isRunning = true;
            todo.timerIsRunning = true;

            this.timers[id].interval = setInterval(() => {
                if (this.timers[id].remaining > 0) {
                    this.timers[id].remaining--;
                    todo.timerRemaining = this.timers[id].remaining;
                    this.saveTodos();
                    this.render();

                    // Check if timer reached 0
                    if (this.timers[id].remaining === 0) {
                        this.stopTimer(id);
                        this.showNotification(`⏰ زمان وظیفه "${todo.text}" به پایان رسید!`, 'warning');
                        // Play sound effect if supported
                        try {
                            const audio = new Audio('data:audio/wav;base64,UklGRlAAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAABAAIAA');
                            audio.play().catch(() => {});
                        } catch(e) {}
                    }
                }
            }, 1000);

            this.saveTodos();
            this.render();
        }
    }

    stopTimer(id) {
        if (this.timers[id]) {
            this.timers[id].isRunning = false;
            const todo = this.todos.find(t => t.id === id);
            if (todo) todo.timerIsRunning = false;

            if (this.timers[id].interval) {
                clearInterval(this.timers[id].interval);
                this.timers[id].interval = null;
            }
            this.saveTodos();
            this.render();
        }
    }

    resetTimer(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && todo.hasTimer) {
            if (this.timers[id]) {
                this.stopTimer(id);
                this.timers[id].remaining = todo.timerDuration;
                todo.timerRemaining = todo.timerDuration;
                this.saveTodos();
                this.render();
            }
        }
    }

    clearAll() {
        if (this.todos.length === 0) {
            this.showNotification('هیچ وظیفه‌ای برای حذف وجود ندارد', 'info');
            return;
        }

        // Stop all timers
        Object.keys(this.timers).forEach(id => {
            this.stopTimer(parseInt(id));
        });

        const modalHtml = `
            <div class="modal fade" id="confirmModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="background: var(--bg-card); color: var(--text-primary);">
                        <div class="modal-header border-0">
                            <h5 class="modal-title text-danger">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                تأیید حذف
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" style="filter: var(--btn-close-filter);"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">آیا مطمئن هستید که می‌خواهید همه ${this.todos.length} وظیفه را حذف کنید؟</p>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteAll">حذف همه</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('confirmModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();

        document.getElementById('confirmDeleteAll').addEventListener('click', () => {
            this.todos = [];
            this.timers = {};
            this.saveTodos();
            this.render();
            this.updateTotalTime();
            modal.hide();
            this.showNotification('همه وظایف حذف شدند', 'danger');
            setTimeout(() => {
                const modalElement = document.getElementById('confirmModal');
                if (modalElement) modalElement.remove();
            }, 300);
        });
    }

    setFilter(filter) {
        this.filter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTodos() {
        switch (this.filter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'timed':
                return this.todos.filter(todo => todo.hasTimer);
            default:
                return this.todos;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    render() {
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            const emptyMessages = {
                all: 'هیچ وظیفه‌ای وجود ندارد',
                active: 'هیچ وظیفه فعالی وجود ندارد 🎉',
                completed: 'هیچ وظیفه انجام شده‌ای وجود ندارد',
                timed: 'هیچ وظیفه‌ای با تایمر وجود ندارد ⏰'
            };
            this.todoList.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>${emptyMessages[this.filter] || emptyMessages.all}</p>
                </div>
            `;
        } else {
            this.todoList.innerHTML = filteredTodos.map(todo => {
                const timer = this.timers[todo.id];
                const remaining = timer ? timer.remaining : (todo.timerRemaining || 0);
                const isRunning = timer ? timer.isRunning : false;
                const hasTimer = todo.hasTimer;
                const isCompleted = todo.completed;

                let timerHtml = '';
                if (hasTimer) {
                    const timerClass = remaining <= 10 && remaining > 0 ? 'warning' :
                        (remaining === 0 ? 'completed-timer' : '');
                    const timerDisplay = remaining > 0 ? this.formatTime(remaining) : '00:00';

                    timerHtml = `
                        <div class="todo-timer ${timerClass}">
                            <i class="bi bi-clock"></i>
                            <span class="timer-display">${timerDisplay}</span>
                            ${!isCompleted && remaining > 0 ? `
                                ${!isRunning ?
                        `<button class="timer-start" onclick="app.startTimer(${todo.id})" title="شروع">
                                        <i class="bi bi-play-fill"></i>
                                    </button>` :
                        `<button class="timer-stop" onclick="app.stopTimer(${todo.id})" title="توقف">
                                        <i class="bi bi-pause-fill"></i>
                                    </button>`
                    }
                                <button class="timer-reset" onclick="app.resetTimer(${todo.id})" title="ریست">
                                    <i class="bi bi-arrow-counterclockwise"></i>
                                </button>
                            ` : ''}
                            ${isCompleted && remaining > 0 ? `
                                <span style="font-size: 0.8rem; color: var(--text-muted);">(توقف)</span>
                            ` : ''}
                            ${remaining === 0 && !isCompleted ? `
                                <span style="font-size: 0.8rem; color: #ef4444;">⏰ پایان</span>
                            ` : ''}
                        </div>
                    `;
                }

                return `
                    <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                        <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="app.toggleTodo(${todo.id})">
                            <i class="bi bi-check-lg"></i>
                        </div>
                        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                        ${timerHtml}
                        <div class="todo-actions">
                            ${!todo.completed ? `
                                <button class="edit-btn" onclick="app.editTodo(${todo.id})" title="ویرایش">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            ` : ''}
                            <button class="delete-btn" onclick="app.deleteTodo(${todo.id})" title="حذف">
                                <i class="bi bi-trash3"></i>
                            </button>
                        </div>
                    </li>
                `;
            }).join('');
        }

        this.updateStats();
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasks.textContent = total;
        this.completedTasks.textContent = completed;
        this.pendingTasks.textContent = pending;

        let text = `${total} وظیفه`;
        if (pending > 0) {
            text += ` (${pending} در انتظار)`;
        }
        this.taskCount.innerHTML = `<i class="bi bi-info-circle me-1"></i> ${text}`;
    }

    updateTotalTime() {
        let totalMinutes = 0;
        this.todos.forEach(todo => {
            if (todo.hasTimer && todo.timerDuration) {
                totalMinutes += Math.ceil(todo.timerDuration / 60);
            }
        });
        this.totalTime.textContent = totalMinutes;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const icons = {
            success: 'bi-check-circle-fill',
            danger: 'bi-x-circle-fill',
            warning: 'bi-exclamation-circle-fill',
            info: 'bi-info-circle-fill'
        };

        const notification = document.createElement('div');
        const isDark = this.theme === 'dark';
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: ${isDark ? '#1a1a2e' : 'white'};
            color: ${isDark ? '#e2e8f0' : '#1a202c'};
            padding: 16px 24px;
            border-radius: 16px;
            font-family: 'Vazirmatn', sans-serif;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            border-right: 4px solid ${colors[type]};
            animation: slideInRight 0.4s ease;
            direction: rtl;
            max-width: 400px;
        `;

        notification.innerHTML = `
            <i class="bi ${icons[type]}" style="color: ${colors[type]}; font-size: 1.5rem;"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease forwards';
            setTimeout(() => {
                notification.remove();
            }, 400);
        }, 3000);
    }
}

// Initialize the app
const app = new TodoApp();
window.app = app;

// Add CSS for notification animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
`;
document.head.appendChild(styleSheet);