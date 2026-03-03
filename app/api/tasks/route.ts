import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'tasks.json');

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read tasks from file
function readTasks(): Task[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Write tasks to file
function writeTasks(tasks: Task[]) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// GET /api/tasks - List all tasks
export async function GET() {
  const tasks = readTasks();
  return NextResponse.json({ tasks });
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, priority = 'medium' } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Task text is required' },
        { status: 400 }
      );
    }

    const tasks = readTasks();
    const newTask: Task = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
    };

    tasks.unshift(newTask);
    writeTasks(tasks);

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// PATCH /api/tasks - Update a task (toggle complete, edit text, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, completed, text, priority } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const tasks = readTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (completed !== undefined) {
      tasks[taskIndex].completed = completed;
    }
    if (text !== undefined && text.trim().length > 0) {
      tasks[taskIndex].text = text.trim();
    }
    if (priority !== undefined && ['low', 'medium', 'high'].includes(priority)) {
      tasks[taskIndex].priority = priority;
    }

    writeTasks(tasks);
    return NextResponse.json({ task: tasks[taskIndex] });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const tasks = readTasks();
    const filteredTasks = tasks.filter(t => t.id !== id);

    if (filteredTasks.length === tasks.length) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    writeTasks(filteredTasks);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
