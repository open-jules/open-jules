import fs from 'fs-extra';
import path from 'path';

export class ReviewerAgent {
  constructor(ollamaService, model) {
    this.ollamaService = ollamaService;
    this.model = model;
  }

  async reviewChanges(repoPath, changes, task) {
    const systemPrompt = `You are a senior code reviewer. Your role is to:

1. Review code changes for quality, security, and best practices
2. Check if the implementation fully addresses the task requirements
3. Identify potential bugs, performance issues, or improvements
4. Ensure code follows project conventions and standards
5. Provide constructive feedback and specific improvement suggestions

RESPONSE FORMAT:
REVIEW_STATUS: [APPROVED/NEEDS_IMPROVEMENT]

SUMMARY:
[Brief summary of the review]

ISSUES_FOUND:
- [List any issues found, or "None" if no issues]

IMPROVEMENTS:
[If NEEDS_IMPROVEMENT, provide specific code improvements using the same FILE_OPERATION format as the developer agent. If APPROVED, write "None needed."]

Be thorough but constructive in your review.`;

    try {
      // Read the actual file contents to review
      let changesContent = '';
      for (const change of changes) {
        const filePath = path.resolve(repoPath, change.filePath);
        // Validate that the resolved path is within the repository root
        if (!filePath.startsWith(repoPath)) {
          changesContent += `\n=== ERROR READING: ${change.filePath} ===\n`;
          changesContent += `Could not read file: Path resolves outside repository root\n`;
          continue;
        }
        try {
          const content = await fs.readFile(filePath, 'utf8');
          changesContent += `\n=== ${change.operation.toUpperCase()}: ${change.filePath} ===\n`;
          changesContent += content;
          changesContent += '\n';
        } catch (error) {
          changesContent += `\n=== ERROR READING: ${change.filePath} ===\n`;
          changesContent += `Could not read file: ${error.message}\n`;
        }
      }

      const prompt = `Task: ${task}

Changes to Review:
${changesContent}

Please review these code changes thoroughly. Check for:
- Correctness and completeness relative to the task
- Code quality and best practices
- Security considerations
- Performance implications
- Integration with existing codebase
- Potential bugs or edge cases

Provide your review using the specified format.`;

      const response = await this.ollamaService.generateResponse(this.model, prompt, systemPrompt);
      return this.parseReviewResult(response);
    } catch (error) {
      console.error('Reviewer Agent error:', error);
      throw new Error('Failed to review changes');
    }
  }

  parseReviewResult(response) {
    const result = {
      status: 'approved',
      summary: '',
      issues: [],
      hasImprovements: false,
      improvements: ''
    };

    // Extract review status
    const statusMatch = response.match(/REVIEW_STATUS:\s*(APPROVED|NEEDS_IMPROVEMENT)/i);
    if (statusMatch) {
      result.status = statusMatch[1].toLowerCase();
      result.hasImprovements = result.status === 'needs_improvement';
    }

    // Extract summary
    const summaryMatch = response.match(/SUMMARY:\s*\n(.*?)(?=\n[A-Z_]+:|$)/s);
    if (summaryMatch) {
      result.summary = summaryMatch[1].trim();
    }

    // Extract issues
    const issuesMatch = response.match(/ISSUES_FOUND:\s*\n(.*?)(?=\n[A-Z_]+:|$)/s);
    if (issuesMatch) {
      const issuesText = issuesMatch[1].trim();
      if (issuesText !== 'None' && issuesText !== '- None') {
        result.issues = issuesText.split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^-\s*/, ''));
      }
    }

    // Extract improvements
    const improvementsMatch = response.match(/IMPROVEMENTS:\s*\n(.*?)$/s);
    if (improvementsMatch) {
      const improvementsText = improvementsMatch[1].trim();
      if (improvementsText !== 'None needed.' && improvementsText !== 'None') {
        result.improvements = improvementsText;
      }
    }

    return result;
  }
}