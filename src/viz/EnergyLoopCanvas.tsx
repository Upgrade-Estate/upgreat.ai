import { useEffect, useRef, useState } from 'react'
import { EnergyLoopApp, type OverlayRefs } from './core/EnergyLoopApp'

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export interface EnergyLoopCanvasProps {
  overlay: () => OverlayRefs
  onUnsupported: () => void
}

export default function EnergyLoopCanvas({ overlay, onUnsupported }: EnergyLoopCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [supported] = useState(webglAvailable)

  useEffect(() => {
    if (!supported) {
      onUnsupported()
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let app: EnergyLoopApp
    try {
      app = new EnergyLoopApp({ canvas, overlay, reducedMotion })
    } catch {
      onUnsupported()
      return
    }
    app.start()

    const onResize = () => app.setSize(window.innerWidth, window.innerHeight)
    onResize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      app.dispose()
    }
    // overlay is a stable closure over refs; onUnsupported only flips a flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported])

  if (!supported) return null

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full" aria-hidden="true" />
}
