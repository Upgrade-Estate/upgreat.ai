import { clamp01, damp } from '../utils/math'

/**
 * Reads page scroll inside the RAF loop (never from scroll events — immune to iOS
 * momentum coalescing) and exposes one damped progress scalar that drives everything.
 */
export class ScrollController {
  private smoothedValue = 0
  private readonly lambda: number

  constructor(lambda = 4.5) {
    this.lambda = lambda
    this.smoothedValue = this.raw()
  }

  raw(): number {
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    if (max <= 0) return 0
    return clamp01((window.scrollY || doc.scrollTop) / max)
  }

  update(dt: number): number {
    this.smoothedValue = damp(this.smoothedValue, this.raw(), this.lambda, dt)
    return this.smoothedValue
  }

  get smoothed(): number {
    return this.smoothedValue
  }
}
