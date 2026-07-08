import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

const features = [
  {
    title: 'Carbon Aware Computing',
    body: 'Workloads run when clean energy is available — solar and wind first, always buffered by on-site batteries.',
  },
  {
    title: 'Heat Recovery Integration',
    body: 'Submersed, immersion-cooled servers hand their waste heat to the building’s warm-water system instead of the atmosphere.',
  },
  {
    title: 'Circular Energy Integration',
    body: 'One loop, every watt used twice: compute today, a warm shower tonight. Carbon-negative compute at scale.',
  },
]

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="brand-gradient">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <span className="rounded-full border border-lime-pale/50 bg-teal-deep/40 px-3 py-1 font-mono text-xs text-lime-pale">
              NEW — Interactive 3D story
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-offwhite sm:text-6xl">
              Every watt, <span className="text-gradient">used twice.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-offwhite/85">
              Follow the energy: sun and wind charge a battery, the battery powers a pod of
              submersed AI servers, and their waste heat warms the building&apos;s water tank — all
              the way to a hot shower.
            </p>
            <Link
              to="/energy-loop"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-3 text-base font-semibold text-teal-deep shadow-lg transition hover:bg-lime-pale"
            >
              Explore the Energy Loop
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-teal-deep/10 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-teal-deep">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-teal-deep/70">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
