import type { LoanResult } from '../utils/loanCalculations'
import { formatCurrency, formatCurrencyDetailed } from '../utils/loanCalculations'

interface LoanSummaryProps {
  title: string
  subtitle: string
  principal: number
  result: LoanResult | null
  initialDisbursedAmount?: number
  initialDisbursedPercent?: number
  variant?: 'standard' | 'milestone'
}

export function LoanSummary({
  title,
  subtitle,
  principal,
  result,
  initialDisbursedAmount,
  initialDisbursedPercent,
  variant = 'standard',
}: LoanSummaryProps) {
  if (!result) {
    return (
      <article className="summary-card">
        <header>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </header>
        <p className="empty-state">Enter valid loan details to see results.</p>
      </article>
    )
  }

  const totalToPay =
    principal + result.totalInterest + result.totalExtraPayment
  const interestShare =
    totalToPay > 0 ? (result.totalInterest / totalToPay) * 100 : 0
  const principalShare =
    totalToPay > 0 ? (principal / totalToPay) * 100 : 0

  return (
    <article className="summary-card">
      <header>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>

      <dl className="summary-stats">
        <div>
          <dt>Sanctioned loan</dt>
          <dd>{formatCurrency(principal)}</dd>
        </div>
        {variant === 'milestone' &&
          initialDisbursedAmount !== undefined &&
          initialDisbursedPercent !== undefined && (
            <div>
              <dt>Already disbursed</dt>
              <dd>
                {formatCurrency(initialDisbursedAmount)} (
                {initialDisbursedPercent % 1 === 0
                  ? initialDisbursedPercent
                  : initialDisbursedPercent.toFixed(1)}
                %)
              </dd>
            </div>
          )}
        <div>
          <dt>Monthly EMI</dt>
          <dd>{formatCurrencyDetailed(result.monthlyEmi)}</dd>
          {result.monthlyEmi !== result.calculatedEmi && (
            <dd className="summary-note">
              Calculated: {formatCurrencyDetailed(result.calculatedEmi)}
            </dd>
          )}
        </div>
        <div>
          <dt>Total interest</dt>
          <dd>{formatCurrency(result.totalInterest)}</dd>
        </div>
        <div>
          <dt>Total to pay</dt>
          <dd>{formatCurrency(totalToPay)}</dd>
          <dd className="summary-note">
            Loan {formatCurrency(principal)} + interest{' '}
            {formatCurrency(result.totalInterest)}
            {result.totalExtraPayment > 0 &&
              ` + extras ${formatCurrency(result.totalExtraPayment)}`}
          </dd>
        </div>
      </dl>

      <div className="split-bar" aria-hidden="true">
        <span
          className="split-bar__interest"
          style={{ width: `${interestShare}%` }}
        />
        <span
          className="split-bar__principal"
          style={{ width: `${principalShare}%` }}
        />
      </div>
      <p className="split-legend">
        <span>Interest {interestShare.toFixed(1)}%</span>
        <span>Loan {principalShare.toFixed(1)}%</span>
      </p>
    </article>
  )
}
