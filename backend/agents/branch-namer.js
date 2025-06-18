export class BranchNamingAgent {
  constructor(ollamaService, model) {
    this.ollamaService = ollamaService;
    this.model = model;
  }

  async generateBranchName(task, plan) {
    const systemPrompt = `You are responsible for creating concise, descriptive Git branch names.

Branch naming conventions:
- Use lowercase letters and hyphens
- Be descriptive but concise (max 50 characters)
- Start with one of the allowed types: fix, feat, chore, build, ci, perf, docs, refactor, revert, test.
- Use prefixes like: feat/, fix/, refactor/, docs/, etc. (e.g. feat/new-feature)
- Avoid special characters except hyphens
- Make it clear what the branch accomplishes
- The subject (part after type/) must not start with an uppercase character.

Examples:
- feat/add-user-authentication
- fix/resolve-payment-bug
- refactor/optimize-database-queries
- docs/update-api-documentation

Return ONLY the branch name, nothing else.`;

    const prompt = `Task: ${task}

Plan Summary: ${plan.substring(0, 500)}...

Generate a concise, descriptive Git branch name for this task. Follow Git branch naming conventions and make it clear what this branch accomplishes.

Branch name:`;

    try {
      const response = await this.ollamaService.generateResponse(this.model, prompt, systemPrompt);
      
      // Clean up the response to ensure it's just the branch name
      let branchName = response.trim()
        .replace(/^(branch name:?\s*)/i, '') // Remove "branch name:" prefix
        .toLowerCase() // Convert to lowercase early
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9\-\/]/g, '-') // Remove special characters except hyphens and slashes
        .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

      const allowedTypes = ['fix', 'feat', 'chore', 'build', 'ci', 'perf', 'docs', 'refactor', 'revert', 'test'];
      let type = 'feat'; // Default type
      let subject = ''; // Initialize subject

      // Split into potential type and subject
      if (branchName.includes('/')) {
        const parts = branchName.split('/');
        const potentialType = parts[0]; // Already lowercase
        if (allowedTypes.includes(potentialType)) {
          type = potentialType;
          subject = parts.slice(1).join('-'); // Join remaining parts with hyphen, also handles multiple slashes
        } else {
          // If the first part is not an allowed type, it's part of the subject
          subject = branchName.replace(/\//g, '-');
        }
      } else {
        // No slash, so the whole thing is the subject
        subject = branchName;
      }

      // If, after processing, type is part of the subject (e.g. "fix" became subject as no slash initially)
      // and subject is an allowed type, then it should be the type.
      if (allowedTypes.includes(subject) && type === 'feat' && !branchName.includes('/') && subject !== type) {
          type = subject;
          subject = 'general-update'; // Set a default subject
      }

      // Clean the subject itself from leading/trailing hyphens and ensure it's not just a hyphen
      subject = subject.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens from subject

      // Ensure subject doesn't start with an uppercase letter (already handled by early toLowerCase)
      // but we need to ensure it's not empty if it became empty after processing
      if (!subject || subject === '-') { // check for subject being just a hyphen after cleaning
        subject = 'general-update';
      }

      // Final assembly and cleaning
      branchName = `${type}/${subject}`
        // .toLowerCase() // Already lowercase
        .replace(/-+/g, '-') // Replace multiple hyphens (should be mostly handled but good for safety)
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens from whole string (safety)
        .replace(/\/-$/, `/${subject}`); // Ensure subject is not empty after type - if subject became empty use the cleaned one.

      // Final check if subject ended up empty and needs to be general-update
      if (branchName.endsWith('/')) {
        branchName += 'general-update';
      }

      return branchName;
    } catch (error) {
      console.error('Branch Naming Agent error:', error);
      throw new Error('Failed to generate branch name');
    }
  }
}