/** Format number using Indian grouping (e.g. 1,28,86,696). */
export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format with rupee symbol for display in inputs and read-only fields. */
export function formatIndianRupee(value: number | string): string {
  const digits = parseRupeeInput(String(value))
  if (!digits) return ''
  const num = Number(digits)
  if (!Number.isFinite(num) || num <= 0) return ''
  return `₹${formatIndianNumber(num)}`
}

/** Strip to digits only from a formatted rupee string. */
export function parseRupeeInput(value: string): string {
  return value.replace(/\D/g, '')
}

export function parseRupeeAmount(value: string): number | null {
  const digits = parseRupeeInput(value)
  if (!digits) return null
  const parsed = Number(digits)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}
