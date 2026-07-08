import * as THREE from 'three'
import { PALETTE } from '../effects/materials'
import { FlowParticles } from '../effects/FlowParticles'
import type { flowIntensities } from '../../content/chapters'

type Flows = ReturnType<typeof flowIntensities>

export interface Conduits {
  group: THREE.Group
  update(dt: number, flows: Flows): void
  degrade(): void
  dispose(): void
}

function curve(points: [number, number, number][]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal',
  )
}

/** Every cable and pipe in the loop, plus the particle flows that run along them. */
export function createConduits(scene: THREE.Scene): Conduits {
  const group = new THREE.Group()

  // --- Curves ---
  const powerSolar = curve([
    [-14.5, 1.1, -6],
    [-8, 2.1, -2.5],
    [-2, 1.6, 2.2],
    [1.8, 1.4, 4.2],
    [4.0, 1.4, 2.8],
  ])
  const powerWind = curve([
    [-25, 1.4, 7.2],
    [-17, 2.3, 7.6],
    [-8, 1.6, 7],
    [0.5, 1.2, 5.6],
    [3.9, 1.3, 3.0],
  ])
  const powerRoof = curve([
    [7.2, 13.4, 1.6],
    [4.4, 10.5, 4.3],
    [3.6, 6, 4.6],
    [4.2, 2.4, 3.0],
  ])
  const podFeed = curve([
    [4.8, 1.0, 1.6],
    [5.5, 0.7, 0.6],
    [6.4, 0.85, -0.3],
  ])
  const heatOut = curve([
    [7.6, 1.2, -1.4],
    [9.0, 1.2, -0.6],
    [10.6, 1.1, 0.4],
    [11.6, 1.1, 1],
  ])
  const heatReturn = curve([
    [11.6, 0.5, 0.4],
    [9.6, 0.5, -0.9],
    [7.8, 0.6, -1.8],
  ])
  const coldFeed = curve([
    [16, 0.2, 4.6],
    [13.6, 0.35, 2.9],
    [12.1, 0.5, 1.7],
  ])
  // Hugs the back of the building on its way up so it never crosses the shower framing.
  const warmRiser = curve([
    [11.6, 3.0, 1],
    [12.2, 4.8, -1.6],
    [10.6, 7.4, -3.4],
    [7.8, 8.6, -2.4],
    [6.2, 8.72, 0.6],
  ])

  // --- Static tube meshes ---
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x1b3a35, roughness: 0.6, metalness: 0.2 })
  const heatPipeMat = new THREE.MeshStandardMaterial({ color: 0x6f7a76, roughness: 0.35, metalness: 0.7 })
  const heatCoreMat = new THREE.MeshStandardMaterial({
    color: PALETTE.heatCore,
    emissive: PALETTE.heatOrange,
    emissiveIntensity: 0,
    roughness: 0.4,
  })
  const returnCoreMat = new THREE.MeshStandardMaterial({
    color: 0x2ec4ab,
    emissive: 0x1a8a78,
    emissiveIntensity: 0,
    roughness: 0.4,
  })
  const coldPipeMat = new THREE.MeshStandardMaterial({ color: 0x4e7d8a, roughness: 0.45, metalness: 0.5 })
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.35, metalness: 0.7 })

  function tube(c: THREE.Curve<THREE.Vector3>, radius: number, mat: THREE.Material, segments = 80): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, segments, radius, 8, false), mat)
    m.castShadow = false
    return m
  }

  group.add(
    tube(powerSolar, 0.05, cableMat),
    tube(powerWind, 0.05, cableMat),
    tube(powerRoof, 0.045, cableMat),
    tube(podFeed, 0.06, cableMat),
    tube(heatOut, 0.11, heatPipeMat),
    tube(heatOut, 0.055, heatCoreMat, 100),
    tube(heatReturn, 0.09, heatPipeMat),
    tube(heatReturn, 0.045, returnCoreMat),
    tube(coldFeed, 0.08, coldPipeMat),
    tube(warmRiser, 0.06, copperMat),
  )

  // --- Particle flows ---
  const lime = PALETTE.limePale
  const flowsList = {
    powerSolar: new FlowParticles({ curve: powerSolar, count: 130, color: lime, size: 0.2, speed: 0.16 }),
    powerWind: new FlowParticles({ curve: powerWind, count: 150, color: lime, size: 0.2, speed: 0.14 }),
    powerRoof: new FlowParticles({ curve: powerRoof, count: 90, color: lime, size: 0.18, speed: 0.18 }),
    podFeed: new FlowParticles({ curve: podFeed, count: 110, color: lime, size: 0.2, speed: 0.2 }),
    heatOut: new FlowParticles({
      curve: heatOut,
      count: 160,
      color: PALETTE.heatOrange,
      colorEnd: 0xffd27a,
      size: 0.22,
      speed: 0.11,
      jitter: 0.05,
    }),
    heatReturn: new FlowParticles({
      curve: heatReturn,
      count: 90,
      color: 0x2ec4ab,
      size: 0.16,
      speed: 0.1,
      jitter: 0.04,
    }),
    coldFeed: new FlowParticles({ curve: coldFeed, count: 60, color: PALETTE.coldBlue, size: 0.18, speed: 0.12 }),
    warmRiser: new FlowParticles({
      curve: warmRiser,
      count: 110,
      color: 0xffc57e,
      colorEnd: 0xffe9c9,
      size: 0.18,
      speed: 0.13,
      jitter: 0.04,
    }),
  }
  for (const f of Object.values(flowsList)) group.add(f.points)

  scene.add(group)

  function update(dt: number, flows: Flows): void {
    flowsList.powerSolar.update(dt, flows.power)
    flowsList.powerWind.update(dt, flows.power)
    flowsList.powerRoof.update(dt, flows.power)
    flowsList.podFeed.update(dt, flows.powerToPod)
    flowsList.heatOut.update(dt, flows.heat)
    flowsList.heatReturn.update(dt, flows.heat * 0.8)
    flowsList.coldFeed.update(dt, flows.coldFeed)
    flowsList.warmRiser.update(dt, flows.warmRiser)
    heatCoreMat.emissiveIntensity = flows.heat * 2.2
    returnCoreMat.emissiveIntensity = flows.heat * 0.7
  }

  return {
    group,
    update,
    degrade() {
      for (const f of Object.values(flowsList)) f.degrade()
    },
    dispose() {
      for (const f of Object.values(flowsList)) f.dispose()
    },
  }
}
