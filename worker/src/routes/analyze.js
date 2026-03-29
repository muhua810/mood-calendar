/**
 * AI 情绪分析代理路由
 * POST /api/analyze — 通过 DeepSeek API 进行情绪分析
 */

import { corsResponse } from '../utils.js'

const SYSTEM_PROMPT = `你是一个情绪分析助手。用户会发来一段简短的文字，请你分析其中表达的情绪。
用JSON格式返回，包含字段：mood(1-5整数)、moodLabel(中文描述)、confidence(0-1)、analysis(30字内分析)、keywords(数组，最多5个)、suggestion(20字内建议)。
mood对应关系：1=非常低落, 2=有点难过, 3=一般般, 4=心情不错, 5=超级开心。
只返回JSON，不要有其他内容。`

const MOOD_MAP = { 1: 'very_negative', 2: 'negative', 3: 'neutral', 4: 'positive', 5: 'very_positive' }
const MOOD_LABELS = { 1: '非常低落', 2: '有点难过', 3: '一般般', 4: '心情不错', 5: '超级开心' }

export async function handleAnalyze(request, env) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return corsResponse({ error: '请提供要分析的文本' }, 400)
    }

    if (text.length > 500) {
      return corsResponse({ error: '文本长度超过限制（500字）' }, 400)
    }

    const apiKey = env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return corsResponse({ error: 'AI 服务未配置' }, 503)
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text.trim() },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('DeepSeek API error:', response.status, errText)
      return corsResponse({ error: 'AI 分析服务暂时不可用' }, 502)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return corsResponse({ error: 'AI 返回内容为空' }, 502)
    }

    let result
    try {
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      result = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('AI 返回内容不是有效 JSON:', content)
      return corsResponse({ error: 'AI 响应格式错误' }, 502)
    }

    const rawMood = Number(result.mood) || 3
    const moodWasClamped = rawMood !== Math.round(rawMood) || rawMood < 1 || rawMood > 5
    const moodNum = Math.max(1, Math.min(5, Math.round(rawMood)))
    let confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0.7))
    if (moodWasClamped) confidence = Math.min(confidence, 0.5)

    return corsResponse({
      mood: MOOD_MAP[moodNum],
      intensity: moodNum,
      moodLabel: MOOD_LABELS[moodNum],
      confidence,
      analysis: String(result.analysis || '').slice(0, 100),
      keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 5) : [],
      suggestion: String(result.suggestion || '').slice(0, 50),
      method: 'ai',
    })
  } catch (e) {
    console.error('Analyze error:', e)
    return corsResponse({ error: '请求处理失败' }, 500)
  }
}
