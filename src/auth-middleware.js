/**
 * Authentication Middleware
 * Handles JWT validation and API key authentication
 */

/**
 * Generate JWT token
 */
export async function generateJWT(payload, secret, expiresIn = 86400) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signature = await signHmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token
 */
export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verify signature
    const expectedSignature = await signHmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}

/**
 * Extract user from request (JWT or API key)
 */
export async function authenticateRequest(request, env) {
  // Check for JWT in Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = await verifyJWT(token, env.JWT_SECRET);
      return {
        userId: payload.userId,
        email: payload.email,
        authType: 'jwt',
        authenticated: true
      };
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      return { authenticated: false, error: error.message };
    }
  }
  
  // Check for API key in header
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    const user = await validateApiKey(apiKey, env);
    if (user) {
      return {
        ...user,
        authType: 'api_key',
        authenticated: true
      };
    }
  }
  
  // Anonymous user (free tier with IP-based rate limiting)
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  return {
    userId: `anon:${clientIP}`,
    email: null,
    authType: 'anonymous',
    authenticated: false
  };
}

/**
 * Validate API key
 */
async function validateApiKey(apiKey, env) {
  const keyData = await env.RISK_LENS_KV.get(`api_key:${apiKey}`);
  
  if (!keyData) {
    return null;
  }
  
  const keyInfo = JSON.parse(keyData);
  
  // Check if key is active
  if (!keyInfo.active) {
    return null;
  }
  
  // Check if key is expired
  if (keyInfo.expiresAt && new Date(keyInfo.expiresAt) < new Date()) {
    return null;
  }
  
  // Update last used timestamp
  keyInfo.lastUsed = new Date().toISOString();
  await env.RISK_LENS_KV.put(`api_key:${apiKey}`, JSON.stringify(keyInfo));
  
  return {
    userId: keyInfo.userId,
    email: keyInfo.email,
    apiKeyId: keyInfo.id
  };
}

/**
 * Generate API key for user
 */
export async function generateApiKey(userId, email, env) {
  // Generate random API key
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const apiKey = 'rl_' + Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const keyInfo = {
    id: crypto.randomUUID(),
    userId,
    email,
    active: true,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    expiresAt: null // Never expires by default
  };
  
  await env.RISK_LENS_KV.put(`api_key:${apiKey}`, JSON.stringify(keyInfo));
  
  // Store key ID for user (for listing their keys)
  const userKeysKey = `user_api_keys:${userId}`;
  const existingKeys = await env.RISK_LENS_KV.get(userKeysKey);
  const keysList = existingKeys ? JSON.parse(existingKeys) : [];
  keysList.push({ id: keyInfo.id, prefix: apiKey.substring(0, 10), createdAt: keyInfo.createdAt });
  await env.RISK_LENS_KV.put(userKeysKey, JSON.stringify(keysList));
  
  return apiKey;
}

/**
 * Revoke API key
 */
export async function revokeApiKey(apiKey, env) {
  const keyData = await env.RISK_LENS_KV.get(`api_key:${apiKey}`);
  
  if (!keyData) {
    throw new Error('API key not found');
  }
  
  const keyInfo = JSON.parse(keyData);
  keyInfo.active = false;
  keyInfo.revokedAt = new Date().toISOString();
  
  await env.RISK_LENS_KV.put(`api_key:${apiKey}`, JSON.stringify(keyInfo));
  
  return true;
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str) {
  const base64 = btoa(str);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str) {
  let base64 = str
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Add padding
  while (base64.length % 4) {
    base64 += '=';
  }
  
  return atob(base64);
}

/**
 * Sign with HMAC SHA-256
 */
async function signHmacSha256(data, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request, env) {
  const auth = await authenticateRequest(request, env);
  
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ 
      error: 'Authentication required',
      message: 'Please provide a valid JWT token or API key'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return auth;
}

/**
 * Create user session after login
 */
export async function createUserSession(userId, email, env) {
  const token = await generateJWT(
    { userId, email },
    env.JWT_SECRET,
    86400 * 30 // 30 days
  );
  
  return {
    token,
    userId,
    email,
    expiresIn: 86400 * 30
  };
}
