import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAdminFinance, useAdminListings } from '@/contexts/AdminDataContext'
import { useAuth } from '@/hooks/useAuth'
import { usePageMeta } from '@/hooks/usePageMeta'
import { SkeletonDashboard } from '@/components/skeleton'
import { FinanceOverview } from './FinanceOverview'
import { FinanceTransactions } from './FinanceTransactions'
import { FinanceInvoicesReceipts } from './FinanceInvoicesReceipts'
import { FinancePayments } from './FinancePayments'
import { FinanceHosting } from './FinanceHosting'
import { FinanceExpenses } from './FinanceExpenses'
import { FinanceReports } from './FinanceReports'
import { RecordPaymentModal } from './RecordPaymentModal'
import { RecordExpenseModal } from './RecordExpenseModal'

export type FinanceTab =
  | 'overview'
  | 'transactions'
  | 'invoices'
  | 'payments'
  | 'hosting'
  | 'expenses'
  | 'reports'

const FINANCE_TABS: Array<{ id: FinanceTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'invoices', label: 'Invoices & Receipts' },
  { id: 'payments', label: 'Payments' },
  { id: 'hosting', label: 'Hosting' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'reports', label: 'Reports' },
]

export function AdminFinance() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as FinanceTab) || 'overview'

  const navigate = useNavigate()
  const { user } = useAuth()

  usePageMeta({
    title: 'Finance Hub — TwinSpace Admin',
    description: 'Centralized financial management, cash flow, invoices, payments, and hosting revenue.',
    path: '/admin/finance',
    noIndex: true,
  })

  const { listings, loading: listingsLoading } = useAdminListings()
  const {
    invoices,
    invoicesLoading,
    receipts,
    receiptsLoading,
    expenses,
    expensesLoading,
    payments,
    paymentsLoading,
    savePayment,
    deletePayment,
    saveExpense,
    deleteExpense,
    deleteInvoice,
    deleteReceipt,
  } = useAdminFinance()

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '3m' | '6m' | '12m' | 'all'>('30d')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)

  const loading =
    listingsLoading || invoicesLoading || receiptsLoading || expensesLoading || paymentsLoading

  const handleTabChange = (tab: FinanceTab) => {
    setSearchParams({ tab })
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Finance Hub</h1>
          <p className="mt-1 text-sm text-ink-500">
            Track money in, business expenses, tour hosting subscriptions, and client financial health.
          </p>
        </div>

        {/* Global Finance Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-emerald-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Record Payment
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-950/12 bg-paper px-3.5 py-2 text-xs font-semibold text-ink-800 shadow-soft transition-all hover:bg-ink-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Record Expense
          </button>

          <button
            onClick={() => navigate('/admin/invoice')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-brand-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            New Invoice
          </button>
        </div>
      </div>

      {/* Main Finance Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-ink-950/10 pb-px">
        {FINANCE_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                isActive
                  ? 'border-brand-600 text-brand-600 font-bold'
                  : 'border-transparent text-ink-500 hover:border-ink-200 hover:text-ink-800'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content Body */}
      {loading ? (
        <SkeletonDashboard />
      ) : (
        <>
          {activeTab === 'overview' && (
            <FinanceOverview
              invoices={invoices}
              receipts={receipts}
              expenses={expenses}
              payments={payments}
              listings={listings}
              dateRange={dateRange}
              setDateRange={setDateRange}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
              onNavigateTab={(tab) => handleTabChange(tab as FinanceTab)}
            />
          )}

          {activeTab === 'transactions' && (
            <FinanceTransactions
              invoices={invoices}
              receipts={receipts}
              expenses={expenses}
              payments={payments}
              listings={listings}
            />
          )}

          {activeTab === 'invoices' && (
            <FinanceInvoicesReceipts
              invoices={invoices}
              receipts={receipts}
              payments={payments}
              listings={listings}
              onDeleteInvoice={deleteInvoice}
              onDeleteReceipt={deleteReceipt}
            />
          )}

          {activeTab === 'payments' && (
            <FinancePayments
              payments={payments}
              invoices={invoices}
              listings={listings}
              onSavePayment={savePayment}
              onDeletePayment={deletePayment}
              currentAdminEmail={user?.email || 'Admin'}
            />
          )}

          {activeTab === 'hosting' && (
            <FinanceHosting
              listings={listings}
              invoices={invoices}
              receipts={receipts}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            />
          )}

          {activeTab === 'expenses' && (
            <FinanceExpenses
              expenses={expenses}
              onSaveExpense={saveExpense}
              onDeleteExpense={deleteExpense}
              currentAdminEmail={user?.email || 'Admin'}
            />
          )}

          {activeTab === 'reports' && (
            <FinanceReports
              invoices={invoices}
              receipts={receipts}
              expenses={expenses}
              payments={payments}
              listings={listings}
            />
          )}
        </>
      )}

      {/* Shared Modals */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSavePayment={savePayment}
        invoices={invoices}
        listings={listings}
        currentAdminEmail={user?.email || 'Admin'}
      />

      <RecordExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSaveExpense={saveExpense}
        currentAdminEmail={user?.email || 'Admin'}
      />
    </div>
  )
}
