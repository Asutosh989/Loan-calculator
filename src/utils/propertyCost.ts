export type Gender = 'male' | 'female'

export const GST_RATE = 0.05
export const REGISTRATION_FEE = 30000
export const STAMP_DUTY_RATE: Record<Gender, number> = {
  male: 0.07,
  female: 0.06,
}

export interface PropertyCostBreakdown {
  agreementValue: number
  gstAmount: number
  stampDuty: number
  registrationFee: number
  propertyValue: number
  contributionPercent: number
  agreementContribution: number
  gstContribution: number
  stampDutyContribution: number
  registrationContribution: number
  totalIndividualContribution: number
  bankLoanAmount: number
}

export const DEFAULT_AGREEMENT_VALUE = 14463100

export function calculatePropertyCost(
  agreementValue: number,
  contributionPercent: number,
  gender: Gender,
): PropertyCostBreakdown {
  const gstAmount = Math.round(agreementValue * GST_RATE)
  const stampDuty = Math.round(agreementValue * STAMP_DUTY_RATE[gender])
  const registrationFee = REGISTRATION_FEE
  const propertyValue = agreementValue + gstAmount + stampDuty + registrationFee

  const agreementContribution = Math.round(
    (agreementValue * contributionPercent) / 100,
  )
  const gstContribution = Math.round((gstAmount * contributionPercent) / 100)
  const stampDutyContribution = stampDuty
  const registrationContribution = registrationFee

  const totalIndividualContribution =
    agreementContribution +
    gstContribution +
    stampDutyContribution +
    registrationContribution

  const bankLoanAmount = propertyValue - totalIndividualContribution

  return {
    agreementValue,
    gstAmount,
    stampDuty,
    registrationFee,
    propertyValue,
    contributionPercent,
    agreementContribution,
    gstContribution,
    stampDutyContribution,
    registrationContribution,
    totalIndividualContribution,
    bankLoanAmount,
  }
}
