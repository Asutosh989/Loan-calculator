export interface DisbursementMilestone {
  id: string
  label: string
  percent: number
  year: number
  month: number
}

export interface MilestoneRowState {
  id: string
  label: string
  percent: string
  year: string
  month: string
}

export interface MilestoneDefinition {
  label: string
  percent: number
}

/** Builder CLP schedule — percentages total 100%. */
export const TOWER_SCHEDULE_DEFINITIONS: MilestoneDefinition[] = [
  { label: 'Booking amount', percent: 10 },
  { label: 'Agreement', percent: 20 },
  { label: 'Completion of 1st podium', percent: 5 },
  { label: 'Completion of 3rd podium', percent: 5 },
  { label: 'Completion of 6th podium', percent: 5 },
  { label: 'Completion of 2nd residence slab', percent: 4 },
  { label: 'Completion of 7th residence slab', percent: 4 },
  { label: 'Completion of 12th residence slab', percent: 4 },
  { label: 'Completion of 18th residence slab', percent: 4 },
  { label: 'Completion of 23rd residence slab', percent: 4 },
  { label: 'Completion of 28th residence slab', percent: 5 },
  {
    label: 'Walls, internal plaster, flooring, doors & windows',
    percent: 5,
  },
  {
    label: 'Staircase, lifts, lobbies up to said apartment',
    percent: 5,
  },
  {
    label: 'External plumbing, plaster, elevation, terrace & waterproofing',
    percent: 5,
  },
  {
    label: 'Lifts, water pumps, electrical, entrance lobbies, etc.',
    percent: 10,
  },
  { label: 'Possession', percent: 5 },
]

export function createMilestoneId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function distributeStagesOverYears(
  definitions: MilestoneDefinition[],
  yearsLeft: number,
  stageCompleted = 0,
): Omit<DisbursementMilestone, 'id'>[] {
  const count = definitions.length
  const totalMonths = Math.max(1, yearsLeft * 12)
  const remainingCount = Math.max(0, count - stageCompleted)

  return definitions.map((definition, index) => {
    if (index < stageCompleted) {
      return {
        label: definition.label,
        percent: definition.percent,
        year: 0,
        month: 0,
      }
    }

    const posInRemaining = index - stageCompleted
    const monthIndex =
      remainingCount <= 1
        ? totalMonths
        : 1 +
          Math.round((posInRemaining / (remainingCount - 1)) * (totalMonths - 1))
    const year = Math.floor((monthIndex - 1) / 12) + 1
    const month = ((monthIndex - 1) % 12) + 1

    return {
      label: definition.label,
      percent: definition.percent,
      year,
      month,
    }
  })
}

export function towerScheduleToRows(
  yearsLeft: number,
  stageCompleted = 0,
): MilestoneRowState[] {
  return distributeStagesOverYears(
    TOWER_SCHEDULE_DEFINITIONS,
    yearsLeft,
    stageCompleted,
  ).map((milestone) => ({
    id: createMilestoneId(),
    label: milestone.label,
    percent: String(milestone.percent),
    year: String(milestone.year),
    month: String(milestone.month),
  }))
}

export function applyTimelineToRows(
  rows: MilestoneRowState[],
  yearsLeft: number,
  stageCompleted = 0,
): MilestoneRowState[] {
  const distributed = distributeStagesOverYears(
    rows.map((row) => ({
      label: row.label,
      percent: Number(row.percent) || 0,
    })),
    yearsLeft,
    stageCompleted,
  )

  return rows.map((row, index) => ({
    ...row,
    year: String(distributed[index]?.year ?? 0),
    month: String(distributed[index]?.month ?? 0),
  }))
}

export function createEmptyMilestoneRow(): MilestoneRowState {
  return {
    id: createMilestoneId(),
    label: '',
    percent: '',
    year: '1',
    month: '1',
  }
}

export function cumulativePercentUpToStage(
  definitions: MilestoneDefinition[],
  stageCompleted: number,
): number {
  if (stageCompleted <= 0) return 0
  const capped = Math.min(stageCompleted, definitions.length)
  return definitions.slice(0, capped).reduce((sum, d) => sum + d.percent, 0)
}

export function cumulativePercentFromRows(
  rows: MilestoneRowState[],
  stageCompleted: number,
): number {
  if (stageCompleted <= 0) return 0
  const capped = Math.min(stageCompleted, rows.length)
  return rows.slice(0, capped).reduce((sum, row) => {
    const pct = Number(row.percent)
    return sum + (Number.isFinite(pct) ? pct : 0)
  }, 0)
}

/** Bank loan share after excluding the buyer's contribution at each CLP stage. */
export function bankDisbursedPercentFromClp(
  clpCumulativePercent: number,
  contributionPercent: number,
): number {
  return Math.max(0, clpCumulativePercent - contributionPercent)
}

export function bankDisbursedAmountFromClp(
  sanctionedAmount: number,
  clpCumulativePercent: number,
  contributionPercent: number,
): number {
  const percent = bankDisbursedPercentFromClp(
    clpCumulativePercent,
    contributionPercent,
  )
  return Math.round((sanctionedAmount * percent) / 100)
}

export function parseMilestoneRows(
  rows: MilestoneRowState[],
  maxDisbursementYear: number,
): { milestones: DisbursementMilestone[]; totalPercent: number } | null {
  const milestones: DisbursementMilestone[] = []
  let totalPercent = 0

  for (const row of rows) {
    const percent = Number(row.percent)
    const year = Number(row.year)
    const month = Number(row.month)

    if (
      !Number.isFinite(percent) ||
      percent <= 0 ||
      percent > 100 ||
      !Number.isInteger(year) ||
      year < 0 ||
      year > maxDisbursementYear ||
      !Number.isInteger(month) ||
      month < 0 ||
      month > 12 ||
      (year === 0 && month !== 0) ||
      (year > 0 && month < 1)
    ) {
      return null
    }

    totalPercent += percent
    milestones.push({
      id: row.id,
      label: row.label.trim(),
      percent,
      year,
      month,
    })
  }

  if (milestones.length === 0) {
    return null
  }

  return { milestones, totalPercent }
}

export function buildDisbursementMap(
  sanctionedAmount: number,
  milestones: DisbursementMilestone[],
  contributionPercent = 0,
  stageCompleted = 0,
): Map<number, number> {
  const map = new Map<number, number>()
  let cumulativeClp = 0
  let previousBankCumulative = 0

  for (let index = 0; index < milestones.length; index += 1) {
    const milestone = milestones[index]
    cumulativeClp += milestone.percent
    const bankCumulative = bankDisbursedPercentFromClp(
      cumulativeClp,
      contributionPercent,
    )
    const tranchePercent = bankCumulative - previousBankCumulative
    previousBankCumulative = bankCumulative

    if (index < stageCompleted || tranchePercent <= 0 || milestone.year <= 0) {
      continue
    }

    const monthIndex = milestoneToMonthIndex(milestone.year, milestone.month)
    const amount = Math.round((sanctionedAmount * tranchePercent) / 100)
    map.set(monthIndex, (map.get(monthIndex) ?? 0) + amount)
  }

  return map
}

export function milestoneToMonthIndex(year: number, month: number): number {
  return (year - 1) * 12 + month
}

export interface MilestoneValidation {
  valid: boolean
  totalPercent: number
  message: string | null
}

export function validateMilestones(
  parsed: { milestones: DisbursementMilestone[]; totalPercent: number } | null,
): MilestoneValidation {
  if (!parsed) {
    return {
      valid: false,
      totalPercent: 0,
      message:
        'Each milestone needs a payment %, year (within project completion window), and month (1–12).',
    }
  }

  const { totalPercent } = parsed
  const rounded = Math.round(totalPercent * 10) / 10

  if (Math.abs(rounded - 100) > 0.1) {
    return {
      valid: false,
      totalPercent: rounded,
      message: `Milestone payments must total 100% (currently ${rounded}%).`,
    }
  }

  return { valid: true, totalPercent: rounded, message: null }
}

export function templateToMilestoneRows(yearsLeft = 4): MilestoneRowState[] {
  return towerScheduleToRows(yearsLeft)
}
