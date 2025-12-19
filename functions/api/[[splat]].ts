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
  let pathSegments = Array.isArray(splat) ? splat.join('/') : (splat || '');
  
  // Normalize path: remove leading/trailing slashes to avoid double slashes
  pathSegments = pathSegments.replace(/^\/+/, '').replace(/\/+$/, '');
  
  const url = new URL(request.url);
  const search = url.search; // Preserve query string
  
  // Construct target URL: ensure single / between segments
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
    // Always set Content-Type for JSON responses to prevent CORB blocking
    const contentType = proxiedHeaders.get('Content-Type') || 'application/json; charset=utf-8';
    if (!contentType.includes('charset')) {
      proxiedHeaders.set('Content-Type', `${contentType.split(';')[0]}; charset=utf-8`);
    } else {
      proxiedHeaders.set('Content-Type', contentType);
    }
    
    // Add X-Content-Type-Options to prevent MIME type sniffing (helps with CORB)
    proxiedHeaders.set('X-Content-Type-Options', 'nosniff');
    
    // Add debug headers only in development (not in production)
    const isProduction = env.ENVIRONMENT === 'production' || !env.ENVIRONMENT;
    if (!isProduction) {
      proxiedHeaders.set('x-aidevelo-proxy', '1');
      proxiedHeaders.set('x-aidevelo-auth-present', hasAuth ? '1' : '0');
      proxiedHeaders.set('x-aidevelo-proxied-url', targetUrl); // Debug: show what URL was forwarded
    }
    
    // Log 404s for debugging (only in non-production or when debugging)
    if (response.status === 404) {
      // Minimal logging - only path, not full URL with tokens
      console.log(`[Pages Function] 404 for path: ${pathSegments}`);
    }
    
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: proxiedHeaders,
    });
  } catch (error) {
    // Log error with path for debugging (safe - no tokens)
    console.error(`[Pages Function] Proxy error for path: ${pathSegments}`, error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({ 
        error: 'Proxy error',
        message: error instanceof Error ? error.message : 'Unknown error',
        path: pathSegments, // Include path in error for debugging
      }),
      {
        status: 502,
        headers: { 
          'Content-Type': 'application/json',
          ...(env.ENVIRONMENT !== 'production' && !env.ENVIRONMENT ? {
            'x-aidevelo-proxy-error': '1',
            'x-aidevelo-proxied-url': targetUrl, // Debug header (dev only)
          } : {}),
        },
      }
    );
  }
};

