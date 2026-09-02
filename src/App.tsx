import { useMemo, useState } from 'react'
import {
  BreakupViewToggle,
  ComparisonTables,
  type BreakupViewMode,
} from './components/AmortizationTable'
import { DisbursementTimeline } from './components/DisbursementTimeline'
import type { DisbursementPlanMode } from './components/MilestoneDisbursementForm'
import { LoanForm } from './components/LoanForm'
import { LoanSummary } from './components/LoanSummary'
import {
  buildAmortizationSchedule,
  buildMilestoneDisbursementSchedule,
  buildStagedDisbursementSchedule,
  calculateEmi,
  formatCurrencyDetailed,
  type ScheduleAdjustments,
} from './utils/loanCalculations'
import {
  applyTimelineToRows,
  bankDisbursedPercentFromClp,
  buildDisbursementMap,
  cumulativePercentFromRows,
  parseMilestoneRows,
  towerScheduleToRows,
  validateMilestones,
  type MilestoneRowState,
} from './utils/milestones'
import {
  calculatePropertyCost,
  DEFAULT_AGREEMENT_VALUE,
  type Gender,
} from './utils/propertyCost'
import { parseRupeeAmount } from './utils/indianCurrency'
import './App.css'

function parseAmount(value: string): number | null {
  return parseRupeeAmount(value)
}

function parsePercent(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null
  return parsed
}

function parseNonNegativeNumber(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

function parseNonNegativeInt(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return null
  }
  return parsed
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

function App() {
  const [agreementValue, setAgreementValue] = useState(() =>
    String(DEFAULT_AGREEMENT_VALUE),
  )
  const [gender, setGender] = useState<Gender>('female')
  const [contributionPercent, setContributionPercent] = useState('10')
  const [interestRate, setInterestRate] = useState('7.2')
  const [tenureYears, setTenureYears] = useState('20')
  const [stagedDisbursementEnabled, setStagedDisbursementEnabled] =
    useState(true)
  const [disbursementPlanMode, setDisbursementPlanMode] =
    useState<DisbursementPlanMode>('milestone')
  const [projectYearsLeft, setProjectYearsLeft] = useState('2')
  const [stageCompleted, setStageCompleted] = useState('7')
  const [milestones, setMilestones] = useState<MilestoneRowState[]>(() =>
    towerScheduleToRows(4),
  )
  const [tranchePercent, setTranchePercent] = useState('25')
  const [fullyDisbursedByYear, setFullyDisbursedByYear] = useState('2')
  const [useCustomEmi, setUseCustomEmi] = useState(false)
  const [customEmi, setCustomEmi] = useState('')
  const [emiIncreasePercent, setEmiIncreasePercent] = useState('0')
  const [extraEmisPerYear, setExtraEmisPerYear] = useState('0')
  const [breakupViewMode, setBreakupViewMode] =
    useState<BreakupViewMode>('yearly')

  const rate = Number(interestRate)
  const years = Number(tenureYears)
  const agreement = parseAmount(agreementValue)
  const contribution = parsePercent(contributionPercent)
  const customEmiParsed = parseAmount(customEmi)
  const customEmiValue =
    useCustomEmi && customEmiParsed !== null ? customEmiParsed : undefined
  const tranche = parsePercent(tranchePercent)
  const disbursementYears = parsePositiveInt(fullyDisbursedByYear)
  const emiIncrease = parseNonNegativeNumber(emiIncreasePercent)
  const extraEmis = parseNonNegativeInt(extraEmisPerYear)
  const stageCompletedNum = parseNonNegativeInt(stageCompleted) ?? 0

  const propertyCost = useMemo(() => {
    if (agreement === null || contribution === null) return null
    return calculatePropertyCost(agreement, contribution, gender)
  }, [agreement, contribution, gender])

  const sanctioned = propertyCost?.bankLoanAmount ?? null

  const stageBasedDisbursement =
    stagedDisbursementEnabled && disbursementPlanMode === 'milestone'

  const clpCumulativePercent = useMemo(
    () => cumulativePercentFromRows(milestones, stageCompletedNum),
    [milestones, stageCompletedNum],
  )

  const bankDisbursedPercent = useMemo(
    () =>
      contribution !== null
        ? bankDisbursedPercentFromClp(clpCumulativePercent, contribution)
        : clpCumulativePercent,
    [clpCumulativePercent, contribution],
  )

  const disbursed =
    sanctioned !== null
      ? Math.round((sanctioned * bankDisbursedPercent) / 100)
      : null

  const disbursedPercentStr =
    bankDisbursedPercent % 1 === 0
      ? String(bankDisbursedPercent)
      : bankDisbursedPercent.toFixed(1)

  const sanctionedAmountStr =
    sanctioned !== null ? String(sanctioned) : ''
  const disbursedAmountStr = disbursed !== null ? String(disbursed) : ''

  const parsedMilestones = useMemo(() => {
    if (!Number.isInteger(years) || years <= 0) return null
    return parseMilestoneRows(milestones, years)
  }, [milestones, years])

  const milestoneValidation = useMemo(
    () => validateMilestones(parsedMilestones),
    [parsedMilestones],
  )

  const milestoneTotalPercent = parsedMilestones?.totalPercent ?? 0

  const adjustmentsValid = emiIncrease !== null && extraEmis !== null

  const adjustments: ScheduleAdjustments | undefined = useMemo(() => {
    if (!adjustmentsValid || emiIncrease === null || extraEmis === null) {
      return undefined
    }
    return {
      emiIncreasePercentPerYear: emiIncrease,
      extraEmisPerYear: extraEmis,
    }
  }, [adjustmentsValid, emiIncrease, extraEmis])

  const inputsValid =
    sanctioned !== null &&
    sanctioned > 0 &&
    disbursed !== null &&
    disbursed <= sanctioned &&
    Number.isFinite(rate) &&
    rate >= 0 &&
    Number.isInteger(years) &&
    years > 0 &&
    (!useCustomEmi || customEmiParsed !== null) &&
    adjustmentsValid &&
    agreement !== null &&
    contribution !== null

  const calculatedEmiHint =
    sanctioned !== null &&
    Number.isFinite(rate) &&
    Number.isInteger(years) &&
    years > 0
      ? formatCurrencyDetailed(calculateEmi(sanctioned, rate, years))
      : null

  const simpleStagedValid =
    stagedDisbursementEnabled &&
    disbursementPlanMode === 'simple' &&
    inputsValid &&
    tranche !== null &&
    tranche > 0 &&
    disbursementYears !== null &&
    disbursementYears <= years

  const milestoneStagedValid =
    stagedDisbursementEnabled &&
    disbursementPlanMode === 'milestone' &&
    inputsValid &&
    milestoneValidation.valid &&
    parsedMilestones !== null

  const stagedInputsValid = simpleStagedValid || milestoneStagedValid

  const sanctionedResult = useMemo(() => {
    if (!inputsValid || sanctioned === null) return null
    return buildAmortizationSchedule({
      principal: sanctioned,
      annualRate: rate,
      years,
      customEmi: customEmiValue,
      adjustments,
    })
  }, [inputsValid, sanctioned, rate, years, customEmiValue, adjustments])

  const stagedResult = useMemo(() => {
    if (!stagedInputsValid || sanctioned === null) return null

    if (milestoneStagedValid && parsedMilestones !== null) {
      const disbursementByMonth = buildDisbursementMap(
        sanctioned,
        parsedMilestones.milestones,
        contribution ?? 0,
      )
      return buildMilestoneDisbursementSchedule({
        sanctionedAmount: sanctioned,
        disbursementByMonth,
        annualRate: rate,
        years,
        customEmi: customEmiValue,
        adjustments,
      })
    }

    if (simpleStagedValid && tranche !== null && disbursementYears !== null) {
      return buildStagedDisbursementSchedule({
        sanctionedAmount: sanctioned,
        tranchePercent: tranche,
        fullyDisbursedByYear: disbursementYears,
        annualRate: rate,
        years,
        customEmi: customEmiValue,
        adjustments,
      })
    }

    return null
  }, [
    stagedInputsValid,
    milestoneStagedValid,
    simpleStagedValid,
    sanctioned,
    parsedMilestones,
    tranche,
    disbursementYears,
    rate,
    years,
    customEmiValue,
    adjustments,
  ])

  const showBreakupComparison =
    stagedDisbursementEnabled &&
    sanctionedResult !== null &&
    stagedResult !== null

  function handleProjectYearsLeftChange(value: string) {
    setProjectYearsLeft(value)
    const yearsLeft = parsePositiveInt(value)
    if (yearsLeft !== null) {
      setMilestones((current) => applyTimelineToRows(current, yearsLeft))
    }
  }

  function handleRedistributeTimeline() {
    const yearsLeft = parsePositiveInt(projectYearsLeft) ?? 4
    setMilestones((current) => applyTimelineToRows(current, yearsLeft))
  }

  const stagedSubtitle =
    disbursementPlanMode === 'milestone'
      ? `Full tower CLP over ${projectYearsLeft} years until possession`
      : tranche !== null && disbursementYears !== null
        ? `${tranche}% per year until year ${disbursementYears}`
        : 'Staged tranche disbursement'

  const alternateBreakupTitle =
    disbursementPlanMode === 'milestone'
      ? 'Tower milestone plan — EMI breakup'
      : 'Staged disbursement — EMI breakup'

  return (
    <div className="app">
      <header className="app-header">
        <h1>Loan &amp; EMI Calculator</h1>
        <p>
          Under-construction home loan planner with property cost, contribution
          split, and tower stage-wise bank disbursement.
        </p>
      </header>

      <LoanForm
        agreementValue={agreementValue}
        gender={gender}
        contributionPercent={contributionPercent}
        propertyCost={propertyCost}
        sanctionedAmount={sanctionedAmountStr}
        disbursedAmount={disbursedAmountStr}
        disbursedPercent={disbursedPercentStr}
        stageBasedDisbursement={stageBasedDisbursement}
        interestRate={interestRate}
        tenureYears={tenureYears}
        useCustomEmi={useCustomEmi}
        customEmi={customEmi}
        calculatedEmiHint={calculatedEmiHint}
        emiIncreasePercent={emiIncreasePercent}
        extraEmisPerYear={extraEmisPerYear}
        stagedDisbursementEnabled={stagedDisbursementEnabled}
        disbursementPlanMode={disbursementPlanMode}
        milestones={milestones}
        milestoneTotalPercent={milestoneTotalPercent}
        projectYearsLeft={projectYearsLeft}
        stageCompleted={stageCompleted}
        clpCumulativePercent={clpCumulativePercent}
        bankDisbursedPercent={bankDisbursedPercent}
        tranchePercent={tranchePercent}
        fullyDisbursedByYear={fullyDisbursedByYear}
        onAgreementValueChange={setAgreementValue}
        onGenderChange={setGender}
        onContributionPercentChange={setContributionPercent}
        onInterestRateChange={setInterestRate}
        onTenureChange={setTenureYears}
        onUseCustomEmiToggle={setUseCustomEmi}
        onCustomEmiChange={setCustomEmi}
        onEmiIncreasePercentChange={setEmiIncreasePercent}
        onExtraEmisPerYearChange={setExtraEmisPerYear}
        onStagedToggle={setStagedDisbursementEnabled}
        onDisbursementPlanModeChange={setDisbursementPlanMode}
        onMilestonesChange={setMilestones}
        onProjectYearsLeftChange={handleProjectYearsLeftChange}
        onStageCompletedChange={setStageCompleted}
        onRedistributeTimeline={handleRedistributeTimeline}
        onTranchePercentChange={setTranchePercent}
        onFullyDisbursedByYearChange={setFullyDisbursedByYear}
      />

      {!inputsValid && (
        <p className="validation-message" role="alert">
          Enter a valid agreement value, contribution %, interest rate, loan
          tenure, and adjustment values. Bank loan must be positive.
        </p>
      )}

      {stagedDisbursementEnabled &&
        disbursementPlanMode === 'simple' &&
        !simpleStagedValid &&
        inputsValid && (
          <p className="validation-message" role="alert">
            For simple staged disbursement, enter a tranche % between 0–100 and
            a disbursement year within loan tenure.
          </p>
        )}

      {stagedDisbursementEnabled &&
        disbursementPlanMode === 'milestone' &&
        inputsValid &&
        !milestoneStagedValid &&
        milestoneValidation.message && (
          <p className="validation-message" role="alert">
            {milestoneValidation.message}
          </p>
        )}

      {stagedDisbursementEnabled &&
        disbursementPlanMode === 'milestone' &&
        parsedMilestones !== null &&
        sanctioned !== null && (
          <DisbursementTimeline
            milestones={parsedMilestones.milestones}
            sanctionedAmount={sanctioned}
            loanYears={years}
            stageCompleted={stageCompletedNum}
          />
        )}

      <section className="results-grid">
        <LoanSummary
          title="100% disbursed"
          subtitle="Full bank loan outstanding — standard amortization"
          principal={sanctioned ?? 0}
          result={sanctionedResult}
        />

        {stagedDisbursementEnabled && stagedResult && (
          <LoanSummary
            title={
              disbursementPlanMode === 'milestone'
                ? 'Tower milestone plan'
                : 'Staged disbursement'
            }
            subtitle={stagedSubtitle}
            principal={sanctioned ?? 0}
            result={stagedResult}
          />
        )}
      </section>

      {showBreakupComparison && (
        <section className="breakup-section">
          <BreakupViewToggle
            viewMode={breakupViewMode}
            onChange={setBreakupViewMode}
          />
          <ComparisonTables
            sanctionedTitle="100% disbursed — EMI breakup"
            alternateTitle={alternateBreakupTitle}
            sanctionedResult={sanctionedResult}
            alternateResult={stagedResult}
            showComparison
            viewMode={breakupViewMode}
            showDisbursementOnAlternate={disbursementPlanMode === 'milestone'}
          />
        </section>
      )}
    </div>
  )
}

export default App
