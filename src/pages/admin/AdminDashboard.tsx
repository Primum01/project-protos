import { useAdminListings } from '@/contexts/AdminDataContext'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { useNavigate } from 'react-router-dom'
import type { ListingStatus } from '@/types/listing'
import { LISTING_STATUSES } from '@/types/listing'

/** Pre-computed lookup — avoids repeated .find() on every render for every row. */
const STATUS_META = Object.fromEntries(
  LISTING_STATUSES.map((s) => [s.value, s]),
) as Record<ListingStatus, (typeof LISTING_STATUSES)[number]>

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-ink-950/8 bg-paper p-6 shadow-soft">
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-medium text-ink-950">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
    </div>
  )
}


export function AdminDashboard() {
  const { listings, loading } = useAdminListings()
  const navigate = useNavigate()

  const total = listings.length
  const published = listings.filter((l) => l.published).length
  const available = listings.filter((l) => l.status === 'available').length
  const sold = listings.filter((l) => l.status === 'sold').length

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-950">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">Overview of your property portfolio.</p>
      </div>

      {/* Firebase not configured notice */}
      {!isFirebaseConfigured && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>Firebase is not yet configured.</strong> Data shown here will be empty until you
          add your credentials to{' '}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env.local</code>.
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total listings" value={total} />
          <StatCard label="Published" value={published} sub="Visible on public site" />
          <StatCard label="Available" value={available} />
          <StatCard label="Sold" value={sold} />
        </div>
      )}

      {/* Recent listings */}
      {!loading && listings.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-950">Recent listings</h2>
            <button
              onClick={() => navigate('/admin/listings')}
              className="text-sm text-brand-600 hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-950/8 bg-ink-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Property
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Price
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Published
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/6">
                {listings.slice(0, 6).map((listing) => (
                  <tr
                    key={listing.id}
                    className="cursor-pointer transition-colors hover:bg-ink-50"
                    onClick={() => navigate(`/admin/listings/${listing.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink-950">{listing.name}</p>
                      <p className="text-xs text-ink-400">{listing.location}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">{listing.price}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_META[listing.status]?.color ?? ''}`}>
                        {STATUS_META[listing.status]?.label ?? listing.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${listing.published ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-400'}`}>
                        {listing.published ? '✓' : '–'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && listings.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-ink-400">No listings yet.</p>
        </div>
      )}
    </div>
  )
}
