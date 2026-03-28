/**
 * 云端备份路由
 * POST /api/backup/save     — 保存备份
 * GET  /api/backup/restore  — 恢复备份
 */

import { corsResponse } from '../utils.js'

const MAX_BACKUP_SIZE = 500 * 1024 // 500KB 上限

export async function handleBackupSave(request, env) {
  try {
    const body = await request.json()
    const { deviceId, data, version } = body

    if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 64) {
      return corsResponse({ error: '无效的设备标识' }, 400)
    }
    if (!Array.isArray(data)) {
      return corsResponse({ error: '数据格式错误' }, 400)
    }

    const serialized = JSON.stringify(data)
    if (serialized.length > MAX_BACKUP_SIZE) {
      return corsResponse({ error: '数据量超出备份上限（500KB）' }, 400)
    }

    const backupKey = `backup:${deviceId}`
    const meta = {
      data,
      count: data.length,
      version: version || 1,
      savedAt: new Date().toISOString(),
      size: serialized.length,
    }

    await env.MOOD_STATS.put(backupKey, JSON.stringify(meta))

    return corsResponse({ success: true, count: data.length, savedAt: meta.savedAt })
  } catch (e) {
    return corsResponse({ error: '备份失败' }, 500)
  }
}

export async function handleBackupRestore(request, env) {
  const url = new URL(request.url)
  const deviceId = url.searchParams.get('deviceId')

  if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 64) {
    return corsResponse({ error: '请提供有效的设备标识' }, 400)
  }

  const backupKey = `backup:${deviceId}`
  const raw = await env.MOOD_STATS.get(backupKey)

  if (!raw) {
    return corsResponse({ error: '未找到备份数据', hasBackup: false }, 404)
  }

  try {
    const meta = JSON.parse(raw)
    return corsResponse({
      success: true, data: meta.data, count: meta.count,
      savedAt: meta.savedAt, hasBackup: true,
    })
  } catch {
    return corsResponse({ error: '备份数据损坏' }, 500)
  }
}
