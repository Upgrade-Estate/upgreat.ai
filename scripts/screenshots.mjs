// Headless verification: screenshots of the energy-loop story at several scroll
// positions (desktop + mobile emulation), failing on any console/page error.
//
//   node scripts/screenshots.mjs [--base http://localhost:5173] [--out <dir>]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
function argValue(flag, fallback) {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : fallback
}
const BASE = argValue('--base', 'http://localhost:5173')
const OUT = argValue('--out', 'shots')
const FRACTIONS = [0, 0.15, 0.32, 0.48, 0.66, 0.82, 0.99]

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

const errors = []

async function capture(name, contextOpts, { reducedMotion = false } = {}) {
  const context = await browser.newContext(contextOpts)
  if (reducedMotion) await context.newPage() // placeholder to keep API simple
  const page = await context.newPage()
  if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[${name}] console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`[${name}] pageerror: ${err.message}`))

  await page.goto(`${BASE}/energy-loop`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  for (let i = 0; i < FRACTIONS.length; i++) {
    const f = FRACTIONS[i]
    await page.evaluate((frac) => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo(0, frac * max)
    }, f)
    // Wait until the damped story progress has actually reached the target
    // (headless software rendering can be slow, so a fixed timeout lags).
    await page
      .waitForFunction(
        (frac) => Math.abs((window.__elProgress ?? -1) - frac) < 0.006,
        f,
        { timeout: 20000 },
      )
      .catch(() => console.warn(`  (progress did not settle for ${name} @ ${f})`))
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(OUT, `${name}-${String(i).padStart(2, '0')}-p${Math.round(f * 100)}.png`) })
    console.log(`shot ${name} @ ${f}`)
  }
  await context.close()
}

async function captureLanding() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[landing] console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`[landing] pageerror: ${err.message}`))
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'landing.png'), fullPage: true })
  console.log('shot landing')
  await context.close()
}

await captureLanding()
await capture('desktop', { viewport: { width: 1440, height: 900 } })
await capture('mobile', {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
await capture('reduced', { viewport: { width: 1440, height: 900 } }, { reducedMotion: true })

await browser.close()

if (errors.length) {
  console.error('\nERRORS CAPTURED:')
  for (const e of errors) console.error('  ' + e)
  process.exit(1)
}
console.log('\nAll screenshots captured with zero console/page errors.')
