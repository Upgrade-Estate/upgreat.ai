import { forwardRef } from 'react'

const ScrollHint = forwardRef<HTMLDivElement>(function ScrollHint(_props, ref) {
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1 text-offwhite/80 transition-opacity duration-700"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.2em]">scroll to follow the energy</span>
      <svg viewBox="0 0 24 24" className="h-6 w-6 animate-bounce fill-none stroke-lime stroke-2">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
})

export default ScrollHint
