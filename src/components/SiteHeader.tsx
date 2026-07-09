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
        <Link to="/" className="flex items-center">
          <img
            src={`${import.meta.env.BASE_URL}${overlay ? 'upgreat-logo-white.svg' : 'upgreat-logo.svg'}`}
            alt="upgreat.ai"
            className="h-8 w-auto"
          />
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
