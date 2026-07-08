import * as THREE from 'three'
import { LAYOUT } from '../layout'
import { smoothstep } from '../utils/math'

export interface WindTurbine {
  group: THREE.Group
  update(dt: number, progress: number): void
}

export function createWindTurbine(scene: THREE.Scene): WindTurbine {
  const group = new THREE.Group()
  group.position.copy(LAYOUT.turbine)

  const white = new THREE.MeshStandardMaterial({ color: 0xe8ece7, roughness: 0.5, metalness: 0.15 })

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 9, 12), white)
  tower.position.y = 4.5
  tower.castShadow = true
  group.add(tower)

  const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.5), white)
  nacelle.position.set(0.1, 9, 0)
  group.add(nacelle)

  // Rotor: 3 tapered blades built from an extruded airfoil-ish shape.
  const bladeShape = new THREE.Shape()
  bladeShape.moveTo(0, 0)
  bladeShape.quadraticCurveTo(0.32, 1.3, 0.14, 3.6)
  bladeShape.quadraticCurveTo(0.05, 3.95, 0, 4)
  bladeShape.quadraticCurveTo(-0.12, 2.4, -0.12, 1)
  bladeShape.quadraticCurveTo(-0.08, 0.2, 0, 0)
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.05, bevelEnabled: false })
  const rotor = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(bladeGeo, white)
    blade.rotation.z = (i * Math.PI * 2) / 3
    blade.castShadow = true
    rotor.add(blade)
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), white)
  rotor.add(hub)
  rotor.position.set(0.62, 9, 0)
  rotor.rotation.y = Math.PI / 2
  group.add(rotor)

  scene.add(group)

  let speed = 0
  function update(dt: number, progress: number): void {
    // Eases up as the generation chapter begins, keeps spinning forever after.
    const target = 1.4 * (0.25 + smoothstep(0.06, 0.16, progress))
    speed += (target - speed) * Math.min(1, dt * 2)
    rotor.rotation.z += speed * dt
  }

  return { group, update }
}
