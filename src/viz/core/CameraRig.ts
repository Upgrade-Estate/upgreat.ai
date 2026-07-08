import * as THREE from 'three'
import type { CameraKeyframe } from '../../content/chapters'

/**
 * Flies the camera along two Catmull-Rom splines (position + lookAt). Keyframes carry
 * explicit progress values, so `progress → curve parameter` is a non-uniform mapping:
 * each keyframe is hit exactly at its `t`, with smooth curvature between.
 */
export class CameraRig {
  private readonly posCurve: THREE.CatmullRomCurve3
  private readonly lookCurve: THREE.CatmullRomCurve3
  private readonly ts: number[]
  private readonly pos = new THREE.Vector3()
  private readonly look = new THREE.Vector3()

  constructor(keyframes: CameraKeyframe[]) {
    this.ts = keyframes.map((k) => k.t)
    this.posCurve = new THREE.CatmullRomCurve3(
      keyframes.map((k) => new THREE.Vector3(...k.pos)),
      false,
      'centripetal',
    )
    this.lookCurve = new THREE.CatmullRomCurve3(
      keyframes.map((k) => new THREE.Vector3(...k.look)),
      false,
      'centripetal',
    )
  }

  private progressToU(p: number): number {
    const ts = this.ts
    const n = ts.length
    if (p <= ts[0]) return 0
    if (p >= ts[n - 1]) return 1
    let i = 0
    while (i < n - 2 && p > ts[i + 1]) i++
    const local = (p - ts[i]) / (ts[i + 1] - ts[i])
    return (i + local) / (n - 1)
  }

  update(camera: THREE.PerspectiveCamera, progress: number, time: number, swayAmp = 0.06): void {
    const u = this.progressToU(progress)
    this.posCurve.getPoint(u, this.pos)
    this.lookCurve.getPoint(u, this.look)
    if (swayAmp > 0) {
      this.pos.x += Math.sin(time * 0.4) * swayAmp
      this.pos.y += Math.sin(time * 0.31 + 1.7) * swayAmp * 0.6
    }
    camera.position.copy(this.pos)
    camera.lookAt(this.look)
  }
}
