import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export interface Post {
  composer: EffectComposer
  bloom: UnrealBloomPass
  setSize(w: number, h: number): void
  dispose(): void
}

export function createComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): Post {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const size = renderer.getSize(new THREE.Vector2())
  const bloom = new UnrealBloomPass(size, 0.55, 0.45, 1.05)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  return {
    composer,
    bloom,
    setSize(w, h) {
      composer.setSize(w, h)
      bloom.setSize(w, h)
    },
    dispose() {
      composer.dispose()
    },
  }
}
