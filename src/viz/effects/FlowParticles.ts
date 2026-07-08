import * as THREE from 'three'
import { glowTexture } from './materials'

export interface FlowParticlesOptions {
  curve: THREE.Curve<THREE.Vector3>
  count: number
  color: THREE.ColorRepresentation
  /** Optional color at the end of the curve; particles fade between them along t. */
  colorEnd?: THREE.ColorRepresentation
  size?: number
  /** Curve traversals per second. */
  speed?: number
  /** Random sideways offset so the stream has volume. */
  jitter?: number
}

/**
 * A glowing stream of points travelling along a curve. `intensity` (0..1) from the
 * scroll story scales opacity and speed so flows switch on as the camera reaches them.
 */
export class FlowParticles {
  readonly points: THREE.Points
  private readonly curve: THREE.Curve<THREE.Vector3>
  private readonly count: number
  private readonly speed: number
  private readonly offsets: Float32Array
  private readonly jitters: Float32Array
  private readonly positions: THREE.BufferAttribute
  private readonly material: THREE.PointsMaterial
  private readonly baseOpacity: number
  private t = 0
  private readonly tmp = new THREE.Vector3()

  constructor(opts: FlowParticlesOptions) {
    this.curve = opts.curve
    this.count = opts.count
    this.speed = opts.speed ?? 0.12
    const jitter = opts.jitter ?? 0.12

    this.offsets = new Float32Array(this.count)
    this.jitters = new Float32Array(this.count * 3)
    const pos = new Float32Array(this.count * 3)
    const col = new Float32Array(this.count * 3)
    const c0 = new THREE.Color(opts.color)
    const c1 = new THREE.Color(opts.colorEnd ?? opts.color)
    const c = new THREE.Color()
    for (let i = 0; i < this.count; i++) {
      this.offsets[i] = Math.random()
      this.jitters[i * 3] = (Math.random() - 0.5) * 2 * jitter
      this.jitters[i * 3 + 1] = (Math.random() - 0.5) * 2 * jitter
      this.jitters[i * 3 + 2] = (Math.random() - 0.5) * 2 * jitter
      c.lerpColors(c0, c1, this.offsets[i])
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }

    const geo = new THREE.BufferGeometry()
    this.positions = new THREE.BufferAttribute(pos, 3)
    geo.setAttribute('position', this.positions)
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))

    this.baseOpacity = 0.95
    this.material = new THREE.PointsMaterial({
      size: opts.size ?? 0.22,
      map: glowTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    this.points = new THREE.Points(geo, this.material)
    this.points.frustumCulled = false
    this.points.visible = false
    this.update(0, 0)
  }

  update(dt: number, intensity: number): void {
    this.material.opacity = this.baseOpacity * intensity
    this.points.visible = intensity > 0.01
    if (!this.points.visible) return
    this.t += dt * this.speed * (0.35 + 0.65 * intensity)
    const arr = this.positions.array as Float32Array
    for (let i = 0; i < this.count; i++) {
      const u = (this.offsets[i] + this.t) % 1
      this.curve.getPointAt(u, this.tmp)
      arr[i * 3] = this.tmp.x + this.jitters[i * 3]
      arr[i * 3 + 1] = this.tmp.y + this.jitters[i * 3 + 1]
      arr[i * 3 + 2] = this.tmp.z + this.jitters[i * 3 + 2]
    }
    this.positions.needsUpdate = true
  }

  /** Halve particle density (quality degradation). */
  degrade(): void {
    this.points.geometry.setDrawRange(0, Math.floor(this.count / 2))
  }

  dispose(): void {
    this.points.geometry.dispose()
    this.material.dispose()
  }
}
