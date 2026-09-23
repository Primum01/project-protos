import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createListing, getListingById, updateListing } from '@/lib/firebase/listings'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { useAuth } from '@/hooks/useAuth'
import {
  deleteListingDocument,
  isValidDocumentFile,
  subscribeListingDocuments,
  uploadListingDocument,
} from '@/lib/firebase/listingDocuments'
import { extractEmbedSrc } from '@/lib/embed'
import { cn } from '@/lib/cn'
import { Button, Input } from '@/components/ui'
import {
  ACCENT_GRADIENTS,
  DEFAULT_LISTING_FORM,
  LISTING_STATUSES,
  PROPERTY_TYPES,
  type Listing,
  type ListingDocument,
  type ListingFormData,
} from '@/types/listing'


/* ──────────────────────────────────────────────────── section wrapper */
function FormSection({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div id={id} className="scroll-mt-6 rounded-xl border border-ink-950/8 bg-paper p-6 shadow-soft">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

/* ─────────────────────────────────────────── amenity tag input */
function AmenityInput({
  amenities,
  onChange,
}: {
  amenities: string[]
  onChange: (next: string[]) => void
}) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim()
    if (trimmed && !amenities.includes(trimmed)) onChange([...amenities, trimmed])
    setInput('')
  }

  function remove(a: string) {
    onChange(amenities.filter((x) => x !== a))
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-800">Amenities</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="e.g. Swimming pool"
          className="w-full rounded-md border border-ink-950/15 bg-paper px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-300 transition-colors focus:border-brand-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-md border border-ink-950/15 bg-ink-50 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 transition-colors"
        >
          Add
        </button>
      </div>
      {amenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {amenities.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-950/10 bg-ink-50 px-3 py-1 text-sm text-ink-700"
            >
              {a}
              <button
                type="button"
                onClick={() => remove(a)}
                className="text-ink-400 hover:text-ink-950 transition-colors"
                aria-label={`Remove ${a}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── preview panel */
function PreviewPanel({
  form,
  onClose,
}: {
  form: ListingFormData
  onClose: () => void
}) {
  const [tab, setTab] = useState<'card' | 'detail'>('card')

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-ink-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-paper shadow-lifted">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ink-950/8 px-6 py-4">
          <h2 className="font-semibold text-ink-950">Preview</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-950 transition-colors"
            aria-label="Close preview"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-ink-950/8">
          {(['card', 'detail'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                tab === t
                  ? 'border-brand-500 text-ink-950'
                  : 'border-transparent text-ink-500 hover:text-ink-950',
              )}
            >
              {t === 'card' ? 'Card view' : 'Detail view'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-ink-50">
          {tab === 'card' ? (
            <div className="flex justify-center">
              <div className="w-64">
                <p className="mb-4 text-center text-xs text-ink-400">As it appears in the tours grid</p>
                {/* Card preview */}
                <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
                  <div className={cn('relative aspect-4/3 bg-gradient-to-br', ACCENT_GRADIENTS[form.accent])}>
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink-800">
                      {form.propertyType || 'Property type'}
                    </span>
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      360° 3D tour
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="font-semibold text-ink-950">{form.name || 'Property name'}</p>
                    <p className="mt-1 text-sm text-ink-500">{[form.city, form.country].filter(Boolean).join(', ') || 'City, Country'}</p>
                    <p className="mt-3 text-sm text-ink-500">
                      {form.bedrooms} bed · {form.bathrooms} bath
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-center text-xs text-ink-400">As it appears on the listing detail page</p>
              {/* Detail preview */}
              <div className={cn('relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br flex items-center justify-center', ACCENT_GRADIENTS[form.accent])}>
                {extractEmbedSrc(form.embedCode || form.tourUrl) ? (
                  <iframe
                    src={extractEmbedSrc(form.embedCode || form.tourUrl)}
                    title="Tour preview"
                    className="h-full w-full border-0"
                    allowFullScreen
                    allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
                  />
                ) : form.tourUrl ? (
                  <a
                    href={form.tourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/20 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                  >
                    Open 3D Tour ↗
                  </a>
                ) : (
                  <p className="text-sm text-white/70">3D tour viewer will appear here</p>
                )}
              </div>
              <div className="rounded-xl border border-ink-950/8 bg-paper p-5">
                <p className="text-sm text-ink-500">{[form.city, form.country].filter(Boolean).join(', ') || 'City, Country'}</p>
                <h3 className="mt-1 text-xl font-semibold text-ink-950">{form.name || 'Property name'}</h3>
                <p className="mt-1 text-sm font-medium text-brand-600">{form.price || 'Price'}</p>
                <p className="mt-3 text-sm text-ink-500 leading-relaxed">
                  {form.description || 'Description will appear here.'}
                </p>
                {form.amenities.length > 0 && (
                  <>
                    <p className="mt-4 text-sm font-semibold text-ink-950">Amenities</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.amenities.map((a) => (
                        <span key={a} className="rounded-md border border-ink-950/10 px-2.5 py-1 text-xs text-ink-700">
                          {a}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {(form.contactPhone || form.contactEmail) && (
                  <div className="mt-5 border-t border-ink-950/8 pt-4">
                    <p className="text-sm font-semibold text-ink-950">Contact</p>
                    {form.contactPhone && <p className="text-sm text-ink-500">{form.contactPhone}</p>}
                    {form.contactEmail && <p className="text-sm text-ink-500">{form.contactEmail}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const FORM_SECTIONS = [
  {
    id: 'section-property-details',
    label: 'Property Details',
    isComplete: (f: ListingFormData) => Boolean(f.name && f.location && f.city),
  },
  {
    id: 'section-tour',
    label: '3D Virtual Tour',
    isComplete: (f: ListingFormData) => Boolean(f.tourUrl || f.embedCode),
  },
  {
    id: 'section-contact',
    label: 'Contact & Payment',
    isComplete: (f: ListingFormData) => Boolean(f.contactName || f.contactPhone || f.paymentMethod),
  },
  {
    id: 'section-documents',
    label: 'Invoice / Receipt',
    isComplete: () => false,
  },
]

/* ══════════════════════════════════════════════════════ main component */
export function AdminListingForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState<ListingFormData>(DEFAULT_LISTING_FORM)
  const [loadingListing, setLoadingListing] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [activeSection, setActiveSection] = useState('section-property-details')
  const formRef = useRef<HTMLFormElement>(null)

  // Document state (invoices & receipts)
  const [documents, setDocuments] = useState<ListingDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(isEditing)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [docError, setDocError] = useState('')
  const [docSuccess, setDocSuccess] = useState('')
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)

  // Real-time subscription to listing documents
  useEffect(() => {
    if (!id || !isFirebaseConfigured) return
    setLoadingDocs(true)
    const unsub = subscribeListingDocuments(id, (docs) => {
      setDocuments(docs)
      setLoadingDocs(false)
    })
    return unsub
  }, [id])

  async function handleUploadDocument(file: File) {
    if (!id) return
    const check = isValidDocumentFile(file)
    if (!check.valid) {
      setDocError(check.error || 'Invalid document file.')
      return
    }
    setDocError('')
    setDocSuccess('')
    setUploadingDoc(true)
    setUploadProgress(0)
    try {
      await uploadListingDocument(
        id,
        file,
        user?.email || 'team@twinspace360.com',
        (progress) => setUploadProgress(Math.round(progress * 100)),
      )
      setDocSuccess(`"${file.name}" uploaded successfully.`)
      setTimeout(() => setDocSuccess(''), 4000)
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploadingDoc(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleReplaceDocument(oldDoc: ListingDocument, newFile: File) {
    if (!id) return
    const check = isValidDocumentFile(newFile)
    if (!check.valid) {
      setDocError(check.error || 'Invalid document file.')
      return
    }
    setDocError('')
    setDocSuccess('')
    setUploadingDoc(true)
    setUploadProgress(0)
    try {
      await uploadListingDocument(
        id,
        newFile,
        user?.email || 'team@twinspace360.com',
        (progress) => setUploadProgress(Math.round(progress * 100)),
      )
      await deleteListingDocument(id, oldDoc)
      setDocSuccess(`Document replaced with "${newFile.name}".`)
      setTimeout(() => setDocSuccess(''), 4000)
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Replacement failed.')
    } finally {
      setUploadingDoc(false)
      setUploadProgress(0)
      setReplacingDocId(null)
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = ''
    }
  }

  async function handleDeleteDocument(docItem: ListingDocument) {
    if (!id) return
    if (!window.confirm(`Are you sure you want to delete "${docItem.originalFileName}"? This action cannot be undone.`)) {
      return
    }
    setDocError('')
    try {
      await deleteListingDocument(id, docItem)
      setDocSuccess(`"${docItem.originalFileName}" deleted.`)
      setTimeout(() => setDocSuccess(''), 3000)
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  // Load existing listing in edit mode
  useEffect(() => {
    if (!id) return
    if (!isFirebaseConfigured) {
      setLoadingListing(false)
      return
    }
    getListingById(id)
      .then((listing) => {
        if (listing) {
          const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = listing as Listing
          void _id; void _c; void _u
          setForm({ ...DEFAULT_LISTING_FORM, ...rest, embedCode: rest.embedCode ?? '', package: rest.package ?? 'monthly' })
        }
      })
      .catch(() => setError('Failed to load listing.'))
      .finally(() => setLoadingListing(false))
  }, [id])

  function set<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    const handleScroll = () => {
      const offsets = FORM_SECTIONS.map((sec) => {
        const el = document.getElementById(sec.id)
        if (!el) return { id: sec.id, top: Infinity }
        const rect = el.getBoundingClientRect()
        return { id: sec.id, top: Math.abs(rect.top - 140) }
      })
      offsets.sort((a, b) => a.top - b.top)
      if (offsets[0] && offsets[0].top < 700) {
        setActiveSection(offsets[0].id)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    const mainEl = document.querySelector('main')
    mainEl?.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      mainEl?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  function scrollToSection(id: string) {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async function save(publish: boolean) {
    if (!formRef.current?.reportValidity()) return
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Add .env.local credentials to save listings.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data: ListingFormData = { ...form, published: publish }
      if (isEditing && id) {
        await updateListing(id, data)
      } else {
        await createListing(data)
      }
      navigate('/admin/listings')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed. Check your Firebase config.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingListing) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-6xl p-6 lg:p-10">
        {/* Page header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/listings')}
            className="text-sm text-ink-500 hover:text-ink-950 transition-colors"
          >
            ← Back to listings
          </button>
          <span className="text-ink-300">/</span>
          <h1 className="text-xl font-semibold text-ink-950">
            {isEditing ? 'Edit listing' : 'Add new listing'}
          </h1>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <strong>Firebase not configured.</strong> You can fill in the form and preview the
            listing, but saving requires Firebase credentials in{' '}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env.local</code>.
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          {/* ── Left side: scrollable form */}
          <div className="min-w-0 flex-1">
            <form ref={formRef} onSubmit={(e: FormEvent) => e.preventDefault()} noValidate className="flex flex-col gap-5">
              {/* ── Property details */}
              <FormSection id="section-property-details" title="Property Details">
            <Input
              id="listing-name"
              label="Property name"
              required
              placeholder="e.g. Westlands Skyline Loft"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            <Input
              id="listing-location"
              label="Full address / location"
              required
              placeholder="e.g. GTC Office Tower, 14th Floor, Westlands"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="listing-city"
                label="City"
                required
                placeholder="e.g. Nairobi"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
              <Input
                id="listing-country"
                label="Country"
                required
                placeholder="e.g. Kenya"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
              />
            </div>
            <Input
              id="listing-price"
              label="Price"
              placeholder="e.g. Ksh 1,200/month"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              {/* Property type */}
              <div>
                <label htmlFor="listing-type" className="mb-1.5 block text-sm font-medium text-ink-800">
                  Property type <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <select
                  id="listing-type"
                  value={form.propertyType}
                  onChange={(e) => set('propertyType', e.target.value)}
                  className="w-full rounded-md border border-ink-950/15 bg-paper px-3.5 py-2.5 text-sm text-ink-950 transition-colors focus:border-brand-500 focus:outline-none"
                >
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* Status */}
              <div>
                <label htmlFor="listing-status" className="mb-1.5 block text-sm font-medium text-ink-800">
                  Status
                </label>
                <select
                  id="listing-status"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as ListingFormData['status'])}
                  className="w-full rounded-md border border-ink-950/15 bg-paper px-3.5 py-2.5 text-sm text-ink-950 transition-colors focus:border-brand-500 focus:outline-none"
                >
                  {LISTING_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                id="listing-bedrooms"
                type="number"
                label="Bedrooms"
                min={0}
                value={form.bedrooms}
                onChange={(e) => set('bedrooms', Number(e.target.value))}
              />
              <Input
                id="listing-bathrooms"
                type="number"
                label="Bathrooms"
                min={0}
                value={form.bathrooms}
                onChange={(e) => set('bathrooms', Number(e.target.value))}
              />
              <Input
                id="listing-size"
                label="Size"
                placeholder="e.g. 85 m²"
                value={form.size}
                onChange={(e) => set('size', e.target.value)}
              />
            </div>
          </FormSection>

          {/* ── Description & amenities */}
          <FormSection title="Description & Amenities">
            <div>
              <label htmlFor="listing-description" className="mb-1.5 block text-sm font-medium text-ink-800">
                Description
              </label>
              <textarea
                id="listing-description"
                rows={4}
                placeholder="Describe the property — highlights, views, surroundings…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="w-full resize-y rounded-md border border-ink-950/15 bg-paper px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-300 transition-colors focus:border-brand-500 focus:outline-none"
              />
            </div>
            <AmenityInput amenities={form.amenities} onChange={(a) => set('amenities', a)} />
          </FormSection>

          {/* ── 3D Tour */}
          <FormSection id="section-tour" title="3D Virtual Tour">
            <Input
              id="listing-tour-url"
              type="url"
              label="Tour URL"
              placeholder="https://my.matterport.com/show/?m=…"
              value={form.tourUrl}
              onChange={(e) => set('tourUrl', e.target.value)}
            />
            <p className="text-xs text-ink-400">
              Direct web link to the tour. When visitors click "Visit tour URL" in the card menu, they are sent to this address.
            </p>

            <div className="mt-4">
              <label
                htmlFor="listing-embed-code"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500"
              >
                Embed Code / Iframe
              </label>
              <textarea
                id="listing-embed-code"
                rows={3}
                placeholder='<iframe width="853" height="480" src="https://my.matterport.com/show/?m=..." frameborder="0" allowfullscreen allow="autoplay; fullscreen; web-share; xr-spatial-tracking;"></iframe>'
                value={form.embedCode ?? ''}
                onChange={(e) => set('embedCode', e.target.value)}
                className="w-full resize-y rounded-md border border-ink-950/15 bg-paper px-3.5 py-2.5 font-mono text-xs text-ink-950 placeholder:text-ink-300 transition-colors focus:border-brand-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink-400">
                Paste the full &lt;iframe&gt; embed code or embed link. Published property tiles will display this interactive 3D tour directly.
              </p>
            </div>
          </FormSection>

          {/* ── Contact details */}
          <FormSection id="section-contact" title="Contact Details">
            <Input
              id="listing-contact-name"
              label="Contact name"
              placeholder="e.g. Jane Mwangi"
              value={form.contactName}
              onChange={(e) => set('contactName', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="listing-contact-phone"
                type="tel"
                label="Phone"
                placeholder="e.g. +254 700 000 000"
                value={form.contactPhone}
                onChange={(e) => set('contactPhone', e.target.value)}
              />
              <Input
                id="listing-contact-email"
                type="email"
                label="Email"
                placeholder="e.g. jane@example.com"
                value={form.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
              />
            </div>

            {/* Unique Account Number (internal only, not visible publicly) */}
            <Input
              id="listing-account-number"
              label="Unique Account Number"
              placeholder="e.g. ACC-08492"
              value={form.accountNumber ?? ''}
              onChange={(e) => set('accountNumber', e.target.value)}
            />
            <p className="-mt-2 text-xs text-ink-400">
              Internal client account identifier. Never shown on public tour pages.
            </p>

            {/* Date paid */}
            <Input
              id="listing-date-paid"
              type="date"
              label="Date paid for tour"
              value={form.datePaid}
              onChange={(e) => set('datePaid', e.target.value)}
            />

            {/* Package */}
            <div>
              <p className="mb-2 text-sm font-medium text-ink-800">Package</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { value: 'monthly', label: 'Monthly', period: '30 days' },
                    { value: 'quarterly', label: 'Quarterly', period: '90 days' },
                    { value: 'annually', label: 'Annually', period: '365 days' },
                  ] as const
                ).map((pkg) => (
                  <label
                    key={pkg.value}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                      form.package === pkg.value
                        ? 'border-brand-500 bg-brand-500/5 text-ink-950 font-semibold ring-1 ring-brand-500/30'
                        : 'border-ink-950/12 text-ink-600 hover:border-ink-950/25',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="package"
                        value={pkg.value}
                        checked={form.package === pkg.value}
                        onChange={() => set('package', pkg.value)}
                        className="accent-brand-500"
                      />
                      <span>{pkg.label}</span>
                    </div>
                    <span className="text-xs text-ink-400 font-normal">{pkg.period}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="mb-2 text-sm font-medium text-ink-800">Method of payment</p>
              <div className="flex gap-4">
                {(
                  [
                    { value: 'credit_card', label: 'Credit Card' },
                    { value: 'mpesa', label: 'M-Pesa' },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                      form.paymentMethod === opt.value
                        ? 'border-brand-500 bg-brand-500/5 text-ink-950'
                        : 'border-ink-950/12 text-ink-600 hover:border-ink-950/25',
                    )}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={opt.value}
                      checked={form.paymentMethod === opt.value}
                      onChange={() => set('paymentMethod', opt.value)}
                      className="accent-brand-500"
                    />
                    {opt.label}
                  </label>
                ))}
                {form.paymentMethod && (
                  <button
                    type="button"
                    onClick={() => set('paymentMethod', '')}
                    className="text-xs text-ink-400 hover:text-ink-700 transition-colors self-center"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </FormSection>

          {/* ── Invoice / Receipt (Admin Only) */}
          <FormSection id="section-documents" title="Invoice / Receipt">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    Property Invoices & Receipts
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Upload and manage official invoices or payment receipts for this property (PDF, JPG, PNG up to 10 MB). Stored securely for admin access only.
                  </p>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingDoc}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-semibold text-ink-800 shadow-sm transition-colors hover:bg-ink-50 hover:text-ink-950 disabled:opacity-50"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Upload document
                  </button>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUploadDocument(file)
                }}
              />
              <input
                ref={replaceFileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  const targetDoc = documents.find((d) => d.id === replacingDocId)
                  if (file && targetDoc) void handleReplaceDocument(targetDoc, file)
                }}
              />

              {/* Upload progress indicator */}
              {uploadingDoc && (
                <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
                  <div className="flex items-center justify-between text-xs font-medium text-brand-700">
                    <span>Uploading document…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-500/20">
                    <div
                      className="h-full bg-brand-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Alerts */}
              {docError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  {docError}
                </div>
              )}
              {docSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
                  {docSuccess}
                </div>
              )}

              {!isEditing ? (
                <div className="rounded-xl border border-dashed border-ink-950/15 bg-ink-50/50 p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-500 mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-ink-700">
                    Save listing to attach invoices or receipts
                  </p>
                  <p className="mt-1 text-[11px] text-ink-400">
                    Once saved as a draft or published, you can upload, inspect, replace, and delete document files here.
                  </p>
                </div>
              ) : loadingDocs ? (
                <div className="py-6 text-center">
                  <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : documents.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-ink-950/20 bg-ink-50/30 p-8 text-center transition-colors hover:border-brand-500 hover:bg-brand-500/5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition-colors group-hover:bg-brand-500/10 group-hover:text-brand-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-ink-800 group-hover:text-brand-600">
                    Click to upload invoice or receipt
                  </p>
                  <p className="mt-1 text-[11px] text-ink-400">
                    Supports PDF, JPG, PNG up to 10 MB. Stored privately for admins only.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {documents.map((docItem) => {
                    const isPdf = docItem.fileType.includes('pdf') || docItem.originalFileName.toLowerCase().endsWith('.pdf')
                    return (
                      <div
                        key={docItem.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-ink-950/10 bg-paper p-3.5 shadow-sm transition-all hover:border-ink-950/20"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-xs',
                            isPdf ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-purple-50 text-purple-600 border border-purple-200'
                          )}>
                            {isPdf ? 'PDF' : 'IMG'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-ink-900" title={docItem.originalFileName}>
                              {docItem.originalFileName}
                            </p>
                            <p className="text-[11px] text-ink-400">
                              {formatFileSize(docItem.fileSize)} • {formatDate(docItem.uploadedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <a
                            href={docItem.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-ink-950/12 bg-paper px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-950 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingDocId(docItem.id)
                              replaceFileInputRef.current?.click()
                            }}
                            disabled={uploadingDoc}
                            className="inline-flex items-center gap-1 rounded-md border border-ink-950/12 bg-paper px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-950 transition-colors disabled:opacity-50"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteDocument(docItem)}
                            disabled={uploadingDoc}
                            className="inline-flex items-center rounded-md border border-red-200 bg-red-50/50 p-1 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                            title="Delete document"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </FormSection>

          {/* ── Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-10">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 rounded-full border border-ink-950/15 bg-paper px-5 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-950"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview listing
            </button>
            <div className="flex gap-3">
              <Button
                id="save-draft-btn"
                variant="secondary"
                onClick={() => save(false)}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save as draft'}
              </Button>
              <Button
                id="save-publish-btn"
                onClick={() => save(true)}
                disabled={saving}
              >
                {saving ? 'Saving…' : isEditing ? 'Save & publish' : 'Publish listing'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Right side: constant fixed/sticky tabs bar */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-6 self-start space-y-4">
        {/* Status & Actions Card */}
        <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between border-b border-ink-950/8 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Publishing
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
                form.published
                  ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
                  : 'bg-ink-100 text-ink-600',
              )}
            >
              {form.published ? 'Live' : 'Draft'}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <Button
              id="side-save-publish-btn"
              className="w-full"
              onClick={() => save(true)}
              disabled={saving}
            >
              {saving ? 'Saving…' : isEditing ? 'Save & publish' : 'Publish listing'}
            </Button>

            <Button
              id="side-save-draft-btn"
              variant="secondary"
              className="w-full"
              onClick={() => save(false)}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save as draft'}
            </Button>

            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-ink-950/15 bg-paper px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-950 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview listing
            </button>
          </div>
        </div>

        {/* Quick Navigation Tabs Card */}
        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
            Form Sections
          </p>
          <nav className="flex flex-col space-y-1">
            {FORM_SECTIONS.map((sec) => {
              const isCur = activeSection === sec.id
              const isDone = sec.id === 'section-documents' ? documents.length > 0 : sec.isComplete(form)
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-left transition-colors',
                    isCur
                      ? 'bg-ink-950 text-white shadow-sm'
                      : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-950',
                  )}
                >
                  <span className="truncate">{sec.label}</span>
                  {isDone ? (
                    <span
                      className={cn(
                        'text-[11px] font-bold',
                        isCur ? 'text-emerald-400' : 'text-emerald-600',
                      )}
                    >
                      ✓
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'text-[10px]',
                        isCur ? 'text-white/40' : 'text-ink-300',
                      )}
                    >
                      ○
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>
    </div>
  </div>

      {showPreview && (
        <PreviewPanel form={form} onClose={() => setShowPreview(false)} />
      )}
    </>
  )
}
