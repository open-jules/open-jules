export class PlannerAgent {
  constructor(ollamaService, model) {
    this.ollamaService = ollamaService;
    this.model = model;
  }

  async generatePlan(task) {
    const systemPrompt = `You are a senior software engineer tasked with breaking down coding tasks into clear, actionable steps.
    
Your role is to:
1. Analyze the given task thoroughly.
2. Break it down into a logical, sequential series of technical steps. Focus on the technical requirements and the order of implementation.
3. Consider technical dependencies and requirements for each step.
4. Provide clear, implementable actions.
5. Do not include any time estimates or deadlines for completing the tasks.

Return your response as a structured plan with numbered steps. Be specific about what needs to be done in each step.`;

    const prompt = `Task: ${task}

Please create a detailed technical implementation plan for this task. Break it down into clear, sequential steps that a developer can follow. For each step, consider:
- What files might need to be created or modified
- What specific code changes are needed
- What dependencies or libraries might be required
- The logical order of implementation
- Any potential technical challenges or considerations

Provide a numbered list of specific, actionable steps to complete this task.`;

    try {
      const response = await this.ollamaService.generateResponse(this.model, prompt, systemPrompt);
      return response.trim();
    } catch (error) {
      console.error('Planner Agent error:', error);
      throw new Error('Failed to generate implementation plan');
    }
  }
}