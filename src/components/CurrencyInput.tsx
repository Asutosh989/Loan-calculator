import type { ChangeEvent } from 'react'

interface CurrencyInputProps {
  value: string
  onChange?: (rawValue: string) => void
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
  id?: string
}

function formatDisplayValue(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = Number(digits)
  if (!Number.isFinite(num) || num <= 0) return ''
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num)}`
}

export function CurrencyInput({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  placeholder = '₹0',
  id,
}: CurrencyInputProps) {
  const isEditable = !readOnly && !disabled && onChange !== undefined

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!onChange) return
    onChange(event.target.value.replace(/\D/g, ''))
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className={`currency-input${!isEditable ? ' currency-input--readonly' : ''}`}
      value={formatDisplayValue(value)}
      onChange={handleChange}
      readOnly={!isEditable}
      disabled={disabled}
      placeholder={placeholder}
    />
  )
}

export function CurrencyDisplay({ value }: { value: string }) {
  return (
    <input
      type="text"
      className="currency-input currency-input--readonly"
      value={formatDisplayValue(value)}
      readOnly
      tabIndex={-1}
    />
  )
}
