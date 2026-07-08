import * as THREE from 'three'
import { LAYOUT } from '../layout'
import { PALETTE } from '../effects/materials'
import { Bubbles } from '../effects/Bubbles'

export interface ServerPod {
  group: THREE.Group
  update(dt: number, time: number, computeIntensity: number, heatIntensity: number): void
  degrade(): void
  dispose(): void
}

const BLADES_PER_RACK = 16
const RACKS = 2
const LED_COUNT = 128

/** Glass pod housing an open immersion tank with submerged server blades (ground-floor room). */
export function createServerPod(scene: THREE.Scene): ServerPod {
  const group = new THREE.Group()
  group.position.copy(LAYOUT.pod)

  const POD_W = 4.8
  const POD_H = 2.4
  const POD_D = 3.1

  // Base slab + corner posts + glass shell.
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(POD_W + 0.6, 0.3, POD_D + 0.6),
    new THREE.MeshStandardMaterial({ color: 0x123f39, roughness: 0.9 }),
  )
  base.position.y = 0.15
  base.castShadow = true
  group.add(base)

  const postMat = new THREE.MeshStandardMaterial({ color: PALETTE.tealMid, roughness: 0.4, metalness: 0.4 })
  for (const [sx, sz] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, POD_H, 0.18), postMat)
    post.position.set((sx * POD_W) / 2, POD_H / 2 + 0.3, (sz * POD_D) / 2)
    group.add(post)
  }
  const lid = new THREE.Mesh(new THREE.BoxGeometry(POD_W + 0.4, 0.18, POD_D + 0.4), postMat)
  lid.position.y = POD_H + 0.35
  group.add(lid)

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbfe6dd,
    transparent: true,
    opacity: 0.12,
    roughness: 0.08,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const glass = new THREE.Mesh(new THREE.BoxGeometry(POD_W, POD_H - 0.1, POD_D), glassMat)
  glass.position.y = POD_H / 2 + 0.3
  group.add(glass)

  // Immersion tub: open-top aquarium — opaque back/sides, glass front wall so the
  // submerged blades, LEDs and bubbles are visible from the camera path (+z side).
  const TUB_W = POD_W - 0.9
  const TUB_H = 1.5
  const TUB_D = POD_D - 1.1
  const tubWallMat = new THREE.MeshStandardMaterial({ color: 0x0c2a26, roughness: 0.6, metalness: 0.3 })
  const tubGlassMat = new THREE.MeshStandardMaterial({
    color: 0x9fe0d4,
    transparent: true,
    opacity: 0.16,
    roughness: 0.05,
    metalness: 0,
    depthWrite: false,
  })
  const wallT = 0.1
  const tubBottom = new THREE.Mesh(new THREE.BoxGeometry(TUB_W + 0.24, 0.16, TUB_D + 0.24), tubWallMat)
  tubBottom.position.y = 0.38
  const tubBack = new THREE.Mesh(new THREE.BoxGeometry(TUB_W + 0.24, TUB_H, wallT), tubWallMat)
  tubBack.position.set(0, TUB_H / 2 + 0.3, -TUB_D / 2 - wallT / 2)
  const tubLeft = new THREE.Mesh(new THREE.BoxGeometry(wallT, TUB_H, TUB_D + 0.24), tubWallMat)
  tubLeft.position.set(-TUB_W / 2 - wallT / 2, TUB_H / 2 + 0.3, 0)
  const tubRight = new THREE.Mesh(new THREE.BoxGeometry(wallT, TUB_H, TUB_D + 0.24), tubWallMat)
  tubRight.position.set(TUB_W / 2 + wallT / 2, TUB_H / 2 + 0.3, 0)
  const tubFront = new THREE.Mesh(new THREE.BoxGeometry(TUB_W + 0.24, TUB_H, wallT), tubGlassMat)
  tubFront.position.set(0, TUB_H / 2 + 0.3, TUB_D / 2 + wallT / 2)
  // Lime rim so the tank edge pops.
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(TUB_W + 0.36, 0.06, TUB_D + 0.36),
    new THREE.MeshStandardMaterial({ color: PALETTE.lime, emissive: PALETTE.lime, emissiveIntensity: 0.6 }),
  )
  rim.position.y = TUB_H + 0.33
  group.add(tubBottom, tubBack, tubLeft, tubRight, tubFront, rim)

  const coolantMat = new THREE.MeshStandardMaterial({
    color: 0x0fa08c,
    transparent: true,
    opacity: 0.4,
    roughness: 0.05,
    metalness: 0,
    emissive: 0x0a6e60,
    emissiveIntensity: 0.35,
    depthWrite: false,
  })
  const coolant = new THREE.Mesh(new THREE.BoxGeometry(TUB_W, TUB_H - 0.18, TUB_D), coolantMat)
  coolant.position.y = TUB_H / 2 + 0.32
  group.add(coolant)

  // Liquid surface with a soft emissive flicker.
  const surfaceMat = new THREE.MeshStandardMaterial({
    color: 0x2ec4ab,
    transparent: true,
    opacity: 0.5,
    roughness: 0.1,
    emissive: 0x2ec4ab,
    emissiveIntensity: 0.4,
  })
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(TUB_W, TUB_D), surfaceMat)
  surface.rotation.x = -Math.PI / 2
  surface.position.y = TUB_H + 0.24
  group.add(surface)

  // Submerged server blades, two racks.
  const bladeGeo = new THREE.BoxGeometry(0.14, 1.05, 0.9)
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x2b4551, roughness: 0.45, metalness: 0.55 })
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, BLADES_PER_RACK * RACKS)
  const dummy = new THREE.Object3D()
  let bi = 0
  for (let rack = 0; rack < RACKS; rack++) {
    const z = (rack - 0.5) * (TUB_D / 2)
    for (let i = 0; i < BLADES_PER_RACK; i++) {
      const x = -TUB_W / 2 + 0.35 + i * ((TUB_W - 0.7) / (BLADES_PER_RACK - 1))
      dummy.position.set(x, 0.95, z)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      blades.setMatrixAt(bi++, dummy.matrix)
    }
  }
  group.add(blades)

  // Blinking status LEDs along the blade tops.
  const ledGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05)
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
  const leds = new THREE.InstancedMesh(ledGeo, ledMat, LED_COUNT)
  const ledPhases = new Float32Array(LED_COUNT)
  const ledSpeeds = new Float32Array(LED_COUNT)
  for (let i = 0; i < LED_COUNT; i++) {
    const rack = i % RACKS
    const along = Math.floor(i / RACKS) % BLADES_PER_RACK
    const x = -TUB_W / 2 + 0.35 + along * ((TUB_W - 0.7) / (BLADES_PER_RACK - 1))
    const z = (rack - 0.5) * (TUB_D / 2) + 0.4
    dummy.position.set(x, 1.15 + (Math.floor(i / (RACKS * BLADES_PER_RACK)) % 3) * 0.18, z)
    dummy.updateMatrix()
    leds.setMatrixAt(i, dummy.matrix)
    ledPhases[i] = Math.random() * Math.PI * 2
    ledSpeeds[i] = 2 + Math.random() * 5
    leds.setColorAt(i, new THREE.Color(0x0a1c18))
  }
  group.add(leds)

  const bubbles = new Bubbles({
    count: 200,
    region: {
      min: new THREE.Vector3(-TUB_W / 2 + 0.2, 0.5, -TUB_D / 2 + 0.2),
      size: new THREE.Vector3(TUB_W - 0.4, TUB_H - 0.5, TUB_D - 0.4),
    },
  })
  group.add(bubbles.mesh)

  // Heat building up under the racks.
  const heatLight = new THREE.PointLight(PALETTE.heatOrange, 0, 9, 1.8)
  heatLight.position.set(0, 0.7, 0)
  group.add(heatLight)

  const coolLight = new THREE.PointLight(0x7fe8d4, 0.7, 8, 1.8)
  coolLight.position.set(0, 2.6, 1.6)
  group.add(coolLight)

  scene.add(group)

  const ledOn = new THREE.Color(PALETTE.limePale).multiplyScalar(2.6)
  const ledOff = new THREE.Color(0x0a1c18)
  const c = new THREE.Color()

  function update(dt: number, time: number, computeIntensity: number, heatIntensity: number): void {
    // LEDs blink faster as compute ramps.
    if (computeIntensity > 0.02) {
      for (let i = 0; i < LED_COUNT; i++) {
        const on = Math.sin(time * ledSpeeds[i] + ledPhases[i]) > 0.35 - computeIntensity * 0.55
        c.copy(on ? ledOn : ledOff)
        leds.setColorAt(i, c)
      }
      leds.instanceColor!.needsUpdate = true
    }
    bubbles.update(dt, computeIntensity)
    heatLight.intensity = heatIntensity * 2.5
    coolantMat.emissiveIntensity = 0.25 + computeIntensity * 0.35
    surfaceMat.emissiveIntensity = 0.3 + computeIntensity * 0.35 + Math.sin(time * 2.1) * 0.08
    surfaceMat.opacity = 0.45 + Math.sin(time * 1.7) * 0.05
  }

  return {
    group,
    update,
    degrade() {
      bubbles.degrade()
    },
    dispose() {
      bubbles.dispose()
    },
  }
}
