import type { MilestoneRowState } from '../utils/milestones'
import {
  createEmptyMilestoneRow,
  towerScheduleToRows,
} from '../utils/milestones'

export type DisbursementPlanMode = 'simple' | 'milestone'

interface MilestoneDisbursementFormProps {
  enabled: boolean
  planMode: DisbursementPlanMode
  milestones: MilestoneRowState[]
  totalPercent: number
  loanYears: number
  projectYearsLeft: string
  stageCompleted: string
  clpCumulativePercent: number
  bankDisbursedPercent: number
  contributionPercent: string
  onPlanModeChange: (mode: DisbursementPlanMode) => void
  onMilestonesChange: (milestones: MilestoneRowState[]) => void
  onProjectYearsLeftChange: (value: string) => void
  onStageCompletedChange: (value: string) => void
  onRedistributeTimeline: () => void
}

function updateRow(
  milestones: MilestoneRowState[],
  id: string,
  patch: Partial<MilestoneRowState>,
): MilestoneRowState[] {
  return milestones.map((row) => (row.id === id ? { ...row, ...patch } : row))
}

export function MilestoneDisbursementForm({
  enabled,
  planMode,
  milestones,
  totalPercent,
  projectYearsLeft,
  stageCompleted,
  clpCumulativePercent,
  bankDisbursedPercent,
  contributionPercent,
  onPlanModeChange,
  onMilestonesChange,
  onProjectYearsLeftChange,
  onStageCompletedChange,
  onRedistributeTimeline,
}: MilestoneDisbursementFormProps) {
  const totalClass =
    Math.abs(totalPercent - 100) < 0.1
      ? 'milestone-total milestone-total--ok'
      : 'milestone-total milestone-total--warn'

  const stageNum = Number(stageCompleted)
  const completedLabel =
    stageNum > 0 && stageNum <= milestones.length
      ? milestones[stageNum - 1]?.label
      : null

  return (
    <div className="milestone-form">
      <fieldset className="plan-mode-toggle" disabled={!enabled}>
        <legend>Disbursement plan type</legend>
        <label>
          <input
            type="radio"
            name="disbursement-plan"
            value="simple"
            checked={planMode === 'simple'}
            onChange={() => onPlanModeChange('simple')}
          />
          Simple (equal % per year)
        </label>
        <label>
          <input
            type="radio"
            name="disbursement-plan"
            value="milestone"
            checked={planMode === 'milestone'}
            onChange={() => onPlanModeChange('milestone')}
          />
          Milestone-based (under-construction)
        </label>
      </fieldset>

      {planMode === 'milestone' && enabled && (
        <>
          <div className="form-grid form-grid--nested">
            <label className="field">
              <span>Project completion — years left from today</span>
              <input
                type="number"
                min="1"
                step="1"
                value={projectYearsLeft}
                onChange={(event) =>
                  onProjectYearsLeftChange(event.target.value)
                }
                placeholder="e.g. 4"
              />
              <span className="field-hint">
                Stages are spread evenly across this period
              </span>
            </label>

            <label className="field">
              <span>Stage completed (of {milestones.length})</span>
              <select
                className="field-select"
                value={stageCompleted}
                onChange={(event) => onStageCompletedChange(event.target.value)}
              >
                <option value="0">None — 0% disbursed</option>
                {milestones.map((row, index) => (
                  <option key={row.id} value={String(index + 1)}>
                    Stage {index + 1}: {row.label || `Milestone ${index + 1}`}
                  </option>
                ))}
              </select>
              {completedLabel && (
                <span className="field-hint field-hint--accent">
                  Bank disbursed: {bankDisbursedPercent.toFixed(1)}% of loan (
                  {clpCumulativePercent.toFixed(1)}% construction minus your{' '}
                  {contributionPercent}% contribution)
                </span>
              )}
            </label>
          </div>

          <div className="milestone-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                onMilestonesChange(
                  towerScheduleToRows(
                    Number(projectYearsLeft) || 2,
                    Number(stageCompleted) || 0,
                  ),
                )
              }
            >
              Reset tower schedule
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onRedistributeTimeline}
            >
              Redistribute timeline
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                onMilestonesChange([...milestones, createEmptyMilestoneRow()])
              }
            >
              Add milestone
            </button>
            <span className={totalClass}>Total: {totalPercent.toFixed(1)}%</span>
          </div>

          <div className="table-scroll milestone-table-wrap">
            <table className="milestone-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Milestone</th>
                  <th>Payment %</th>
                  <th>Year</th>
                  <th>Month</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((row, index) => {
                  const stageNumCurrent = Number(stageCompleted)
                  const isCompleted =
                    stageNumCurrent > 0 && index < stageNumCurrent

                  return (
                    <tr
                      key={row.id}
                      className={isCompleted ? 'milestone-row--done' : undefined}
                    >
                      <td>{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={row.label}
                          onChange={(event) =>
                            onMilestonesChange(
                              updateRow(milestones, row.id, {
                                label: event.target.value,
                              }),
                            )
                          }
                          placeholder="Stage name"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0.1"
                          max="100"
                          step="0.1"
                          value={row.percent}
                          onChange={(event) =>
                            onMilestonesChange(
                              updateRow(milestones, row.id, {
                                percent: event.target.value,
                              }),
                            )
                          }
                        />
                      </td>
                      <td>
                        {isCompleted ? (
                          <span className="milestone-done-label">Done</span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            max={Number(projectYearsLeft) || 1}
                            step="1"
                            value={row.year}
                            onChange={(event) =>
                              onMilestonesChange(
                                updateRow(milestones, row.id, {
                                  year: event.target.value,
                                }),
                              )
                            }
                          />
                        )}
                      </td>
                      <td>
                        {isCompleted ? (
                          <span className="milestone-done-label">—</span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            max="12"
                            step="1"
                            value={row.month}
                            onChange={(event) =>
                              onMilestonesChange(
                                updateRow(milestones, row.id, {
                                  month: event.target.value,
                                }),
                              )
                            }
                          />
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon"
                          aria-label="Remove milestone"
                          disabled={milestones.length <= 1}
                          onClick={() =>
                            onMilestonesChange(
                              milestones.filter((item) => item.id !== row.id),
                            )
                          }
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
