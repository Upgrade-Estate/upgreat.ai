import * as THREE from 'three'
import { glowTexture } from './materials'

/** Soft additive sprites drifting upward — steam above the warm shower. */
export class Steam {
  readonly group: THREE.Group
  private readonly sprites: THREE.Sprite[] = []
  private readonly seeds: Float32Array
  private time = 0

  constructor(origin: THREE.Vector3, count = 16) {
    this.group = new THREE.Group()
    this.group.position.copy(origin)
    this.seeds = new Float32Array(count * 3)
    const mat = new THREE.SpriteMaterial({
      map: glowTexture(),
      color: 0xdfe8e4,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(mat.clone())
      this.seeds[i * 3] = Math.random()
      this.seeds[i * 3 + 1] = Math.random() * Math.PI * 2
      this.seeds[i * 3 + 2] = 0.6 + Math.random() * 0.8
      this.sprites.push(s)
      this.group.add(s)
    }
  }

  update(dt: number, intensity: number): void {
    this.group.visible = intensity > 0.02
    if (!this.group.visible) return
    this.time += dt
    for (let i = 0; i < this.sprites.length; i++) {
      const cycle = this.seeds[i * 3]
      const phase = this.seeds[i * 3 + 1]
      const speed = this.seeds[i * 3 + 2]
      const life = (this.time * 0.22 * speed + cycle) % 1
      const s = this.sprites[i]
      s.position.set(
        Math.sin(this.time * 0.8 + phase) * 0.25 * life,
        life * 1.6,
        Math.cos(this.time * 0.7 + phase) * 0.2 * life,
      )
      const size = 0.35 + life * 0.9
      s.scale.setScalar(size)
      const mat = s.material as THREE.SpriteMaterial
      mat.opacity = intensity * 0.32 * Math.sin(life * Math.PI)
    }
  }

  dispose(): void {
    for (const s of this.sprites) (s.material as THREE.Material).dispose()
  }
}
