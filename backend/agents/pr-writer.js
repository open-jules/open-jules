export class PRWriterAgent {
  constructor(ollamaService, model) {
    this.ollamaService = ollamaService;
    this.model = model;
  }

  async generatePR(task, plan, changes, reviewResult) {
    const systemPrompt = `You are responsible for writing clear, professional pull request titles and descriptions.

A good PR should:
- Have a concise, descriptive title
- Explain what changes were made and why
- Include relevant context and implementation details
- Mention any testing considerations
- Be professional and easy to understand

RESPONSE FORMAT:
TITLE: [Concise PR title]

DESCRIPTION:
[Detailed PR description in markdown format]

Keep the title under 70 characters and make the description comprehensive but readable.`;

    const changesDescription = changes.map(change => 
      `- ${change.operation.toUpperCase()}: ${change.filePath}`
    ).join('\n');

    const reviewSummary = reviewResult.summary ? 
      `\nCode Review Summary:\n${reviewResult.summary}` : '';

    const prompt = `Task: ${task}

Implementation Plan:
${plan}

Files Changed:
${changesDescription}
${reviewSummary}

Generate a professional pull request title and description for these changes. The description should explain:
- What was implemented and why
- Key changes made
- Any important implementation details
- Testing considerations (if applicable)

Make it clear and professional for code review.`;

    try {
      const response = await this.ollamaService.generateResponse(this.model, prompt, systemPrompt);
      return this.parsePRContent(response);
    } catch (error) {
      console.error('PR Writer Agent error:', error);
      throw new Error('Failed to generate pull request content');
    }
  }

  parsePRContent(response) {
    const result = {
      title: '',
      body: ''
    };

    // Extract title
    const titleMatch = response.match(/TITLE:\s*(.+?)(?=\n|$)/);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract description
    const descriptionMatch = response.match(/DESCRIPTION:\s*\n(.*?)$/s);
    if (descriptionMatch) {
      result.body = descriptionMatch[1].trim();
    }

    // Fallback if parsing fails
    if (!result.title) {
      result.title = 'Implement requested changes';
    }
    if (!result.body) {
      result.body = 'This pull request implements the requested changes as specified.';
    }

    return result;
  }
}