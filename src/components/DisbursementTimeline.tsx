import type { DisbursementMilestone } from '../utils/milestones'
import { milestoneToMonthIndex } from '../utils/milestones'
import { formatCurrency } from '../utils/loanCalculations'

interface DisbursementTimelineProps {
  milestones: DisbursementMilestone[]
  sanctionedAmount: number
  projectYearsLeft: number
  stageCompleted: number
}

export function DisbursementTimeline({
  milestones,
  sanctionedAmount,
  projectYearsLeft,
  stageCompleted,
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
            of {milestones.length}). Remaining bank releases ({' '}
            {milestones
              .slice(stageCompleted)
              .reduce((s, m) => s + m.percent, 0)
              .toFixed(0)}
            % of loan) fit within <strong>{projectYearsLeft}</strong> year
            {projectYearsLeft === 1 ? '' : 's'} from today.
          </>
        ) : (
          <>
            Bank releases spread over <strong>{projectYearsLeft}</strong> year
            {projectYearsLeft === 1 ? '' : 's'} from today.
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
              const amount = Math.round(
                (sanctionedAmount * milestone.percent) / 100,
              )
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
                    {milestone.percent}% of loan · Year {milestone.year}, Month{' '}
                    {milestone.month} · {formatCurrency(amount)}
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
