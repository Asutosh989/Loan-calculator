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
          <th>Principal</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const totalPaid = row.totalEmi + row.totalExtraPayment
          const interestPct =
            totalPaid > 0 ? (row.totalInterest / totalPaid) * 100 : 0

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
              <td>
                {formatCurrency(row.totalInterest)}
                <span className="pct"> ({interestPct.toFixed(0)}%)</span>
              </td>
              <td>{formatCurrency(row.totalPrincipal)}</td>
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
          <th>Principal</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const totalPaid = row.emi + row.extraPayment
          const interestPct =
            totalPaid > 0 ? (row.interest / totalPaid) * 100 : 0

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
              <td>
                {formatCurrency(row.interest)}
                <span className="pct"> ({interestPct.toFixed(0)}%)</span>
              </td>
              <td>{formatCurrency(row.principal)}</td>
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
}

export function AmortizationTable({
  title,
  result,
  viewMode,
  compact = false,
  showDisbursement = false,
}: AmortizationTableProps) {
  if (result.schedule.length === 0) {
    return null
  }

  return (
    <section
      className={`amortization-table${compact ? ' amortization-table--compact' : ''}`}
    >
      <h3>{title}</h3>
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
}

export function ComparisonTables({
  sanctionedTitle,
  alternateTitle,
  sanctionedResult,
  alternateResult,
  showComparison,
  viewMode,
  showDisbursementOnAlternate = false,
}: ComparisonTablesProps) {
  if (showComparison) {
    return (
      <section className="comparison-tables">
        <AmortizationTable
          title={sanctionedTitle}
          result={sanctionedResult}
          viewMode={viewMode}
          compact
        />
        <AmortizationTable
          title={alternateTitle}
          result={alternateResult}
          viewMode={viewMode}
          compact
          showDisbursement={showDisbursementOnAlternate}
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
