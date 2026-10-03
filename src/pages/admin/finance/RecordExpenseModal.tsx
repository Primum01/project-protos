import { useState } from 'react'
import { uploadFile } from '@/lib/firebase/storage'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { generateUUID } from '@/lib/uuid'
import type { ExpenseCategory, ExpenseRecord, PaymentMethod } from '@/types/finance'

interface RecordExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveExpense: (expense: ExpenseRecord) => Promise<void>
  currentAdminEmail?: string
}

const EXPENSE_CATEGORIES: Array<{ value: ExpenseCategory; label: string }> = [
  { value: 'Transport', label: 'Transport' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Software', label: 'Software & Services' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Contractor', label: 'Contractor Expenses' },
  { value: 'Hosting/Infrastructure', label: 'Hosting & Infrastructure' },
  { value: 'Office', label: 'Office' },
  { value: 'Communication', label: 'Communication' },
  { value: 'Miscellaneous', label: 'Miscellaneous' },
]

export function RecordExpenseModal({
  isOpen,
  onClose,
  onSaveExpense,
  currentAdminEmail,
}: RecordExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Transport')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount.replace(/,/g, ''))
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive expense amount.')
      return
    }
    if (!description.trim()) {
      setError('Please provide an expense description.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const expenseId = generateUUID()

      let attachmentUrl: string | undefined = undefined
      let attachmentName: string | undefined = undefined

      if (file) {
        attachmentName = file.name
        if (isFirebaseConfigured) {
          const path = `expenses/${expenseId}/${Date.now()}_${file.name}`
          attachmentUrl = await uploadFile(path, file, (p) => setUploadProgress(p))
        }
      }

      const expense: ExpenseRecord = {
        id: expenseId,
        date,
        category,
        description: description.trim(),
        amount: numericAmount,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        attachmentUrl,
        attachmentName,
        recordedBy: currentAdminEmail || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await onSaveExpense(expense)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense.')
    } finally {
      setSaving(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-ink-950/15 bg-paper p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-ink-950/10">
          <div>
            <h3 className="text-base font-semibold text-ink-950">Record Business Expense</h3>
            <p className="text-xs text-ink-500">Track money going out of TwinSpace</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Expense Amount (KSh) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 4500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-sm font-semibold text-ink-950 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="M-Pesa">M-Pesa</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-600 mb-1">
              Description / Payee *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fuel to Westlands shoot, Matterport cloud subscription..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-600 mb-1">
              Receipt / Transaction Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. M-Pesa Code / Receipt #"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-600 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Additional operational details or shoot association..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Secure Document / Receipt Attachment */}
          <div>
            <label className="block text-[11px] font-medium text-ink-600 mb-1">
              Attach Receipt / Invoice Document (Admin-only storage)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-ink-700 file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-2.5 file:py-1 file:text-xs file:font-medium hover:file:bg-ink-200"
            />
            {uploadProgress !== null && (
              <p className="mt-1 text-[10px] text-ink-500">
                Uploading: {Math.round(uploadProgress * 100)}%
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-950/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-ink-600 hover:bg-ink-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-rose-700 disabled:opacity-50"
            >
              {saving ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
