import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteListing, updateListing } from '@/lib/firebase/listings'
import { useAdminListings } from '@/contexts/AdminDataContext'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { Button } from '@/components/ui'
import {
  type Listing,
  type ListingStatus,
  type DeactivationReason,
  LISTING_STATUSES,
  DEACTIVATION_REASONS,
} from '@/types/listing'

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function statusMeta(status: ListingStatus) {
  return LISTING_STATUSES.find((s) => s.value === status) ?? LISTING_STATUSES[0]
}
function deactivationMeta(reason: DeactivationReason) {
  return DEACTIVATION_REASONS.find((r) => r.value === reason)
}

/* ── Icons ───────────────────────────────────────────────────────────────── */
function IconPencil() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
function IconPower() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" /><line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}
function IconRefresh() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}
function IconTag() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/* ── Tab type ─────────────────────────────────────────────────────────────── */
type Tab = 'all' | 'deactivated' | 'pricing'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',         label: 'All listings' },
  { id: 'deactivated', label: 'Deactivated' },
  { id: 'pricing',     label: 'Pricing' },
]

/* ── Deactivate inline picker ─────────────────────────────────────────────── */
function DeactivatePicker({
  listingId,
  onConfirm,
  onCancel,
}: {
  listingId: string
  onConfirm: (reason: DeactivationReason) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState<DeactivationReason>('late_payment')
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <span className="text-xs font-medium text-amber-800">Reason:</span>
      <select
        id={`deactivate-reason-${listingId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value as DeactivationReason)}
        className="rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        {DEACTIVATION_REASONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <button
        id={`deactivate-confirm-${listingId}`}
        onClick={() => onConfirm(reason)}
        className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
      >
        Confirm deactivate
      </button>
      <button
        onClick={onCancel}
        className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
      >
        Cancel
      </button>
    </div>
  )
}

/* ── Inline price editor row ─────────────────────────────────────────────── */
function PriceRow({ listing }: { listing: Listing }) {
  const [draft, setDraft] = useState(listing.price)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isDirty = draft.trim() !== listing.price

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    try {
      await updateListing(listing.id, { price: draft.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Failed to update price.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="group border-b border-ink-950/6 transition-colors hover:bg-ink-50/60">
      {/* Name */}
      <td className="px-5 py-3.5">
        <p className="font-medium text-ink-950">{listing.name}</p>
        <p className="truncate max-w-[180px] text-xs text-ink-400">{listing.location}</p>
      </td>
      {/* Type */}
      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-ink-500">{listing.propertyType}</td>
      {/* Current price */}
      <td className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-ink-600">{listing.price || '—'}</td>
      {/* New price input */}
      <td className="px-5 py-3.5">
        <input
          id={`price-input-${listing.id}`}
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setSaved(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
          placeholder="e.g. KES 85,000/mo"
          className="w-full rounded-lg border border-ink-950/15 bg-paper px-3 py-2 text-sm text-ink-950 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </td>
      {/* Save */}
      <td className="px-5 py-3.5">
        {saved ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <IconCheck /> Saved
          </span>
        ) : (
          <button
            id={`price-save-${listing.id}`}
            onClick={handleSave}
            disabled={!isDirty || saving || !isFirebaseConfigured}
            className="flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save price'}
          </button>
        )}
      </td>
    </tr>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export function AdminListings() {
  const { listings, loading } = useAdminListings()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [toggling, setToggling]   = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  // tracks which listing has the inline deactivate picker open
  const [deactivatePicker, setDeactivatePicker] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState<string | null>(null)
  const [reactivating, setReactivating] = useState<string | null>(null)

  /* Derived lists */
  const allListings         = listings
  const deactivatedListings = listings.filter((l) => l.deactivated)
  const counts = {
    all:         allListings.length,
    deactivated: deactivatedListings.length,
    pricing:     allListings.length,
  }

  /* Handlers */
  async function handleTogglePublish(listing: Listing) {
    setToggling(listing.id)
    try {
      await updateListing(listing.id, { published: !listing.published })
    } catch {
      alert('Failed to update listing.')
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
      alert('Failed to delete listing.')
    } finally {
      setDeleting(null)
    }
  }

  async function handleDeactivate(listing: Listing, reason: DeactivationReason) {
    setDeactivating(listing.id)
    setDeactivatePicker(null)
    try {
      await updateListing(listing.id, {
        deactivated: true,
        deactivationReason: reason,
        published: false,
      })
    } catch {
      alert('Failed to deactivate listing.')
    } finally {
      setDeactivating(null)
    }
  }

  async function handleReactivate(listing: Listing) {
    setReactivating(listing.id)
    try {
      await updateListing(listing.id, {
        deactivated: false,
        deactivationReason: '',
        // stays unpublished — admin manually re-publishes
      })
    } catch {
      alert('Failed to reactivate listing.')
    } finally {
      setReactivating(null)
    }
  }

  /* ── Shared empty / loading states */
  function renderSkeleton() {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />
        ))}
      </div>
    )
  }

  function renderEmpty(message: string, sub?: string, action?: React.ReactNode) {
    return (
      <div className="mt-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink-400" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18M3 15h6" />
          </svg>
        </div>
        <p className="font-medium text-ink-700">{message}</p>
        {sub && <p className="mt-1 text-sm text-ink-400">{sub}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    )
  }

  /* ── "All listings" table ── */
  function renderAllTable() {
    if (loading) return renderSkeleton()
    if (allListings.length === 0) return renderEmpty(
      'No listings yet',
      'Add your first property to get started.',
      <Button onClick={() => navigate('/admin/listings/new')}>Add listing</Button>,
    )
    return (
      <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-950/8 bg-ink-50">
                {['Property', 'Type', 'Price', 'Status', 'Published', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/6">
              {allListings.map((listing) => {
                const sm            = statusMeta(listing.status)
                const isToggling    = toggling === listing.id
                const isDeleting    = deleting === listing.id
                const isDeactivating = deactivating === listing.id
                const showPicker    = deactivatePicker === listing.id
                const isDeactivated = listing.deactivated

                return (
                  <tr key={listing.id} className={`group transition-colors hover:bg-ink-50/60 ${isDeactivated ? 'opacity-60' : ''}`}>
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="font-medium text-ink-950">{listing.name}</p>
                        <p className="truncate max-w-[180px] text-xs text-ink-400">{listing.location}</p>
                        {/* Inline picker lives under the name cell */}
                        {showPicker && (
                          <DeactivatePicker
                            listingId={listing.id}
                            onConfirm={(reason) => handleDeactivate(listing, reason)}
                            onCancel={() => setDeactivatePicker(null)}
                          />
                        )}
                      </div>
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
                      {isDeactivated && (
                        <span className="ml-1.5 inline-flex rounded-full border border-ink-200 bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
                          Deactivated
                        </span>
                      )}
                    </td>
                    {/* Publish toggle */}
                    <td className="px-5 py-4">
                      <button
                        id={`publish-toggle-${listing.id}`}
                        onClick={() => handleTogglePublish(listing)}
                        disabled={isToggling || !isFirebaseConfigured || isDeactivated}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 ${listing.published ? 'bg-emerald-500' : 'bg-ink-200'}`}
                        aria-label={listing.published ? 'Unpublish' : 'Publish'}
                        title={isDeactivated ? 'Reactivate before publishing' : (listing.published ? 'Click to unpublish' : 'Click to publish')}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${listing.published ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Edit */}
                        <button
                          id={`edit-btn-${listing.id}`}
                          onClick={() => navigate(`/admin/listings/${listing.id}`)}
                          className="flex items-center gap-1.5 rounded-lg border border-ink-950/10 bg-paper px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-950"
                        >
                          <IconPencil /> Edit
                        </button>

                        {/* Deactivate (only when not already deactivated) */}
                        {!isDeactivated && (
                          <button
                            id={`deactivate-btn-${listing.id}`}
                            onClick={() => setDeactivatePicker(showPicker ? null : listing.id)}
                            disabled={isDeactivating || !isFirebaseConfigured}
                            className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                          >
                            <IconPower /> {isDeactivating ? 'Deactivating…' : 'Deactivate'}
                          </button>
                        )}

                        {/* Reactivate (only when deactivated) */}
                        {isDeactivated && (
                          <button
                            id={`reactivate-btn-${listing.id}`}
                            onClick={() => handleReactivate(listing)}
                            disabled={reactivating === listing.id || !isFirebaseConfigured}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <IconRefresh /> {reactivating === listing.id ? 'Reactivating…' : 'Reactivate'}
                          </button>
                        )}

                        {/* Delete */}
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
    )
  }

  /* ── "Deactivated" table ── */
  function renderDeactivatedTable() {
    if (loading) return renderSkeleton()
    if (deactivatedListings.length === 0) return renderEmpty(
      'No deactivated listings',
      'Properties you deactivate will appear here with the reason.',
    )
    return (
      <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-950/8 bg-ink-50">
                {['Property', 'Type', 'Price', 'Status', 'Reason', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/6">
              {deactivatedListings.map((listing) => {
                const sm     = statusMeta(listing.status)
                const dm     = deactivationMeta(listing.deactivationReason)
                const isRea  = reactivating === listing.id
                const isDel  = deleting === listing.id

                return (
                  <tr key={listing.id} className="group opacity-80 transition-colors hover:bg-ink-50/60">
                    {/* Name */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-950">{listing.name}</p>
                      <p className="truncate max-w-[160px] text-xs text-ink-400">{listing.location}</p>
                    </td>
                    {/* Type */}
                    <td className="whitespace-nowrap px-5 py-4 text-ink-600">{listing.propertyType}</td>
                    {/* Price */}
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-ink-700">{listing.price}</td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${sm.color}`}>
                        {sm.label}
                      </span>
                    </td>
                    {/* Deactivation reason */}
                    <td className="px-5 py-4">
                      {dm ? (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${dm.color}`}>
                          <IconTag /> {dm.label}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          id={`edit-deactivated-${listing.id}`}
                          onClick={() => navigate(`/admin/listings/${listing.id}`)}
                          className="flex items-center gap-1.5 rounded-lg border border-ink-950/10 bg-paper px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-950"
                        >
                          <IconPencil /> Edit
                        </button>
                        <button
                          id={`reactivate-deactivated-${listing.id}`}
                          onClick={() => handleReactivate(listing)}
                          disabled={isRea || !isFirebaseConfigured}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <IconRefresh /> {isRea ? 'Reactivating…' : 'Reactivate'}
                        </button>
                        <button
                          id={`delete-deactivated-${listing.id}`}
                          onClick={() => handleDelete(listing)}
                          disabled={isDel || !isFirebaseConfigured}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          <IconTrash /> {isDel ? 'Deleting…' : 'Delete'}
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
    )
  }

  /* ── "Pricing" table ── */
  function renderPricingTable() {
    if (loading) return renderSkeleton()
    if (allListings.length === 0) return renderEmpty(
      'No listings to price',
      'Add a listing first, then update its price here.',
    )
    return (
      <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-950/8 bg-ink-50">
                {['Property', 'Type', 'Current price', 'New price', 'Save'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allListings.map((listing) => (
                <PriceRow key={listing.id} listing={listing} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  /* ── Render ── */
  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-950">Listings</h1>
          <p className="mt-1 text-sm text-ink-500">
            {loading ? 'Loading…' : `${listings.length} propert${listings.length === 1 ? 'y' : 'ies'}`}
          </p>
        </div>
        <Button onClick={() => navigate('/admin/listings/new')}>
          + Add listing
        </Button>
      </div>

      {/* Firebase warning */}
      {!isFirebaseConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>Firebase not configured.</strong> Listings are stored in Firestore. Add your
          credentials to <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env.local</code> to enable data storage.
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-xl border border-ink-950/8 bg-ink-50 p-1">
        {TABS.map((tab) => {
          const count = counts[tab.id]
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-paper text-ink-950 shadow-soft'
                  : 'text-ink-500 hover:text-ink-800',
              ].join(' ')}
            >
              {tab.label}
              {count > 0 && (
                <span className={[
                  'rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                  activeTab === tab.id
                    ? tab.id === 'deactivated'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-brand-100 text-brand-700'
                    : 'bg-ink-200 text-ink-500',
                ].join(' ')}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'all'         && renderAllTable()}
      {activeTab === 'deactivated' && renderDeactivatedTable()}
      {activeTab === 'pricing'     && renderPricingTable()}
    </div>
  )
}
