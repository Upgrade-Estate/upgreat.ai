export default function SiteFooter() {
  return (
    <footer className="border-t border-teal-deep/10 bg-offwhite">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-teal-deep/60 sm:px-6">
        <p className="font-semibold text-teal-deep">Upgreat AI</p>
        <p>
          Sustainable, sovereign AI compute — carbon aware scheduling, renewable energy, and heat
          recovery, combined into carbon-negative operations.
        </p>
        <p className="font-mono text-xs text-teal-deep/40">© {new Date().getFullYear()} Upgreat AI · An initiative by thriving sustainable companies</p>
      </div>
    </footer>
  )
}
