export interface RoomPosition {
  x: number
  y: number
  z: number
}

export interface Room {
  roomId: string
  tourId: string
  name: string
  description: string
  order: number
  position: RoomPosition
  thumbnailUrl: string | null
}
