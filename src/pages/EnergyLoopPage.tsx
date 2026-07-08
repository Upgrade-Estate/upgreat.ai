import { useCallback, useEffect, useRef, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import ChapterPanel from '../components/ChapterPanel'
import EnergyHud from '../components/EnergyHud'
import ScrollHint from '../components/ScrollHint'
import WebGLFallback from '../components/WebGLFallback'
import EnergyLoopCanvas from '../viz/EnergyLoopCanvas'
import { CHAPTERS } from '../content/chapters'
import type { HudEls, OverlayRefs } from '../viz/core/EnergyLoopApp'

const SCROLL_VH_PER_CHAPTER = 130

export default function EnergyLoopPage() {
  const [unsupported, setUnsupported] = useState(false)

  const panelRefs = useRef<(HTMLDivElement | null)[]>(Array(CHAPTERS.length).fill(null))
  const hudRootRef = useRef<HTMLDivElement | null>(null)
  const hudEls = useRef<HudEls>({ kw: null, battery: null, temp: null, reuse: null, root: null })
  const hintRef = useRef<HTMLDivElement | null>(null)

  const overlay = useCallback(
    (): OverlayRefs => ({
      panels: panelRefs.current,
      hud: { ...hudEls.current, root: hudRootRef.current },
      scrollHint: hintRef.current,
    }),
    [],
  )

  const registerHudEl = useCallback((key: keyof HudEls, el: HTMLElement | null) => {
    hudEls.current[key] = el
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (unsupported) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <WebGLFallback />
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="bg-teal-deep">
      <SiteHeader overlay />
      <EnergyLoopCanvas overlay={overlay} onUnsupported={() => setUnsupported(true)} />

      {/* Tall spacer: the native page scroll IS the story timeline. */}
      <div style={{ height: `${CHAPTERS.length * SCROLL_VH_PER_CHAPTER}vh` }} aria-hidden="true" />

      {/* Overlays (fixed, driven per-frame by the viz) */}
      {CHAPTERS.map((c, i) => (
        <ChapterPanel
          key={c.id}
          chapter={c}
          ref={(el) => {
            panelRefs.current[i] = el
          }}
        />
      ))}
      <EnergyHud ref={hudRootRef} registerEl={registerHudEl} />
      <ScrollHint ref={hintRef} />

      {/* Accessible text version of the story for screen readers. */}
      <div className="sr-only">
        {CHAPTERS.map((c) => (
          <section key={c.id}>
            <h2>{c.title}</h2>
            <p>{c.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
