import type { TourProviderKind } from './tourProvider'

export type TourStatus =
  | 'draft'
  | 'capture_requested'
  | 'scheduled'
  | 'captured'
  | 'processing'
  | 'quality_review'
  | 'ready'
  | 'published'
  | 'unpublished'
  | 'archived'
  | 'failed'

export type TourVisibility = 'public' | 'unlisted' | 'private'

export interface Tour {
  tourId: string
  propertyId: string
  ownerId: string
  provider: TourProviderKind
  status: TourStatus
  visibility: TourVisibility
  version: number
  publishedVersion: number | null
  publicSlug: string | null
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}
