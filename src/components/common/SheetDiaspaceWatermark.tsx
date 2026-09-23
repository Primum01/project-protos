interface SheetDiaspaceWatermarkProps {
  className?: string
}

/**
 * Minimized 'A PRODUCT OF' + DiaSpace logo watermark for white exportable sheets
 * (Analytics reports, invoices, and receipts).
 */
export function SheetDiaspaceWatermark({ className = '' }: SheetDiaspaceWatermarkProps) {
  return (
    <div
      className={`pt-4 print:pt-3 border-t border-ink-950/10 flex flex-col items-center justify-center gap-1 text-center select-none ${className}`}
    >
      <span className="text-[8px] sm:text-[9px] print:text-[8px] font-semibold uppercase tracking-[0.25em] text-ink-400">
        A PRODUCT OF
      </span>
      <img
        src="/diaspace-dark-logo.png"
        alt="DiaSpace — Building Possibilities, Bridging Distances"
        className="h-6 sm:h-7 print:h-5.5 w-auto object-contain opacity-85"
      />
    </div>
  )
}
