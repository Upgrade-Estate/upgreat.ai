import { forwardRef } from 'react'
import type { Chapter } from '../content/chapters'

/** Title with the highlight substring rendered in lime. */
function HighlightedTitle({ title, highlight }: { title: string; highlight: string }) {
  const idx = title.toLowerCase().indexOf(highlight.toLowerCase())
  if (idx === -1) return <>{title}</>
  return (
    <>
      {title.slice(0, idx)}
      <span className="text-lime">{title.slice(idx, idx + highlight.length)}</span>
      {title.slice(idx + highlight.length)}
    </>
  )
}

/**
 * One explanatory story card. The OUTER div owns positioning (including Tailwind
 * translate centering); the INNER div (the forwarded ref) is what the viz animates
 * per-frame (opacity + translateY), so the two transforms never fight.
 */
const ChapterPanel = forwardRef<HTMLDivElement, { chapter: Chapter }>(function ChapterPanel(
  { chapter },
  ref,
) {
  const sideClass =
    chapter.side === 'center'
      ? 'md:left-1/2 md:-translate-x-1/2 md:max-w-lg'
      : chapter.side === 'left'
        ? 'md:left-10'
        : 'md:right-10'

  return (
    <div
      className={`pointer-events-none fixed inset-x-3 bottom-20 z-10 mx-auto max-w-md md:inset-x-auto md:bottom-auto md:top-1/2 md:mx-0 md:w-full md:-translate-y-1/2 ${sideClass}`}
    >
      <div
        ref={ref}
        style={{ opacity: 0, pointerEvents: 'none' }}
        className={`flex flex-col gap-3 rounded-xl border border-white/10 bg-teal-deep/85 p-5 shadow-2xl backdrop-blur-md md:p-6 ${
          chapter.side === 'center' ? 'items-center text-center' : ''
        }`}
      >
        <span className="rounded-full border border-lime/40 px-3 py-1 font-mono text-[11px] tracking-wider text-lime-pale">
          {chapter.badge}
        </span>
        <h2 className="text-xl font-extrabold leading-snug tracking-tight text-offwhite md:text-2xl">
          <HighlightedTitle title={chapter.title} highlight={chapter.highlight} />
        </h2>
        <p className="text-sm leading-relaxed text-offwhite/80">{chapter.body}</p>
        <div className="mt-1 w-full rounded-lg bg-black/25 p-3 font-mono text-xs leading-6 text-lime-pale">
          {chapter.stats.map((s) => (
            <div key={s.label} className="flex justify-between gap-4">
              <span className="text-offwhite/50">{s.label}</span>
              <span>{s.value}</span>
            </div>
          ))}
        </div>
        {chapter.id === 'outro' && (
          <a
            href="/"
            className="mt-1 rounded-full bg-lime px-5 py-2 text-sm font-semibold text-teal-deep hover:bg-lime-pale"
          >
            Back to Upgreat AI →
          </a>
        )}
      </div>
    </div>
  )
})

export default ChapterPanel
