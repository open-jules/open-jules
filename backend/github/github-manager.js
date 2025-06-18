import { Octokit } from 'octokit';

export class GitHubManager {
  constructor(token) {
    this.octokit = new Octokit({
      auth: token
    });
  }

  async getRepositories() {
    try {
      const response = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });

      return response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: repo.owner.login,
        description: repo.description,
        private: repo.private,
        updated_at: repo.updated_at
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories from GitHub');
    }
  }

  async getBranches(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100
      });

      return response.data.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected
      }));
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw new Error('Failed to fetch branches from GitHub');
    }
  }

  async createPullRequest(owner, repo, head, base, title, body) {
    try {
      const response = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base
      });

      return response.data;
    } catch (error) {
      console.error('Error creating pull request:', error);
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  async getRepository(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching repository:', error);
      throw new Error('Failed to fetch repository details');
    }
  }
}