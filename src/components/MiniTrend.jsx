/**
 * 迷你 7 天情绪趋势图
 * 在首页展示最近一周的情绪变化，让用户一眼看到趋势
 */
import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { MOOD_TYPES } from '../utils/moodUtils'

const MOOD_COLORS = {
  very_negative: '#ef4444',
  negative: '#f97316',
  neutral: '#eab308',
  positive: '#22c55e',
  very_positive: '#6366f1',
}

export default function MiniTrend({ records }) {
  const trendData = useMemo(() => {
    const data = []
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const rec = records.find(r => r.date === d)
      data.push({
        date: format(subDays(new Date(), i), 'M/d'),
        score: rec ? (MOOD_TYPES[rec.mood]?.intensity || 0) : null,
        mood: rec?.mood || null,
        label: format(subDays(new Date(), i), 'EEE', { locale: undefined }),
      })
    }
    return data
  }, [records])

  // 计算 SVG 路径
  const { pathD, dots, hasData } = useMemo(() => {
    const width = 280
    const height = 48
    const padding = { top: 8, bottom: 8, left: 12, right: 12 }
    const innerW = width - padding.left - padding.right
    const innerH = height - padding.top - padding.bottom

    const validData = trendData.filter(d => d.score !== null)
    if (validData.length < 2) return { pathD: '', dots: [], hasData: false }

    const points = trendData.map((d, i) => {
      const x = padding.left + (i / 6) * innerW
      const y = d.score !== null ? padding.top + innerH - ((d.score - 1) / 4) * innerH : null
      return { x, y, ...d }
    })

    // 构建平滑路径（仅连接有数据的点）
    let path = ''
    const validPoints = points.filter(p => p.y !== null)

    if (validPoints.length >= 2) {
      path = `M ${validPoints[0].x} ${validPoints[0].y}`
      for (let i = 1; i < validPoints.length; i++) {
        const prev = validPoints[i - 1]
        const curr = validPoints[i]
        const cpx = (prev.x + curr.x) / 2
        path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
      }
    }

    return {
      pathD: path,
      dots: validPoints,
      hasData: true,
    }
  }, [trendData])

  if (!hasData) {
    return (
      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold theme-text mb-2">近7天趋势</h2>
        <p className="text-xs theme-text-tertiary text-center py-4">记录几天后就能看到趋势啦~</p>
      </div>
    )
  }

  // 趋势方向判断
  const recent3 = trendData.slice(-3).filter(d => d.score !== null)
  const prev3 = trendData.slice(0, 3).filter(d => d.score !== null)
  const recentAvg = recent3.length ? recent3.reduce((s, d) => s + d.score, 0) / recent3.length : 0
  const prevAvg = prev3.length ? prev3.reduce((s, d) => s + d.score, 0) / prev3.length : 0
  let trendText = ''
  let trendColor = 'theme-text-tertiary'
  if (recentAvg > prevAvg + 0.3) {
    trendText = '📈 心情在变好'
    trendColor = 'text-green-400'
  } else if (recentAvg < prevAvg - 0.3) {
    trendText = '📉 最近有些低落'
    trendColor = 'text-orange-400'
  } else {
    trendText = '➡️ 心情比较平稳'
    trendColor = 'theme-text-tertiary'
  }

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold theme-text">近7天趋势</h2>
        <span className={`text-xs ${trendColor}`}>{trendText}</span>
      </div>

      {/* SVG 趋势线 */}
      <div className="flex justify-center">
        <svg width="280" height="48" viewBox="0 0 280 48" className="overflow-visible">
          {/* 水平参考线 */}
          <line x1="12" y1="44" x2="268" y2="44" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1="12" y1="24" x2="268" y2="24" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="12" y1="8" x2="268" y2="8" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* 渐变填充 */}
          <defs>
            <linearGradient id="miniTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 填充区域 */}
          {pathD && (
            <path
              d={pathD + ` L ${dots[dots.length - 1].x} 44 L ${dots[0].x} 44 Z`}
              fill="url(#miniTrendGrad)"
            />
          )}

          {/* 趋势线 */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#c084fc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 数据点 */}
          {dots.map((dot, i) => (
            <g key={i}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r="4"
                fill={MOOD_COLORS[dot.mood] || '#c084fc'}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
              />
              {/* 日期标签 */}
              <text
                x={dot.x}
                y="48"
                textAnchor="middle"
                fontSize="8"
                fill="rgba(255,255,255,0.3)"
                dominantBaseline="auto"
              >
                {dot.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
