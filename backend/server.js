import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PlannerAgent } from './agents/planner.js';
import { BranchNamingAgent } from './agents/branch-namer.js';
import { EmbedderAgent } from './agents/embedder.js';
import { DeveloperAgent } from './agents/developer.js';
import { ReviewerAgent } from './agents/reviewer.js';
import { PRWriterAgent } from './agents/pr-writer.js';
import { GitManager } from './git/git-manager.js';
import { GitHubManager } from './github/github-manager.js';
import { OllamaService } from './services/ollama.js';
import { TaskQueueService } from './services/task-queue.js';
import { TaskExecutor } from './services/task-executor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize services
const ollamaService = new OllamaService();
const taskQueueService = new TaskQueueService();
const taskExecutor = new TaskExecutor(taskQueueService, ollamaService);

// Connect TaskQueueService with TaskExecutor
taskQueueService.setTaskExecutor(taskExecutor);

// Legacy endpoint for backward compatibility
app.post('/api/run-task', async (req, res) => {
  try {
    const { token, repo, baseBranch, task, agentModels } = req.body;
    
    if (!token || !repo || !baseBranch || !task || !agentModels) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Set up SSE for real-time updates
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const sendUpdate = (status, message, data = null) => {
      res.write(`data: ${JSON.stringify({ status, message, data })}\n\n`);
    };

    try {
      // Initialize managers and agents
      const githubManager = new GitHubManager(token);
      const gitManager = new GitManager();
      
      const plannerAgent = new PlannerAgent(ollamaService, agentModels.planner);
      const branchNamingAgent = new BranchNamingAgent(ollamaService, agentModels.branchNamer);
      const embedderAgent = new EmbedderAgent(ollamaService, agentModels.embedder, agentModels.generator);
      const developerAgent = new DeveloperAgent(ollamaService, agentModels.developer);
      const reviewerAgent = new ReviewerAgent(ollamaService, agentModels.reviewer);
      const prWriterAgent = new PRWriterAgent(ollamaService, agentModels.prWriter);

      sendUpdate('info', 'Starting task execution...');

      // Step 1: Planner Agent
      sendUpdate('info', 'Planning task decomposition...');
      const plan = await plannerAgent.generatePlan(task);
      sendUpdate('success', 'Task plan generated', { plan });

      // Step 2: Branch Naming Agent
      sendUpdate('info', 'Generating branch name...');
      const branchName = await branchNamingAgent.generateBranchName(task, plan);
      sendUpdate('success', 'Branch name generated', { branchName });

      // Step 3: Clone and setup repository
      sendUpdate('info', 'Cloning repository...');
      const [owner, repoName] = repo.split('/');
      const repoPath = await gitManager.cloneRepository(token, owner, repoName, baseBranch);
      sendUpdate('success', 'Repository cloned successfully');

      // Step 4: Create new branch
      sendUpdate('info', 'Creating new branch...');
      await gitManager.createBranch(repoPath, branchName);
      sendUpdate('success', 'New branch created', { branchName });

      // Step 5: Embedder Agent
      sendUpdate('info', 'Analyzing codebase...');
      const codebaseContext = await embedderAgent.analyzeCodebase(repoPath, task);
      sendUpdate('success', 'Codebase analysis completed');

      // Step 6: Developer Agent
      sendUpdate('info', 'Implementing changes...');
      const changes = await developerAgent.implementChanges(repoPath, task, plan, codebaseContext);
      sendUpdate('success', 'Changes implemented', { changes });

      // Step 7: Reviewer Agent
      sendUpdate('info', 'Reviewing changes...');
      const reviewResult = await reviewerAgent.reviewChanges(repoPath, changes, task);
      sendUpdate('success', 'Changes reviewed', { reviewResult });

      // Apply review suggestions if any
      if (reviewResult.hasImprovements) {
        sendUpdate('info', 'Applying review improvements...');
        await developerAgent.applyImprovements(repoPath, reviewResult.improvements);
        sendUpdate('success', 'Review improvements applied');
      }

      // Step 8: Commit and push changes
      sendUpdate('info', 'Committing changes...');
      await gitManager.commitChanges(repoPath, `${task}\n\n${plan}`);
      sendUpdate('success', 'Changes committed');

      sendUpdate('info', 'Pushing branch to GitHub...');
      await gitManager.pushBranch(repoPath, branchName);
      sendUpdate('success', 'Branch pushed to GitHub');

      // Step 9: PR Writer Agent
      sendUpdate('info', 'Generating pull request...');
      const prContent = await prWriterAgent.generatePR(task, plan, changes, reviewResult);
      sendUpdate('success', 'Pull request content generated');

      // Step 10: Create pull request
      sendUpdate('info', 'Creating pull request...');
      const pullRequest = await githubManager.createPullRequest(
        owner,
        repoName,
        branchName,
        baseBranch,
        prContent.title,
        prContent.body
      );
      sendUpdate('success', 'Pull request created successfully!', { 
        prUrl: pullRequest.html_url,
        prNumber: pullRequest.number 
      });

    } catch (error) {
      console.error('Task execution error:', error);
      sendUpdate('error', `Task failed: ${error.message}`);
    }

    res.end();
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error occurred' });
  }
});

// New Task Queue Endpoints

// Get all models
app.get('/api/models', async (req, res) => {
  try {
    const models = await ollamaService.getModels();
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models from Ollama' });
  }
});

// Rewrite task prompt
app.post('/api/rewrite-prompt', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }

    const systemPrompt = `You are an expert at improving task descriptions for AI coding assistants. Your job is to take a user's task description and rewrite it to be more clear, specific, and actionable.

Guidelines for improvement:
1. Make the task more specific and detailed
2. Add context about what should be accomplished
3. Clarify any ambiguous requirements
4. Structure the description in a logical way
5. Include relevant technical details
6. Make it easier for AI agents to understand and implement
7. Keep the original intent and scope

Return ONLY the improved task description, nothing else.`;

    const userPrompt = `Original task description: ${prompt}

Please rewrite this task description to be more clear, specific, and actionable for AI coding assistants.`;

    const improvedPrompt = await ollamaService.generateResponse(model, userPrompt, systemPrompt);
    
    res.json({ improvedPrompt: improvedPrompt.trim() });
  } catch (error) {
    console.error('Error rewriting prompt:', error);
    res.status(500).json({ error: 'Failed to rewrite prompt' });
  }
});

// Get repositories
app.post('/api/repos', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    const githubManager = new GitHubManager(token);
    const repos = await githubManager.getRepositories();
    res.json(repos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Get branches
app.post('/api/branches', async (req, res) => {
  try {
    const { token, owner, repo } = req.body;
    if (!token || !owner || !repo) {
      return res.status(400).json({ error: 'Token, owner, and repo are required' });
    }

    const githubManager = new GitHubManager(token);
    const branches = await githubManager.getBranches(owner, repo);
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Add task to queue
app.post('/api/tasks', async (req, res) => {
  try {
    const { token, repo, baseBranch, task, agentModels } = req.body;
    
    if (!token || !repo || !baseBranch || !task || !agentModels) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const taskData = {
      token,
      repo,
      baseBranch,
      task,
      agentModels,
      user: 'default' // TODO: Add user management
    };

    const newTask = await taskQueueService.addTask(taskData);
    res.json(newTask);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add task to queue' });
  }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const queueStatus = taskQueueService.getQueueStatus();
    res.json(queueStatus);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get specific task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = taskQueueService.getTaskStatus(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Pause task
app.put('/api/tasks/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await taskQueueService.pauseTask(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Task not found or cannot be paused' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error pausing task:', error);
    res.status(500).json({ error: 'Failed to pause task' });
  }
});

// Resume task
app.put('/api/tasks/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await taskQueueService.resumeTask(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Task not found or cannot be resumed' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error resuming task:', error);
    res.status(500).json({ error: 'Failed to resume task' });
  }
});

// Cancel task
app.put('/api/tasks/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await taskQueueService.cancelTask(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Task not found or cannot be cancelled' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling task:', error);
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

// Remove task from queue
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await taskQueueService.removeTask(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing task:', error);
    res.status(500).json({ error: 'Failed to remove task' });
  }
});

// Get task logs (SSE)
app.get('/api/tasks/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const task = taskQueueService.getTaskStatus(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const sendUpdate = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial task status
    sendUpdate({ type: 'task-status', task });

    // Send existing logs
    if (task.logs.length > 0) {
      sendUpdate({ type: 'logs', logs: task.logs });
    }

    // Set up polling for new logs (in a real implementation, you'd use WebSockets or a more efficient method)
    const interval = setInterval(async () => {
      const updatedTask = taskQueueService.getTaskStatus(id);
      if (updatedTask) {
        sendUpdate({ type: 'task-status', task: updatedTask });
        
        // Send new logs if any
        if (updatedTask.logs.length > task.logs.length) {
          const newLogs = updatedTask.logs.slice(task.logs.length);
          sendUpdate({ type: 'logs', logs: newLogs });
          task.logs = updatedTask.logs;
        }
      }
    }, 1000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });

  } catch (error) {
    console.error('Error streaming task logs:', error);
    res.status(500).json({ error: 'Failed to stream task logs' });
  }
});

// Get queue status
app.get('/api/queue/status', async (req, res) => {
  try {
    const status = taskQueueService.getQueueStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({ error: 'Failed to fetch queue status' });
  }
});

// Start queue processing
app.post('/api/queue/start', async (req, res) => {
  try {
    await taskQueueService.startQueue();
    res.json({ success: true });
  } catch (error) {
    console.error('Error starting queue:', error);
    res.status(500).json({ error: 'Failed to start queue' });
  }
});

// Pause all tasks
app.post('/api/queue/pause', async (req, res) => {
  try {
    await taskQueueService.pauseQueue();
    res.json({ success: true });
  } catch (error) {
    console.error('Error pausing queue:', error);
    res.status(500).json({ error: 'Failed to pause queue' });
  }
});

// Clear completed tasks
app.post('/api/queue/clear', async (req, res) => {
  try {
    await taskQueueService.clearCompleted();
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing completed tasks:', error);
    res.status(500).json({ error: 'Failed to clear completed tasks' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Start queue processing loop
setInterval(async () => {
  const status = taskQueueService.getQueueStatus();
  if (status.stats.pending > 0 && !status.running) {
    console.log('Starting queue processing...');
    await taskQueueService.startQueue();
  }
}, 5000); // Check every 5 seconds