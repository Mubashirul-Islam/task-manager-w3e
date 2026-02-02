let currentTaskId = null;

// Load tasks on page load
document.addEventListener("DOMContentLoaded", loadTasks);

// Modal controls
const modal = document.getElementById("taskModal");
const newTaskBtn = document.getElementById("newTaskBtn");
const closeBtn = document.querySelector(".close");
const cancelBtn = document.getElementById("cancelBtn");

newTaskBtn.onclick = () => openModal();
closeBtn.onclick = closeModal;
cancelBtn.onclick = closeModal;
window.onclick = (e) => {
  if (e.target == modal) closeModal();
};

// Form submit
document.getElementById("taskForm").onsubmit = (e) => {
  e.preventDefault();
  saveTask();
};

// Filters
document
  .getElementById("searchInput")
  .addEventListener("input", debounce(loadTasks, 500));
document.getElementById("statusFilter").addEventListener("change", loadTasks);
document.getElementById("sortSelect").addEventListener("change", loadTasks);

function openModal(task = null) {
  modal.style.display = "block";
  document.getElementById("modalTitle").textContent = task
    ? "Edit Task"
    : "Create New Task";

  if (task) {
    currentTaskId = task.id;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDescription").value = task.description || "";
    document.getElementById("taskStatus").value = task.status;
    document.getElementById("taskDueDate").value = task.due_date || "";
  } else {
    currentTaskId = null;
    document.getElementById("taskForm").reset();
  }
}

function closeModal() {
  modal.style.display = "none";
  currentTaskId = null;
  document.getElementById("taskForm").reset();
}

async function loadTasks() {
  const search = document.getElementById("searchInput").value;
  const status = document.getElementById("statusFilter").value;
  const sort = document.getElementById("sortSelect").value;

  let url = "/api/tasks?";
  if (search) url += `q=${encodeURIComponent(search)}&`;
  if (status) url += `status=${status}&`;
  url += `sort=${sort}`;

  try {
    const response = await fetch(url);
    const tasks = await response.json();
    displayTasks(tasks);
  } catch (error) {
    document.getElementById("tasksList").innerHTML =
      '<div class="error">Failed to load tasks. Please try again.</div>';
  }
}

function displayTasks(tasks) {
  const tasksList = document.getElementById("tasksList");

  if (tasks.length === 0) {
    tasksList.innerHTML =
      '<div class="empty-state">No tasks found. Create your first task!</div>';
    return;
  }

  tasksList.innerHTML = tasks
    .map(
      (task) => `
          <div class="task-card ${task.status}">
              <div class="task-content">
                  <div class="task-header">
                      <h3 class="task-title">${escapeHtml(task.title)}</h3>
                      <span class="status-badge ${task.status}">${formatStatus(
        task.status
      )}</span>
                  </div>
                  
                  ${
                    task.description
                      ? `<p class="task-description">${escapeHtml(
                          task.description
                        )}</p>`
                      : ""
                  }
                  
                  <div class="task-meta">
                      <span class="meta-item">
                          📅 Created: ${formatDate(task.created_at)}
                      </span>
                      ${
                        task.due_date
                          ? `
                          <span class="meta-item ${
                            isPastDue(task.due_date, task.status)
                              ? "overdue"
                              : ""
                          }">
                              ⏰ Due: ${formatDate(task.due_date)}
                          </span>
                      `
                          : ""
                      }
                  </div>
              </div>
              
              <div class="task-actions">
                  <button class="action-btn edit-btn" onclick="editTask(${
                    task.id
                  })">✏️ Edit</button>
                  <button class="action-btn delete-btn" onclick="deleteTask(${
                    task.id
                  })">🗑️ Delete</button>
              </div>
          </div>
      `
    )
    .join("");
}

async function saveTask() {
  const title = document.getElementById("taskTitle").value;
  const description = document.getElementById("taskDescription").value;
  const status = document.getElementById("taskStatus").value;
  const due_date = document.getElementById("taskDueDate").value;

  const taskData = { title, description, status };
  if (due_date) taskData.due_date = due_date;

  try {
    const url = currentTaskId ? `/api/tasks/${currentTaskId}` : "/api/tasks";
    const method = currentTaskId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    if (response.ok) {
      closeModal();
      loadTasks();
    } else {
      const error = await response.json();
      alert("Error: " + error.error);
    }
  } catch (error) {
    alert("Failed to save task. Please try again.");
  }
}

async function editTask(id) {
  try {
    const response = await fetch(`/api/tasks/${id}`);
    const task = await response.json();
    openModal(task);
  } catch (error) {
    alert("Failed to load task. Please try again.");
  }
}

async function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      loadTasks();
    } else {
      alert("Failed to delete task.");
    }
  } catch (error) {
    alert("Failed to delete task. Please try again.");
  }
}

// Helper functions
function formatStatus(status) {
  return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isPastDue(dueDate, status) {
  return status !== "done" && new Date(dueDate) < new Date();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
