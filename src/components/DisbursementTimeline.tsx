import type { DisbursementMilestone } from '../utils/milestones'
import { milestoneToMonthIndex } from '../utils/milestones'
import { formatCurrency } from '../utils/loanCalculations'

interface DisbursementTimelineProps {
  milestones: DisbursementMilestone[]
  sanctionedAmount: number
  loanYears: number
  stageCompleted: number
}

export function DisbursementTimeline({
  milestones,
  sanctionedAmount,
  loanYears,
  stageCompleted,
}: DisbursementTimelineProps) {
  if (milestones.length === 0) {
    return null
  }

  const totalMonths = loanYears * 12
  const sorted = [...milestones].sort(
    (a, b) =>
      milestoneToMonthIndex(a.year, a.month) -
      milestoneToMonthIndex(b.year, b.month),
  )

  const stageIndexById = new Map(
    milestones.map((milestone, index) => [milestone.id, index + 1]),
  )

  const lastCompleted =
    stageCompleted > 0 ? milestones[stageCompleted - 1] : null
  const progressWidth = lastCompleted
    ? ((milestoneToMonthIndex(lastCompleted.year, lastCompleted.month) - 1) /
        totalMonths) *
      100
    : 0

  const completedLabel =
    stageCompleted > 0
      ? milestones[stageCompleted - 1]?.label ?? `Stage ${stageCompleted}`
      : null

  return (
    <section className="disbursement-timeline">
      <h4>Disbursement timeline</h4>
      {completedLabel && (
        <p className="timeline-status">
          Completion selected: <strong>{completedLabel}</strong> (stage{' '}
          {stageCompleted} of {milestones.length})
        </p>
      )}
      <div className="timeline-track-wrap" aria-hidden="true">
        <div className="timeline-track">
          <span
            className="timeline-progress"
            style={{ width: `${Math.min(progressWidth, 100)}%` }}
          />
          {sorted.map((milestone) => {
            const monthIndex = milestoneToMonthIndex(
              milestone.year,
              milestone.month,
            )
            const left = ((monthIndex - 1) / totalMonths) * 100
            const stageIndex = stageIndexById.get(milestone.id) ?? 0
            const isCompleted =
              stageIndex > 0 && stageIndex <= stageCompleted
            const isCurrent = stageIndex === stageCompleted

            return (
              <span
                key={milestone.id}
                className={`timeline-marker${isCompleted ? ' timeline-marker--completed' : ''}${isCurrent ? ' timeline-marker--current' : ''}`}
                style={{ left: `${left}%` }}
                title={`${milestone.label || 'Milestone'}: ${milestone.percent}%${isCompleted ? ' (completed)' : ''}`}
              />
            )
          })}
        </div>
      </div>
      <ul className="timeline-list">
        {sorted.map((milestone) => {
          const amount = Math.round((sanctionedAmount * milestone.percent) / 100)
          const stageIndex = stageIndexById.get(milestone.id) ?? 0
          const isCompleted =
            stageIndex > 0 && stageIndex <= stageCompleted
          const isCurrent = stageIndex === stageCompleted

          return (
            <li
              key={milestone.id}
              className={`${isCompleted ? 'timeline-list__item--completed' : ''}${isCurrent ? ' timeline-list__item--current' : ''}`}
            >
              <strong>{milestone.label || 'Milestone'}</strong>
              <span>
                {milestone.percent}% · Year {milestone.year}, Month{' '}
                {milestone.month} · {formatCurrency(amount)}
                {isCurrent && ' · Current stage'}
                {isCompleted && !isCurrent && ' · Done'}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
