import { forwardRef } from 'react'
import type { HudEls } from '../viz/core/EnergyLoopApp'

export interface EnergyHudHandles {
  els: HudEls
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-lime stroke-2" aria-hidden="true">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ICONS = {
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',
  battery: 'M3 8h14v8H3zM17 10h2v4h-2zM6 10.5v3M9 10.5v3M12 10.5v3',
  temp: 'M12 4a2 2 0 0 0-2 2v7.2a4 4 0 1 0 4 0V6a2 2 0 0 0-2-2z',
  loop: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
}

/**
 * Persistent live-counter strip. Value nodes are plain spans updated by the viz via
 * refs (textContent writes) — zero React re-renders while scrolling.
 */
const EnergyHud = forwardRef<HTMLDivElement, { registerEl: (key: keyof HudEls, el: HTMLElement | null) => void }>(
  function EnergyHud({ registerEl }, ref) {
    const item = (key: keyof HudEls, icon: string, label: string, initial: string) => (
      <div className="flex items-center gap-1.5" title={label}>
        <Icon path={icon} />
        <span
          ref={(el) => registerEl(key, el)}
          className="font-mono text-xs text-lime-pale tabular-nums"
        >
          {initial}
        </span>
        <span className="hidden text-[10px] uppercase tracking-wider text-offwhite/40 sm:inline">{label}</span>
      </div>
    )
    return (
      <div
        ref={ref}
        style={{ opacity: 0 }}
        className="fixed inset-x-0 top-16 z-20 mx-auto flex w-fit items-center gap-4 rounded-full border border-white/10 bg-teal-deep/80 px-5 py-2 backdrop-blur transition-opacity duration-500 sm:gap-6 md:top-auto md:bottom-6"
      >
        {item('kw', ICONS.bolt, 'generated', '0.0 kW')}
        {item('battery', ICONS.battery, 'battery', '42%')}
        {item('temp', ICONS.temp, 'tank', '12°C')}
        {item('reuse', ICONS.loop, 'heat reused', '0%')}
      </div>
    )
  },
)

export default EnergyHud
