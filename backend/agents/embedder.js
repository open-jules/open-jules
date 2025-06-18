import fs from 'fs-extra';
import path from 'path';

export class EmbedderAgent {
  constructor(ollamaService, embeddingModel = 'snowflake-arctic-embed2', generationModel = 'llama3') {
    this.ollamaService = ollamaService;
    this.embeddingModel = embeddingModel;
    this.generationModel = generationModel;
  }

  async analyzeCodebase(repoPath, task) {
    const systemPrompt = `You are a code analysis specialist. Your job is to analyze a codebase and provide structured context that will help other agents understand the project structure and implement changes.

Provide analysis in this format:
1. Project Overview - What type of project this is
2. Key Technologies - Programming languages, frameworks, libraries
3. Project Structure - Important directories and files
4. Entry Points - Main files where execution begins
5. Configuration Files - Important config files
6. Relevant Context - Code patterns, architecture notes relevant to the task

Be concise but comprehensive. Focus on information that would help implement the given task.`;

    try {
      // Scan the repository structure
      const projectStructure = await this.scanProjectStructure(repoPath);
      const keyFiles = await this.identifyKeyFiles(repoPath);
      const packageInfo = await this.getPackageInfo(repoPath);

      const prompt = `Task to implement: ${task}

Repository Structure:
${projectStructure}

Key Files Found:
${keyFiles}

Package/Dependency Information:
${packageInfo}

Please analyze this codebase and provide structured context that will help implement the given task. Focus on:
- What kind of project this is
- Key technologies and frameworks used
- Important files and directories relevant to the task
- Architectural patterns or conventions to follow
- Recommendations for where to implement the changes`;

      const response = await this.ollamaService.generateResponse(this.generationModel, prompt, systemPrompt);
      return response.trim();
    } catch (error) {
      console.error('Embedder Agent error:', error);
      throw new Error('Failed to analyze codebase');
    }
  }

  async scanProjectStructure(repoPath, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return '';

    let structure = '';
    try {
      const items = await fs.readdir(repoPath);
      
      for (const item of items) {
        if (item.startsWith('.') && !['', '.env', '.config'].some(allowed => item.includes(allowed))) {
          continue; // Skip hidden files except important ones
        }

        const itemPath = path.resolve(repoPath, item);
        // Validate that the resolved path is within the repository root
        if (!itemPath.startsWith(repoPath)) {
          continue; // Skip items outside the repoPath
        }
        const stats = await fs.stat(itemPath);
        const indent = '  '.repeat(currentDepth);

        if (stats.isDirectory()) {
          structure += `${indent}${item}/\n`;
          if (currentDepth < maxDepth - 1 && !['node_modules', '.git', 'dist', 'build'].includes(item)) {
            structure += await this.scanProjectStructure(itemPath, maxDepth, currentDepth + 1);
          }
        } else {
          structure += `${indent}${item}\n`;
        }
      }
    } catch (error) {
      console.error('Error scanning structure:', error);
    }

    return structure;
  }

  async identifyKeyFiles(repoPath) {
    const keyFilePatterns = [
      'package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml',
      'README.md', 'README.txt',
      'main.py', 'index.js', 'index.ts', 'App.js', 'App.tsx',
      'server.js', 'server.ts', 'app.py',
      'webpack.config.js', 'vite.config.js', 'tsconfig.json'
    ];

    let keyFilesInfo = '';
    
    for (const pattern of keyFilePatterns) {
      const filePath = path.resolve(repoPath, pattern);
      // Validate that the resolved path is within the repository root
      if (!filePath.startsWith(repoPath)) {
        continue; // Skip files outside the repoPath
      }
      try {
        if (await fs.pathExists(filePath)) {
          const content = await fs.readFile(filePath, 'utf8');
          keyFilesInfo += `\n=== ${pattern} ===\n`;
          keyFilesInfo += content.length > 1000 ? content.substring(0, 1000) + '...' : content;
          keyFilesInfo += '\n';
        }
      } catch (error) {
        // File doesn't exist or can't be read, skip it
      }
    }

    return keyFilesInfo;
  }

  async getPackageInfo(repoPath) {
    let packageInfo = '';

    // Check for package.json (Node.js)
    const packageJsonPath = path.resolve(repoPath, 'package.json');
    if (!packageJsonPath.startsWith(repoPath)) {
      return packageInfo || 'No package information found';
    }
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        packageInfo += 'Node.js Project:\n';
        packageInfo += `Dependencies: ${Object.keys(packageJson.dependencies || {}).join(', ')}\n`;
        packageInfo += `DevDependencies: ${Object.keys(packageJson.devDependencies || {}).join(', ')}\n`;
      } catch (error) {
        packageInfo += 'Node.js project detected but package.json could not be parsed\n';
      }
    }

    // Check for requirements.txt (Python)
    const requirementsPath = path.resolve(repoPath, 'requirements.txt');
    if (!requirementsPath.startsWith(repoPath)) {
      return packageInfo || 'No package information found';
    }
    if (await fs.pathExists(requirementsPath)) {
      try {
        const requirements = await fs.readFile(requirementsPath, 'utf8');
        packageInfo += 'Python Project:\n';
        packageInfo += `Requirements: ${requirements.split('\n').filter(line => line.trim()).join(', ')}\n`;
      } catch (error) {
        packageInfo += 'Python project detected but requirements.txt could not be read\n';
      }
    }

    return packageInfo || 'No package information found';
  }
}