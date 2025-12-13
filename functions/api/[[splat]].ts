/**
 * Cloudflare Pages Function: API Proxy
 * 
 * Proxies all /api/* requests to Render backend server-side.
 * This ensures browser only makes same-origin requests (satisfies CSP connect-src 'self').
 * 
 * Environment Variable Required:
 * - RENDER_API_ORIGIN: https://real-aidevelo-ai.onrender.com
 */

export const onRequest: PagesFunction<{ RENDER_API_ORIGIN?: string }> = async (context) => {
  const { request, env, params } = context;
  
  // Get target origin from environment variable (fallback to default)
  const targetOrigin = env.RENDER_API_ORIGIN || 'https://real-aidevelo-ai.onrender.com';
  
  // Safety: Only allow HTTPS origins (prevent open proxy)
  if (!targetOrigin.startsWith('https://')) {
    return new Response(
      JSON.stringify({ error: 'Invalid RENDER_API_ORIGIN: must be HTTPS' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Reconstruct target URL
  // params.splat is an array of path segments after /api/
  const splat = params.splat as string | string[];
  const pathSegments = Array.isArray(splat) ? splat.join('/') : (splat || '');
  const search = new URL(request.url).search; // Preserve query string
  
  const targetUrl = `${targetOrigin}/api/${pathSegments}${search}`;
  
  // Forward request to Render backend
  const forwardedHeaders = new Headers();
  
  // Check if Authorization header is present (for debug header)
  const hasAuth = request.headers.has('Authorization');
  
  // Copy relevant headers (exclude Host and other Cloudflare-specific headers)
  const headersToForward = [
    'Authorization',
    'Content-Type',
    'Accept',
    'User-Agent',
    'X-Requested-With',
  ];
  
  for (const headerName of headersToForward) {
    const value = request.headers.get(headerName);
    if (value) {
      forwardedHeaders.set(headerName, value);
    }
  }
  
  // Do NOT forward these headers (let fetch set them):
  // - Host (will be set by fetch to target origin)
  // - cf-* (Cloudflare-specific, not needed upstream)
  // - x-forwarded-* (we're not a traditional proxy, fetch handles this)
  
  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method: request.method,
    headers: forwardedHeaders,
    // Forward body for non-GET/HEAD requests
    body: request.method !== 'GET' && request.method !== 'HEAD' 
      ? await request.clone().arrayBuffer() 
      : undefined,
  };
  
  try {
    // Forward request to Render backend
    const response = await fetch(targetUrl, fetchOptions);
    
    // Clone response to read body
    const responseBody = await response.arrayBuffer();
    
    // Create new response with same status and headers
    const proxiedHeaders = new Headers(response.headers);
    
    // Remove CORS headers from upstream (we're same-origin now)
    proxiedHeaders.delete('Access-Control-Allow-Origin');
    proxiedHeaders.delete('Access-Control-Allow-Credentials');
    proxiedHeaders.delete('Access-Control-Allow-Methods');
    proxiedHeaders.delete('Access-Control-Allow-Headers');
    
    // Ensure Content-Type is set (prevents CORB)
    if (!proxiedHeaders.has('Content-Type')) {
      proxiedHeaders.set('Content-Type', 'application/json; charset=utf-8');
    }
    
    // Add debug headers to verify proxy is active
    proxiedHeaders.set('x-aidevelo-proxy', '1');
    proxiedHeaders.set('x-aidevelo-auth-present', hasAuth ? '1' : '0');
    
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: proxiedHeaders,
    });
  } catch (error) {
    console.error('[Pages Function] Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Proxy error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

