export interface HotspotPosition {
  x: number
  y: number
  z: number
}

export interface Hotspot {
  hotspotId: string
  tourId: string
  roomId: string
  title: string
  description: string | null
  imageUrl: string | null
  position: HotspotPosition
  destinationRoomId: string | null
  externalUrl: string | null
}
