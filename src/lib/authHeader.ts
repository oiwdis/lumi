/**
 * Bearer header for the endpoints that cost money to call.
 *
 * /api/tutor and /api/customize used to accept anonymous requests, which meant
 * anyone who found the URL could spend the project's Anthropic credits. They now
 * require a signed-in user, so every caller has to send this.
 */
export function authHeader(): Record<string, string> {
  const token = localStorage.getItem('lumi-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
