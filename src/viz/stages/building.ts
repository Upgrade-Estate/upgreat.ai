import * as THREE from 'three'
import { LAYOUT, FLOOR_H } from '../layout'
import { PALETTE } from '../effects/materials'
import { clamp01 } from '../utils/math'

export interface Building {
  group: THREE.Group
  /** Shower head world position (spray + steam anchor). */
  showerHead: THREE.Vector3
  /** f 0..1 = tank warmth (12→58 °C), drives fill + coil glow. */
  update(time: number, tankWarmth: number, heatIntensity: number): void
}

/**
 * Cutaway apartment building: open front face (+z) shows the utility room with the
 * warm-water tank on the ground floor and a shower room two floors up.
 */
export function createBuilding(scene: THREE.Scene): Building {
  const { center, w, h, d, floors } = LAYOUT.building
  const group = new THREE.Group()
  group.position.set(center.x, 0, center.z)

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8d9d0, roughness: 0.85 })
  const innerMat = new THREE.MeshStandardMaterial({ color: 0xcfd6cd, roughness: 0.9 })
  const slabMat = new THREE.MeshStandardMaterial({ color: 0xb9bfb4, roughness: 0.9 })

  const wallT = 0.25
  // Back, left, right walls + roof. Front (+z) stays open — the cutaway.
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallT), wallMat)
  back.position.set(0, h / 2, -d / 2 + wallT / 2)
  const left = new THREE.Mesh(new THREE.BoxGeometry(wallT, h, d), wallMat)
  left.position.set(-w / 2 + wallT / 2, h / 2, 0)
  const right = new THREE.Mesh(new THREE.BoxGeometry(wallT, h, d), wallMat)
  right.position.set(w / 2 - wallT / 2, h / 2, 0)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w, 0.35, d), slabMat)
  roof.position.set(0, h + 0.05, 0)
  roof.castShadow = true
  for (const m of [back, left, right]) m.castShadow = true
  group.add(back, left, right, roof)

  // Floor slabs.
  for (let i = 0; i <= floors; i++) {
    if (i === floors) continue // roof already placed
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w - wallT * 2, 0.28, d - wallT), slabMat)
    slab.position.set(0, i * FLOOR_H + 0.14, 0)
    group.add(slab)
  }

  // Interior back-wall skin, slightly warmer.
  const innerBack = new THREE.Mesh(new THREE.PlaneGeometry(w - wallT * 2, h), innerMat)
  innerBack.position.set(0, h / 2, -d / 2 + wallT + 0.01)
  group.add(innerBack)

  // Room partitions on tank + shower floors so the rooms read as rooms.
  const tankWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, FLOOR_H - 0.3, d - wallT), innerMat)
  tankWall.position.set(0.6, FLOOR_H / 2, 0)
  group.add(tankWall)
  const showerWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, FLOOR_H - 0.3, d - wallT), innerMat)
  showerWall.position.set(0.6, FLOOR_H * 2 + FLOOR_H / 2, 0)
  group.add(showerWall)

  // ---- Warm-water tank (utility room, ground floor) ----
  const tankLocal = LAYOUT.tank.clone().sub(new THREE.Vector3(center.x, 0, center.z))
  const tankGroup = new THREE.Group()
  tankGroup.position.copy(tankLocal)

  const TANK_R = 0.85
  const TANK_H = 2.5
  const coldMat = new THREE.MeshStandardMaterial({ color: 0x3d7c8a, roughness: 0.35, metalness: 0.15 })
  const warmMat = new THREE.MeshStandardMaterial({
    color: 0xff9a3c,
    emissive: 0xff8a2c,
    emissiveIntensity: 0.25,
    roughness: 0.4,
  })
  // Warm layer grows bottom-up, cold layer shrinks above it.
  const warmFill = new THREE.Mesh(new THREE.CylinderGeometry(TANK_R, TANK_R, 1, 24), warmMat)
  const coldFill = new THREE.Mesh(new THREE.CylinderGeometry(TANK_R, TANK_R, 1, 24), coldMat)
  tankGroup.add(warmFill, coldFill)

  const capMat = new THREE.MeshStandardMaterial({ color: 0x9aa39c, roughness: 0.3, metalness: 0.7 })
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(TANK_R + 0.06, TANK_R + 0.06, 0.16, 24), capMat)
  capTop.position.y = TANK_H + 0.32
  const capBottom = new THREE.Mesh(new THREE.CylinderGeometry(TANK_R + 0.06, TANK_R + 0.06, 0.24, 24), capMat)
  capBottom.position.y = 0.12
  tankGroup.add(capTop, capBottom)

  // Heat-exchanger coil wrapped around the tank.
  class Helix extends THREE.Curve<THREE.Vector3> {
    constructor() {
      super()
    }
    getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
      const turns = 6
      const angle = t * Math.PI * 2 * turns
      return target.set(
        Math.cos(angle) * (TANK_R + 0.14),
        0.5 + t * (TANK_H - 0.5),
        Math.sin(angle) * (TANK_R + 0.14),
      )
    }
  }
  const coilMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    emissive: PALETTE.heatOrange,
    emissiveIntensity: 0,
    roughness: 0.35,
    metalness: 0.6,
  })
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new Helix(), 220, 0.05, 6, false), coilMat)
  tankGroup.add(coil)
  group.add(tankGroup)

  // ---- Shower room (third floor) ----
  const showerLocal = LAYOUT.shower.clone().sub(new THREE.Vector3(center.x, 0, center.z))
  const stall = new THREE.Group()
  stall.position.copy(showerLocal)

  const tileMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e2, roughness: 0.25, metalness: 0.05 })
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.5), tileMat)
  tray.position.y = 0.06
  const stallBack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.6, 0.08), tileMat)
  stallBack.position.set(0, 1.3, -0.7)
  const stallSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 1.5), tileMat)
  stallSide.position.set(-0.75, 1.3, 0)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xcfe8e2,
    transparent: true,
    opacity: 0.18,
    roughness: 0.1,
  })
  const stallGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.4, 1.4), glassMat)
  stallGlass.position.set(0.75, 1.25, 0)
  stall.add(tray, stallBack, stallSide, stallGlass)

  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dde0, roughness: 0.15, metalness: 0.9 })
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), chrome)
  arm.rotation.x = Math.PI / 2
  arm.position.set(0, 2.25, -0.45)
  const headMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.08, 12), chrome)
  headMesh.position.set(0, 2.18, -0.2)
  stall.add(arm, headMesh)

  const showerLight = new THREE.PointLight(0xffd9a0, 0, 5, 2)
  showerLight.position.set(0.5, 2.2, 0.8)
  stall.add(showerLight)
  group.add(stall)

  const tankLight = new THREE.PointLight(PALETTE.heatOrange, 0, 6, 2)
  tankLight.position.copy(tankLocal).add(new THREE.Vector3(0, 2, 1.5))
  group.add(tankLight)

  // Ceiling lights so the ground-floor rooms (battery + pod left, tank right) read indoors.
  const podRoomLight = new THREE.PointLight(0xdff2e8, 0.35, 8, 1.8)
  podRoomLight.position.set(-2.6, FLOOR_H - 0.4, 1) // world ≈ (6.4, 2.85, 0)
  group.add(podRoomLight)
  const tankRoomLight = new THREE.PointLight(0xf2ead8, 0.25, 7, 2)
  tankRoomLight.position.set(3, FLOOR_H - 0.4, 1)
  group.add(tankRoomLight)

  scene.add(group)

  const showerHead = new THREE.Vector3()
  stall.updateMatrixWorld(true)
  headMesh.getWorldPosition(showerHead)
  showerHead.y -= 0.06

  function update(time: number, tankWarmth: number, heatIntensity: number): void {
    const f = clamp01(tankWarmth)
    const warmH = Math.max(0.02, f * TANK_H)
    const coldH = Math.max(0.02, (1 - f) * TANK_H)
    warmFill.scale.set(1, warmH, 1)
    warmFill.position.y = 0.24 + warmH / 2
    coldFill.scale.set(1, coldH, 1)
    coldFill.position.y = 0.24 + warmH + coldH / 2
    warmMat.emissiveIntensity = 0.15 + f * 0.5 + Math.sin(time * 2.5) * 0.06 * f
    coilMat.emissiveIntensity = heatIntensity * (1.6 + Math.sin(time * 4) * 0.3)
    tankLight.intensity = heatIntensity * 2.2
    showerLight.intensity = f * 1.6
  }

  update(0, 0, 0)

  return { group, showerHead, update }
}
