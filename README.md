# Upgreat AI — The Energy Loop

An interactive, scroll-driven Three.js story about circular energy: sun and wind charge a
battery inside a residential building, the battery powers a pod of submersed
(immersion-cooled) AI servers, and the servers' waste heat warms the building's
warm-water tank — all the way to a hot shower.

## Pages

- `/` — branded landing page
- `/energy-loop` — the 3D visualization (scroll to fly through the seven chapters)

## Stack

Vite + React 18 + TypeScript + Tailwind CSS v4 + three.js (plain, no react-three-fiber).
No 3D model files — the whole diorama is procedural geometry.

## Develop

```sh
npm install
npm run dev        # dev server on :5173
npm run build      # typecheck + production bundle in dist/
npm run preview    # serve the production build
npm run shots      # headless screenshot pass (playwright-core + system chromium)
```

## How the visualization works

- The page scrolls natively over a tall spacer; a single damped progress scalar (read
  inside the RAF loop) drives the camera flight, particle flows, panel fades and HUD.
- Camera position + lookAt travel along two Catmull-Rom splines with keyframes defined
  next to the chapter copy in `src/content/chapters.ts` — recomposing a shot is a
  one-file edit.
- Explanatory panels are DOM overlays; the viz writes opacity/transform straight to
  refs, so nothing re-renders while scrolling.
- Degrades gracefully: WebGL-unavailable fallback article, `prefers-reduced-motion`
  support (no bloom/sway), tab-hidden pause, and a runtime quality manager that lowers
  pixel ratio and particle counts on slow devices.
