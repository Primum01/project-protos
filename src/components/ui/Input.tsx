import { forwardRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface FieldWrapperProps {
  label?: string
  error?: string
  className?: string
}

const fieldClasses =
  'w-full rounded-md border border-ink-950/15 bg-paper px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-300 transition-colors focus:border-brand-500 focus:outline-none'

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5 text-left" htmlFor={id}>
      {label && (
        <span className="text-sm font-medium text-ink-800">
          {label}
          {rest.required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
        </span>
      )}
      <input ref={ref} id={id} className={cn(fieldClasses, className)} {...rest} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...rest },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5 text-left" htmlFor={id}>
      {label && (
        <span className="text-sm font-medium text-ink-800">
          {label}
          {rest.required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
        </span>
      )}
      <textarea ref={ref} id={id} className={cn(fieldClasses, 'min-h-28 resize-y', className)} {...rest} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
})

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>, FieldWrapperProps {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, error, className, id, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="flex flex-col gap-1.5 text-left" htmlFor={id}>
      {label && (
        <span className="text-sm font-medium text-ink-800">
          {label}
          {rest.required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
        </span>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          className={cn(fieldClasses, 'pr-10', className)}
          {...rest}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 transition-colors hover:text-ink-700 focus:outline-none"
          tabIndex={-1}
        >
          {visible ? (
            /* Eye-off icon */
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            /* Eye icon */
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
})

