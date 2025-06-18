import { render, screen } from '@testing-library/react';
import { RepoSelector } from './RepoSelector';
import { describe, it, expect } from 'vitest';

describe('RepoSelector', () => {
  it('renders the select dropdowns with correct initial options', () => {
    render(<RepoSelector token="" selectedRepo="" selectedBranch="" onRepoSelect={() => {}} onBranchSelect={() => {}} />);

    // Check for Repository select and its initial option
    const repoSelect = screen.getByLabelText('Repository');
    expect(repoSelect).toBeInTheDocument();
    expect(repoSelect).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Enter GitHub token first' })).toBeInTheDocument();

    // Check for Base Branch select and its initial option
    const branchSelect = screen.getByLabelText('Base Branch');
    expect(branchSelect).toBeInTheDocument();
    expect(branchSelect).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Select repository first' })).toBeInTheDocument();
  });
});
