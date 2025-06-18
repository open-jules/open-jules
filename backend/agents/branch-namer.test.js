import { BranchNamingAgent } from './branch-namer';

import { vi } from 'vitest';
// Mock ollamaService
const mockOllamaService = {
  generateResponse: vi.fn(),
};

describe('BranchNamingAgent', () => {
  let agent;

  beforeEach(() => {
    // Reset the mock before each test
    mockOllamaService.generateResponse.mockReset();
    agent = new BranchNamingAgent(mockOllamaService, 'test-model');
  });

  const task = 'Implement user login';
  const plan = 'Create login endpoint and UI';

  test('should generate a branch name with a valid type (feat)', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('feat/Implement-User-Login');
    const branchName = await agent.generateBranchName(task, plan);
    expect(mockOllamaService.generateResponse).toHaveBeenCalledTimes(1);
    expect(branchName).toBe('feat/implement-user-login');
  });

  test('should generate a branch name with a valid type (fix)', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('fix/Resolve-Bug-In-API');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('fix/resolve-bug-in-api');
  });

  test('should generate a branch name with a valid type (chore)', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('chore/Update Dependencies');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('chore/update-dependencies');
  });

  test('should ensure subject does not start with an uppercase character', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('feat/Add-New-Button');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/add-new-button');
  });

  test('should handle leading/trailing spaces and special characters', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('  feat/Test Sp@cial Chars!  ');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/test-sp-cial-chars');
  });

  test('should handle names without a type prefix (default to feat)', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('My-Cool-Feature');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/my-cool-feature');
  });

  test('should handle names with an invalid type prefix (default to feat and include original prefix in subject)', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('invalidtype/Some-Work');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/invalidtype-some-work');
  });

  test('should handle names with "feature/" prefix and convert to "feat/"', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('feature/Old-Style-Feature');
    const branchName = await agent.generateBranchName(task, plan);
    // The current logic will treat 'feature' as an invalid type and prepend 'feat',
    // making it 'feat/feature-old-style-feature'.
    // This is consistent with the updated logic that only allows specific types.
    expect(branchName).toBe('feat/feature-old-style-feature');
  });

  test('should handle names that are just a type (e.g. "fix") and create a default subject', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('fix');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('fix/general-update');
  });

  test('should handle names that are a type with a slash (e.g. "docs/") and create a default subject', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('docs/');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('docs/general-update');
  });

  test('should correctly lowercase an all-uppercase subject', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('feat/ALLUPPERCASE');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/alluppercase');
  });

  test('should replace multiple hyphens with a single hyphen', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('feat/subject--with---multiple----hyphens');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/subject-with-multiple-hyphens');
  });

  test('should remove leading and trailing hyphens from subject', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('feat/-subject-');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/subject');
  });

  test('should handle empty or whitespace-only response from ollama', async () => {
    mockOllamaService.generateResponse.mockResolvedValue(' ');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/general-update');
  });

  test('should handle response with only special characters', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('!@#$%^&*()');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/general-update');
  });

  test('should ensure entire branch name is lowercase even if type is initially uppercase', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('FIX/My-Bug-Fix');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('fix/my-bug-fix');
  });

  test('should handle subjects with slashes by replacing them with hyphens', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('feat/subject/with/slashes');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/subject-with-slashes');
  });

  test('should handle non-allowed type with slashes in subject', async () => {
    mockOllamaService.generateResponse.mockResolvedValue('custom/subject/with/slashes');
    const branchName = await agent.generateBranchName(task, plan);
    expect(branchName).toBe('feat/custom-subject-with-slashes');
  });

});
