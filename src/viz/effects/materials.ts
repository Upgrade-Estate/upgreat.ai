import * as THREE from 'three'

export const PALETTE = {
  tealDeep: 0x054440,
  tealMid: 0x065b55,
  lime: 0x97d068,
  limePale: 0xd1f58c,
  offwhite: 0xeaebe4,
  groundTeal: 0x0b3d38,
  heatOrange: 0xff9a3c,
  heatCore: 0xffb45e,
  coldBlue: 0x5ab8d4,
  warmWater: 0xffd9a0,
  panelNavy: 0x10233a,
}

export function standard(opts: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial(opts)
}

/** Soft radial-gradient sprite texture, generated on a canvas (used by steam/glow sprites). */
export function makeGlowTexture(size = 64): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

let sharedGlow: THREE.Texture | null = null
export function glowTexture(): THREE.Texture {
  if (!sharedGlow) sharedGlow = makeGlowTexture()
  return sharedGlow
}
