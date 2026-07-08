import * as THREE from 'three'
import { glowTexture } from './materials'
import { lerp } from '../utils/math'

/** Falling shower-water particles: spawn under the head, accelerate down, die at the tray. */
export class Spray {
  readonly points: THREE.Points
  private readonly count: number
  private readonly seeds: Float32Array
  private readonly positions: THREE.BufferAttribute
  private readonly material: THREE.PointsMaterial
  private readonly colorCold = new THREE.Color(0x9fd4e8)
  private readonly colorWarm = new THREE.Color(0xffe9c9)
  private readonly dropHeight: number
  private time = 0

  constructor(head: THREE.Vector3, dropHeight = 2.1, count = 260) {
    this.count = count
    this.dropHeight = dropHeight
    this.seeds = new Float32Array(count * 3)
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      this.seeds[i * 3] = Math.random() // life offset
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 0.22
      this.seeds[i * 3 + 1] = Math.cos(angle) * radius
      this.seeds[i * 3 + 2] = Math.sin(angle) * radius
    }
    const geo = new THREE.BufferGeometry()
    this.positions = new THREE.BufferAttribute(pos, 3)
    geo.setAttribute('position', this.positions)
    this.material = new THREE.PointsMaterial({
      size: 0.075,
      map: glowTexture(),
      color: this.colorCold,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    })
    this.points = new THREE.Points(geo, this.material)
    this.points.position.copy(head)
    this.points.frustumCulled = false
    this.points.visible = false
  }

  /** warmth 0..1 lerps droplet color from cold blue to warm white. */
  update(dt: number, intensity: number, warmth: number): void {
    this.points.visible = intensity > 0.02
    this.material.opacity = 0.85 * intensity
    if (!this.points.visible) return
    this.time += dt
    this.material.color.lerpColors(this.colorCold, this.colorWarm, warmth)
    const arr = this.positions.array as Float32Array
    for (let i = 0; i < this.count; i++) {
      const life = (this.time * 0.9 + this.seeds[i * 3]) % 1
      const fall = life * life // accelerate
      const spread = 1 + life * 2.2
      arr[i * 3] = this.seeds[i * 3 + 1] * spread
      arr[i * 3 + 1] = -fall * this.dropHeight
      arr[i * 3 + 2] = this.seeds[i * 3 + 2] * spread
    }
    this.positions.needsUpdate = true
  }

  warmthColor(warmth: number): THREE.Color {
    return new THREE.Color().copy(this.colorCold).lerp(this.colorWarm, lerp(0, 1, warmth))
  }

  dispose(): void {
    this.points.geometry.dispose()
    this.material.dispose()
  }
}
