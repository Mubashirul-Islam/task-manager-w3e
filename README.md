# Task Manager

A simple and efficient web-based task management application built with Flask and SQLAlchemy. Organize your tasks, track progress, and stay productive with this lightweight task manager.

## Features

- **Task Management**: Create, read, update, and delete tasks
- **Status Tracking**: Organize tasks by status (To Do, In Progress, Done)
- **Search & Filter**: Search tasks by title/description and filter by status
- **Sorting**: Sort tasks by creation date or due date
- **Due Dates**: Set and track due dates for tasks
- **RESTful API**: Full REST API for integration with other tools
- **Logging**: Comprehensive logging for debugging and monitoring
- **Responsive Design**: Clean, modern UI that works on desktop and mobile

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Setup

1. **Clone the repository** and navigate to the project directory:

   ```bash
   git clone https://github.com/Mubashirul-Islam/task-manager-w3e.git
   cd task-manager-w3e
   ```

2. **Create a virtual environment** (recommended):

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory:

   ```
   FLASK_APP=app.py
   FLASK_DEBUG=1
   DATABASE_URL=sqlite:///db.sqlite
   ```

5. **Run the application**:

   ```bash
   flask run
   ```

6. **Open your browser** and navigate to `http://127.0.0.1:5000/`

## Usage

### Web Interface

- **Home Page**: Visit the welcome page at `/`
- **Tasks Page**: Manage your tasks at `/tasks`
- **Search**: Use the search bar to find tasks by title or description
- **Filter**: Filter tasks by status using the dropdown
- **Sort**: Sort tasks by creation date or due date

### API Usage

The application provides a RESTful API for programmatic access:

#### Get All Tasks

```bash
GET /api/tasks
```

Query parameters:

- `status`: Filter by status (`todo`, `in_progress`, `done`)
- `q`: Search in title/description
- `sort`: Sort by `due_date` or `created_at`

#### Get Single Task

```bash
GET /api/tasks/<id>
```

#### Create Task

```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "Task Title",
  "description": "Task description",
  "status": "todo",
  "due_date": "2024-12-31"
}
```

#### Update Task

```bash
PUT /api/tasks/<id>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "in_progress"
}
```

#### Delete Task

```bash
DELETE /api/tasks/<id>
```

## Project Structure

```
task-manager-w3e/
├── app.py                 # Main Flask application
├── logger.py              # Logging configuration
├── requirements.txt       # Python dependencies
├── README.md              # This file
├── instance/              # Database files
├── logs/                  # Application logs
├── static/                # Static assets (CSS, JS)
│   ├── style.css
│   └── tasks.js
└── templates/             # HTML templates
    ├── index.html
    └── tasks.html
```

## Technologies Used

- **Backend**: Flask, SQLAlchemy
- **Database**: SQLite (configurable)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Logging**: Python logging with rotating file handler

