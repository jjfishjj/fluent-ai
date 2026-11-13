import { describe, expect, it } from 'vitest';
import { getGitHubPagesRedirectPath } from './github-pages-route';

describe('GitHub Pages deep-link recovery', () => {
  it('restores the game path under the repository base URL', () => {
    expect(getGitHubPagesRedirectPath('?/xianjing', '/fluent-ai/')).toBe('/fluent-ai/xianjing');
  });

  it('preserves forwarded query parameters and the hash', () => {
    expect(
      getGitHubPagesRedirectPath('?/xianjing&genius=visual~and~vark=read', '/fluent-ai/', '#lesson'),
    ).toBe('/fluent-ai/xianjing?genius=visual&vark=read#lesson');
  });

  it('does not rewrite ordinary application query strings', () => {
    expect(getGitHubPagesRedirectPath('?genius=visual', '/fluent-ai/')).toBeNull();
  });

  it('supports a root-hosted build without a repository prefix', () => {
    expect(getGitHubPagesRedirectPath('?/xianjing', '/')).toBe('/xianjing');
  });
});
