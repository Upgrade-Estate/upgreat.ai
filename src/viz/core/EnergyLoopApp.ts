import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { CAMERA_KEYFRAMES, CHAPTERS, flowIntensities, statsAt } from '../../content/chapters'
import { clamp01, fadeWindow, remap, smoothstep } from '../utils/math'
import { ScrollController } from './ScrollController'
import { CameraRig } from './CameraRig'
import { createComposer, type Post } from './postprocessing'
import { createEnvironment, type Environment } from '../stages/environment'
import { createSolarField, type SolarField } from '../stages/solarField'
import { createWindTurbine, type WindTurbine } from '../stages/windTurbine'
import { createBattery, type Battery } from '../stages/battery'
import { createBuilding, type Building } from '../stages/building'
import { createServerPod, type ServerPod } from '../stages/serverPod'
import { createConduits, type Conduits } from '../stages/conduits'
import { Steam } from '../effects/Steam'
import { Spray } from '../effects/Spray'

export interface HudEls {
  kw: HTMLElement | null
  battery: HTMLElement | null
  temp: HTMLElement | null
  reuse: HTMLElement | null
  root: HTMLElement | null
}

export interface OverlayRefs {
  panels: (HTMLElement | null)[]
  hud: HudEls
  scrollHint: HTMLElement | null
}

export interface EnergyLoopAppOptions {
  canvas: HTMLCanvasElement
  /** Called every frame to fetch current overlay DOM nodes (React refs). */
  overlay: () => OverlayRefs
  reducedMotion: boolean
}

/** Owns the renderer, scene, animation loop and the scroll→story mapping. */
export class EnergyLoopApp {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly overlay: () => OverlayRefs
  private readonly reducedMotion: boolean

  private readonly scroll: ScrollController
  private readonly rig = new CameraRig(CAMERA_KEYFRAMES)
  private post: Post | null = null

  private readonly env: Environment
  private readonly solar: SolarField
  private readonly turbine: WindTurbine
  private readonly battery: Battery
  private readonly building: Building
  private readonly pod: ServerPod
  private readonly conduits: Conduits
  private readonly steam: Steam
  private readonly spray: Spray

  private raf = 0
  private running = false
  private lastT = 0
  private time = 0
  private hudAccum = 1
  private frameCount = 0
  private slowFrames = 0
  private degraded = false
  private readonly onVisibility = () => {
    if (document.hidden) this.pause()
    else this.resume()
  }

  constructor(opts: EnergyLoopAppOptions) {
    this.overlay = opts.overlay
    this.reducedMotion = opts.reducedMotion

    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = !this.reducedMotion
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 300)

    // Image-based fill lighting so metals/roughness read correctly.
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.35
    pmrem.dispose()

    this.env = createEnvironment(this.scene)
    this.solar = createSolarField(this.scene)
    this.turbine = createWindTurbine(this.scene)
    this.battery = createBattery(this.scene)
    this.building = createBuilding(this.scene)
    this.pod = createServerPod(this.scene)
    this.conduits = createConduits(this.scene)
    this.steam = new Steam(this.building.showerHead.clone().add(new THREE.Vector3(0.1, -0.6, 0.3)))
    this.scene.add(this.steam.group)
    this.spray = new Spray(this.building.showerHead)
    this.scene.add(this.spray.points)

    if (!this.reducedMotion) {
      this.post = createComposer(this.renderer, this.scene, this.camera)
    }

    this.setSize(opts.canvas.clientWidth || window.innerWidth, opts.canvas.clientHeight || window.innerHeight)
    this.scroll = new ScrollController(this.reducedMotion ? 12 : 4.5)

    document.addEventListener('visibilitychange', this.onVisibility)
  }

  setSize(w: number, h: number): void {
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
    this.post?.setSize(w, h)
  }

  start(): void {
    this.resume()
  }

  private resume(): void {
    if (this.running) return
    this.running = true
    this.lastT = performance.now()
    const loop = (now: number) => {
      if (!this.running) return
      const dt = Math.min((now - this.lastT) / 1000, 0.05)
      this.lastT = now
      this.frame(dt)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  private pause(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private frame(dt: number): void {
    this.time += dt
    const p = this.scroll.update(dt)
    const stats = statsAt(p)
    const flows = flowIntensities(p)

    const sway = this.reducedMotion ? 0 : 0.06
    this.rig.update(this.camera, p, this.time, sway)
    this.env.update(p)
    this.solar.update(this.time, p)
    this.turbine.update(dt, p)
    this.battery.update(this.time, stats.battery)

    const computeIntensity = clamp01(flows.powerToPod + flows.heat)
    const heatIntensity = clamp01(remap(p, 0.46, 0.62, 0, 1)) * (1 - clamp01(remap(p, 0.86, 0.94, 0, 0.4)))
    this.pod.update(dt, this.time, computeIntensity, heatIntensity)
    this.building.update(this.time, remap(stats.tankTemp, 12, 58, 0, 1), flows.heat)
    this.conduits.update(dt, flows)
    const warmth = remap(stats.tankTemp, 12, 58, 0, 1)
    this.steam.update(dt, flows.shower * warmth)
    this.spray.update(dt, flows.shower, warmth)

    this.applyOverlay(p, stats)
    this.trackQuality(dt)
    // Exposed for the screenshot harness to wait for the damped camera to settle.
    ;(window as unknown as { __elProgress: number }).__elProgress = p

    if (this.post) this.post.composer.render()
    else this.renderer.render(this.scene, this.camera)
  }

  private applyOverlay(p: number, stats: ReturnType<typeof statsAt>): void {
    const refs = this.overlay()
    for (let i = 0; i < CHAPTERS.length; i++) {
      const el = refs.panels[i]
      if (!el) continue
      const [start, end] = CHAPTERS[i].range
      const local = (p - start) / (end - start)
      let fade = local >= 0 && local <= 1 ? fadeWindow(local) : 0
      // First panel: no fade-in — fully visible at the very top of the page.
      if (i === 0 && local >= 0 && local <= 1) fade = 1 - smoothstep(0.82, 1, local)
      // Last panel holds at the very end.
      const finalHold = i === CHAPTERS.length - 1 && p > 0.96 ? 1 : fade
      el.style.opacity = finalHold.toFixed(3)
      el.style.transform = `translateY(${((1 - finalHold) * 24).toFixed(1)}px)`
      el.style.pointerEvents = finalHold > 0.5 ? 'auto' : 'none'
    }

    const hint = refs.scrollHint
    if (hint) hint.style.opacity = p < 0.015 ? '1' : '0'

    this.hudAccum += 1
    if (this.hudAccum >= 6) {
      this.hudAccum = 0
      const { kw, battery, temp, reuse, root } = refs.hud
      if (root) root.style.opacity = p > 0.06 ? '1' : '0'
      if (kw) kw.textContent = `${stats.kw.toFixed(1)} kW`
      if (battery) battery.textContent = `${Math.round(stats.battery)}%`
      if (temp) temp.textContent = `${Math.round(stats.tankTemp)}°C`
      if (reuse) reuse.textContent = `${Math.round(stats.heatReuse)}%`
    }
  }

  /** After warm-up, degrade quality once if frames are consistently slow. */
  private trackQuality(dt: number): void {
    if (this.degraded) return
    this.frameCount++
    if (this.frameCount < 40 || this.frameCount > 220) return
    if (dt > 0.026) this.slowFrames++
    if (this.slowFrames > 45) {
      this.degraded = true
      this.renderer.setPixelRatio(1)
      this.env.setShadows(false)
      this.pod.degrade()
      this.conduits.degrade()
      if (this.post) {
        this.post.bloom.strength = 0.35
      }
    }
  }

  dispose(): void {
    this.pause()
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.pod.dispose()
    this.conduits.dispose()
    this.steam.dispose()
    this.spray.dispose()
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat?.dispose()
    })
    this.post?.dispose()
    this.renderer.dispose()
  }
}
