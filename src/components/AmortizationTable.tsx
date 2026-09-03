import type {
  LoanResult,
  MonthlyPayment,
  YearlyBreakdown,
} from '../utils/loanCalculations'
import { formatCurrency } from '../utils/loanCalculations'

export type BreakupViewMode = 'yearly' | 'monthly'

interface BreakupViewToggleProps {
  viewMode: BreakupViewMode
  onChange: (mode: BreakupViewMode) => void
}

export function BreakupViewToggle({
  viewMode,
  onChange,
}: BreakupViewToggleProps) {
  return (
    <fieldset className="breakup-toggle">
      <legend>Breakup view</legend>
      <label>
        <input
          type="radio"
          name="breakup-view"
          value="yearly"
          checked={viewMode === 'yearly'}
          onChange={() => onChange('yearly')}
        />
        Yearly
      </label>
      <label>
        <input
          type="radio"
          name="breakup-view"
          value="monthly"
          checked={viewMode === 'monthly'}
          onChange={() => onChange('monthly')}
        />
        Monthly
      </label>
    </fieldset>
  )
}

interface YearlyTableProps {
  rows: YearlyBreakdown[]
  showDisbursement?: boolean
  compact?: boolean
}

function formatSplitPercent(value: number, totalPaid: number): string {
  if (totalPaid <= 0) return '—'
  return `${((value / totalPaid) * 100).toFixed(0)}%`
}

function YearlyTable({ rows, showDisbursement = false }: YearlyTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Year</th>
          {showDisbursement && <th>Disbursed</th>}
          {showDisbursement && <th>Cumulative</th>}
          <th>EMI paid</th>
          <th>Extra</th>
          <th>Interest</th>
          <th>Int %</th>
          <th>Principal</th>
          <th>Prin %</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const totalPaid = row.totalEmi + row.totalExtraPayment

          return (
            <tr key={row.year}>
              <td>Year {row.year}</td>
              {showDisbursement && (
                <td>{formatCurrency(row.disbursedInYear ?? 0)}</td>
              )}
              {showDisbursement && (
                <td>{formatCurrency(row.cumulativeDisbursed ?? 0)}</td>
              )}
              <td>{formatCurrency(row.totalEmi)}</td>
              <td>{formatCurrency(row.totalExtraPayment)}</td>
              <td>{formatCurrency(row.totalInterest)}</td>
              <td className="pct-cell">
                {formatSplitPercent(row.totalInterest, totalPaid)}
              </td>
              <td>{formatCurrency(row.totalPrincipal)}</td>
              <td className="pct-cell">
                {formatSplitPercent(row.totalPrincipal, totalPaid)}
              </td>
              <td>{formatCurrency(row.closingBalance)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

interface MonthlyTableProps {
  rows: MonthlyPayment[]
  showDisbursement?: boolean
  compact?: boolean
}

function MonthlyTable({
  rows,
  showDisbursement = false,
  compact = false,
}: MonthlyTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Month</th>
          {showDisbursement && <th>Disbursed</th>}
          <th>EMI</th>
          <th>Extra</th>
          <th>Interest</th>
          <th>Int %</th>
          <th>Principal</th>
          <th>Prin %</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const totalPaid = row.emi + row.extraPayment

          return (
            <tr key={row.month}>
              <td>
                M{row.month}
                {!compact && <span className="pct"> (Y{row.year})</span>}
              </td>
              {showDisbursement && (
                <td>{formatCurrency(row.disbursement ?? 0)}</td>
              )}
              <td>{formatCurrency(row.emi)}</td>
              <td>{formatCurrency(row.extraPayment)}</td>
              <td>{formatCurrency(row.interest)}</td>
              <td className="pct-cell">
                {formatSplitPercent(row.interest, totalPaid)}
              </td>
              <td>{formatCurrency(row.principal)}</td>
              <td className="pct-cell">
                {formatSplitPercent(row.principal, totalPaid)}
              </td>
              <td>{formatCurrency(row.balance)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

interface AmortizationTableProps {
  title: string
  result: LoanResult
  viewMode: BreakupViewMode
  compact?: boolean
  showDisbursement?: boolean
  initialDisbursedAmount?: number
  initialDisbursedPercent?: number
}

export function AmortizationTable({
  title,
  result,
  viewMode,
  compact = false,
  showDisbursement = false,
  initialDisbursedAmount,
  initialDisbursedPercent,
}: AmortizationTableProps) {
  if (result.schedule.length === 0) {
    return null
  }

  const showDisbursedBanner =
    showDisbursement &&
    initialDisbursedAmount !== undefined &&
    initialDisbursedPercent !== undefined

  return (
    <section
      className={`amortization-table${compact ? ' amortization-table--compact' : ''}`}
    >
      <h3>{title}</h3>
      {showDisbursedBanner && (
        <p className="amortization-table__disbursed-note">
          Already disbursed today:{' '}
          <strong>{formatCurrency(initialDisbursedAmount)}</strong> (
          {initialDisbursedPercent % 1 === 0
            ? initialDisbursedPercent
            : initialDisbursedPercent.toFixed(1)}
          % of sanctioned loan). Remaining tranches appear in the Disbursed /
          Cumulative columns below.
        </p>
      )}
      <div className="table-scroll">
        {viewMode === 'yearly' ? (
          <YearlyTable
            rows={result.yearlyBreakdown}
            showDisbursement={showDisbursement}
          />
        ) : (
          <MonthlyTable
            rows={result.schedule}
            showDisbursement={showDisbursement}
            compact={compact}
          />
        )}
      </div>
    </section>
  )
}

interface ComparisonTablesProps {
  sanctionedTitle: string
  alternateTitle: string
  sanctionedResult: LoanResult
  alternateResult: LoanResult
  showComparison: boolean
  viewMode: BreakupViewMode
  showDisbursementOnAlternate?: boolean
  initialDisbursedAmount?: number
  initialDisbursedPercent?: number
}

export function ComparisonTables({
  sanctionedTitle,
  alternateTitle,
  sanctionedResult,
  alternateResult,
  showComparison,
  viewMode,
  showDisbursementOnAlternate = false,
  initialDisbursedAmount,
  initialDisbursedPercent,
}: ComparisonTablesProps) {
  if (showComparison) {
    return (
      <section className="comparison-tables comparison-tables--stacked">
        <AmortizationTable
          title={sanctionedTitle}
          result={sanctionedResult}
          viewMode={viewMode}
        />
        <AmortizationTable
          title={alternateTitle}
          result={alternateResult}
          viewMode={viewMode}
          showDisbursement={showDisbursementOnAlternate}
          initialDisbursedAmount={initialDisbursedAmount}
          initialDisbursedPercent={initialDisbursedPercent}
        />
      </section>
    )
  }

  return (
    <AmortizationTable
      title={sanctionedTitle}
      result={sanctionedResult}
      viewMode={viewMode}
    />
  )
}
