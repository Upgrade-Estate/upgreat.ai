import * as THREE from 'three'

/** World positions of every stage in the diorama — single place to re-arrange the set. */
export const LAYOUT = {
  ground: { radius: 46 },
  solarField: new THREE.Vector3(-18, 0, -8),
  turbine: new THREE.Vector3(-25, 0, 7),
  /** Battery cabinet — inside the building, ground-floor left room. */
  battery: new THREE.Vector3(4.4, 0.28, 2.0),
  building: {
    center: new THREE.Vector3(9, 0, -1),
    w: 11, // x
    h: 13, // y
    d: 9, // z
    floors: 4,
  },
  /** Immersion-cooling pod — inside the building, ground-floor left room. */
  pod: new THREE.Vector3(6.4, 0.28, -1.4),
  /** Warm-water tank inside the building's ground floor (utility room). */
  tank: new THREE.Vector3(11.6, 0.2, 1),
  /** Shower stall base, third floor. */
  shower: new THREE.Vector3(6.2, 6.62, 1.1),
}

export const FLOOR_H = LAYOUT.building.h / LAYOUT.building.floors
