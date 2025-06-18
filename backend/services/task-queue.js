import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TaskQueueService {
  constructor() {
    this.queue = [];
    this.running = false;
    this.currentTask = null;
    this.dataFile = path.join(__dirname, '../data/tasks.json');
    this.taskExecutor = null; // Will be set by the server
    this.ensureDataDirectory();
    this.loadTasks();
  }

  setTaskExecutor(taskExecutor) {
    this.taskExecutor = taskExecutor;
  }

  async ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  async loadTasks() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      this.queue = JSON.parse(data);
      // Reset any running tasks to pending on startup
      this.queue.forEach(task => {
        if (task.status === 'running') {
          task.status = 'pending';
        }
      });
    } catch (error) {
      console.log('No existing tasks file found, starting with empty queue');
      this.queue = [];
    }
  }

  async saveTasks() {
    await this.ensureDataDirectory();
    await fs.writeFile(this.dataFile, JSON.stringify(this.queue, null, 2));
  }

  async addTask(taskData) {
    const task = {
      id: this.generateTaskId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      user: taskData.user || 'default',
      repo: taskData.repo,
      branch: taskData.baseBranch,
      task: taskData.task,
      agentModels: taskData.agentModels,
      token: taskData.token, // Store token for execution
      logs: [],
      progress: 0,
      error: null,
      result: null
    };

    this.queue.push(task);
    await this.saveTasks();
    return task;
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async startQueue() {
    if (this.running || !this.taskExecutor) return;
    
    this.running = true;
    while (this.queue.length > 0 && this.running) {
      const pendingTask = this.queue.find(task => task.status === 'pending');
      if (!pendingTask) break;

      this.currentTask = pendingTask;
      pendingTask.status = 'running';
      pendingTask.startedAt = new Date().toISOString();
      await this.saveTasks();

      // Execute the task using TaskExecutor
      try {
        await this.taskExecutor.executeTask(pendingTask);
      } catch (error) {
        console.error(`Error executing task ${pendingTask.id}:`, error);
        await this.updateTaskStatus(pendingTask.id, 'failed', null, error.message);
      }

      // Move to next task
      this.currentTask = null;
    }
    
    this.running = false;
  }

  async pauseTask(taskId) {
    const task = this.queue.find(t => t.id === taskId);
    if (task && task.status === 'running') {
      task.status = 'paused';
      await this.saveTasks();
      
      // Also pause in TaskExecutor if it's active
      if (this.taskExecutor) {
        await this.taskExecutor.pauseTask(taskId);
      }
      return true;
    }
    return false;
  }

  async resumeTask(taskId) {
    const task = this.queue.find(t => t.id === taskId);
    if (task && task.status === 'paused') {
      task.status = 'pending';
      await this.saveTasks();
      return true;
    }
    return false;
  }

  async cancelTask(taskId) {
    const task = this.queue.find(t => t.id === taskId);
    if (task && ['pending', 'running', 'paused'].includes(task.status)) {
      task.status = 'cancelled';
      task.completedAt = new Date().toISOString();
      await this.saveTasks();
      
      // Also cancel in TaskExecutor if it's active
      if (this.taskExecutor) {
        await this.taskExecutor.cancelTask(taskId);
      }
      return true;
    }
    return false;
  }

  async removeTask(taskId) {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      await this.saveTasks();
      return true;
    }
    return false;
  }

  async updateTaskStatus(taskId, status, progress = null, error = null, result = null) {
    const task = this.queue.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (progress !== null) task.progress = progress;
      if (error !== null) task.error = error;
      if (result !== null) task.result = result;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        task.completedAt = new Date().toISOString();
      }
      await this.saveTasks();
      return true;
    }
    return false;
  }

  async addTaskLog(taskId, logEntry) {
    const task = this.queue.find(t => t.id === taskId);
    if (task) {
      task.logs.push({
        timestamp: new Date().toISOString(),
        ...logEntry
      });
      await this.saveTasks();
      return true;
    }
    return false;
  }

  getTaskStatus(taskId) {
    return this.queue.find(t => t.id === taskId) || null;
  }

  getQueueStatus() {
    return {
      queue: this.queue,
      running: this.running,
      currentTask: this.currentTask,
      stats: {
        total: this.queue.length,
        pending: this.queue.filter(t => t.status === 'pending').length,
        running: this.queue.filter(t => t.status === 'running').length,
        paused: this.queue.filter(t => t.status === 'paused').length,
        completed: this.queue.filter(t => t.status === 'completed').length,
        failed: this.queue.filter(t => t.status === 'failed').length,
        cancelled: this.queue.filter(t => t.status === 'cancelled').length
      }
    };
  }

  async clearCompleted() {
    this.queue = this.queue.filter(task => 
      !['completed', 'failed', 'cancelled'].includes(task.status)
    );
    await this.saveTasks();
  }

  async pauseQueue() {
    this.running = false;
    if (this.currentTask) {
      await this.pauseTask(this.currentTask.id);
    }
  }
} 