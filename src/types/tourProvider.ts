/**
 * Provider-agnostic shape for the 3D tour layer. Concrete viewer
 * implementations (Three.js first, later Matterport / Gaussian splats /
 * other providers) adapt their native data into this shape so the rest of
 * the app never depends on a specific 3D technology.
 */
export type TourProviderKind = 'threejs' | 'matterport' | 'gaussian_splat'

export interface TourProviderAsset {
  id: string
  kind: 'model' | 'panorama' | 'texture' | 'video' | 'floorplan'
  url: string
  format: string
}

export interface TourProviderData {
  provider: TourProviderKind
  assets: TourProviderAsset[]
  rooms: string[]
  hotspots: string[]
  floorplanUrl: string | null
  metadata: Record<string, unknown>
}
