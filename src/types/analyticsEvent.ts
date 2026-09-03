export type AnalyticsEventName =
  | 'tour_opened'
  | 'tour_loaded'
  | 'room_entered'
  | 'hotspot_clicked'
  | 'photo_opened'
  | 'floorplan_opened'
  | 'booking_clicked'
  | 'share_clicked'
  | 'tour_completed'

export interface AnalyticsEvent {
  eventId: string
  tourId: string
  name: AnalyticsEventName
  sessionId: string
  occurredAt: string
  metadata: Record<string, unknown>
}
