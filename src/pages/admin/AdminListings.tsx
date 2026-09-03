import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteListing, updateListing } from '@/lib/firebase/listings'
import { useAdminListings } from '@/contexts/AdminDataContext'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { Button } from '@/components/ui'
import type { Listing, ListingStatus } from '@/types/listing'
import { LISTING_STATUSES } from '@/types/listing'

function statusMeta(status: ListingStatus) {
  return LISTING_STATUSES.find((s) => s.value === status) ?? LISTING_STATUSES[0]
}

function IconPencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export function AdminListings() {
  const { listings, loading } = useAdminListings()
  const navigate = useNavigate()
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleTogglePublish(listing: Listing) {
    setToggling(listing.id)
    try {
      await updateListing(listing.id, { published: !listing.published })
    } catch {
      alert('Failed to update listing. Check your Firebase config.')
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete(listing: Listing) {
    if (!window.confirm(`Delete "${listing.name}"? This cannot be undone.`)) return
    setDeleting(listing.id)
    try {
      await deleteListing(listing.id)
    } catch {
      alert('Failed to delete listing. Check your Firebase config.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-950">Listings</h1>
        <p className="mt-1 text-sm text-ink-500">
          {loading ? 'Loading…' : `${listings.length} propert${listings.length === 1 ? 'y' : 'ies'}`}
        </p>
      </div>

      {/* Firebase warning */}
      {!isFirebaseConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>Firebase not configured.</strong> Listings are stored in Firestore. Add your
          credentials to <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env.local</code> to enable data storage.
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && listings.length === 0 && (
        <div className="mt-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink-400" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18M3 15h6" />
            </svg>
          </div>
          <p className="font-medium text-ink-700">No listings yet</p>
          <p className="mt-1 text-sm text-ink-400">Add your first property to get started.</p>
          <Button onClick={() => navigate('/admin/listings/new')} className="mt-5">
            Add listing
          </Button>
        </div>
      )}

      {/* Table */}
      {!loading && listings.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-950/8 bg-ink-50">
                  {['Property', 'Type', 'Price', 'Status', 'Published', 'Actions'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/6">
                {listings.map((listing) => {
                  const sm = statusMeta(listing.status)
                  const isToggling = toggling === listing.id
                  const isDeleting = deleting === listing.id
                  return (
                    <tr key={listing.id} className="group transition-colors hover:bg-ink-50/60">
                      {/* Name */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink-950">{listing.name}</p>
                        <p className="text-xs text-ink-400 truncate max-w-[180px]">{listing.location}</p>
                      </td>
                      {/* Type */}
                      <td className="whitespace-nowrap px-5 py-4 text-ink-600">{listing.propertyType}</td>
                      {/* Price */}
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-ink-800">{listing.price}</td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${sm.color}`}>
                          {sm.label}
                        </span>
                      </td>
                      {/* Publish toggle */}
                      <td className="px-5 py-4">
                        <button
                          id={`publish-toggle-${listing.id}`}
                          onClick={() => handleTogglePublish(listing)}
                          disabled={isToggling || !isFirebaseConfigured}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${listing.published ? 'bg-emerald-500' : 'bg-ink-200'}`}
                          aria-label={listing.published ? 'Unpublish' : 'Publish'}
                          title={listing.published ? 'Click to unpublish' : 'Click to publish'}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${listing.published ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            id={`edit-btn-${listing.id}`}
                            onClick={() => navigate(`/admin/listings/${listing.id}`)}
                            className="flex items-center gap-1.5 rounded-lg border border-ink-950/10 bg-paper px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-950"
                          >
                            <IconPencil /> Edit
                          </button>
                          <button
                            id={`delete-btn-${listing.id}`}
                            onClick={() => handleDelete(listing)}
                            disabled={isDeleting || !isFirebaseConfigured}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            <IconTrash /> {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
