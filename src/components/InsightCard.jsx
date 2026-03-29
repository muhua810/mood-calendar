/**
 * 洞察卡片组件 — 展示情绪洞察引擎的分析结果
 *
 * 展示位置：首页（最近记录下方、热力图上方）
 * 最多展示 2 条洞察，按严重程度排序
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { runInsightAnalysis, INSIGHT_TYPES } from '../services/insightEngine'
import { t } from '../i18n'

const SEVERITY_STYLES = {
  high: {
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
    icon: '💛',
    iconBg: 'bg-red-500/10',
  },
  medium: {
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    icon: '💡',
    iconBg: 'bg-amber-500/10',
  },
  low: {
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
    icon: '✨',
    iconBg: 'bg-green-500/10',
  },
}

export default function InsightCard() {
  const [insights, setInsights] = useState([])
  const [dismissed, setDismissed] = useState(() => {
    try {
      const saved = localStorage.getItem('moodtrace_dismissed_insights')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    const results = runInsightAnalysis()
      .filter(ins => !dismissed.includes(ins.type))
    setInsights(results)
  }, [])

  const handleDismiss = (type) => {
    const updated = [...dismissed, type]
    setDismissed(updated)
    setInsights(prev => prev.filter(i => i.type !== type))
    try { localStorage.setItem('moodtrace_dismissed_insights', JSON.stringify(updated)) } catch { /* ignore */ }
  }

  if (insights.length === 0) return null

  return (
    <div className="space-y-2 mb-4 animate-fade-in-up">
      {insights.map((insight) => {
        const style = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.low
        return (
          <div
            key={insight.type}
            className={`card p-4 border ${style.border} ${style.bg} relative`}
          >
            <button
              onClick={() => handleDismiss(insight.type)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center theme-text-tertiary hover:theme-text text-xs transition-colors"
              aria-label={t('common.close')}
            >
              <X size={12} />
            </button>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center text-base shrink-0`}>
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} className="text-purple-400" />
                  <span className="text-[10px] text-purple-400 font-medium">{t('insight.title')}</span>
                </div>
                <p className="text-xs theme-text-secondary leading-relaxed">{insight.message}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
