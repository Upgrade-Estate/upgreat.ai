import { remap, smoothstep } from '../viz/utils/math'

export interface ChapterStat {
  label: string
  value: string
}

export interface Chapter {
  id: string
  badge: string
  title: string
  /** Word(s) inside the title rendered in lime. */
  highlight: string
  body: string
  stats: ChapterStat[]
  side: 'left' | 'right' | 'center'
  range: [number, number]
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    badge: 'THE ENERGY LOOP',
    title: 'Carbon aware compute for a sustainable future',
    highlight: 'compute',
    body: 'One building, one battery, one pod of submersed servers — and every watt used twice. Scroll to follow the energy from the sky to the shower head.',
    stats: [
      { label: 'renewable input', value: '100%' },
      { label: 'energy reused as heat', value: 'up to 95%' },
    ],
    side: 'center',
    range: [0, 0.1],
  },
  {
    id: 'generation',
    badge: 'STEP 01 — GENERATION',
    title: 'Sun and wind make the power',
    highlight: 'make',
    body: 'Rooftop and field solar panels plus an on-site wind turbine feed the loop. No grid fossil mix, no imported megawatts — generation happens where the compute lives.',
    stats: [
      { label: 'renewable input', value: '100%' },
      { label: 'transmission losses', value: '≈ 0% (on-site)' },
    ],
    side: 'left',
    range: [0.1, 0.26],
  },
  {
    id: 'battery',
    badge: 'STEP 02 — STORAGE',
    title: 'The battery buffers every green watt',
    highlight: 'buffers',
    body: 'Clean power is not always on time. The building battery stores the surplus, so compute can be scheduled carbon-aware: run hard when energy is clean, idle when it is not.',
    stats: [
      { label: 'battery buffer', value: '87%' },
      { label: 'fossil grid draw', value: '0 kW' },
    ],
    side: 'right',
    range: [0.26, 0.4],
  },
  {
    id: 'pod',
    badge: 'STEP 03 — COMPUTE',
    title: 'Servers submersed in liquid, not air',
    highlight: 'submersed',
    body: 'Inside the pod, AI servers sit fully immersed in a cooling liquid. No fans, no chillers, no air conditioning — the liquid captures nearly all the heat directly at the chip.',
    stats: [
      { label: 'cooling overhead (PUE)', value: '~1.03' },
      { label: 'fans & chillers', value: '0' },
    ],
    side: 'left',
    range: [0.4, 0.58],
  },
  {
    id: 'heat',
    badge: 'STEP 04 — HEAT RECOVERY',
    title: 'Waste heat becomes warm water',
    highlight: 'warm water',
    body: 'The hot coolant loops into the building and coils around the warm-water tank. Heat that a classic datacenter blows into the sky heats the tank from 12 °C to 58 °C instead.',
    stats: [
      { label: 'server energy reused', value: 'up to 95%' },
      { label: 'tank temperature', value: '12 → 58 °C' },
    ],
    side: 'right',
    range: [0.58, 0.74],
  },
  {
    id: 'shower',
    badge: 'STEP 05 — REUSE',
    title: 'The loop ends in a hot shower',
    highlight: 'hot shower',
    body: 'Upstairs, the shower runs on water warmed by AI computation. The boiler stays off: the same joules that trained a model now wash the day away.',
    stats: [
      { label: 'boiler energy displaced', value: '100%' },
      { label: 'shower temperature', value: '38 °C' },
    ],
    side: 'left',
    range: [0.74, 0.9],
  },
  {
    id: 'outro',
    badge: 'CIRCULAR ENERGY INTEGRATION',
    title: 'Reduce, reuse — carbon-negative compute',
    highlight: 'carbon-negative',
    body: 'Carbon aware scheduling reduces what we draw. Immersion cooling reduces what we waste. Heat recovery reuses what remains. One circular loop: compute today, comfort tonight.',
    stats: [
      { label: 'energy used twice', value: 'compute + heat' },
      { label: 'net operations', value: 'carbon-negative' },
    ],
    side: 'left',
    range: [0.9, 1],
  },
]

export interface CameraKeyframe {
  t: number
  pos: [number, number, number]
  look: [number, number, number]
}

/** Camera flight path — t is global scroll progress. Tuned against rendered screenshots. */
export const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  { t: 0.0, pos: [30, 24, 34], look: [0, 3, 0] },
  { t: 0.08, pos: [16, 12, 26], look: [-3, 2, 0] },
  { t: 0.14, pos: [-6, 4.5, 3], look: [-18, 1, -8] },
  { t: 0.2, pos: [-16, 5, 1], look: [-25, 8, 7] },
  { t: 0.25, pos: [-15, 4, 12], look: [-25, 9, 7] },
  { t: 0.31, pos: [5.4, 2.5, 9.0], look: [4.4, 1.4, 2.0] },
  { t: 0.38, pos: [4.7, 1.8, 5.0], look: [4.4, 1.2, 2.0] },
  { t: 0.45, pos: [8.2, 3.0, 9.8], look: [6.4, 1.2, -0.6] },
  { t: 0.54, pos: [6.4, 1.7, 2.9], look: [6.4, 1.0, -1.4] },
  { t: 0.63, pos: [8.8, 2.1, 6.8], look: [10.8, 1.3, 0.6] },
  { t: 0.7, pos: [9.9, 3.1, 6.4], look: [11.6, 1.5, 1] },
  { t: 0.78, pos: [6.2, 8.2, 10.5], look: [6.2, 7.9, 1.1] },
  { t: 0.86, pos: [6.6, 8.4, 5.4], look: [6.2, 7.7, 0.6] },
  { t: 0.93, pos: [9, 5, 17], look: [7.5, 2.5, -1] },
  { t: 1.0, pos: [13, 8.5, 25], look: [7, 3.5, -1] },
]

export interface LiveStats {
  /** kW being generated right now */
  kw: number
  /** battery state of charge, percent */
  battery: number
  /** warm-water tank temperature, °C */
  tankTemp: number
  /** share of server energy reused as heat, percent */
  heatReuse: number
}

/** Deterministic "live" counters as a function of scroll progress — keeps HUD, tank fill and glow in sync. */
export function statsAt(p: number): LiveStats {
  const kw = remap(p, 0.08, 0.24, 0.3, 4.2)
  const battery = remap(p, 0.2, 0.38, 42, 87)
  const tankTemp = remap(p, 0.55, 0.74, 12, 58)
  const heatReuse = remap(p, 0.45, 0.72, 0, 95)
  return { kw, battery, tankTemp, heatReuse }
}

/** How strongly each flow runs at a given progress (particles "switch on" as the story reaches them). */
export function flowIntensities(p: number) {
  const outro = smoothstep(0.88, 0.95, p)
  return {
    power: Math.max(smoothstep(0.1, 0.18, p), outro),
    powerToPod: Math.max(smoothstep(0.32, 0.42, p), outro),
    heat: Math.max(smoothstep(0.55, 0.64, p) * (1 - smoothstep(0.78, 0.88, p)), outro),
    coldFeed: Math.max(smoothstep(0.58, 0.68, p) * (1 - smoothstep(0.78, 0.88, p)), outro),
    warmRiser: Math.max(smoothstep(0.7, 0.78, p), outro),
    shower: smoothstep(0.75, 0.8, p) * (1 - smoothstep(0.88, 0.93, p)),
  }
}
