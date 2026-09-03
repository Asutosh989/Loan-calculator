import type { DisbursementMilestone } from '../utils/milestones'
import {
  bankDisbursedPercentFromClp,
  milestoneToMonthIndex,
} from '../utils/milestones'
import { formatCurrency } from '../utils/loanCalculations'

interface DisbursementTimelineProps {
  milestones: DisbursementMilestone[]
  sanctionedAmount: number
  projectYearsLeft: number
  stageCompleted: number
  contributionPercent: number
}

export function DisbursementTimeline({
  milestones,
  sanctionedAmount,
  projectYearsLeft,
  stageCompleted,
  contributionPercent,
}: DisbursementTimelineProps) {
  if (milestones.length === 0) {
    return null
  }

  const totalMonths = Math.max(1, projectYearsLeft * 12)
  const upcoming = milestones.filter(
    (milestone, index) =>
      index >= stageCompleted && milestone.year > 0 && milestone.month > 0,
  )
  const sorted = [...upcoming].sort(
    (a, b) =>
      milestoneToMonthIndex(a.year, a.month) -
      milestoneToMonthIndex(b.year, b.month),
  )

  const stageIndexById = new Map(
    milestones.map((milestone, index) => [milestone.id, index + 1]),
  )

  let cumulativeClp = 0
  let previousBankCumulative = 0
  const bankAmountById = new Map<string, number>()
  for (let index = 0; index < milestones.length; index += 1) {
    const milestone = milestones[index]
    cumulativeClp += milestone.percent
    const bankCumulative = bankDisbursedPercentFromClp(
      cumulativeClp,
      contributionPercent,
    )
    const tranchePercent = bankCumulative - previousBankCumulative
    previousBankCumulative = bankCumulative
    if (index >= stageCompleted && tranchePercent > 0) {
      bankAmountById.set(
        milestone.id,
        Math.round((sanctionedAmount * tranchePercent) / 100),
      )
    }
  }

  const completedLabel =
    stageCompleted > 0
      ? milestones[stageCompleted - 1]?.label ?? `Stage ${stageCompleted}`
      : null

  return (
    <section className="disbursement-timeline">
      <h4>Upcoming disbursement timeline</h4>
      <p className="timeline-status">
        {completedLabel ? (
          <>
            Completed: <strong>{completedLabel}</strong> (stage {stageCompleted}{' '}
            of {milestones.length}). Remaining stages fit within{' '}
            <strong>{projectYearsLeft}</strong> year
            {projectYearsLeft === 1 ? '' : 's'} from today.
          </>
        ) : (
          <>
            Remaining stages spread over <strong>{projectYearsLeft}</strong>{' '}
            year{projectYearsLeft === 1 ? '' : 's'} from today.
          </>
        )}
      </p>
      {sorted.length > 0 && (
        <>
          <div className="timeline-track-wrap" aria-hidden="true">
            <div className="timeline-track">
              {sorted.map((milestone) => {
                const monthIndex = milestoneToMonthIndex(
                  milestone.year,
                  milestone.month,
                )
                const left = ((monthIndex - 1) / totalMonths) * 100
                const stageIndex = stageIndexById.get(milestone.id) ?? 0
                const isCurrent = stageIndex === stageCompleted + 1

                return (
                  <span
                    key={milestone.id}
                    className={`timeline-marker timeline-marker--upcoming${isCurrent ? ' timeline-marker--current' : ''}`}
                    style={{ left: `${Math.min(left, 100)}%` }}
                    title={`${milestone.label || 'Milestone'}: Year ${milestone.year}, Month ${milestone.month}`}
                  />
                )
              })}
            </div>
          </div>
          <ul className="timeline-list">
            {sorted.map((milestone) => {
              const amount = bankAmountById.get(milestone.id) ?? 0
              const stageIndex = stageIndexById.get(milestone.id) ?? 0
              const isNext = stageIndex === stageCompleted + 1

              return (
                <li
                  key={milestone.id}
                  className={isNext ? 'timeline-list__item--current' : ''}
                >
                  <strong>
                    Stage {stageIndex}: {milestone.label || 'Milestone'}
                  </strong>
                  <span>
                    Bank release · Year {milestone.year}, Month {milestone.month}{' '}
                    · {formatCurrency(amount)}
                    {isNext && ' · Next'}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
