import * as THREE from 'three'

export interface BubblesOptions {
  count: number
  /** Local-space box the bubbles rise through (min corner + size). */
  region: { min: THREE.Vector3; size: THREE.Vector3 }
}

/** Instanced coolant bubbles rising from the submerged server blades. */
export class Bubbles {
  readonly mesh: THREE.InstancedMesh
  private readonly seeds: Float32Array
  private readonly region: BubblesOptions['region']
  private readonly dummy = new THREE.Object3D()
  private time = 0
  private activeCount: number

  constructor(opts: BubblesOptions) {
    this.region = opts.region
    this.activeCount = opts.count
    const geo = new THREE.SphereGeometry(0.028, 6, 5)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xbfeee6,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
    this.mesh = new THREE.InstancedMesh(geo, mat, opts.count)
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.mesh.frustumCulled = false
    this.seeds = new Float32Array(opts.count * 4)
    for (let i = 0; i < opts.count; i++) {
      this.seeds[i * 4] = Math.random() // x fraction
      this.seeds[i * 4 + 1] = Math.random() // z fraction
      this.seeds[i * 4 + 2] = 0.5 + Math.random() // speed
      this.seeds[i * 4 + 3] = Math.random() * Math.PI * 2 // wobble phase
    }
  }

  update(dt: number, intensity: number): void {
    this.mesh.visible = intensity > 0.02
    if (!this.mesh.visible) return
    this.time += dt
    const { min, size } = this.region
    const n = this.activeCount
    for (let i = 0; i < n; i++) {
      const sx = this.seeds[i * 4]
      const sz = this.seeds[i * 4 + 1]
      const speed = this.seeds[i * 4 + 2]
      const phase = this.seeds[i * 4 + 3]
      const rise = ((this.time * speed * 0.25 + sx * 7.3) % 1)
      const wobble = Math.sin(this.time * 2.2 + phase) * 0.03
      this.dummy.position.set(
        min.x + sx * size.x + wobble,
        min.y + rise * size.y,
        min.z + sz * size.z + Math.cos(this.time * 1.9 + phase) * 0.03,
      )
      const s = 0.6 + 0.8 * rise
      this.dummy.scale.setScalar(s * intensity)
      this.dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this.dummy.matrix)
    }
    this.mesh.count = n
    this.mesh.instanceMatrix.needsUpdate = true
  }

  degrade(): void {
    this.activeCount = Math.floor(this.activeCount / 2)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}
