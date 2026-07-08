import { Link } from 'react-router-dom'

export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={
        overlay
          ? 'fixed inset-x-0 top-0 z-30 bg-teal-deep/70 backdrop-blur border-b border-white/10'
          : 'sticky top-0 z-30 bg-offwhite/90 backdrop-blur border-b border-teal-deep/10'
      }
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill={overlay ? '#97d068' : '#054440'} />
            <path
              d="M32 10a22 22 0 1 0 22 22"
              fill="none"
              stroke={overlay ? '#054440' : '#97d068'}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="32" cy="32" r="7" fill={overlay ? '#054440' : '#d1f58c'} />
          </svg>
          <span className={`text-lg font-bold tracking-tight ${overlay ? 'text-offwhite' : 'text-teal-deep'}`}>
            Upgreat AI
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/energy-loop"
            className={`text-sm font-medium ${overlay ? 'text-offwhite/80 hover:text-offwhite' : 'text-teal-deep/70 hover:text-teal-deep'}`}
          >
            The Energy Loop
          </Link>
          <a
            href="https://upgreat.ai"
            className={
              overlay
                ? 'rounded-full bg-lime px-4 py-1.5 text-sm font-semibold text-teal-deep hover:bg-lime-pale'
                : 'rounded-full bg-teal-deep px-4 py-1.5 text-sm font-semibold text-offwhite hover:bg-teal-mid'
            }
          >
            upgreat.ai
          </a>
        </nav>
      </div>
    </header>
  )
}
