import { useState, Suspense, lazy, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Onboarding from './components/Onboarding'
import { t } from './i18n'

// 路由懒加载 — 首屏只加载 HomePage，其余按需加载
const HomePage = lazy(() => import('./pages/HomePage'))
const RecordPage = lazy(() => import('./pages/RecordPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotFound = lazy(() => import('./pages/NotFound'))

// 预取函数：调用 import() 会触发浏览器缓存该 chunk
const prefetchRecord = () => import('./pages/RecordPage')
const prefetchStats = () => import('./pages/StatsPage')
const prefetchProfile = () => import('./pages/ProfilePage')

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse-soft text-center">
        <div className="text-3xl mb-3">🎭</div>
        <p className="text-sm theme-text-tertiary">{t('common.loading')}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('mood_calendar_onboarded') === 'true'
  )

  // 首屏加载完成后，空闲时预取其他路由 chunk
  // 这样用户第一次点 tab 时资源已在缓存中，秒开
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 2000))
    idle(() => {
      prefetchRecord()
      prefetchStats()
      prefetchProfile()
    })
  }, [])

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
