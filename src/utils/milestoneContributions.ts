import type { DisbursementMilestone } from './milestones'

export type MilestonePaymentStatus = 'completed' | 'current' | 'upcoming'

export interface MilestonePaymentRow {
  stageNumber: number
  label: string
  clpPercent: number
  year: number
  month: number
  ownTranche: number
  ownCumulative: number
  bankTranche: number
  bankCumulative: number
  status: MilestonePaymentStatus
}

export interface MilestonePaymentTotals {
  ownPaidToDate: number
  ownTotal: number
  bankDisbursedToDate: number
  bankTotal: number
}

/** Each CLP stage pays that % of total own contribution and that % of sanctioned loan. */
export function buildMilestonePaymentBreakup(
  milestones: DisbursementMilestone[],
  totalIndividualContribution: number,
  sanctionedAmount: number,
  stageCompleted: number,
): { rows: MilestonePaymentRow[]; totals: MilestonePaymentTotals } {
  let ownCumulative = 0
  let bankCumulative = 0
  const rows: MilestonePaymentRow[] = []

  for (let index = 0; index < milestones.length; index += 1) {
    const milestone = milestones[index]

    const ownTranche = Math.round(
      (totalIndividualContribution * milestone.percent) / 100,
    )
    const bankTranche = Math.round((sanctionedAmount * milestone.percent) / 100)

    ownCumulative += ownTranche
    bankCumulative += bankTranche

    const stageNumber = index + 1
    let status: MilestonePaymentStatus = 'upcoming'
    if (stageCompleted > 0 && stageNumber < stageCompleted) {
      status = 'completed'
    } else if (stageNumber === stageCompleted) {
      status = 'current'
    }

    rows.push({
      stageNumber,
      label: milestone.label,
      clpPercent: milestone.percent,
      year: milestone.year,
      month: milestone.month,
      ownTranche,
      ownCumulative,
      bankTranche,
      bankCumulative,
      status,
    })
  }

  const ownPaidToDate =
    stageCompleted > 0
      ? rows
          .filter((row) => row.stageNumber <= stageCompleted)
          .reduce((sum, row) => sum + row.ownTranche, 0)
      : 0

  const bankDisbursedToDate =
    stageCompleted > 0
      ? rows
          .filter((row) => row.stageNumber <= stageCompleted)
          .reduce((sum, row) => sum + row.bankTranche, 0)
      : 0

  const ownTotal = rows.length > 0 ? rows[rows.length - 1].ownCumulative : 0
  const bankTotal = rows.length > 0 ? rows[rows.length - 1].bankCumulative : 0

  return {
    rows,
    totals: {
      ownPaidToDate,
      ownTotal,
      bankDisbursedToDate,
      bankTotal,
    },
  }
}
