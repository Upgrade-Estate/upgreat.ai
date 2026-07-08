import * as THREE from 'three'
import { LAYOUT } from '../layout'
import { PALETTE } from '../effects/materials'

export interface SolarField {
  group: THREE.Group
  update(time: number, progress: number): void
}

const FIELD_COLS = 8
const FIELD_ROWS = 5
const ROOF_COUNT = 8

/**
 * Instanced solar panels: a ground field plus a rooftop array on the building.
 * "Shimmer" = a diagonal brightness wave travelling across the grid via instanceColor.
 */
export function createSolarField(scene: THREE.Scene): SolarField {
  const group = new THREE.Group()
  const count = FIELD_COLS * FIELD_ROWS + ROOF_COUNT

  const panelGeo = new THREE.BoxGeometry(1.6, 0.06, 1.1)
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x1c3a5e,
    metalness: 0.55,
    roughness: 0.35,
  })
  const panels = new THREE.InstancedMesh(panelGeo, panelMat, count)
  panels.castShadow = true

  const legGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x39544e, roughness: 0.8 })
  const legs = new THREE.InstancedMesh(legGeo, legMat, count)

  const dummy = new THREE.Object3D()
  const cells: { row: number; col: number }[] = []
  let idx = 0

  const base = LAYOUT.solarField
  for (let r = 0; r < FIELD_ROWS; r++) {
    for (let c = 0; c < FIELD_COLS; c++) {
      const x = base.x + (c - FIELD_COLS / 2 + 0.5) * 1.95
      const z = base.z + (r - FIELD_ROWS / 2 + 0.5) * 1.6
      dummy.position.set(x, 0.72, z)
      dummy.rotation.set(-Math.PI * 0.16, 0, 0)
      dummy.updateMatrix()
      panels.setMatrixAt(idx, dummy.matrix)
      dummy.position.set(x, 0.25, z)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      legs.setMatrixAt(idx, dummy.matrix)
      cells.push({ row: r, col: c })
      idx++
    }
  }

  // Rooftop array on the building.
  const b = LAYOUT.building
  const roofY = b.h + 0.35
  for (let i = 0; i < ROOF_COUNT; i++) {
    const col = i % 4
    const row = Math.floor(i / 4)
    const x = b.center.x + (col - 1.5) * 2.1
    const z = b.center.z + (row - 0.5) * 2.2
    dummy.position.set(x, roofY, z)
    dummy.rotation.set(-Math.PI * 0.14, 0, 0)
    dummy.updateMatrix()
    panels.setMatrixAt(idx, dummy.matrix)
    dummy.position.set(x, b.h + 0.12, z)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.set(1, 0.45, 1)
    dummy.updateMatrix()
    legs.setMatrixAt(idx, dummy.matrix)
    dummy.scale.set(1, 1, 1)
    cells.push({ row: row + FIELD_ROWS + 2, col })
    idx++
  }

  const baseColor = new THREE.Color(PALETTE.panelNavy).multiplyScalar(1)
  const shineColor = new THREE.Color(0x9fd9ff).multiplyScalar(1.6)
  const c = new THREE.Color()
  for (let i = 0; i < count; i++) panels.setColorAt(i, baseColor)
  panels.instanceColor!.needsUpdate = true

  group.add(panels, legs)
  scene.add(group)

  function update(time: number, progress: number): void {
    // Shimmer wave only worth animating while panels are on screen.
    if (progress > 0.32 && progress < 0.88) return
    for (let i = 0; i < count; i++) {
      const { row, col } = cells[i]
      const wave = Math.sin(time * 1.4 - (row + col) * 0.7)
      const s = Math.max(0, wave) ** 6
      c.lerpColors(baseColor, shineColor, s * 0.85)
      panels.setColorAt(i, c)
    }
    panels.instanceColor!.needsUpdate = true
  }

  return { group, update }
}
