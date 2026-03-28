/**
 * Worker 公共工具函数
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

export function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS })
}

export function handleOptions() {
  return new Response(null, { headers: CORS_HEADERS })
}

// ============ 限流 ============
const RATE_LIMIT_WINDOW = 60
const RATE_LIMIT_MAX = 30

export async function checkRateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const key = `ratelimit:${ip}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - RATE_LIMIT_WINDOW

  try {
    const raw = await env.MOOD_STATS.get(key)
    let data = raw ? JSON.parse(raw) : { requests: [], windowStart: now }
    data.requests = data.requests.filter(t => t > windowStart)

    if (data.requests.length >= RATE_LIMIT_MAX) {
      return false
    }

    data.requests.push(now)
    await env.MOOD_STATS.put(key, JSON.stringify(data), { expirationTtl: RATE_LIMIT_WINDOW * 2 })
    return true
  } catch {
    return true
  }
}
