import fs from 'fs-extra';
import path from 'path';

export class DeveloperAgent {
  constructor(ollamaService, model) {
    this.ollamaService = ollamaService;
    this.model = model;
  }

  async implementChanges(repoPath, task, plan, codebaseContext) {
    const systemPrompt = `You are a senior software developer implementing code changes. Your role is to:

1. Analyze the task, plan, and codebase context
2. Identify exactly which files need to be created or modified
3. Generate the complete, functional code for those files
4. Follow the existing code patterns and conventions
5. Ensure changes are production-ready and follow best practices

IMPORTANT RESPONSE FORMAT:
For each file you want to create or modify, use this exact format:

FILE_OPERATION: CREATE path/to/file.ext
\`\`\`
[complete file content here]
\`\`\`

FILE_OPERATION: MODIFY path/to/existing/file.ext
\`\`\`
[complete updated file content here]
\`\`\`

Always provide complete file contents, never partial or placeholder code.`;

    const prompt = `Task: ${task}

Implementation Plan:
${plan}

Codebase Context:
${codebaseContext}

Based on the task, plan, and codebase analysis, implement the necessary code changes. 

For each file you need to create or modify, specify the operation (CREATE or MODIFY) and provide the complete file content. Make sure your implementation:
- Follows the existing code style and conventions
- Is complete and functional (no TODOs or placeholders)
- Integrates properly with the existing codebase
- Implements all aspects of the task

Provide your implementation below:`;

    try {
      const response = await this.ollamaService.generateResponse(this.model, prompt, systemPrompt);
      const changes = await this.parseAndApplyChanges(repoPath, response);
      return changes;
    } catch (error) {
      console.error('Developer Agent error:', error);
      throw new Error('Failed to implement changes');
    }
  }

  async parseAndApplyChanges(repoPath, response) {
    const changes = [];
    const fileOperationRegex = /FILE_OPERATION:\s+(CREATE|MODIFY)\s+(.+?)\n```([^`]+?)```/gs;
    
    let match;
    while ((match = fileOperationRegex.exec(response)) !== null) {
      const [, operation, filePath, content] = match;
      
      // Sanitize the file path
      const sanitizedPath = filePath.trim()
        .replace(/^[./\\]+/, '') // Remove leading ./ or ../
        .replace(/[<>:"|?*]/g, '_') // Replace invalid Windows characters
        .replace(/\\/g, '/'); // Normalize path separators
      
      const fullPath = path.resolve(repoPath, sanitizedPath);
      // Validate that the resolved path is within the repository root
      if (!fullPath.startsWith(repoPath)) {
        throw new Error(`Invalid file path: ${sanitizedPath} resolves outside the repository root`);
      }
      const dirPath = path.dirname(fullPath);
      
      try {
        // First ensure the directory exists
        await fs.ensureDir(dirPath);
        
        // Then write the file
        await fs.writeFile(fullPath, content.trim(), 'utf8');
        
        changes.push({
          operation: operation.toLowerCase(),
          filePath: sanitizedPath,
          content: content.trim()
        });
      } catch (error) {
        console.error(`Error applying change to ${sanitizedPath}:`, error);
        throw new Error(`Failed to apply changes to ${sanitizedPath}: ${error.message}`);
      }
    }

    if (changes.length === 0) {
      throw new Error('No valid file operations found in developer response');
    }

    return changes;
  }

  async applyImprovements(repoPath, improvements) {
    // Apply review improvements using the same format
    return await this.parseAndApplyChanges(repoPath, improvements);
  }
}