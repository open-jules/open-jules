import { PlannerAgent } from '../agents/planner.js';
import { BranchNamingAgent } from '../agents/branch-namer.js';
import { EmbedderAgent } from '../agents/embedder.js';
import { DeveloperAgent } from '../agents/developer.js';
import { ReviewerAgent } from '../agents/reviewer.js';
import { PRWriterAgent } from '../agents/pr-writer.js';
import { GitManager } from '../git/git-manager.js';
import { GitHubManager } from '../github/github-manager.js';

export class TaskExecutor {
  constructor(taskQueueService, ollamaService) {
    this.taskQueue = taskQueueService;
    this.ollamaService = ollamaService;
    this.activeTasks = new Map(); // Track active task executions
  }

  async executeTask(task) {
    const taskId = task.id;
    
    // Check if task is already being executed
    if (this.activeTasks.has(taskId)) {
      throw new Error('Task is already being executed');
    }

    // Create execution context
    const executionContext = {
      taskId,
      cancelled: false,
      paused: false,
      sendUpdate: (status, message, data = null) => {
        this.taskQueue.addTaskLog(taskId, { status, message, data });
      }
    };

    this.activeTasks.set(taskId, executionContext);

    try {
      await this.taskQueue.updateTaskStatus(taskId, 'running', 0);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Starting task execution...' 
      });

      // Initialize managers and agents
      const githubManager = new GitHubManager(task.token);
      const gitManager = new GitManager();
      
      const plannerAgent = new PlannerAgent(this.ollamaService, task.agentModels.planner);
      const branchNamingAgent = new BranchNamingAgent(this.ollamaService, task.agentModels.branchNamer);
      const embedderAgent = new EmbedderAgent(this.ollamaService, task.agentModels.embedder, task.agentModels.generator);
      const developerAgent = new DeveloperAgent(this.ollamaService, task.agentModels.developer);
      const reviewerAgent = new ReviewerAgent(this.ollamaService, task.agentModels.reviewer);
      const prWriterAgent = new PRWriterAgent(this.ollamaService, task.agentModels.prWriter);

      // Check for cancellation/pause before each major step
      const checkStatus = () => {
        if (executionContext.cancelled) {
          throw new Error('Task was cancelled');
        }
        if (executionContext.paused) {
          throw new Error('Task was paused');
        }
      };

      // Step 1: Planner Agent (10%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Planning task decomposition...' 
      });
      const plan = await plannerAgent.generatePlan(task.task);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Task plan generated', 
        data: { plan } 
      });
      await this.taskQueue.updateTaskStatus(taskId, 'running', 10);

      // Step 2: Branch Naming Agent (15%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Generating branch name...' 
      });
      const branchName = await branchNamingAgent.generateBranchName(task.task, plan);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Branch name generated', 
        data: { branchName } 
      });
      await this.taskQueue.updateTaskStatus(taskId, 'running', 15);

      // Step 3: Clone and setup repository (25%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Cloning repository...' 
      });
      const [owner, repoName] = task.repo.split('/');
      const repoPath = await gitManager.cloneRepository(task.token, owner, repoName, task.branch);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Repository cloned successfully' 
      });
      await this.taskQueue.updateTaskStatus(taskId, 'running', 25);

      // Step 4: Create new branch (30%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Creating new branch...' 
      });
      await gitManager.createBranch(repoPath, branchName);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'New branch created', 
        data: { branchName } 
      });
      await this.taskQueue.updateTaskStatus(taskId, 'running', 30);

      // Step 5: Embedder Agent (45%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Analyzing codebase...' 
      });
      const codebaseContext = await embedderAgent.analyzeCodebase(repoPath, task.task);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Codebase analysis completed' 
      });
      await this.taskQueue.updateTaskStatus(taskId, 'running', 45);

      // Step 6: Developer Agent (60%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Implementing changes...' 
      });
      const changes = await developerAgent.implementChanges(repoPath, task.task, plan, codebaseContext);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Changes implemented', 
        data: { changes } 
      });
      await this.taskQueue.updateTaskStatus(taskId, 'running', 60);

      // Step 7: Reviewer Agent (75%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Reviewing changes...' 
      });
      const reviewResult = await reviewerAgent.reviewChanges(repoPath, changes, task.task);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Changes reviewed', 
        data: { reviewResult } 
      });
      await this.taskQueue.updateTaskStatus(taskId, 'running', 75);

      // Apply review suggestions if any (80%)
      if (reviewResult.hasImprovements) {
        checkStatus();
        await this.taskQueue.addTaskLog(taskId, { 
          status: 'info', 
          message: 'Applying review improvements...' 
        });
        await developerAgent.applyImprovements(repoPath, reviewResult.improvements);
        await this.taskQueue.addTaskLog(taskId, { 
          status: 'success', 
          message: 'Review improvements applied' 
        });
      }
      await this.taskQueue.updateTaskStatus(taskId, 'running', 80);

      // Step 8: Commit and push changes (90%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Committing changes...' 
      });
      await gitManager.commitChanges(repoPath, `${task.task}\n\n${plan}`);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Changes committed' 
      });

      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Pushing branch to GitHub...' 
      });
      await gitManager.pushBranch(repoPath, branchName);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Branch pushed to GitHub' 
      });
      await this.taskQueue.updateTaskStatus(taskId, 'running', 90);

      // Step 9: PR Writer Agent (95%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Generating pull request...' 
      });
      const prContent = await prWriterAgent.generatePR(task.task, plan, changes, reviewResult);
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Pull request content generated' 
      });
      await this.taskQueue.updateTaskStatus(taskId, 'running', 95);

      // Step 10: Create pull request (100%)
      checkStatus();
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'info', 
        message: 'Creating pull request...' 
      });
      const pullRequest = await githubManager.createPullRequest(
        owner,
        repoName,
        branchName,
        task.branch,
        prContent.title,
        prContent.body
      );
      await this.taskQueue.addTaskLog(taskId, { 
        status: 'success', 
        message: 'Pull request created successfully!', 
        data: { 
          prUrl: pullRequest.html_url,
          prNumber: pullRequest.number 
        } 
      });

      // Task completed successfully
      await this.taskQueue.updateTaskStatus(taskId, 'completed', 100, null, {
        prUrl: pullRequest.html_url,
        prNumber: pullRequest.number,
        branchName,
        changes
      });

    } catch (error) {
      console.error(`Task execution error for ${taskId}:`, error);
      
      if (error.message === 'Task was cancelled') {
        await this.taskQueue.updateTaskStatus(taskId, 'cancelled', null, error.message);
      } else if (error.message === 'Task was paused') {
        await this.taskQueue.updateTaskStatus(taskId, 'paused', null, error.message);
      } else {
        await this.taskQueue.addTaskLog(taskId, { 
          status: 'error', 
          message: `Task failed: ${error.message}` 
        });
        await this.taskQueue.updateTaskStatus(taskId, 'failed', null, error.message);
      }
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  async pauseTask(taskId) {
    const executionContext = this.activeTasks.get(taskId);
    if (executionContext) {
      executionContext.paused = true;
      return true;
    }
    return false;
  }

  async cancelTask(taskId) {
    const executionContext = this.activeTasks.get(taskId);
    if (executionContext) {
      executionContext.cancelled = true;
      return true;
    }
    return false;
  }

  getTaskLogs(taskId) {
    const task = this.taskQueue.getTaskStatus(taskId);
    return task ? task.logs : [];
  }

  isTaskActive(taskId) {
    return this.activeTasks.has(taskId);
  }
} 