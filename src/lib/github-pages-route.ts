/**
 * GitHub Pages 404.html redirects unknown routes to `/?/<route>`.
 * Restore that path before BrowserRouter initializes.
 */
export function getGitHubPagesRedirectPath(search: string, baseUrl: string, hash = ''): string | null {
  if (!search.startsWith('?/')) return null;

  const redirected = search.slice(2);
  const queryStart = redirected.indexOf('&');
  const route = queryStart < 0 ? redirected : redirected.slice(0, queryStart);
  const forwardedQuery = queryStart < 0 ? '' : redirected.slice(queryStart + 1);
  const baseSegments = baseUrl.split('/').filter(Boolean);
  const basePath = baseSegments.length ? `/${baseSegments.join('/')}` : '';
  const routePath = route.replace(/^\/+/, '');
  const query = forwardedQuery ? `?${forwardedQuery.replace(/~and~/g, '&')}` : '';

  return `${basePath}/${routePath}${query}${hash}`;
}
