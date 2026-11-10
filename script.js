
// ==========================================
// PROJECT MANAGEMENT SYSTEM - PROJECTHUB
// ==========================================

const PROJECT_KEY = "projectHubProjects";
const TASK_KEY = "projectHubTasks";

let projects = JSON.parse(localStorage.getItem(PROJECT_KEY) || "[]");
let tasks = JSON.parse(localStorage.getItem(TASK_KEY) || "[]");

const projectForm = document.getElementById("projectForm");
const taskForm = document.getElementById("taskForm");

const projectGrid = document.getElementById("projectGrid");
const taskTable = document.getElementById("taskTable");

// ==========================================
// INITIALIZATION
// ==========================================

function initialize() {
    document.getElementById("today").textContent =
        new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    const today = new Date();
    const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

    document.getElementById("startDate").min = localToday;
    document.getElementById("deadline").min = localToday;
    document.getElementById("taskDeadline").min = localToday;

    renderAll();
}

// ==========================================
// SAVE DATA
// ==========================================

function saveData() {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(projects));
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function getProjectProgress(projectId) {
    const projectTasks = tasks.filter(
        task => task.projectId === projectId
    );

    if (!projectTasks.length) return 0;

    const completed = projectTasks.filter(
        task => task.status === "Completed"
    ).length;

    return Math.round(
        (completed / projectTasks.length) * 100
    );
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ==========================================
// CREATE PROJECT
// ==========================================

projectForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("projectName").value.trim();
    const manager = document.getElementById("manager").value.trim();
    const startDate = document.getElementById("startDate").value;
    const deadline = document.getElementById("deadline").value;
    const priority = document.getElementById("priority").value;
    const status = document.getElementById("projectStatus").value;
    const description = document.getElementById("description").value.trim();

    if (new Date(deadline) < new Date(startDate)) {
        showToast("Deadline cannot be before start date!");
        return;
    }

    const project = {
        id: Date.now(),
        name,
        manager,
        startDate,
        deadline,
        priority,
        status,
        description,
        createdAt: new Date().toISOString()
    };

    projects.unshift(project);

    saveData();
    renderAll();

    projectForm.reset();

    document.getElementById("startDate").min =
        new Date().toISOString().split("T")[0];

    showToast("Project created successfully!");
});

// ==========================================
// DISPLAY PROJECTS
// ==========================================

function renderProjects() {

    const search = document.getElementById("searchProject")
        .value.toLowerCase().trim();

    const filter = document.getElementById("filterProject").value;

    const filtered = projects.filter(project => {

        const matchesSearch =
            project.name.toLowerCase().includes(search) ||
            project.manager.toLowerCase().includes(search);

        const matchesFilter =
            filter === "All" || project.status === filter;

        return matchesSearch && matchesFilter;
    });

    projectGrid.innerHTML = "";

    document.getElementById("emptyProjects").style.display =
        filtered.length ? "none" : "block";

    document.getElementById("projectCount").textContent =
        `${filtered.length} Projects`;

    filtered.forEach(project => {

        const progress = getProjectProgress(project.id);

        const card = document.createElement("div");
        card.className = "project-card";

        const statusClass = project.status.replace(/\s+/g, "-");

        card.innerHTML = `
            <div class="project-top">

                <div class="project-icon">
                    <i class="fa-solid fa-folder-open"></i>
                </div>

                <div class="project-actions">

                    <button class="icon-btn"
                        data-action="edit-project"
                        data-id="${project.id}"
                        title="Edit project">
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button class="icon-btn"
                        data-action="delete-project"
                        data-id="${project.id}"
                        title="Delete project">
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>
            </div>

            <h3>${escapeHTML(project.name)}</h3>

            <p>${escapeHTML(project.description)}</p>

            <div class="project-meta">
                <span>Manager: <strong>${escapeHTML(project.manager)}</strong></span>
                <span>${tasks.filter(t => t.projectId === project.id).length} Tasks</span>
            </div>

            <div class="project-meta">
                <span>Deadline</span>
                <strong>${formatDate(project.deadline)}</strong>
            </div>

            <div class="progress-heading">
                <span>Task Progress</span>
                <strong>${progress}%</strong>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width:${progress}%"></div>
            </div>

            <div class="project-bottom">
                <span class="badge ${statusClass}">
                    ${escapeHTML(project.status)}
                </span>

                <span class="priority ${project.priority}">
                    ${escapeHTML(project.priority)} Priority
                </span>
            </div>
        `;

        projectGrid.appendChild(card);
    });

    updateProjectDropdown();
}

// ==========================================
// EDIT / DELETE PROJECT
// ==========================================

projectGrid.addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    const project = projects.find(p => p.id === id);

    if (!project) return;

    if (action === "delete-project") {

        if (!confirm(
            `Delete "${project.name}" and all its tasks?`
        )) return;

        projects = projects.filter(p => p.id !== id);

        tasks = tasks.filter(t => t.projectId !== id);

        saveData();
        renderAll();

        showToast("Project deleted successfully!");

    } else if (action === "edit-project") {

        const newName = prompt("Enter project name:", project.name);

        if (newName === null) return;

        if (!newName.trim()) {
            showToast("Project name cannot be empty!");
            return;
        }

        const newManager = prompt(
            "Enter project manager:",
            project.manager
        );

        if (newManager === null) return;

        if (!newManager.trim()) {
            showToast("Manager name cannot be empty!");
            return;
        }

        project.name = newName.trim();
        project.manager = newManager.trim();

        saveData();
        renderAll();

        showToast("Project updated successfully!");
    }
});

// ==========================================
// UPDATE PROJECT DROPDOWN
// ==========================================

function updateProjectDropdown() {

    const dropdown = document.getElementById("taskProject");

    const currentValue = dropdown.value;

    dropdown.innerHTML = `
        <option value="">Select project</option>
    `;

    projects.forEach(project => {

        const option = document.createElement("option");

        option.value = project.id;
        option.textContent = project.name;

        dropdown.appendChild(option);
    });

    if (projects.some(p => String(p.id) === currentValue)) {
        dropdown.value = currentValue;
    }
}

// ==========================================
// CREATE TASK
// ==========================================

taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("taskName").value.trim();
    const projectId = Number(document.getElementById("taskProject").value);
    const assignedTo = document.getElementById("assignedTo").value.trim();
    const priority = document.getElementById("taskPriority").value;
    const deadline = document.getElementById("taskDeadline").value;
    const status = document.getElementById("taskStatus").value;

    const project = projects.find(p => p.id === projectId);

    if (!project) {
        showToast("Please select a valid project!");
        return;
    }

    if (deadline < project.startDate || deadline > project.deadline) {
        showToast("Task due date must be within project dates!");
        return;
    }

    const task = {
        id: Date.now(),
        name,
        projectId,
        assignedTo,
        priority,
        deadline,
        status
    };

    tasks.unshift(task);

    saveData();
    renderAll();

    taskForm.reset();

    showToast("Task added successfully!");
});

// ==========================================
// DISPLAY TASKS
// ==========================================

function renderTasks() {

    const search = document.getElementById("searchTask")
        .value.toLowerCase().trim();

    const filter = document.getElementById("filterTask").value;

    const filtered = tasks.filter(task => {

        const project = projects.find(
            p => p.id === task.projectId
        );

        const projectName = project ? project.name : "";

        const matchesSearch =
            task.name.toLowerCase().includes(search) ||
            task.assignedTo.toLowerCase().includes(search) ||
            projectName.toLowerCase().includes(search);

        const matchesFilter =
            filter === "All" || task.status === filter;

        return matchesSearch && matchesFilter;
    });

    taskTable.innerHTML = "";

    document.getElementById("emptyTasks").style.display =
        filtered.length ? "none" : "block";

    filtered.forEach(task => {

        const project = projects.find(
            p => p.id === task.projectId
        );

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><strong>${escapeHTML(task.name)}</strong></td>

            <td>${escapeHTML(project?.name || "Unknown")}</td>

            <td>${escapeHTML(task.assignedTo)}</td>

            <td>
                <span class="priority ${task.priority}">
                    ${escapeHTML(task.priority)}
                </span>
            </td>

            <td>${formatDate(task.deadline)}</td>

            <td>
                <select class="task-status"
                    data-action="update-task"
                    data-id="${task.id}">
                    <option value="To Do"
                        ${task.status === "To Do" ? "selected" : ""}>
                        To Do
                    </option>

                    <option value="In Progress"
                        ${task.status === "In Progress" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Completed"
                        ${task.status === "Completed" ? "selected" : ""}>
                        Completed
                    </option>
                </select>
            </td>

            <td>
                <button class="delete-btn"
                    data-action="delete-task"
                    data-id="${task.id}"
                    title="Delete task">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;

        taskTable.appendChild(row);
    });
}

// ==========================================
// UPDATE TASK STATUS / DELETE TASK
// ==========================================

taskTable.addEventListener("change", function(event) {

    const select = event.target.closest(
        'select[data-action="update-task"]'
    );

    if (!select) return;

    const id = Number(select.dataset.id);

    const task = tasks.find(t => t.id === id);

    if (!task) return;

    task.status = select.value;

    saveData();
    renderAll();

    showToast("Task status updated!");
});

taskTable.addEventListener("click", function(event) {

    const button = event.target.closest(
        'button[data-action="delete-task"]'
    );

    if (!button) return;

    const id = Number(button.dataset.id);

    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    tasks = tasks.filter(task => task.id !== id);

    saveData();
    renderAll();

    showToast("Task deleted successfully!");
});

// ==========================================
// SEARCH AND FILTER
// ==========================================

document.getElementById("searchProject")
    .addEventListener("input", renderProjects);

document.getElementById("filterProject")
    .addEventListener("change", renderProjects);

document.getElementById("searchTask")
    .addEventListener("input", renderTasks);

document.getElementById("filterTask")
    .addEventListener("change", renderTasks);

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

function updateStatistics() {

    document.getElementById("totalProjects").textContent =
        projects.length;

    document.getElementById("progressProjects").textContent =
        projects.filter(p => p.status === "In Progress").length;

    document.getElementById("completedProjects").textContent =
        projects.filter(p => p.status === "Completed").length;

    document.getElementById("totalTasks").textContent =
        tasks.length;
}

// ==========================================
// NAVIGATION
// ==========================================

document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", function() {

        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
    });
});

// ==========================================
// RENDER EVERYTHING
// ==========================================

function renderAll() {
    renderProjects();
    renderTasks();
    updateStatistics();
}

// START APPLICATION
initialize();
