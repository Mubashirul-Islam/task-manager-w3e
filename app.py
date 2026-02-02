from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from dotenv import load_dotenv
from logger import setup_logger

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

setup_logger(app)

class Todo(db.Model):
    __tablename__ = "todos"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    status = db.Column(
        db.String(20),
        nullable=False,
        default="todo"
    )
    
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.now
    )
    
    due_date = db.Column(
        db.Date,
        nullable=True
    )


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/tasks")
def tasks():
    return render_template("tasks.html")


# API Routes

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    """
    List all tasks with optional filters and sorting
    Query params:
    - status: filter by status (todo, in_progress, done)
    - q: search in title/description
    - sort: sort by field (due_date, created_at)
    """
    app.logger.info(f"GET /api/tasks - Params: {request.args}")
    query = Todo.query
    
    # Filter by status
    status = request.args.get('status')
    if status:
        valid_statuses = ['todo', 'in_progress', 'done']
        if status not in valid_statuses:
            app.logger.warning(f"Invalid status filter attempted: {status}")
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
        query = query.filter(Todo.status == status)
    
    # Search in title/description
    search = request.args.get('q')
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Todo.title.ilike(search_pattern),
                Todo.description.ilike(search_pattern)
            )
        )
    
    # Sort
    sort_by = request.args.get('sort', 'created_at')
    if sort_by == 'due_date':
        query = query.order_by(Todo.due_date.asc().nullslast())
    elif sort_by == 'created_at':
        query = query.order_by(Todo.created_at.desc())
    else:
        return jsonify({"error": "Invalid sort field. Must be 'due_date' or 'created_at'"}), 400
    
    tasks = query.all()
    app.logger.info(f"Retrieved {len(tasks)} tasks")
    
    return jsonify([{
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "created_at": task.created_at.isoformat(),
        "due_date": task.due_date.isoformat() if task.due_date else None
    } for task in tasks]), 200


@app.route("/api/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    """Get a single task by ID"""
    app.logger.info(f"GET /api/tasks/{task_id}")
    task = Todo.query.get(task_id)
    
    if not task:
        app.logger.warning(f"Task not found: {task_id}")
        return jsonify({"error": "Task not found"}), 404
    
    return jsonify({
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "created_at": task.created_at.isoformat(),
        "due_date": task.due_date.isoformat() if task.due_date else None
    }), 200


@app.route("/api/tasks", methods=["POST"])
def create_task():
    """
    Create a new task
    Body: {"title": "...", "description": "...", "due_date": "YYYY-MM-DD"}
    """
    app.logger.info("POST /api/tasks - Creating new task")
    data = request.get_json()
    
    if not data:
        app.logger.error("Request body missing or not JSON")
        return jsonify({"error": "Request body must be JSON"}), 400
    
    # Validate title
    if not data.get('title') or not data.get('title').strip():
        app.logger.warning("Task creation failed: missing title")
        return jsonify({"error": "Title is required"}), 400
    
    # Validate status if provided
    status = data.get('status', 'todo')
    valid_statuses = ['todo', 'in_progress', 'done']
    if status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
    
    # Parse due_date if provided
    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid due_date format. Use YYYY-MM-DD"}), 400
    
    # Create task
    task = Todo(
        title=data['title'].strip(),
        description=data.get('description', ''),
        status=status,
        due_date=due_date
    )
    
    db.session.add(task)
    db.session.commit()
    
    app.logger.info(f"Task created successfully: ID={task.id}, Title='{task.title}'")
    
    return jsonify({
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "created_at": task.created_at.isoformat(),
        "due_date": task.due_date.isoformat() if task.due_date else None
    }), 201


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    """
    Update an existing task
    Body: {"title": "...", "description": "...", "status": "...", "due_date": "YYYY-MM-DD"}
    """
    app.logger.info(f"PUT /api/tasks/{task_id} - Updating task")
    task = Todo.query.get(task_id)
    
    if not task:
        app.logger.warning(f"Task update failed: Task not found {task_id}")
        return jsonify({"error": "Task not found"}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    # Update title
    if 'title' in data:
        if not data['title'] or not data['title'].strip():
            return jsonify({"error": "Title cannot be empty"}), 400
        task.title = data['title'].strip()
    
    # Update description
    if 'description' in data:
        task.description = data['description']
    
    # Update status
    if 'status' in data:
        valid_statuses = ['todo', 'in_progress', 'done']
        if data['status'] not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
        task.status = data['status']
    
    # Update due_date
    if 'due_date' in data:
        if data['due_date']:
            try:
                task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid due_date format. Use YYYY-MM-DD"}), 400
        else:
            task.due_date = None
    
    db.session.commit()
    
    app.logger.info(f"Task updated successfully: ID={task.id}, Title='{task.title}'")
    
    return jsonify({
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "created_at": task.created_at.isoformat(),
        "due_date": task.due_date.isoformat() if task.due_date else None
    }), 200


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    """Delete a task by ID"""
    app.logger.info(f"DELETE /api/tasks/{task_id}")
    task = Todo.query.get(task_id)
    
    if not task:
        app.logger.warning(f"Task deletion failed: Task not found {task_id}")
        return jsonify({"error": "Task not found"}), 404
    
    db.session.delete(task)
    db.session.commit()
    
    app.logger.info(f"Task deleted successfully: ID={task_id}")
    
    return jsonify({"message": "Task deleted successfully"}), 200


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        app.logger.info("Database tables created")
    app.run()