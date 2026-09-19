import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createListing, getListingById, updateListing } from '@/lib/firebase/listings'
import { uploadFile } from '@/lib/firebase/storage'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { extractEmbedSrc } from '@/lib/embed'
import { cn } from '@/lib/cn'
import { Button, Input } from '@/components/ui'
import {
  ACCENT_OPTIONS,
  ACCENT_GRADIENTS,
  DEFAULT_LISTING_FORM,
  LISTING_STATUSES,
  PROPERTY_TYPES,
  type Listing,
  type ListingFormData,
} from '@/types/listing'


/* ──────────────────────────────────────────────────── section wrapper */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-950/8 bg-paper p-6 shadow-soft">
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
                {(form.contactName || form.contactPhone || form.contactEmail) && (
                  <div className="mt-5 border-t border-ink-950/8 pt-4">
                    <p className="text-sm font-semibold text-ink-950">Contact</p>
                    <p className="mt-1 text-sm text-ink-600">{form.contactName}</p>
                    <p className="text-sm text-ink-500">{form.contactPhone}</p>
                    <p className="text-sm text-ink-500">{form.contactEmail}</p>
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

/* ══════════════════════════════════════════════════════ main component */
export function AdminListingForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<ListingFormData>(DEFAULT_LISTING_FORM)
  const [loadingListing, setLoadingListing] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Photo upload state — upload eagerly on file pick, not on save
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0)
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

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
          setForm({ ...DEFAULT_LISTING_FORM, ...rest, embedCode: rest.embedCode ?? '' })
          if (rest.photoUrl) setPhotoPreview(rest.photoUrl)
        }
      })
      .catch(() => setError('Failed to load listing.'))
      .finally(() => setLoadingListing(false))
  }, [id])

  function set<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save(publish: boolean) {
    if (!formRef.current?.reportValidity()) return
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Add .env.local credentials to save listings.')
      return
    }
    if (photoUploading) {
      setError('Please wait for the photo to finish uploading.')
      return
    }
    setSaving(true)
    setError('')
    try {
      // Photo URL is already resolved eagerly; just write Firestore data
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

  /**
   * Called when the user picks a file. Immediately starts the Storage upload
   * and updates form.photoUrl when done. This keeps the save flow fast.
   */
  async function handlePhotoChange(file: File | null) {
    setPhotoError('')
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image is too large. Maximum size is 5 MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPEG, PNG, WebP, etc.).')
      return
    }

    // Show a local preview instantly
    const localUrl = URL.createObjectURL(file)
    setPhotoPreview(localUrl)
    setPhotoUploading(true)
    setPhotoUploadProgress(0)

    try {
      const uploadedUrl = await uploadFile(
        `listings/${crypto.randomUUID()}-${file.name}`,
        file,
        (p) => setPhotoUploadProgress(Math.round(p * 100)),
      )
      // Store the real CDN URL in form state so save() can use it
      set('photoUrl', uploadedUrl)
      setPhotoPreview(uploadedUrl)
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'Upload failed. Check Storage rules and try again.',
      )
      setPhotoPreview('')
      set('photoUrl', '')
    } finally {
      setPhotoUploading(false)
      setPhotoUploadProgress(0)
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
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
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

        <form ref={formRef} onSubmit={(e: FormEvent) => e.preventDefault()} noValidate className="flex flex-col gap-5">
          {/* ── Property details */}
          <FormSection title="Property Details">
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
          <FormSection title="3D Virtual Tour">
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
          <FormSection title="Contact Details">
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

            {/* Date paid */}
            <Input
              id="listing-date-paid"
              type="date"
              label="Date paid for tour"
              value={form.datePaid}
              onChange={(e) => set('datePaid', e.target.value)}
            />

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

          {/* ── Display options */}
          <FormSection title="Display Options">
            {/* ── Photo upload */}
            <div>
              <p className="mb-2 text-sm font-medium text-ink-800">Property photo</p>
              <p className="mb-3 text-xs text-ink-400">Used as the card thumbnail. Max 1 MB · JPEG, PNG, or WebP.</p>

              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => photoInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && photoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  handlePhotoChange(e.dataTransfer.files[0] ?? null)
                }}
                className={cn(
                  'relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors',
                  photoPreview ? 'border-brand-400 p-0' : 'border-ink-200 p-8 hover:border-brand-400',
                )}
              >
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Property preview"
                      className="h-48 w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-ink-950/40 opacity-0 transition-opacity hover:opacity-100">
                      <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-ink-950">
                        Click to change photo
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mb-3 text-ink-300" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p className="text-sm font-medium text-ink-600">Click to upload or drag &amp; drop</p>
                    <p className="mt-1 text-xs text-ink-400">Max 1 MB</p>
                  </>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={photoInputRef}
                id="listing-photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
              />

              {/* Upload progress bar */}
              {photoUploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
                    <span>Uploading…</span>
                    <span>{photoUploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full bg-brand-500 transition-all duration-300"
                      style={{ width: `${photoUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Validation error */}
              {photoError && (
                <p className="mt-2 text-xs text-red-600">{photoError}</p>
              )}

              {/* Remove button */}
              {photoPreview && !photoUploading && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview('')
                    set('photoUrl', '')
                    if (photoInputRef.current) photoInputRef.current.value = ''
                  }}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove photo
                </button>
              )}
            </div>

            {/* ── Accent colour */}
            <div>
              <p className="mb-3 text-sm font-medium text-ink-800">Card accent colour</p>
              <p className="mb-3 text-xs text-ink-400">Used as the gradient background when no photo is uploaded.</p>
              <div className="flex gap-3">
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('accent', opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border-2 p-1 transition-all',
                      form.accent === opt.value
                        ? 'border-brand-500 scale-105'
                        : 'border-transparent hover:border-ink-950/20',
                    )}
                    title={opt.label}
                    aria-label={opt.label}
                  >
                    <span
                      className="h-10 w-10 rounded-md"
                      style={{ background: `linear-gradient(135deg, ${opt.from}, ${opt.to})` }}
                    />
                    <span className="text-xs text-ink-500">{opt.label}</span>
                  </button>
                ))}
              </div>
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
                disabled={saving || photoUploading}
              >
                {saving ? 'Saving…' : photoUploading ? 'Uploading photo…' : 'Save as draft'}
              </Button>
              <Button
                id="save-publish-btn"
                onClick={() => save(true)}
                disabled={saving || photoUploading}
              >
                {saving ? 'Saving…' : photoUploading ? 'Uploading photo…' : isEditing ? 'Save & publish' : 'Publish listing'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {showPreview && (
        <PreviewPanel form={form} onClose={() => setShowPreview(false)} />
      )}
    </>
  )
}
