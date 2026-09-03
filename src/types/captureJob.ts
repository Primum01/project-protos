export type CaptureJobStatus =
  | 'assigned'
  | 'scheduled'
  | 'in_progress'
  | 'awaiting_upload'
  | 'processing'
  | 'completed'
  | 'cancelled'

export interface CaptureJob {
  jobId: string
  propertyId: string
  tourId: string | null
  technicianId: string | null
  status: CaptureJobStatus
  appointmentAt: string | null
  requiredRooms: string[]
  instructions: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}
