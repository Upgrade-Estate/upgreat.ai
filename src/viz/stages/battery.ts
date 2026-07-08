import * as THREE from 'three'
import { LAYOUT } from '../layout'
import { PALETTE } from '../effects/materials'

export interface Battery {
  group: THREE.Group
  update(time: number, chargePct: number): void
}

/** Wall-mounted battery cabinet with an emissive charge-level bar. */
export function createBattery(scene: THREE.Scene): Battery {
  const group = new THREE.Group()
  group.position.copy(LAYOUT.battery)

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.2, 0.7),
    new THREE.MeshStandardMaterial({ color: PALETTE.tealMid, roughness: 0.4, metalness: 0.3 }),
  )
  body.position.y = 1.25
  body.castShadow = true
  group.add(body)

  const face = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.0, 0.06),
    new THREE.MeshStandardMaterial({ color: PALETTE.offwhite, roughness: 0.6 }),
  )
  face.position.set(0, 1.25, 0.38)
  group.add(face)

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.3, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x123f39, roughness: 0.9 }),
  )
  plinth.position.y = 0.15
  group.add(plinth)

  // Charge bar: emissive lime box that fills bottom→top.
  const BAR_H = 1.6
  const barMat = new THREE.MeshStandardMaterial({
    color: PALETTE.lime,
    emissive: PALETTE.lime,
    emissiveIntensity: 1.8,
  })
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.22, BAR_H, 0.05), barMat)
  bar.position.set(-0.42, 0, 0.43)
  group.add(bar)

  // Slot outline behind the bar.
  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, BAR_H + 0.08, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0c2a26, roughness: 0.8 }),
  )
  slot.position.set(-0.42, 1.25, 0.415)
  group.add(slot)

  // Brand pill on the face plate.
  const pill = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.09, 0.3, 4, 8),
    new THREE.MeshStandardMaterial({ color: PALETTE.lime, emissive: PALETTE.lime, emissiveIntensity: 0.5 }),
  )
  pill.rotation.z = Math.PI / 2
  pill.position.set(0.25, 2.0, 0.42)
  group.add(pill)

  const glow = new THREE.PointLight(PALETTE.lime, 0, 6, 2)
  glow.position.set(0, 1.6, 1.2)
  group.add(glow)

  scene.add(group)

  function update(time: number, chargePct: number): void {
    const f = Math.max(0.04, chargePct / 100)
    bar.scale.y = f
    bar.position.y = 1.25 - (BAR_H * (1 - f)) / 2
    const pulse = 1 + Math.sin(time * 3.2) * 0.18
    barMat.emissiveIntensity = 1.5 * pulse + f
    glow.intensity = 1.1 * f
  }

  return { group, update }
}
