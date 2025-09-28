// Sample data for the application
let columns = [
    {
        id: 1,
        title: "To Do",
        tasks: [
            { id: 1, title: "Design Homepage", description: "Create wireframes and mockups for the homepage", priority: "high" },
            { id: 2, title: "Research Competitors", description: "Analyze competitor websites and features", priority: "medium" },
            { id: 3, title: "Setup Project Repository", description: "Initialize Git repository and project structure", priority: "low" }
        ]
    },
    {
        id: 2,
        title: "In Progress",
        tasks: [
            { id: 4, title: "Develop Login Feature", description: "Implement user authentication system", priority: "high" },
            { id: 5, title: "Write Documentation", description: "Create user guides and API documentation", priority: "medium" }
        ]
    },
    {
        id: 3,
        title: "Done",
        tasks: [
            { id: 6, title: "Project Planning", description: "Define project scope and requirements", priority: "high" },
            { id: 7, title: "Team Setup", description: "Assign roles and responsibilities to team members", priority: "medium" },
            { id: 8, title: "Technology Stack Selection", description: "Choose frameworks and tools for development", priority: "low" }
        ]
    }
];

let notifications = [
    { id: 1, title: "Task Added", message: "New task 'Design Homepage' added to To Do", time: "10 minutes ago", type: "add" },
    { id: 2, title: "Task Moved", message: "Task 'Project Planning' moved to Done", time: "1 hour ago", type: "move" },
    { id: 3, title: "Task Updated", message: "Task 'Develop Login Feature' was updated", time: "2 hours ago", type: "update" }
];

let nextTaskId = 9;
let nextColumnId = 4;
let nextNotificationId = 4;

// Chart instances
let taskDistributionChart, priorityChart;

// DOM Elements
const kanbanBoard = document.getElementById('kanbanBoard');
const searchBar = document.querySelector('.search-bar');
const notificationBtn = document.getElementById('notificationBtn');
const notificationPanel = document.getElementById('notificationPanel');
const userBtn = document.getElementById('userBtn');
const userDropdown = document.getElementById('userDropdown');
const addColumnBtn = document.getElementById('addColumnBtn');
const taskModal = document.getElementById('taskModal');
const columnModal = document.getElementById('columnModal');
const snackbar = document.getElementById('snackbar');
const timeFilter = document.getElementById('timeFilter');

// Initialize the application
function init() {
    renderColumns();
    renderNotifications();
    setupEventListeners();
    initializeCharts();
    updateAllRealTimeData();
}

// Render columns and tasks
function renderColumns() {
    kanbanBoard.innerHTML = '';
    
    columns.forEach(column => {
        const columnElement = document.createElement('div');
        columnElement.className = 'column';
        columnElement.setAttribute('data-column-id', column.id);
        
        columnElement.innerHTML = `
            <div class="column-header">
                <div class="column-title">
                    <i class="fas fa-list-ul"></i>
                    <span>${column.title}</span>
                    <span class="task-count">(${column.tasks.length})</span>
                </div>
                <div class="column-actions">
                    <button class="column-action-btn edit-column" title="Edit Column">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="column-action-btn delete-column" title="Delete Column">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="tasks-container" data-column-id="${column.id}">
                ${column.tasks.map(task => `
                    <div class="task" data-task-id="${task.id}" draggable="true">
                        <div class="task-header">
                            <div class="task-title">${task.title}</div>
                            <div class="task-priority priority-${task.priority}">${task.priority}</div>
                        </div>
                        <div class="task-description">${task.description}</div>
                        <div class="task-footer">
                            <div class="task-actions">
                                <button class="task-action-btn edit-task" title="Edit Task">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="task-action-btn delete-task" title="Delete Task">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="task-date">Today</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-task-btn" data-column-id="${column.id}">
                <i class="fas fa-plus"></i> Add Task
            </button>
        `;
        
        kanbanBoard.appendChild(columnElement);
    });
    
    // Make tasks draggable
    setupDragAndDrop();
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const tasks = document.querySelectorAll('.task');
    const columns = document.querySelectorAll('.tasks-container');
    
    tasks.forEach(task => {
        task.addEventListener('dragstart', dragStart);
        task.addEventListener('dragend', dragEnd);
    });
    
    columns.forEach(column => {
        column.addEventListener('dragover', dragOver);
        column.addEventListener('dragenter', dragEnter);
        column.addEventListener('dragleave', dragLeave);
        column.addEventListener('drop', drop);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    setTimeout(() => {
        e.target.classList.add('dragging');
    }, 0);
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    e.target.classList.add('drag-over');
}

function dragLeave(e) {
    e.target.classList.remove('drag-over');
}

function drop(e) {
    e.preventDefault();
    e.target.classList.remove('drag-over');
    
    const taskId = e.dataTransfer.getData('text/plain');
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const targetColumn = e.target.closest('.tasks-container');
    
    if (targetColumn && taskElement) {
        const sourceColumnId = parseInt(taskElement.closest('.tasks-container').dataset.columnId);
        const targetColumnId = parseInt(targetColumn.dataset.columnId);
        
        if (sourceColumnId !== targetColumnId) {
            // Move task to new column
            moveTask(parseInt(taskId), sourceColumnId, targetColumnId);
            const taskTitle = getTaskById(parseInt(taskId))?.title || 'Task';
            showNotification('Task Moved', `Task "${taskTitle}" moved to ${getColumnTitle(targetColumnId)}`, 'move');
        }
        
        targetColumn.appendChild(taskElement);
        
        // Update all real-time data after drag & drop
        updateAllRealTimeData();
    }
}

// Move task between columns in data model
function moveTask(taskId, fromColumnId, toColumnId) {
    const fromColumn = columns.find(col => col.id === fromColumnId);
    const toColumn = columns.find(col => col.id === toColumnId);
    
    if (fromColumn && toColumn) {
        const taskIndex = fromColumn.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const task = fromColumn.tasks[taskIndex];
            fromColumn.tasks.splice(taskIndex, 1);
            toColumn.tasks.push(task);
        }
    }
}

// Get column title by ID
function getColumnTitle(columnId) {
    const column = columns.find(col => col.id === columnId);
    return column ? column.title : '';
}

// Render notifications
function renderNotifications() {
    const notificationList = document.querySelector('.notification-list');
    notificationList.innerHTML = '';
    
    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        
        let icon = 'fas fa-info-circle';
        if (notification.type === 'add') icon = 'fas fa-plus-circle';
        else if (notification.type === 'delete') icon = 'fas fa-trash';
        else if (notification.type === 'update') icon = 'fas fa-edit';
        else if (notification.type === 'move') icon = 'fas fa-arrows-alt';
        
        notificationItem.innerHTML = `
            <div class="notification-icon">
                <i class="${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${notification.time}</div>
            </div>
        `;
        
        notificationList.appendChild(notificationItem);
    });
    
    // Update notification badge
    const badge = document.querySelector('.notification-badge');
    badge.textContent = notifications.length;
}

// Show notification snackbar
function showSnackbar(message, type = 'info') {
    snackbar.textContent = message;
    snackbar.className = 'snackbar';
    
    if (type === 'success') snackbar.style.backgroundColor = '#4caf50';
    else if (type === 'error') snackbar.style.backgroundColor = '#f44336';
    else if (type === 'warning') snackbar.style.backgroundColor = '#ff9800';
    else snackbar.style.backgroundColor = '#333';
    
    snackbar.classList.add('show');
    
    setTimeout(() => {
        snackbar.classList.remove('show');
    }, 3000);
}

// Add notification
function showNotification(title, message, type = 'info') {
    const now = new Date();
    const time = formatTime(now);
    
    notifications.unshift({
        id: nextNotificationId++,
        title,
        message,
        time,
        type
    });
    
    renderNotifications();
    showSnackbar(message, type);
}

// Format time for notifications
function formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
}

// Update dashboard statistics
function updateDashboardStats() {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    
    columns.forEach(column => {
        total += column.tasks.length;
        if (column.title === 'Done') completed = column.tasks.length;
        if (column.title === 'In Progress') inProgress = column.tasks.length;
    });
    
    // Update dashboard stats
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Update all dashboard stat values
    const dashboardStats = document.querySelectorAll('.dashboard-stat-value');
    if (dashboardStats.length >= 4) {
        dashboardStats[0].textContent = `${completionRate}%`; // Completion Rate
        dashboardStats[1].textContent = total; // Total Tasks
        dashboardStats[2].textContent = completed; // Completed
        dashboardStats[3].textContent = inProgress; // In Progress
    }
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${completionRate}%`;
    }
}

// Initialize charts
function initializeCharts() {
    const taskDistributionCtx = document.getElementById('taskDistributionChart').getContext('2d');
    const priorityCtx = document.getElementById('priorityChart').getContext('2d');
    
    // Task Distribution Chart (Doughnut)
    taskDistributionChart = new Chart(taskDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: columns.map(col => col.title),
            datasets: [{
                data: columns.map(col => col.tasks.length),
                backgroundColor: [
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(76, 201, 240, 0.7)',
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(255, 152, 0, 0.7)',
                    'rgba(156, 39, 176, 0.7)'
                ],
                borderColor: [
                    'rgba(67, 97, 238, 1)',
                    'rgba(76, 201, 240, 1)',
                    'rgba(76, 175, 80, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(156, 39, 176, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} tasks (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Priority Chart (Pie)
    priorityChart = new Chart(priorityCtx, {
        type: 'pie',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: calculatePriorityCounts(),
                backgroundColor: [
                    'rgba(230, 57, 70, 0.7)',
                    'rgba(255, 152, 0, 0.7)',
                    'rgba(76, 175, 80, 0.7)'
                ],
                borderColor: [
                    'rgba(230, 57, 70, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(76, 175, 80, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Calculate priority counts
function calculatePriorityCounts() {
    const priorityCounts = { high: 0, medium: 0, low: 0 };
    columns.forEach(column => {
        column.tasks.forEach(task => {
            priorityCounts[task.priority]++;
        });
    });
    
    return [
        priorityCounts.high,
        priorityCounts.medium,
        priorityCounts.low
    ];
}

// Update charts with current data
function updateCharts() {
    // Update task distribution chart
    taskDistributionChart.data.datasets[0].data = columns.map(col => col.tasks.length);
    taskDistributionChart.data.labels = columns.map(col => col.title);
    taskDistributionChart.update();
    
    // Update priority chart
    priorityChart.data.datasets[0].data = calculatePriorityCounts();
    priorityChart.update();
}

// Update all real-time data
function updateAllRealTimeData() {
    updateDashboardStats(); // Update dashboard stats
    updateCharts(); // Update both charts
    updateColumnTaskCounts(); // Update task counts in column headers
}

// Update task counts in column headers
function updateColumnTaskCounts() {
    columns.forEach(column => {
        const columnElement = document.querySelector(`[data-column-id="${column.id}"]`);
        if (columnElement) {
            const taskCountElement = columnElement.querySelector('.task-count');
            if (taskCountElement) {
                taskCountElement.textContent = `(${column.tasks.length})`;
            }
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality - FIXED: Remove highlight when search is cleared
    searchBar.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const tasks = document.querySelectorAll('.task');
        
        tasks.forEach(task => {
            const title = task.querySelector('.task-title').textContent.toLowerCase();
            const description = task.querySelector('.task-description').textContent.toLowerCase();
            
            if (searchTerm && (title.includes(searchTerm) || description.includes(searchTerm))) {
                task.classList.add('task-highlight');
                task.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Remove highlight when search term is empty or doesn't match
                task.classList.remove('task-highlight');
            }
        });
    });
    
    // Notification panel toggle
    notificationBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationPanel.style.display = notificationPanel.style.display === 'block' ? 'none' : 'block';
        userDropdown.style.display = 'none';
    });
    
    // User dropdown toggle
    userBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        notificationPanel.style.display = 'none';
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        notificationPanel.style.display = 'none';
        userDropdown.style.display = 'none';
    });
    
    // Add column button
    addColumnBtn.addEventListener('click', function() {
        document.getElementById('columnTitle').value = '';
        columnModal.style.display = 'flex';
        columnModal.dataset.columnId = '';
        document.querySelector('#columnModal .modal-title').textContent = 'Add New Column';
    });
    
    // Add task buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-task-btn')) {
            const columnId = parseInt(e.target.dataset.columnId);
            openTaskModal(null, columnId);
        }
    });
    
    // Edit task buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-task')) {
            const taskElement = e.target.closest('.task');
            const taskId = parseInt(taskElement.dataset.taskId);
            const columnId = parseInt(taskElement.closest('.tasks-container').dataset.columnId);
            openTaskModal(taskId, columnId);
        }
    });
    
    // Delete task buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-task')) {
            const taskElement = e.target.closest('.task');
            const taskId = parseInt(taskElement.dataset.taskId);
            const columnId = parseInt(taskElement.closest('.tasks-container').dataset.columnId);
            deleteTask(taskId, columnId);
        }
    });
    
    // Edit column buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-column')) {
            const columnElement = e.target.closest('.column');
            const columnId = parseInt(columnElement.dataset.columnId);
            editColumn(columnId);
        }
    });
    
    // Delete column buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-column')) {
            const columnElement = e.target.closest('.column');
            const columnId = parseInt(columnElement.dataset.columnId);
            deleteColumn(columnId);
        }
    });
    
    // Modal close buttons
    document.getElementById('taskModalClose').addEventListener('click', closeTaskModal);
    document.getElementById('taskModalCancel').addEventListener('click', closeTaskModal);
    document.getElementById('columnModalClose').addEventListener('click', closeColumnModal);
    document.getElementById('columnModalCancel').addEventListener('click', closeColumnModal);
    
    // Modal save buttons
    document.getElementById('taskModalSave').addEventListener('click', saveTask);
    document.getElementById('columnModalSave').addEventListener('click', saveColumn);
    
    // Clear notifications
    document.querySelector('.notification-clear').addEventListener('click', clearNotifications);
    
    // Time filter change
    timeFilter.addEventListener('change', function() {
        // In a real app, this would filter data based on the selected time range
        showSnackbar(`Data filtered for ${this.value}`);
    });
}

// Open task modal for adding/editing
function openTaskModal(taskId = null, columnId = null) {
    const modal = document.getElementById('taskModal');
    const title = document.getElementById('taskModalTitle');
    const form = document.getElementById('taskForm');
    const columnSelect = document.getElementById('taskColumn');
    
    // Populate column dropdown
    columnSelect.innerHTML = '';
    columns.forEach(column => {
        const option = document.createElement('option');
        option.value = column.id;
        option.textContent = column.title;
        if (column.id === columnId) option.selected = true;
        columnSelect.appendChild(option);
    });
    
    if (taskId) {
        // Editing existing task
        title.textContent = 'Edit Task';
        const task = getTaskById(taskId);
        if (task) {
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskPriority').value = task.priority;
        }
    } else {
        // Adding new task
        title.textContent = 'Add New Task';
        form.reset();
    }
    
    modal.style.display = 'flex';
    modal.dataset.taskId = taskId || '';
    modal.dataset.columnId = columnId || '';
}

// Close task modal
function closeTaskModal() {
    taskModal.style.display = 'none';
}

// Save task (add or edit)
function saveTask() {
    const taskId = taskModal.dataset.taskId;
    const columnId = parseInt(taskModal.dataset.columnId);
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const targetColumnId = parseInt(document.getElementById('taskColumn').value);
    
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    if (taskId) {
        // Edit existing task
        const task = getTaskById(parseInt(taskId));
        if (task) {
            const oldTitle = task.title;
            task.title = title;
            task.description = description;
            task.priority = priority;
            
            // Move task if column changed
            if (columnId !== targetColumnId) {
                moveTask(parseInt(taskId), columnId, targetColumnId);
            }
            
            showNotification('Task Updated', `Task "${oldTitle}" was updated`, 'update');
        }
    } else {
        // Add new task
        const newTask = {
            id: nextTaskId++,
            title,
            description,
            priority
        };
        
        const targetColumn = columns.find(col => col.id === targetColumnId);
        if (targetColumn) {
            targetColumn.tasks.push(newTask);
            showNotification('Task Added', `New task "${title}" added to ${targetColumn.title}`, 'add');
        }
    }
    
    renderColumns(); // Re-render to reflect changes
    updateAllRealTimeData(); // Update all real-time data
    closeTaskModal();
}

// Get task by ID
function getTaskById(taskId) {
    for (const column of columns) {
        const task = column.tasks.find(t => t.id === taskId);
        if (task) return task;
    }
    return null;
}

// Delete task
function deleteTask(taskId, columnId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const column = columns.find(col => col.id === columnId);
        if (column) {
            const taskIndex = column.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                const taskTitle = column.tasks[taskIndex].title;
                column.tasks.splice(taskIndex, 1);
                showNotification('Task Deleted', `Task "${taskTitle}" was deleted`, 'delete');
                renderColumns(); // Re-render to reflect changes
                updateAllRealTimeData(); // Update all real-time data
            }
        }
    }
}

// Edit column
function editColumn(columnId) {
    const column = columns.find(col => col.id === columnId);
    if (column) {
        document.getElementById('columnTitle').value = column.title;
        columnModal.style.display = 'flex';
        columnModal.dataset.columnId = columnId;
        document.querySelector('#columnModal .modal-title').textContent = 'Edit Column';
    }
}

// Delete column
function deleteColumn(columnId) {
    if (columns.length <= 1) {
        alert('You must have at least one column');
        return;
    }
    
    const column = columns.find(col => col.id === columnId);
    if (column && confirm(`Are you sure you want to delete the "${column.title}" column? All tasks in this column will be moved to the first available column.`)) {
        // Move tasks to the first column that's not being deleted
        const firstColumn = columns.find(col => col.id !== columnId);
        if (firstColumn) {
            const movedTasksCount = column.tasks.length;
            firstColumn.tasks.push(...column.tasks);
            
            // Remove the column
            columns = columns.filter(col => col.id !== columnId);
            
            showNotification('Column Deleted', `Column "${column.title}" was deleted and ${movedTasksCount} tasks moved to ${firstColumn.title}`, 'delete');
            renderColumns(); // Re-render to reflect changes
            updateAllRealTimeData(); // Update all real-time data
        }
    }
}

// Close column modal
function closeColumnModal() {
    columnModal.style.display = 'none';
}

// Save column (add or edit)
function saveColumn() {
    const title = document.getElementById('columnTitle').value.trim();
    const columnId = columnModal.dataset.columnId;
    
    if (!title) {
        alert('Please enter a column title');
        return;
    }
    
    if (columnId) {
        // Edit existing column
        const column = columns.find(col => col.id === parseInt(columnId));
        if (column) {
            const oldTitle = column.title;
            column.title = title;
            showNotification('Column Updated', `Column renamed to "${title}"`, 'update');
        }
    } else {
        // Add new column
        const newColumn = {
            id: nextColumnId++,
            title,
            tasks: []
        };
        
        columns.push(newColumn);
        showNotification('Column Added', `New column "${title}" added`, 'add');
    }
    
    renderColumns(); // Re-render to reflect changes
    updateAllRealTimeData(); // Update all real-time data
    closeColumnModal();
}

// Clear all notifications
function clearNotifications() {
    if (notifications.length > 0 && confirm('Clear all notifications?')) {
        notifications = [];
        renderNotifications();
        showSnackbar('All notifications cleared');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);