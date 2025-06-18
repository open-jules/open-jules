import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class GitManager {
  constructor() {
    this.workspaceDir = path.join(os.homedir(), '.local-ai-coder', 'repos');
  }

  async cloneRepository(token, owner, repo, baseBranch) {
    const repoUrl = `https://${token}@github.com/${owner}/${repo}.git`;
    const repoPath = path.join(this.workspaceDir, repo);

    try {
      // Ensure workspace directory exists
      await fs.ensureDir(this.workspaceDir);

      // Remove existing directory if it exists
      if (await fs.pathExists(repoPath)) {
        await fs.remove(repoPath);
      }

      // Clone the repository
      const git = simpleGit();
      await git.clone(repoUrl, repoPath, ['--depth', '1', '--branch', baseBranch]);

      // Configure git in the cloned repo
      const repoGit = simpleGit(repoPath);
      await repoGit.addConfig('user.name', 'Local AI Coder');
      await repoGit.addConfig('user.email', 'local-ai-coder@example.com');

      return repoPath;
    } catch (error) {
      console.error('Error cloning repository:', error);
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async createBranch(repoPath, branchName) {
    try {
      const git = simpleGit(repoPath);
      await git.checkoutLocalBranch(branchName);
      return branchName;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  async commitChanges(repoPath, commitMessage) {
    try {
      const git = simpleGit(repoPath);
      
      // Add all changes
      await git.add('.');
      
      // Check if there are changes to commit
      const status = await git.status();
      if (status.files.length === 0) {
        throw new Error('No changes to commit');
      }

      // Commit changes
      await git.commit(commitMessage);
      
      return true;
    } catch (error) {
      console.error('Error committing changes:', error);
      throw new Error(`Failed to commit changes: ${error.message}`);
    }
  }

  async pushBranch(repoPath, branchName) {
    try {
      const git = simpleGit(repoPath);
      await git.push('origin', branchName, { '--set-upstream': null });
      return true;
    } catch (error) {
      console.error('Error pushing branch:', error);
      throw new Error(`Failed to push branch: ${error.message}`);
    }
  }

  async getChangedFiles(repoPath) {
    try {
      const git = simpleGit(repoPath);
      const status = await git.status();
      return status.files;
    } catch (error) {
      console.error('Error getting changed files:', error);
      throw new Error(`Failed to get changed files: ${error.message}`);
    }
  }
}