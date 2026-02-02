// Load tasks on page load
document.addEventListener("DOMContentLoaded", loadTasks);

// Filters
document
  .getElementById("searchInput")
  .addEventListener("input", debounce(loadTasks, 500));
document.getElementById("statusFilter").addEventListener("change", loadTasks);
document.getElementById("sortSelect").addEventListener("change", loadTasks);

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
      '<div class="empty-state">No tasks to show right now.</div>';
    return;
  }

  tasksList.innerHTML = `
    <table class="tasks-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Status</th>
          <th>Created</th>
          <th>Due Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${tasks
          .map(
            (task) => `
          <tr class="task-row ${task.status}">
            <td class="task-title">${escapeHtml(task.title)}</td>
            <td class="task-description">${
              task.description ? escapeHtml(task.description) : ""
            }</td>
            <td>
              <select class="status-select" onchange="updateTaskStatus(${
                task.id
              }, this.value)">
                <option value="todo" ${
                  task.status === "todo" ? "selected" : ""
                }>To Do</option>
                <option value="in_progress" ${
                  task.status === "in_progress" ? "selected" : ""
                }>In Progress</option>
                <option value="done" ${
                  task.status === "done" ? "selected" : ""
                }>Done</option>
              </select>
            </td>
            <td>${formatDate(task.created_at)}</td>
            <td>${formatDate(task.due_date)}</td>
            <td>
              <button class="action-btn delete-btn" onclick="deleteTask(${
                task.id
              })">Delete</button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
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

// Update a task's status via the API and refresh the list
async function updateTaskStatus(id, status) {
  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update status");
    }

    loadTasks();
  } catch (error) {
    alert("Unable to update task status. Please try again.");
    loadTasks();
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
