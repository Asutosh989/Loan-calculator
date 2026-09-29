import type {
  MilestonePaymentRow,
  MilestonePaymentTotals,
} from '../utils/milestoneContributions'
import { formatCurrency } from '../utils/loanCalculations'

interface MilestonePaymentBreakupProps {
  rows: MilestonePaymentRow[]
  totals: MilestonePaymentTotals
  stageCompleted: number
}

function timingLabel(row: MilestonePaymentRow): string {
  if (row.year <= 0 || row.month <= 0) {
    return 'Done'
  }
  return `Y${row.year} M${row.month}`
}

export function MilestonePaymentBreakup({
  rows,
  totals,
  stageCompleted,
}: MilestonePaymentBreakupProps) {
  if (rows.length === 0) {
    return null
  }

  return (
    <section className="milestone-payment-breakup">
      <header className="milestone-payment-breakup__header">
        <div>
          <h3>Milestone payment breakup</h3>
          <p className="form-hint">
            Each construction stage (CLP %) releases that same share of your
            total contribution and of the bank loan — e.g. 10% CLP → 10% of your
            contribution and 10% of the sanctioned amount.
          </p>
        </div>
        <dl className="milestone-payment-breakup__totals">
          <div>
            <dt>Your contribution paid</dt>
            <dd>
              {formatCurrency(totals.ownPaidToDate)}
              <span className="milestone-payment-breakup__of">
                {' '}
                of {formatCurrency(totals.ownTotal)}
              </span>
            </dd>
          </div>
          <div>
            <dt>Bank disbursed</dt>
            <dd>
              {formatCurrency(totals.bankDisbursedToDate)}
              <span className="milestone-payment-breakup__of">
                {' '}
                of {formatCurrency(totals.bankTotal)}
              </span>
            </dd>
          </div>
        </dl>
      </header>

      <div className="milestone-payment-breakup__grid">
        <article className="milestone-payment-breakup__panel">
          <h4>Your contribution</h4>
          <div className="table-scroll">
            <table className="milestone-payment-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>CLP %</th>
                  <th>When</th>
                  <th>This stage</th>
                  <th>Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`own-${row.stageNumber}`}
                    className={`milestone-payment-table__row--${row.status}`}
                  >
                    <td>
                      {row.stageNumber}. {row.label || 'Milestone'}
                    </td>
                    <td>{row.clpPercent}%</td>
                    <td>{timingLabel(row)}</td>
                    <td>{formatCurrency(row.ownTranche)}</td>
                    <td>{formatCurrency(row.ownCumulative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="milestone-payment-breakup__panel">
          <h4>Bank loan disbursement</h4>
          <div className="table-scroll">
            <table className="milestone-payment-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>CLP %</th>
                  <th>When</th>
                  <th>This stage</th>
                  <th>Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`bank-${row.stageNumber}`}
                    className={`milestone-payment-table__row--${row.status}`}
                  >
                    <td>
                      {row.stageNumber}. {row.label || 'Milestone'}
                    </td>
                    <td>{row.clpPercent}%</td>
                    <td>{timingLabel(row)}</td>
                    <td>{formatCurrency(row.bankTranche)}</td>
                    <td>{formatCurrency(row.bankCumulative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {stageCompleted > 0 && (
        <p className="milestone-payment-breakup__footnote field-hint">
          Stages 1–{stageCompleted} marked as completed; amounts through stage{' '}
          {stageCompleted} count toward paid / disbursed to date.
        </p>
      )}
    </section>
  )
}
