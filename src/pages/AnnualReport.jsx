/**
 * 年度报告组件 — 从 StatsPage 独立拆分
 *
 * 功能：展示年度情绪数据的完整可视化报告
 * - 年度封面、核心仪表盘、情绪环形图
 * - 12 个月情绪河流图、月度趋势折线
 * - 情绪故事线、月度对比、年度关键词、年度寄语
 */

import { MOOD_TYPES, getMoodLabel } from '../utils/moodUtils'
import { t } from '../i18n'
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts'
import { Flame, Calendar } from 'lucide-react'

const MOOD_COLORS = {
  very_negative: '#ef4444',
  negative: '#f97316',
  neutral: '#eab308',
  positive: '#22c55e',
  very_positive: '#6366f1',
}

// ============ 小组件 ============

function StatCard({ icon, label, value, unit, color, delay = 0 }) {
  return (
    <div className="card p-3">
      <div className={`flex items-center gap-1.5 mb-1.5 ${color}`}>{icon}<span className="text-xs">{label}</span></div>
      <p className="text-xl font-bold theme-text animate-count-up" style={{ animationDelay: `${delay}ms` }}>{value}<span className="text-xs font-normal theme-text-tertiary ml-0.5">{unit}</span></p>
    </div>
  )
}

// ============ 年度报告 ============

export default function AnnualReport({ records, navigate }) {
  const currentYear = new Date().getFullYear()
  const yearRecords = records.filter(r => r.date?.startsWith(String(currentYear)))

  if (yearRecords.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4 animate-float">📖</div>
        <p className="theme-text-secondary text-sm mb-4">{t('annual.noData')}</p>
        <button
          onClick={() => navigate('/record')}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm font-medium transition-all"
        >
          {t('annual.writeFirst')}
        </button>
      </div>
    )
  }

  // ====== 年度数据计算 ======
  const yearMoodCounts = {}
  Object.keys(MOOD_TYPES).forEach(k => yearMoodCounts[k] = 0)
  yearRecords.forEach(r => { if (yearMoodCounts[r.mood] !== undefined) yearMoodCounts[r.mood]++ })

  const yearAvg = yearRecords.reduce((s, r) => s + (MOOD_TYPES[r.mood]?.intensity || 3), 0) / yearRecords.length

  // 月度分析
  const monthScores = {}
  yearRecords.forEach(r => {
    const m = r.date.slice(5, 7)
    if (!monthScores[m]) monthScores[m] = { sum: 0, count: 0, moods: {} }
    monthScores[m].sum += MOOD_TYPES[r.mood]?.intensity || 3
    monthScores[m].count++
    monthScores[m].moods[r.mood] = (monthScores[m].moods[r.mood] || 0) + 1
  })
  let bestMonth = null, worstMonth = null
  Object.entries(monthScores).forEach(([m, d]) => {
    const avg = d.sum / d.count
    if (!bestMonth || avg > bestMonth.avg) bestMonth = { month: m, avg, count: d.count }
    if (!worstMonth || avg < worstMonth.avg) worstMonth = { month: m, avg, count: d.count }
  })

  // 最佳连续天数
  let bestStreak = 0, currentStreak = 0
  yearRecords.forEach(r => {
    if (r.mood === 'positive' || r.mood === 'very_positive') { currentStreak++; bestStreak = Math.max(bestStreak, currentStreak) }
    else currentStreak = 0
  })

  // 最常见情绪
  const topYearMood = Object.entries(yearMoodCounts).sort(([,a],[,b]) => b - a)[0]
  const topMoodInfo = MOOD_TYPES[topYearMood?.[0]]

  // 记录率
  const yearStart = new Date(currentYear, 0, 1)
  const daysInYear = Math.max(1, Math.round((new Date() - yearStart) / 86400000))
  const recordRate = Math.round((yearRecords.length / daysInYear) * 100)

  // 月度趋势 + 情绪河流图数据
  const monthLabels = t('heatmap.months').split(',')
  const monthlyTrend = monthLabels.map((name, idx) => {
    const monthStr = String(idx + 1).padStart(2, '0')
    const mr = yearRecords.filter(r => r.date.slice(5, 7) === monthStr)
    const avg = mr.length > 0 ? mr.reduce((s, r) => s + (MOOD_TYPES[r.mood]?.intensity || 3), 0) / mr.length : 0
    return { month: name, avg: Number(avg.toFixed(1)), count: mr.length }
  })

  // 情绪河流图：每月各情绪原始计数（expand 自动归一化）
  const riverData = monthLabels.map((name, idx) => {
    const monthStr = String(idx + 1).padStart(2, '0')
    const mr = yearRecords.filter(r => r.date.slice(5, 7) === monthStr)
    const counts = {}
    Object.keys(MOOD_TYPES).forEach(k => counts[k] = 0)
    mr.forEach(r => { if (counts[r.mood] !== undefined) counts[r.mood]++ })
    return {
      month: name,
      very_negative: counts.very_negative,
      negative: counts.negative,
      neutral: counts.neutral,
      positive: counts.positive,
      very_positive: counts.very_positive,
      _total: mr.length,
    }
  })
  // 截掉末尾无数据月份，河流自然结束
  const lastDataIdx = riverData.map(d => d._total).lastIndexOf(yearRecords.length > 0 ? 1 : 0)
  const riverDisplay = lastDataIdx >= 0 ? riverData.slice(0, lastDataIdx + 1) : riverData

  // 年度关键词
  const STOP = new Set(['的','了','在','是','我','有','和','就','不','人','都','一','一个','上','也','很','到','说','要','去','你','会','着','没有','看','好','自己','这','他','她','它','们','那','些','什么','怎么','还是','因为','所以','但是','然后','如果','虽然','今天','感觉','觉得','有点','真的','可以','已经','不是','不想','不过','一直','一下','一些','这些','那些','这样','那样','这么','那么','一天','一次','一样','一点','一种'])
  const kwFreq = {}
  yearRecords.forEach(r => {
    if (Array.isArray(r.keywords)) r.keywords.forEach(kw => { if (kw?.length >= 2 && kw.length <= 10 && !STOP.has(kw)) kwFreq[kw] = (kwFreq[kw]||0)+1 })
    if (r.text) r.text.replace(/[^\u4e00-\u9fff\uf900-\ufaffa-zA-Z]/g,' ').split(/\s+/).filter(s => s.length>=2 && s.length<=6 && !STOP.has(s)).forEach(w => { kwFreq[w]=(kwFreq[w]||0)+1 })
  })
  const sortedKeywords = Object.entries(kwFreq).filter(([,c])=>c>=2).sort(([,a],[,b])=>b-a).slice(0,20)

  // 情绪故事线：每月一句话
  const monthStories = monthLabels.map((name, idx) => {
    const monthStr = String(idx + 1).padStart(2, '0')
    const mr = yearRecords.filter(r => r.date.slice(5, 7) === monthStr)
    if (!mr.length) return { month: name, story: t('story.noRecord'), emoji: '·', moodKey: 'neutral' }
    const avg = mr.reduce((s,r)=>s+(MOOD_TYPES[r.mood]?.intensity||3),0)/mr.length
    let story, moodKey
    if (avg >= 4.5) { story = t('story.sunny'); moodKey = 'very_positive' }
    else if (avg >= 3.8) { story = t('story.happy'); moodKey = 'positive' }
    else if (avg >= 3.2) { story = t('story.calm'); moodKey = 'neutral' }
    else if (avg >= 2.5) { story = t('story.rough'); moodKey = 'negative' }
    else { story = t('story.low'); moodKey = 'very_negative' }
    return { month: name, story, emoji: MOOD_TYPES[moodKey]?.emoji, moodKey, avg, count: mr.length }
  })

  // 年度寄语
  const getMessage = () => {
    if (yearAvg >= 4.5) return { text: t('annualMsg.excellent'), icon: '🌟' }
    if (yearAvg >= 4) return { text: t('annualMsg.great'), icon: '🎉' }
    if (yearAvg >= 3.5) return { text: t('annualMsg.good'), icon: '🌱' }
    if (yearAvg >= 3) return { text: t('annualMsg.okay'), icon: '🌈' }
    if (yearAvg >= 2.5) return { text: t('annualMsg.tough'), icon: '💙' }
    return { text: t('annualMsg.hard'), icon: '💛' }
  }
  const annualMsg = getMessage()

  // 情绪环形图 SVG 数据
  const ringSize = 140, ringStroke = 12, ringRadius = (ringSize - ringStroke) / 2
  const ringCirc = 2 * Math.PI * ringRadius
  const moodRingData = Object.entries(yearMoodCounts)
    .filter(([,c]) => c > 0)
    .sort(([,a],[,b]) => b - a)
    .map(([key, count]) => ({
      key,
      count,
      pct: count / yearRecords.length,
      color: MOOD_TYPES[key]?.color,
      label: getMoodLabel(key),
      emoji: MOOD_TYPES[key]?.emoji,
    }))

  let ringOffset = 0
  const ringSegments = moodRingData.map(d => {
    const segLen = d.pct * ringCirc
    const segDasharray = `${segLen} ${ringCirc - segLen}`
    const segOffset = -ringOffset
    ringOffset += segLen
    return { ...d, dasharray: segDasharray, offset: segOffset }
  })

  return (
    <div className="space-y-4">
      {/* ====== 第一页：年度封面 ====== */}
      <div className="card annual-cover p-8 text-center relative overflow-hidden animate-card-flip">
        <div className="relative">
          <div className="text-6xl mb-3 animate-float">{topMoodInfo?.emoji || '📝'}</div>
          <h2 className="text-2xl font-bold gradient-text mb-1">{currentYear}</h2>
          <p className="text-sm font-medium theme-text mb-1">{t('annual.title')}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs theme-text-tertiary mt-2">
            <span>{t('annual.totalRecords')}</span>
            <span className="text-base font-bold gradient-text">{yearRecords.length}</span>
            <span>{t('annual.daysUnit')}</span>
          </div>
        </div>
      </div>

      {/* ====== 第二页：核心数据仪表盘 ====== */}
      <div className="card p-5 animate-card-flip" style={{ animationDelay: '100ms' }}>
        <h3 className="text-sm font-semibold theme-text mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
          {t('stats.annualDataOverview')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* 年度均分 — 带环形进度 */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-2">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--theme-border)" strokeWidth="5" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="url(#avgGrad)" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray={`${(yearAvg/5)*213.6} 213.6`}
                  transform="rotate(-90 40 40)" />
                <defs>
                  <linearGradient id="avgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-xl font-bold theme-text">{yearAvg.toFixed(1)}</span>
            </div>
            <p className="text-xs theme-text-tertiary">{t('annual.avgScore')}</p>
          </div>
          {/* 记录率 — 带环形进度 */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-2">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--theme-border)" strokeWidth="5" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#6366f1" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray={`${(Math.min(recordRate,100)/100)*213.6} 213.6`}
                  transform="rotate(-90 40 40)" />
              </svg>
              <span className="absolute text-xl font-bold theme-text">{recordRate}<span className="text-xs">%</span></span>
            </div>
            <p className="text-xs theme-text-tertiary">{t('stats.recordRate')}</p>
          </div>
          <StatCard icon={<Flame size={16} />} label={t('annual.bestStreak')} value={bestStreak} unit={t('stats.days')} color="text-orange-400" delay={200} />
          <StatCard icon={<Calendar size={16} />} label={t('annual.recordDays')} value={yearRecords.length} unit={t('stats.days')} color="text-pink-400" delay={300} />
        </div>
      </div>

      {/* ====== 第三页：年度主旋律 + 情绪环形图 ====== */}
      <div className="card p-5 animate-card-flip" style={{ animationDelay: '200ms' }}>
        <h3 className="text-sm font-semibold theme-text mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          {t('stats.annualMoodMap')}
        </h3>
        <div className="flex items-center gap-5">
          {/* SVG 环形图 */}
          <div className="shrink-0" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
              <circle cx={ringSize/2} cy={ringSize/2} r={ringRadius} fill="none" stroke="var(--theme-border)" strokeWidth={ringStroke} />
              {ringSegments.map((seg) => (
                <circle key={seg.key} cx={ringSize/2} cy={ringSize/2} r={ringRadius}
                  fill="none" stroke={seg.color} strokeWidth={ringStroke}
                  strokeDasharray={seg.dasharray} strokeDashoffset={seg.offset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${ringSize/2} ${ringSize/2})`}
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              ))}
              <text x={ringSize/2} y={ringSize/2 - 8} textAnchor="middle" fill="var(--theme-text)" fontSize="24">
                {topMoodInfo?.emoji}
              </text>
              <text x={ringSize/2} y={ringSize/2 + 14} textAnchor="middle" fill="var(--theme-text-secondary)" fontSize="10">
                {t('stats.annualMainMood')}
              </text>
            </svg>
          </div>
          <div className="flex-1 space-y-2">
            {moodRingData.map(d => (
              <div key={d.key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs theme-text-secondary flex-1">{d.emoji} {d.label}</span>
                <span className="text-xs theme-text-tertiary">{Math.round(d.pct * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== 第四页：12 个月情绪河流图 ====== */}
      <div className="card p-5 animate-card-flip" style={{ animationDelay: '300ms' }}>
        <h3 className="text-sm font-semibold theme-text mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          {t('annual.riverTitle')}
        </h3>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <AreaChart data={riverDisplay} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--theme-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--theme-text-tertiary)' }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${Math.round(v*100)}%`} />
              <Tooltip
                contentStyle={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', borderRadius: 10, fontSize: 11, color: 'var(--theme-text)' }}
                formatter={(value, name, props) => {
                  const keys = ['very_positive','positive','neutral','negative','very_negative']
                  const raw = keys.map(k => props.payload?.[k] || 0)
                  const sum = raw.reduce((a,b) => a+b, 0) || 1
                  const pcts = raw.map(r => Math.round(r / sum * 100))
                  const diff = 100 - pcts.reduce((a,b) => a+b, 0)
                  const maxIdx = pcts.indexOf(Math.max(...pcts))
                  pcts[maxIdx] += diff
                  const idx = keys.indexOf(name)
                  return [`${pcts[idx]}%`, getMoodLabel(name)]
                }}
              />
              <Area type="monotone" dataKey="very_positive" stackId="1" stroke="none" fill="#6366f1" fillOpacity={0.8} />
              <Area type="monotone" dataKey="positive" stackId="1" stroke="none" fill="#22c55e" fillOpacity={0.8} />
              <Area type="monotone" dataKey="neutral" stackId="1" stroke="none" fill="#eab308" fillOpacity={0.8} />
              <Area type="monotone" dataKey="negative" stackId="1" stroke="none" fill="#f97316" fillOpacity={0.8} />
              <Area type="monotone" dataKey="very_negative" stackId="1" stroke="none" fill="#ef4444" fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ====== 第五页：月度趋势折线 ====== */}
      <div className="card p-5 animate-card-flip" style={{ animationDelay: '350ms' }}>
        <h3 className="text-sm font-semibold theme-text mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          {t('stats.monthlyAvg')}
        </h3>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="yearGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--theme-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'var(--theme-text-tertiary)' }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', borderRadius: 8, fontSize: 12, color: 'var(--theme-text)' }}
                formatter={(value) => [value > 0 ? `${value}/5` : '-', t('stats.avgMoodLabel')]} />
              <Area type="monotone" dataKey="avg" stroke="#c084fc" strokeWidth={2.5} fill="url(#yearGrad2)" connectNulls={false}
                dot={{ r: 4, fill: '#c084fc', stroke: 'var(--theme-bg)', strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: '#c084fc', strokeWidth: 2, fill: 'var(--theme-bg)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ====== 第六页：情绪故事线 ====== */}
      <div className="card p-5 animate-card-flip" style={{ animationDelay: '400ms' }}>
        <h3 className="text-sm font-semibold theme-text mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          {t('stats.annualStory')}
        </h3>
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2.5 top-1 bottom-1 w-px bg-gradient-to-b from-purple-400/40 via-pink-400/30 to-transparent" />
          {monthStories.filter(s => s.count > 0).map((ms, i) => {
            const moodColor = MOOD_TYPES[ms.moodKey]?.color || '#9ca3af'
            return (
              <div key={ms.month} className="relative animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="absolute -left-3.5 top-1 w-3 h-3 rounded-full border-2" style={{ borderColor: moodColor, backgroundColor: 'var(--theme-bg)' }} />
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{ms.emoji}</span>
                  <div>
                    <p className="text-xs font-medium theme-text">{ms.month}</p>
                    <p className="text-xs theme-text-secondary mt-0.5">{ms.story}</p>
                    {ms.avg > 0 && <p className="text-[10px] theme-text-tertiary mt-0.5">{t('story.recordSuffix').replace('{avg}', ms.avg.toFixed(1)).replace('{count}', ms.count)}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ====== 第七页：月度对比 ====== */}
      {(bestMonth || worstMonth) && (
        <div className="card p-5 animate-card-flip" style={{ animationDelay: '450ms' }}>
          <h3 className="text-sm font-semibold theme-text mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            {t('stats.monthlyCompare')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {bestMonth && (
              <div className="p-4 rounded-xl text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.02))' }}>
                <div className="absolute inset-0 border border-green-500/20 rounded-xl" />
                <p className="text-3xl mb-2">🌟</p>
                <p className="text-lg font-bold text-green-400">{parseInt(bestMonth.month)}</p>
                <p className="text-xs theme-text-tertiary mt-1">{t('annual.bestMonth')}</p>
                <p className="text-2xl font-bold text-green-400 mt-2">{bestMonth.avg.toFixed(1)}<span className="text-xs font-normal theme-text-tertiary">/5</span></p>
              </div>
            )}
            {worstMonth && (
              <div className="p-4 rounded-xl text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.02))' }}>
                <div className="absolute inset-0 border border-indigo-500/20 rounded-xl" />
                <p className="text-3xl mb-2">💙</p>
                <p className="text-lg font-bold text-indigo-400">{parseInt(worstMonth.month)}</p>
                <p className="text-xs theme-text-tertiary mt-1">{t('annual.worstMonth')}</p>
                <p className="text-2xl font-bold text-indigo-400 mt-2">{worstMonth.avg.toFixed(1)}<span className="text-xs font-normal theme-text-tertiary">/5</span></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== 第八页：年度关键词 ====== */}
      {sortedKeywords.length > 0 && (
        <div className="card p-5 animate-card-flip" style={{ animationDelay: '500ms' }}>
          <h3 className="text-sm font-semibold theme-text mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            {t('annual.keywordsTitle')}
          </h3>
          <div className="flex flex-wrap gap-2.5 items-center justify-center py-2">
            {sortedKeywords.map(([keyword, count], idx) => {
              const maxCount = sortedKeywords[0][1]
              const ratio = count / maxCount
              const size = Math.round(13 + ratio * 13)
              const colors = ['#f472b6', '#c084fc', '#818cf8', '#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#a78bfa']
              const color = colors[idx % colors.length]
              return (
                <span key={keyword}
                  className="inline-block px-2.5 py-1 rounded-lg cursor-default transition-all duration-200 hover:scale-110"
                  style={{ fontSize: `${size}px`, color, backgroundColor: `${color}12`, opacity: 0.65 + ratio * 0.35 }}
                  title={`${count}${t('stats.times')}`}>
                  {keyword}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ====== 最后一页：年度寄语 ====== */}
      <div className="card p-6 text-center relative overflow-hidden animate-card-flip" style={{ animationDelay: '550ms' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent" />
        <div className="relative">
          <div className="text-4xl mb-3">{annualMsg.icon}</div>
          <p className="text-sm theme-text-secondary leading-relaxed max-w-xs mx-auto">{annualMsg.text}</p>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-purple-400/30" />
            <span className="text-[10px] theme-text-muted">{t('annual.slogan')}</span>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-purple-400/30" />
          </div>
        </div>
      </div>
    </div>
  )
}
