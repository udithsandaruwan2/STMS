import { useEffect } from 'react'
import { useTrafficStore } from '../store/useTrafficStore'

export function Toast() {
  const toast = useTrafficStore((s) => s.toast)
  const clearToast = useTrafficStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 2600)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  if (!toast) return null

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-[80] rounded-lg border border-[var(--color-mint)]/40 bg-[#0d1a14] px-4 py-3 text-sm text-[var(--color-mint)] shadow-xl">
      {toast}
    </div>
  )
}
