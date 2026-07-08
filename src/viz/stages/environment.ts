import * as THREE from 'three'
import { LAYOUT } from '../layout'
import { PALETTE } from '../effects/materials'
import { smoothstep } from '../utils/math'

interface SkyPalette {
  top: THREE.Color
  horizon: THREE.Color
  sun: THREE.Color
  hemi: number
}

const DAWN: SkyPalette = {
  top: new THREE.Color(0x0a4a43),
  horizon: new THREE.Color(0xe8b078),
  sun: new THREE.Color(0xffd9a8),
  hemi: 1.0,
}
const NOON: SkyPalette = {
  top: new THREE.Color(0x0d6156),
  horizon: new THREE.Color(0xbcd8c4),
  sun: new THREE.Color(0xfff3d6),
  hemi: 1.35,
}
const DUSK: SkyPalette = {
  top: new THREE.Color(0x06322d),
  horizon: new THREE.Color(0xff9a5c),
  sun: new THREE.Color(0xffb36b),
  hemi: 0.85,
}

export interface Environment {
  group: THREE.Group
  sun: THREE.DirectionalLight
  update(progress: number): void
  setShadows(enabled: boolean): void
}

export function createEnvironment(scene: THREE.Scene): Environment {
  const group = new THREE.Group()

  // Sky dome: vertical gradient, colors driven by the day cycle.
  const skyUniforms = {
    topColor: { value: DAWN.top.clone() },
    horizonColor: { value: DAWN.horizon.clone() },
  }
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(130, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        varying vec3 vPos;
        void main() {
          float h = clamp(normalize(vPos).y * 1.6 + 0.12, 0.0, 1.0);
          gl_FragColor = vec4(mix(horizonColor, topColor, pow(h, 0.8)), 1.0);
        }
      `,
    }),
  )
  group.add(sky)

  const fog = new THREE.Fog(DAWN.horizon.clone(), 55, 125)
  scene.fog = fog

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(LAYOUT.ground.radius, 48),
    new THREE.MeshStandardMaterial({ color: 0x1a5a50, roughness: 0.95, metalness: 0 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  group.add(ground)

  // Accent ring around the diorama edge, brand lime.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(LAYOUT.ground.radius - 0.6, 0.07, 8, 96),
    new THREE.MeshBasicMaterial({ color: PALETTE.lime, transparent: true, opacity: 0.35 }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.02
  group.add(ring)

  const hemi = new THREE.HemisphereLight(0xcdeee2, 0x1c4a42, DAWN.hemi)
  group.add(hemi)

  const ambient = new THREE.AmbientLight(0x9fd4c4, 0.25)
  group.add(ambient)

  const sun = new THREE.DirectionalLight(DAWN.sun, 1.6)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -32
  sun.shadow.camera.right = 32
  sun.shadow.camera.top = 32
  sun.shadow.camera.bottom = -32
  sun.shadow.camera.near = 10
  sun.shadow.camera.far = 140
  sun.shadow.bias = -0.001
  group.add(sun)
  group.add(sun.target)

  // Visible sun disc (blooms).
  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 16, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.6, 1.6), toneMapped: false }),
  )
  group.add(sunDisc)

  const paletteNow: SkyPalette = {
    top: new THREE.Color(),
    horizon: new THREE.Color(),
    sun: new THREE.Color(),
    hemi: 0.5,
  }

  function mixPalettes(p: number): void {
    // dawn (0) → noon (0.5) → dusk (1)
    const toNoon = smoothstep(0.05, 0.45, p)
    const toDusk = smoothstep(0.62, 0.96, p)
    paletteNow.top.lerpColors(DAWN.top, NOON.top, toNoon).lerp(DUSK.top, toDusk)
    paletteNow.horizon.lerpColors(DAWN.horizon, NOON.horizon, toNoon).lerp(DUSK.horizon, toDusk)
    paletteNow.sun.lerpColors(DAWN.sun, NOON.sun, toNoon).lerp(DUSK.sun, toDusk)
    paletteNow.hemi = DAWN.hemi + (NOON.hemi - DAWN.hemi) * toNoon + (DUSK.hemi - NOON.hemi) * toDusk
  }

  function update(progress: number): void {
    mixPalettes(progress)
    skyUniforms.topColor.value.copy(paletteNow.top)
    skyUniforms.horizonColor.value.copy(paletteNow.horizon)
    fog.color.copy(paletteNow.horizon).lerp(paletteNow.top, 0.55)
    hemi.intensity = paletteNow.hemi
    sun.color.copy(paletteNow.sun)

    // Sun arcs east → overhead → west across the story.
    const angle = Math.PI * (0.15 + 0.7 * progress)
    const r = 90
    sun.position.set(Math.cos(angle) * r, Math.sin(angle) * r * 0.7 + 8, -30)
    sun.target.position.set(0, 0, 0)
    sun.intensity = 1.8 + Math.sin(angle) * 1.4
    sunDisc.position.copy(sun.position).multiplyScalar(0.92)
  }

  update(0)
  scene.add(group)

  return {
    group,
    sun,
    update,
    setShadows(enabled: boolean) {
      sun.castShadow = enabled
    },
  }
}
