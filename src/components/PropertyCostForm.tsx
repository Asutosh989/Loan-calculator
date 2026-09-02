import type { PropertyCostBreakdown } from '../utils/propertyCost'
import { formatCurrency } from '../utils/loanCalculations'
import type { Gender } from '../utils/propertyCost'
import { CurrencyInput } from './CurrencyInput'

interface PropertyCostFormProps {
  agreementValue: string
  gender: Gender
  contributionPercent: string
  propertyCost: PropertyCostBreakdown | null
  onAgreementValueChange: (value: string) => void
  onGenderChange: (gender: Gender) => void
  onContributionPercentChange: (value: string) => void
}

export function PropertyCostForm({
  agreementValue,
  gender,
  contributionPercent,
  propertyCost,
  onAgreementValueChange,
  onGenderChange,
  onContributionPercentChange,
}: PropertyCostFormProps) {
  return (
    <section className="loan-form loan-form--property">
      <h2>Property Cost</h2>
      <p className="form-hint">
        Agreement value, taxes, and your contribution. Bank loan is calculated
        from the remaining amount after your share.
      </p>
      <div className="form-grid">
        <label className="field">
          <span>Agreement value of property</span>
          <CurrencyInput
            value={agreementValue}
            onChange={onAgreementValueChange}
            placeholder="₹1,44,63,100"
          />
        </label>

        <fieldset className="gender-toggle">
          <legend>Stamp duty rate</legend>
          <label>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={gender === 'male'}
              onChange={() => onGenderChange('male')}
            />
            Male (7%)
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={gender === 'female'}
              onChange={() => onGenderChange('female')}
            />
            Female (6%)
          </label>
        </fieldset>

        <label className="field">
          <span>Your contribution (% of agreement &amp; GST)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={contributionPercent}
            onChange={(event) =>
              onContributionPercentChange(event.target.value)
            }
            placeholder="e.g. 10"
          />
          <span className="field-hint">
            Includes {contributionPercent || '—'}% of agreement,{' '}
            {contributionPercent || '—'}% of GST, plus 100% stamp duty &amp;
            registration (₹30,000)
          </span>
        </label>
      </div>

      {propertyCost && (
        <dl className="property-breakdown">
          <div>
            <dt>Agreement value</dt>
            <dd>{formatCurrency(propertyCost.agreementValue)}</dd>
          </div>
          <div>
            <dt>GST (5%)</dt>
            <dd>{formatCurrency(propertyCost.gstAmount)}</dd>
          </div>
          <div>
            <dt>Stamp duty ({gender === 'male' ? '7' : '6'}%)</dt>
            <dd>{formatCurrency(propertyCost.stampDuty)}</dd>
          </div>
          <div>
            <dt>Registration</dt>
            <dd>{formatCurrency(propertyCost.registrationFee)}</dd>
          </div>
          <div className="property-breakdown__total">
            <dt>Total property value</dt>
            <dd>{formatCurrency(propertyCost.propertyValue)}</dd>
          </div>
          <div>
            <dt>Your contribution</dt>
            <dd>{formatCurrency(propertyCost.totalIndividualContribution)}</dd>
          </div>
          <div className="property-breakdown__loan">
            <dt>Bank loan (sanctioned)</dt>
            <dd>{formatCurrency(propertyCost.bankLoanAmount)}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}
