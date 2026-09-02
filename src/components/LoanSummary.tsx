import type { LoanResult } from '../utils/loanCalculations'
import { formatCurrency, formatCurrencyDetailed } from '../utils/loanCalculations'

interface LoanSummaryProps {
  title: string
  subtitle: string
  principal: number
  result: LoanResult | null
}

export function LoanSummary({
  title,
  subtitle,
  principal,
  result,
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

  const interestShare =
    result.totalPayment > 0
      ? (result.totalInterest / result.totalPayment) * 100
      : 0
  const principalShare = 100 - interestShare

  return (
    <article className="summary-card">
      <header>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>

      <dl className="summary-stats">
        <div>
          <dt>Principal</dt>
          <dd>{formatCurrency(principal)}</dd>
        </div>
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
          <dt>Total payment</dt>
          <dd>{formatCurrency(result.totalPayment)}</dd>
          {result.totalExtraPayment > 0 && (
            <dd className="summary-note">
              Includes {formatCurrency(result.totalExtraPayment)} in extra EMIs
            </dd>
          )}
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
        <span>Principal {principalShare.toFixed(1)}%</span>
      </p>
    </article>
  )
}
