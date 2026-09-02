import { PropertyCostForm } from './PropertyCostForm'
import { CurrencyDisplay, CurrencyInput } from './CurrencyInput'
import {
  MilestoneDisbursementForm,
  type DisbursementPlanMode,
} from './MilestoneDisbursementForm'
import type { MilestoneRowState } from '../utils/milestones'
import type { Gender, PropertyCostBreakdown } from '../utils/propertyCost'

interface LoanFormProps {
  agreementValue: string
  gender: Gender
  contributionPercent: string
  propertyCost: PropertyCostBreakdown | null
  sanctionedAmount: string
  disbursedAmount: string
  disbursedPercent: string
  stageBasedDisbursement: boolean
  interestRate: string
  tenureYears: string
  useCustomEmi: boolean
  customEmi: string
  calculatedEmiHint: string | null
  emiIncreasePercent: string
  extraEmisPerYear: string
  stagedDisbursementEnabled: boolean
  disbursementPlanMode: DisbursementPlanMode
  milestones: MilestoneRowState[]
  milestoneTotalPercent: number
  projectYearsLeft: string
  stageCompleted: string
  clpCumulativePercent: number
  bankDisbursedPercent: number
  tranchePercent: string
  fullyDisbursedByYear: string
  onAgreementValueChange: (value: string) => void
  onGenderChange: (gender: Gender) => void
  onContributionPercentChange: (value: string) => void
  onInterestRateChange: (value: string) => void
  onTenureChange: (value: string) => void
  onUseCustomEmiToggle: (checked: boolean) => void
  onCustomEmiChange: (value: string) => void
  onEmiIncreasePercentChange: (value: string) => void
  onExtraEmisPerYearChange: (value: string) => void
  onStagedToggle: (checked: boolean) => void
  onDisbursementPlanModeChange: (mode: DisbursementPlanMode) => void
  onMilestonesChange: (milestones: MilestoneRowState[]) => void
  onProjectYearsLeftChange: (value: string) => void
  onStageCompletedChange: (value: string) => void
  onRedistributeTimeline: () => void
  onTranchePercentChange: (value: string) => void
  onFullyDisbursedByYearChange: (value: string) => void
}

export function LoanForm({
  agreementValue,
  gender,
  contributionPercent,
  propertyCost,
  sanctionedAmount,
  disbursedAmount,
  disbursedPercent,
  stageBasedDisbursement,
  interestRate,
  tenureYears,
  useCustomEmi,
  customEmi,
  calculatedEmiHint,
  emiIncreasePercent,
  extraEmisPerYear,
  stagedDisbursementEnabled,
  disbursementPlanMode,
  milestones,
  milestoneTotalPercent,
  projectYearsLeft,
  stageCompleted,
  clpCumulativePercent,
  bankDisbursedPercent,
  tranchePercent,
  fullyDisbursedByYear,
  onAgreementValueChange,
  onGenderChange,
  onContributionPercentChange,
  onInterestRateChange,
  onTenureChange,
  onUseCustomEmiToggle,
  onCustomEmiChange,
  onEmiIncreasePercentChange,
  onExtraEmisPerYearChange,
  onStagedToggle,
  onDisbursementPlanModeChange,
  onMilestonesChange,
  onProjectYearsLeftChange,
  onStageCompletedChange,
  onRedistributeTimeline,
  onTranchePercentChange,
  onFullyDisbursedByYearChange,
}: LoanFormProps) {
  const loanYears = Number(tenureYears) || 20
  const stageNum = Number(stageCompleted)
  const completedStageLabel =
    stageNum > 0 && stageNum <= milestones.length
      ? milestones[stageNum - 1]?.label
      : null

  return (
    <>
      <PropertyCostForm
        agreementValue={agreementValue}
        gender={gender}
        contributionPercent={contributionPercent}
        propertyCost={propertyCost}
        onAgreementValueChange={onAgreementValueChange}
        onGenderChange={onGenderChange}
        onContributionPercentChange={onContributionPercentChange}
      />

      <section className="loan-form">
        <h2>Loan Details</h2>
        <div className="form-grid">
          <label className="field">
            <span>Bank loan sanctioned (auto)</span>
            <CurrencyDisplay value={sanctionedAmount} />
            <span className="field-hint">
              Derived from property value minus your contribution
            </span>
          </label>

          <label className="field">
            <span>
              Currently disbursed (% of loan)
              {stageBasedDisbursement && stageNum > 0 && (
                <span className="field-label-meta">
                  {' '}
                  · Stage {stageCompleted}
                  {completedStageLabel ? `: ${completedStageLabel}` : ''}
                </span>
              )}
            </span>
            <input
              type="text"
              value={disbursedPercent}
              readOnly={stageBasedDisbursement}
              onChange={() => undefined}
              className={stageBasedDisbursement ? 'input-readonly' : undefined}
            />
            {stageBasedDisbursement && (
              <span className="field-hint field-hint--accent">
                {clpCumulativePercent.toFixed(1)}% construction due minus your{' '}
                {contributionPercent}% contribution
              </span>
            )}
          </label>

          <label className="field">
            <span>Loan amount disbursed today</span>
            <CurrencyDisplay value={disbursedAmount} />
            {stageBasedDisbursement && stageNum > 0 && completedStageLabel ? (
              <span className="field-hint">
                Stage {stageCompleted}: {completedStageLabel}
              </span>
            ) : (
              <span className="field-hint">
                Based on completed construction stage
              </span>
            )}
          </label>

          <label className="field">
            <span>Rate of interest (% per annum)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={interestRate}
              onChange={(event) => onInterestRateChange(event.target.value)}
              placeholder="e.g. 8.5"
            />
          </label>

          <label className="field">
            <span>Loan tenure (years)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={tenureYears}
              onChange={(event) => onTenureChange(event.target.value)}
              placeholder="e.g. 20"
            />
          </label>
        </div>
      </section>

      <section className="loan-form loan-form--adjustments">
        <h2>Custom Adjustments</h2>
        <p className="form-hint">
          Override the calculated EMI or model annual EMI increases and extra
          prepayments at the end of each year.
        </p>
        <div className="form-grid">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={useCustomEmi}
              onChange={(event) => onUseCustomEmiToggle(event.target.checked)}
            />
            <span>Use custom monthly EMI</span>
          </label>

          <label className="field">
            <span>Custom monthly EMI</span>
            <CurrencyInput
              value={customEmi}
              onChange={onCustomEmiChange}
              placeholder={calculatedEmiHint ?? '₹0'}
              disabled={!useCustomEmi}
            />
            {calculatedEmiHint && (
              <span className="field-hint">
                Calculated EMI: {calculatedEmiHint}
              </span>
            )}
          </label>

          <label className="field">
            <span>EMI increase every year (%)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={emiIncreasePercent}
              onChange={(event) =>
                onEmiIncreasePercentChange(event.target.value)
              }
              placeholder="e.g. 5"
            />
          </label>

          <label className="field">
            <span>Extra EMIs paid per year</span>
            <input
              type="number"
              min="0"
              step="1"
              value={extraEmisPerYear}
              onChange={(event) => onExtraEmisPerYearChange(event.target.value)}
              placeholder="e.g. 1"
            />
            <span className="field-hint">
              Lump-sum prepayment at year-end equal to this many EMIs
            </span>
          </label>
        </div>
      </section>

      <section className="loan-form loan-form--staged">
        <h2>Staged Disbursement Plan</h2>
        <p className="form-hint">
          Tower schedule with stage-wise bank releases. Set stage completed to
          auto-calculate current disbursement; adjust years left to spread stages
          evenly until possession.
        </p>
        <div className="form-grid">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={stagedDisbursementEnabled}
              onChange={(event) => onStagedToggle(event.target.checked)}
            />
            <span>Enable staged disbursement schedule</span>
          </label>
        </div>

        <MilestoneDisbursementForm
          enabled={stagedDisbursementEnabled}
          planMode={disbursementPlanMode}
          milestones={milestones}
          totalPercent={milestoneTotalPercent}
          loanYears={loanYears}
          projectYearsLeft={projectYearsLeft}
          stageCompleted={stageCompleted}
          clpCumulativePercent={clpCumulativePercent}
          bankDisbursedPercent={bankDisbursedPercent}
          contributionPercent={contributionPercent}
          onPlanModeChange={onDisbursementPlanModeChange}
          onMilestonesChange={onMilestonesChange}
          onProjectYearsLeftChange={onProjectYearsLeftChange}
          onStageCompletedChange={onStageCompletedChange}
          onRedistributeTimeline={onRedistributeTimeline}
        />

        {disbursementPlanMode === 'simple' && stagedDisbursementEnabled && (
          <div className="form-grid form-grid--nested">
            <label className="field">
              <span>Disbursement per year (% of sanctioned)</span>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={tranchePercent}
                onChange={(event) => onTranchePercentChange(event.target.value)}
                placeholder="e.g. 25"
              />
            </label>

            <label className="field">
              <span>Fully disbursed by year</span>
              <input
                type="number"
                min="1"
                step="1"
                value={fullyDisbursedByYear}
                onChange={(event) =>
                  onFullyDisbursedByYearChange(event.target.value)
                }
                placeholder="e.g. 4"
              />
            </label>
          </div>
        )}
      </section>
    </>
  )
}
