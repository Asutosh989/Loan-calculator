export interface ScheduleAdjustments {
  emiIncreasePercentPerYear: number
  extraEmisPerYear: number
}

export interface LoanInputs {
  principal: number
  annualRate: number
  years: number
  customEmi?: number
  adjustments?: ScheduleAdjustments
}

export interface MonthlyPayment {
  month: number
  year: number
  emi: number
  extraPayment: number
  interest: number
  principal: number
  balance: number
  disbursement?: number
  cumulativeDisbursed?: number
}

export interface YearlyBreakdown {
  year: number
  totalEmi: number
  totalExtraPayment: number
  totalInterest: number
  totalPrincipal: number
  closingBalance: number
  disbursedInYear?: number
  cumulativeDisbursed?: number
}

export interface LoanResult {
  monthlyEmi: number
  calculatedEmi: number
  totalPayment: number
  totalExtraPayment: number
  totalInterest: number
  schedule: MonthlyPayment[]
  yearlyBreakdown: YearlyBreakdown[]
}

export function calculateEmi(
  principal: number,
  annualRatePercent: number,
  years: number,
): number {
  if (principal <= 0 || years <= 0) return 0
  if (annualRatePercent === 0) return principal / (years * 12)

  const monthlyRate = annualRatePercent / 12 / 100
  const months = years * 12
  const factor = Math.pow(1 + monthlyRate, months)

  return (principal * monthlyRate * factor) / (factor - 1)
}

export function resolveEmi(
  principal: number,
  annualRate: number,
  years: number,
  customEmi?: number,
): number {
  if (customEmi !== undefined && customEmi > 0) {
    return customEmi
  }
  return calculateEmi(principal, annualRate, years)
}

function emiForMonth(
  baseEmi: number,
  month: number,
  increasePercent: number,
): number {
  if (increasePercent <= 0) return baseEmi
  const year = Math.floor((month - 1) / 12) + 1
  return baseEmi * Math.pow(1 + increasePercent / 100, year - 1)
}

function applyRegularPayment(
  balance: number,
  emi: number,
  monthlyRate: number,
): { interest: number; principal: number; balance: number } {
  if (balance <= 0) {
    return { interest: 0, principal: 0, balance: 0 }
  }

  const interestDue = monthlyRate === 0 ? 0 : balance * monthlyRate
  const interest = Math.min(emi, interestDue)
  const principal = Math.min(Math.max(0, emi - interest), balance)

  return {
    interest,
    principal,
    balance: balance - principal,
  }
}

function applyExtraPayment(
  balance: number,
  extraAmount: number,
): { extraPrincipal: number; balance: number } {
  if (balance <= 0 || extraAmount <= 0) {
    return { extraPrincipal: 0, balance }
  }

  const extraPrincipal = Math.min(extraAmount, balance)
  return { extraPrincipal, balance: balance - extraPrincipal }
}

function finalizeLoanResult(
  baseEmi: number,
  calculatedEmi: number,
  schedule: MonthlyPayment[],
  includeDisbursement = false,
): LoanResult {
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0)
  const totalExtraPayment = schedule.reduce(
    (sum, row) => sum + row.extraPayment,
    0,
  )
  const totalPayment =
    schedule.reduce((sum, row) => sum + row.emi, 0) + totalExtraPayment

  return {
    monthlyEmi: baseEmi,
    calculatedEmi,
    totalPayment,
    totalExtraPayment,
    totalInterest,
    schedule,
    yearlyBreakdown: aggregateByYear(schedule, includeDisbursement),
  }
}

export interface PartialDisbursementInputs {
  sanctionedAmount: number
  disbursedAmount: number
  annualRate: number
  years: number
  customEmi?: number
  adjustments?: ScheduleAdjustments
}

export interface StagedDisbursementInputs {
  sanctionedAmount: number
  tranchePercent: number
  fullyDisbursedByYear: number
  annualRate: number
  years: number
  customEmi?: number
  adjustments?: ScheduleAdjustments
}

export interface MilestoneDisbursementInputs {
  sanctionedAmount: number
  disbursementByMonth: Map<number, number>
  annualRate: number
  years: number
  customEmi?: number
  adjustments?: ScheduleAdjustments
}

function runDisbursementSchedule(
  sanctionedAmount: number,
  annualRate: number,
  years: number,
  customEmi: number | undefined,
  adjustments: ScheduleAdjustments | undefined,
  getDisbursementForMonth: (month: number) => number,
): LoanResult {
  const monthlyRate = annualRate / 12 / 100
  const months = years * 12
  const calculatedEmi = calculateEmi(sanctionedAmount, annualRate, years)
  const baseEmi = resolveEmi(sanctionedAmount, annualRate, years, customEmi)
  const increasePercent = adjustments?.emiIncreasePercentPerYear ?? 0
  const extraEmisPerYear = adjustments?.extraEmisPerYear ?? 0

  const schedule: MonthlyPayment[] = []
  let balance = 0
  let cumulativeDisbursed = 0

  for (let month = 1; month <= months; month += 1) {
    const year = Math.floor((month - 1) / 12) + 1
    const disbursement = getDisbursementForMonth(month)

    if (disbursement > 0) {
      cumulativeDisbursed += disbursement
      balance += disbursement
    }

    const emi = emiForMonth(baseEmi, month, increasePercent)
    const payment = applyRegularPayment(balance, emi, monthlyRate)
    balance = payment.balance

    let extraPayment = 0
    if (month % 12 === 0 && extraEmisPerYear > 0) {
      const extra = applyExtraPayment(balance, extraEmisPerYear * emi)
      extraPayment = extra.extraPrincipal
      balance = extra.balance
    }

    schedule.push({
      month,
      year,
      emi,
      extraPayment,
      interest: payment.interest,
      principal: payment.principal + extraPayment,
      balance,
      disbursement,
      cumulativeDisbursed,
    })
  }

  return finalizeLoanResult(baseEmi, calculatedEmi, schedule, true)
}

export function buildMilestoneDisbursementSchedule(
  inputs: MilestoneDisbursementInputs,
): LoanResult {
  const {
    sanctionedAmount,
    disbursementByMonth,
    annualRate,
    years,
    customEmi,
    adjustments,
  } = inputs

  return runDisbursementSchedule(
    sanctionedAmount,
    annualRate,
    years,
    customEmi,
    adjustments,
    (month) => disbursementByMonth.get(month) ?? 0,
  )
}

export function buildStagedDisbursementSchedule(
  inputs: StagedDisbursementInputs,
): LoanResult {
  const {
    sanctionedAmount,
    tranchePercent,
    fullyDisbursedByYear,
    annualRate,
    years,
    customEmi,
    adjustments,
  } = inputs

  let cumulativeDisbursed = 0

  return runDisbursementSchedule(
    sanctionedAmount,
    annualRate,
    years,
    customEmi,
    adjustments,
    (month) => {
      const year = Math.floor((month - 1) / 12) + 1

      if (month % 12 !== 1 || year > fullyDisbursedByYear) {
        return 0
      }

      let disbursement =
        year === fullyDisbursedByYear
          ? sanctionedAmount - cumulativeDisbursed
          : Math.round((sanctionedAmount * tranchePercent) / 100)

      disbursement = Math.max(
        0,
        Math.min(disbursement, sanctionedAmount - cumulativeDisbursed),
      )
      cumulativeDisbursed += disbursement
      return disbursement
    },
  )
}

export function buildPartialDisbursementSchedule(
  inputs: PartialDisbursementInputs,
): LoanResult {
  const {
    sanctionedAmount,
    disbursedAmount,
    annualRate,
    years,
    customEmi,
    adjustments,
  } = inputs
  const monthlyRate = annualRate / 12 / 100
  const months = years * 12
  const calculatedEmi = calculateEmi(sanctionedAmount, annualRate, years)
  const baseEmi = resolveEmi(sanctionedAmount, annualRate, years, customEmi)
  const increasePercent = adjustments?.emiIncreasePercentPerYear ?? 0
  const extraEmisPerYear = adjustments?.extraEmisPerYear ?? 0

  const schedule: MonthlyPayment[] = []
  let balance = disbursedAmount

  for (let month = 1; month <= months; month += 1) {
    const year = Math.floor((month - 1) / 12) + 1
    const emi = emiForMonth(baseEmi, month, increasePercent)
    const payment = applyRegularPayment(balance, emi, monthlyRate)
    balance = payment.balance

    let extraPayment = 0
    if (month % 12 === 0 && extraEmisPerYear > 0) {
      const extra = applyExtraPayment(balance, extraEmisPerYear * emi)
      extraPayment = extra.extraPrincipal
      balance = extra.balance
    }

    schedule.push({
      month,
      year,
      emi,
      extraPayment,
      interest: payment.interest,
      principal: payment.principal + extraPayment,
      balance,
    })
  }

  return finalizeLoanResult(baseEmi, calculatedEmi, schedule)
}

export function buildAmortizationSchedule(inputs: LoanInputs): LoanResult {
  const { principal, annualRate, years, customEmi, adjustments } = inputs
  const monthlyRate = annualRate / 12 / 100
  const months = years * 12
  const calculatedEmi = calculateEmi(principal, annualRate, years)
  const baseEmi = resolveEmi(principal, annualRate, years, customEmi)
  const increasePercent = adjustments?.emiIncreasePercentPerYear ?? 0
  const extraEmisPerYear = adjustments?.extraEmisPerYear ?? 0

  const schedule: MonthlyPayment[] = []
  let balance = principal

  for (let month = 1; month <= months; month += 1) {
    const year = Math.floor((month - 1) / 12) + 1
    const emi = emiForMonth(baseEmi, month, increasePercent)
    const payment = applyRegularPayment(balance, emi, monthlyRate)
    let principalPaid = payment.principal
    balance = payment.balance

    let extraPayment = 0
    if (month % 12 === 0 && extraEmisPerYear > 0) {
      const extra = applyExtraPayment(balance, extraEmisPerYear * emi)
      extraPayment = extra.extraPrincipal
      balance = extra.balance
    }

    if (month === months && balance > 0) {
      principalPaid += balance
      balance = 0
    }

    schedule.push({
      month,
      year,
      emi,
      extraPayment,
      interest: payment.interest,
      principal: principalPaid + extraPayment,
      balance,
    })
  }

  return finalizeLoanResult(baseEmi, calculatedEmi, schedule)
}

function aggregateByYear(
  schedule: MonthlyPayment[],
  includeDisbursement = false,
): YearlyBreakdown[] {
  const years = Math.ceil(schedule.length / 12)
  const breakdown: YearlyBreakdown[] = []

  for (let year = 1; year <= years; year += 1) {
    const start = (year - 1) * 12
    const slice = schedule.slice(start, start + 12)

    const row: YearlyBreakdown = {
      year,
      totalEmi: slice.reduce((sum, entry) => sum + entry.emi, 0),
      totalExtraPayment: slice.reduce(
        (sum, entry) => sum + entry.extraPayment,
        0,
      ),
      totalInterest: slice.reduce((sum, entry) => sum + entry.interest, 0),
      totalPrincipal: slice.reduce((sum, entry) => sum + entry.principal, 0),
      closingBalance: slice[slice.length - 1]?.balance ?? 0,
    }

    if (includeDisbursement) {
      row.disbursedInYear = slice.reduce(
        (sum, entry) => sum + (entry.disbursement ?? 0),
        0,
      )
      row.cumulativeDisbursed =
        slice[slice.length - 1]?.cumulativeDisbursed ?? 0
    }

    breakdown.push(row)
  }

  return breakdown
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
