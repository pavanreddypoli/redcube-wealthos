'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  firstName: string; lastName: string; email: string; phone: string
  dob: string; maritalStatus: string; dependents: string
  employmentStatus: string; occupation: string; state: string
  grossIncome: string; spouseIncome: string; otherIncome: string
  monthlyExpenses: string; monthlySavings: string
  emergencyFundMonths: string; hasbudget: string
  hasLifeInsurance: string; lifeCoverageAmount: string
  hasDisabilityInsurance: string; hasHealthInsurance: string
  hasLongTermCare: string; hasUmbrella: string; lifeInsuranceType: string
  retirementAge: string; currentRetirementSavings: string
  monthlyRetirementContrib: string; hasPension: string; pensionAmount: string
  socialSecurityEstimate: string; retirementIncomeGoal: string
  retirementAccounts: string[]
  investableAssets: string; riskTolerance: string; investmentHorizon: string
  investmentExperience: string; currentAllocation: string
  hasAdvisor: string; investmentGoal: string; annualReturnExpectation: string
  homeOwnership: string; homeValue: string; mortgageBalance: string
  mortgageRate: string; mortgageType: string; monthlyMortgage: string
  yearsRemaining: string; hasSecondProperty: string
  filingStatus: string; taxBracket: string; lastYearTaxes: string
  hasAccountant: string; taxLossHarvesting: string
  hasBusinessIncome: string; estimatedTaxes: string; maxing401k: string
  hasWill: string; hasTrust: string; hasPOA: string
  hasHealthcareDirective: string; estateValue: string
  hasBeneficiaries: string; lastReviewedEstate: string; hasEstateAttorney: string
  topPriority1: string; topPriority2: string; topPriority3: string
  biggestConcern: string; timelineToStart: string
  additionalNotes: string; referralSource: string
}

const INIT: FormData = {
  firstName:'',lastName:'',email:'',phone:'',dob:'',maritalStatus:'',
  dependents:'',employmentStatus:'',occupation:'',state:'',
  grossIncome:'',spouseIncome:'',otherIncome:'',monthlyExpenses:'',
  monthlySavings:'',emergencyFundMonths:'',hasbudget:'',
  hasLifeInsurance:'',lifeCoverageAmount:'',hasDisabilityInsurance:'',
  hasHealthInsurance:'',hasLongTermCare:'',hasUmbrella:'',lifeInsuranceType:'',
  retirementAge:'',currentRetirementSavings:'',monthlyRetirementContrib:'',
  hasPension:'',pensionAmount:'',socialSecurityEstimate:'',retirementIncomeGoal:'',
  retirementAccounts:[],
  investableAssets:'',riskTolerance:'',investmentHorizon:'',investmentExperience:'',
  currentAllocation:'',hasAdvisor:'',investmentGoal:'',annualReturnExpectation:'',
  homeOwnership:'',homeValue:'',mortgageBalance:'',mortgageRate:'',
  mortgageType:'',monthlyMortgage:'',yearsRemaining:'',hasSecondProperty:'',
  filingStatus:'',taxBracket:'',lastYearTaxes:'',hasAccountant:'',
  taxLossHarvesting:'',hasBusinessIncome:'',estimatedTaxes:'',maxing401k:'',
  hasWill:'',hasTrust:'',hasPOA:'',hasHealthcareDirective:'',estateValue:'',
  hasBeneficiaries:'',lastReviewedEstate:'',hasEstateAttorney:'',
  topPriority1:'',topPriority2:'',topPriority3:'',biggestConcern:'',
  timelineToStart:'',additionalNotes:'',referralSource:'',
}

const STEPS = [
  { id:'personal',    label:'Personal',    icon:'👤' },
  { id:'cashflow',    label:'Cash Flow',   icon:'💵' },
  { id:'protection',  label:'Protection',  icon:'🛡️' },
  { id:'retirement',  label:'Retirement',  icon:'🏖️' },
  { id:'investments', label:'Investments', icon:'📈' },
  { id:'mortgage',    label:'Mortgage',    icon:'🏠' },
  { id:'tax',         label:'Tax',         icon:'🧾' },
  { id:'estate',      label:'Estate',      icon:'📋' },
  { id:'priorities',  label:'Priorities',  icon:'🎯' },
]

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

function validate(step: number, d: FormData): string[] {
  const e: string[] = []
  if (step === 0) {
    if (!d.firstName.trim()) e.push("We'd love to know your name — please add your first name so we can personalize your plan")
    if (!d.lastName.trim())  e.push("Almost there! Please add your last name to continue")
    if (!d.email.includes('@')) e.push("We'll send your results here — please enter a valid email address")
    if (!d.dob)              e.push("Your age helps us tailor your retirement timeline — please add your date of birth")
    if (!d.maritalStatus)    e.push("Your household situation helps us give more accurate advice — please select your marital status")
    if (!d.employmentStatus) e.push("Understanding your work situation helps us build a better plan — please select your employment status")
  }
  if (step === 1) {
    if (!d.grossIncome)     e.push("We understand sharing financials feels personal — your income helps us recommend the right strategies for your situation")
    if (!d.monthlyExpenses) e.push("Your spending picture helps us find savings opportunities — please add your monthly expenses")
  }
  if (step === 4) {
    if (!d.riskTolerance)     e.push("This shapes your entire investment strategy — please select how you feel about investment risk")
    if (!d.investmentHorizon) e.push("Knowing your timeline helps us match the right approach — please select your investment horizon")
  }
  if (step === 8) {
    if (!d.topPriority1)    e.push("Help us focus on what matters most to you — please choose your top financial priority")
    if (!d.biggestConcern)  e.push("Your concerns help us prepare your advisor — please share what's on your mind financially")
    if (!d.timelineToStart) e.push("Knowing when you'd like to start helps us prioritize — please select a timeline")
  }
  return e
}

// ── Field components ──────────────────────────────────────────────────────────

function F({ label, req, hint, children }: { label:string; req?:boolean; hint?:string; children:React.ReactNode }) {
  return (
    <div className="mb-[18px]">
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
        {label}{req && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function TI({ val, set, ph, type='text', pre }: { val:string; set:(v:string)=>void; ph?:string; type?:string; pre?:string }) {
  return (
    <div className="relative flex items-center">
      {pre && <span className="absolute left-3 text-[13px] text-gray-400 pointer-events-none">{pre}</span>}
      <input
        type={type}
        value={val}
        onChange={e=>set(e.target.value)}
        placeholder={ph}
        className={`w-full h-[42px] border-[1.5px] border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50 outline-none transition-colors duration-150 focus:border-brand-400 focus:bg-white ${pre ? 'pl-6 pr-3.5' : 'px-3.5'}`}
      />
    </div>
  )
}

function Sel({ val, set, opts, ph }: { val:string; set:(v:string)=>void; opts:{value:string;label:string}[]; ph?:string }) {
  return (
    <select
      value={val}
      onChange={e=>set(e.target.value)}
      className="w-full h-[42px] border-[1.5px] border-gray-200 rounded-lg px-3.5 text-sm text-gray-900 bg-gray-50 outline-none cursor-pointer transition-colors duration-150 appearance-none focus:border-brand-400 focus:bg-white"
    >
      {ph && <option value="">{ph}</option>}
      {opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Radio({ val, set, opts }: { val:string; set:(v:string)=>void; opts:{value:string;label:string}[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(o=>(
        <label
          key={o.value}
          className={`flex items-center px-3.5 py-2 rounded-lg border-[1.5px] text-[13px] font-medium cursor-pointer transition-all duration-150 select-none ${
            val === o.value
              ? 'border-brand-600 bg-blue-50 text-brand-600'
              : 'border-gray-200 text-gray-500 hover:border-brand-400 hover:text-brand-600'
          }`}
        >
          <input type="radio" value={o.value} checked={val===o.value} onChange={()=>set(o.value)} className="hidden" />
          {o.label}
        </label>
      ))}
    </div>
  )
}

function Check({ vals, set, opts }: { vals:string[]; set:(v:string[])=>void; opts:{value:string;label:string}[] }) {
  const toggle = (v:string) => set(vals.includes(v) ? vals.filter(x=>x!==v) : [...vals,v])
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(o=>(
        <label
          key={o.value}
          className={`flex items-center px-3.5 py-2 rounded-lg border-[1.5px] text-[13px] font-medium cursor-pointer transition-all duration-150 select-none ${
            vals.includes(o.value)
              ? 'border-brand-600 bg-blue-50 text-brand-600'
              : 'border-gray-200 text-gray-500 hover:border-brand-400 hover:text-brand-600'
          }`}
          onClick={()=>toggle(o.value)}
        >
          <span className="w-3.5 h-3.5 border-[1.5px] border-current rounded-sm inline-flex items-center justify-center text-[9px] mr-1.5 shrink-0">
            {vals.includes(o.value) ? '✓' : ''}
          </span>
          {o.label}
        </label>
      ))}
    </div>
  )
}

function G2({ children }: { children:React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

function SecHead({ icon, title, sub, bgClass }: { icon:string; title:string; sub:string; bgClass?:string }) {
  return (
    <div className="flex items-start gap-4 mb-7 pb-5 border-b border-gray-100">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${bgClass ?? 'bg-blue-50'}`}
      >
        {icon}
      </div>
      <div>
        <h2 className="font-heading text-xl font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-[13px] text-gray-500 leading-relaxed">{sub}</p>
      </div>
    </div>
  )
}

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-brand-600 text-lg font-bold leading-none">■</span>
      <span className="text-[15px] text-gray-900 font-semibold">
        WealthPlanr<span className="text-brand-600">AI</span>
      </span>
    </Link>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const [step,setStep]         = useState(0)
  const [data,setData]         = useState<FormData>(INIT)
  const [errs,setErrs]         = useState<string[]>([])
  const [apiError,setApiError] = useState('')
  const [loading,setLoading]   = useState(false)
  const [done,setDone]         = useState(false)
  const router = useRouter()

  const s = useCallback(<K extends keyof FormData>(k:K,v:FormData[K]) => {
    setData(p=>({...p,[k]:v})); setErrs([]); setApiError('')
  },[])

  function goNext() {
    const e = validate(step,data)
    if (e.length) { setErrs(e); window.scrollTo(0,0); return }
    setErrs([]); setStep(n=>n+1); window.scrollTo(0,0)
  }
  function goBack() { setErrs([]); setApiError(''); setStep(n=>n-1); window.scrollTo(0,0) }

  async function submit() {
    const e = validate(step,data)
    if (e.length) { setErrs(e); return }
    setLoading(true); setApiError('')
    try {
      const res = await fetch('/api/assessment',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({answers:data,score:75,risk_profile:data.riskTolerance||'moderate'}),
      })
      const json = await res.json()
      if (json.id) router.push(`/summary?id=${json.id}`)
      else setDone(true)
    } catch {
      setApiError("Something went sideways on our end — your answers are safe, please try submitting again")
    } finally { setLoading(false) }
  }

  const pct = ((step+1)/STEPS.length)*100

  // ── Done screen ────────────────────────────────────────────────────────────

  if (done) return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center">
        <Logo />
      </header>
      <div className="max-w-[440px] mx-auto mt-20 text-center px-10 py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="w-[68px] h-[68px] rounded-full bg-green-50 border-2 border-green-200 text-green-600 text-[30px] flex items-center justify-center mx-auto mb-5">✓</div>
        <h2 className="font-heading text-[22px] font-bold text-gray-900 mb-2.5">Assessment Complete!</h2>
        <p className="text-sm text-gray-500 leading-[1.7] mb-7">
          Thank you, {data.firstName}. Your advisor will review your responses and be in touch within 1 business day.
        </p>
        <button
          className="px-6 py-2.5 rounded-lg bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          onClick={()=>router.push('/dashboard')}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  )

  // ── Main form ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">

      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between sticky top-0 z-20">
        <Logo />
        <span className="text-[11px] text-gray-400 tracking-[1.2px] uppercase">Wealth Assessment</span>
      </header>

      {/* Progress bar */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-1">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{width:`${pct}%`}} />
        </div>
        <span className="text-xs font-semibold text-blue-600 w-8 flex-shrink-0">{Math.round(pct)}%</span>
      </div>

      {/* Step pills */}
      <div className="overflow-x-auto px-5 pt-4 pb-0">
        <div className="flex gap-2 min-w-max">
          {STEPS.map((st,i)=>(
            <button
              key={st.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] bg-white text-xs whitespace-nowrap transition-all duration-150 ${
                i < step
                  ? 'border-green-200 text-green-600 bg-green-50 cursor-pointer'
                  : i === step
                    ? 'border-brand-600 text-brand-600 bg-blue-50 font-semibold'
                    : 'border-gray-200 text-gray-400 cursor-default'
              }`}
              onClick={()=>{if(i<step){setStep(i);setErrs([])}}}
              disabled={i>step}
            >
              <span>{i<step?'✓':st.icon}</span>
              <span className="text-xs">{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div
        key={step}
        className="max-w-[700px] md:mx-auto mx-3 mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-md:p-5 max-md:rounded-xl animate-slide-up"
      >

        {/* Validation errors */}
        {errs.length>0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-6 text-[13px] text-amber-800">
            <p className="font-semibold mb-2">We want to make sure we get this right — please check the following before continuing:</p>
            <ul className="space-y-1 mt-1">
              {errs.map(e=>(
                <li key={e} className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">•</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* API error */}
        {apiError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-6 text-[13px] text-amber-800">
            {apiError}
          </div>
        )}

        {/* Step 0 welcome banner */}
        {step===0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 mb-6">
            <p className="text-[13px] text-blue-700 leading-relaxed">
              <strong>We understand your time is precious.</strong> The more accurately you complete this assessment, the more precisely we can tailor advice to your unique financial situation. Most advisors find this takes about 8 minutes.
            </p>
          </div>
        )}

        {/* ── Step 0: Personal ─────────────────────────────────────── */}
        {step===0 && <>
          <SecHead icon="👤" title="Personal Information" sub="Tell us about yourself so we can tailor your financial plan." bgClass="bg-blue-50" />
          <G2>
            <F label="First Name" req><TI val={data.firstName} set={v=>s('firstName',v)} ph="Jane" /></F>
            <F label="Last Name" req><TI val={data.lastName} set={v=>s('lastName',v)} ph="Smith" /></F>
          </G2>
          <G2>
            <F label="Email Address" req><TI val={data.email} set={v=>s('email',v)} ph="jane@example.com" type="email" /></F>
            <F label="Phone Number"><TI val={data.phone} set={v=>s('phone',v)} ph="(555) 000-0000" type="tel" /></F>
          </G2>
          <G2>
            <F label="Date of Birth" req><TI val={data.dob} set={v=>s('dob',v)} type="date" /></F>
            <F label="State of Residence">
              <Sel val={data.state} set={v=>s('state',v)} ph="Select state" opts={US_STATES.map(st=>({value:st,label:st}))} />
            </F>
          </G2>
          <F label="Marital Status" req>
            <Radio val={data.maritalStatus} set={v=>s('maritalStatus',v)}
              opts={[{value:'single',label:'Single'},{value:'married',label:'Married'},{value:'divorced',label:'Divorced'},{value:'widowed',label:'Widowed'},{value:'partnered',label:'Domestic Partner'}]} />
          </F>
          <G2>
            <F label="Dependents">
              <Sel val={data.dependents} set={v=>s('dependents',v)} ph="Select" opts={['0','1','2','3','4','5+'].map(v=>({value:v,label:v}))} />
            </F>
            <F label="Employment Status" req>
              <Sel val={data.employmentStatus} set={v=>s('employmentStatus',v)} ph="Select"
                opts={[{value:'employed',label:'Employed (W-2)'},{value:'self_employed',label:'Self-Employed'},{value:'business_owner',label:'Business Owner'},{value:'retired',label:'Retired'},{value:'unemployed',label:'Not Currently Employed'}]} />
            </F>
          </G2>
          <F label="Occupation / Industry">
            <TI val={data.occupation} set={v=>s('occupation',v)} ph="e.g. Software Engineer, Physician, Attorney" />
          </F>
        </>}

        {/* ── Step 1: Cash Flow ─────────────────────────────────────── */}
        {step===1 && <>
          <SecHead icon="💵" title="Cash Flow" sub="Understanding your income and spending is the foundation of your financial plan." bgClass="bg-green-50" />
          <G2>
            <F label="Annual Gross Income" req hint="Before taxes"><TI val={data.grossIncome} set={v=>s('grossIncome',v)} ph="120,000" pre="$" type="number" /></F>
            <F label="Spouse / Partner Income" hint="If applicable"><TI val={data.spouseIncome} set={v=>s('spouseIncome',v)} ph="0" pre="$" type="number" /></F>
          </G2>
          <G2>
            <F label="Other Annual Income" hint="Rental, dividends, business"><TI val={data.otherIncome} set={v=>s('otherIncome',v)} ph="0" pre="$" type="number" /></F>
            <F label="Total Monthly Expenses" req><TI val={data.monthlyExpenses} set={v=>s('monthlyExpenses',v)} ph="5,000" pre="$" type="number" /></F>
          </G2>
          <G2>
            <F label="Monthly Savings / Investing"><TI val={data.monthlySavings} set={v=>s('monthlySavings',v)} ph="1,000" pre="$" type="number" /></F>
            <F label="Emergency Fund Coverage">
              <Sel val={data.emergencyFundMonths} set={v=>s('emergencyFundMonths',v)} ph="Months of expenses saved"
                opts={[{value:'0',label:'None'},{value:'1',label:'1 month'},{value:'2',label:'2 months'},{value:'3',label:'3 months'},{value:'4-6',label:'4–6 months'},{value:'6+',label:'6+ months'}]} />
            </F>
          </G2>
          <F label="Do you follow a monthly budget?">
            <Radio val={data.hasbudget} set={v=>s('hasbudget',v)}
              opts={[{value:'yes',label:'Yes, I track it closely'},{value:'informal',label:'Informally'},{value:'no',label:'No budget yet'}]} />
          </F>
        </>}

        {/* ── Step 2: Protection ────────────────────────────────────── */}
        {step===2 && <>
          <SecHead icon="🛡️" title="Protection & Insurance" sub="Insurance is the foundation that protects everything you're building." bgClass="bg-purple-50" />
          <F label="Do you have life insurance?">
            <Radio val={data.hasLifeInsurance} set={v=>s('hasLifeInsurance',v)}
              opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'},{value:'unsure',label:'Not sure'}]} />
          </F>
          {data.hasLifeInsurance==='yes' && (
            <G2>
              <F label="Policy Type">
                <Sel val={data.lifeInsuranceType} set={v=>s('lifeInsuranceType',v)} ph="Select type"
                  opts={[{value:'term',label:'Term Life'},{value:'whole',label:'Whole Life'},{value:'universal',label:'Universal Life'},{value:'group',label:'Group / Employer'}]} />
              </F>
              <F label="Total Coverage Amount"><TI val={data.lifeCoverageAmount} set={v=>s('lifeCoverageAmount',v)} ph="500,000" pre="$" type="number" /></F>
            </G2>
          )}
          <F label="Disability insurance?">
            <Radio val={data.hasDisabilityInsurance} set={v=>s('hasDisabilityInsurance',v)}
              opts={[{value:'yes',label:'Yes'},{value:'employer',label:'Through employer'},{value:'no',label:'No'}]} />
          </F>
          <F label="Health insurance?">
            <Radio val={data.hasHealthInsurance} set={v=>s('hasHealthInsurance',v)}
              opts={[{value:'employer',label:'Employer plan'},{value:'marketplace',label:'ACA Marketplace'},{value:'medicare',label:'Medicare'},{value:'none',label:'No coverage'}]} />
          </F>
          <G2>
            <F label="Long-term care insurance?">
              <Radio val={data.hasLongTermCare} set={v=>s('hasLongTermCare',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
            </F>
            <F label="Umbrella liability policy?">
              <Radio val={data.hasUmbrella} set={v=>s('hasUmbrella',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
            </F>
          </G2>
        </>}

        {/* ── Step 3: Retirement ────────────────────────────────────── */}
        {step===3 && <>
          <SecHead icon="🏖️" title="Retirement Planning" sub="Let's map out the retirement you've envisioned." bgClass="bg-orange-50" />
          <G2>
            <F label="Target Retirement Age"><TI val={data.retirementAge} set={v=>s('retirementAge',v)} ph="65" type="number" /></F>
            <F label="Desired Monthly Income in Retirement"><TI val={data.retirementIncomeGoal} set={v=>s('retirementIncomeGoal',v)} ph="8,000" pre="$" type="number" /></F>
          </G2>
          <G2>
            <F label="Current Retirement Savings"><TI val={data.currentRetirementSavings} set={v=>s('currentRetirementSavings',v)} ph="250,000" pre="$" type="number" /></F>
            <F label="Monthly Retirement Contributions"><TI val={data.monthlyRetirementContrib} set={v=>s('monthlyRetirementContrib',v)} ph="2,000" pre="$" type="number" /></F>
          </G2>
          <F label="Retirement Accounts You Have">
            <Check vals={data.retirementAccounts} set={v=>s('retirementAccounts',v)}
              opts={[{value:'401k',label:'401(k)'},{value:'roth401k',label:'Roth 401(k)'},{value:'ira',label:'Traditional IRA'},{value:'roth_ira',label:'Roth IRA'},{value:'sep_ira',label:'SEP IRA'},{value:'pension',label:'Pension'},{value:'403b',label:'403(b)'}]} />
          </F>
          <G2>
            <F label="Do you have a pension?">
              <Radio val={data.hasPension} set={v=>s('hasPension',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
            </F>
            <F label="Estimated Social Security ($/mo)">
              <TI val={data.socialSecurityEstimate} set={v=>s('socialSecurityEstimate',v)} ph="2,200" pre="$" type="number" />
            </F>
          </G2>
        </>}

        {/* ── Step 4: Investments ───────────────────────────────────── */}
        {step===4 && <>
          <SecHead icon="📈" title="Investments" sub="Help us understand your current portfolio and philosophy." bgClass="bg-emerald-50" />
          <G2>
            <F label="Total Investable Assets" hint="Outside retirement accounts"><TI val={data.investableAssets} set={v=>s('investableAssets',v)} ph="150,000" pre="$" type="number" /></F>
            <F label="Investment Horizon" req>
              <Sel val={data.investmentHorizon} set={v=>s('investmentHorizon',v)} ph="Select timeframe"
                opts={[{value:'1-3',label:'1–3 years'},{value:'3-5',label:'3–5 years'},{value:'5-10',label:'5–10 years'},{value:'10-20',label:'10–20 years'},{value:'20+',label:'20+ years'}]} />
            </F>
          </G2>
          <F label="Risk Tolerance" req>
            <Radio val={data.riskTolerance} set={v=>s('riskTolerance',v)}
              opts={[{value:'conservative',label:'Conservative'},{value:'moderate',label:'Moderate'},{value:'moderately_aggressive',label:'Mod. Aggressive'},{value:'aggressive',label:'Aggressive'},{value:'very_aggressive',label:'Very Aggressive'}]} />
          </F>
          <F label="Investment Experience">
            <Radio val={data.investmentExperience} set={v=>s('investmentExperience',v)}
              opts={[{value:'beginner',label:'Beginner'},{value:'some',label:'Some experience'},{value:'experienced',label:'Experienced'},{value:'professional',label:'Professional'}]} />
          </F>
          <G2>
            <F label="Current Portfolio Allocation">
              <Sel val={data.currentAllocation} set={v=>s('currentAllocation',v)} ph="Select"
                opts={[{value:'all_cash',label:'All cash'},{value:'conservative',label:'Mostly bonds'},{value:'balanced',label:'60/40 Balanced'},{value:'growth',label:'Mostly equities'},{value:'all_equities',label:'All equities'},{value:'unsure',label:'Not sure'}]} />
            </F>
            <F label="Primary Investment Goal">
              <Sel val={data.investmentGoal} set={v=>s('investmentGoal',v)} ph="Select"
                opts={[{value:'growth',label:'Long-term growth'},{value:'income',label:'Income generation'},{value:'preservation',label:'Capital preservation'},{value:'balanced',label:'Balanced growth & income'}]} />
            </F>
          </G2>
          <F label="Do you currently work with a financial advisor?">
            <Radio val={data.hasAdvisor} set={v=>s('hasAdvisor',v)}
              opts={[{value:'yes',label:'Yes'},{value:'previously',label:'Previously'},{value:'no',label:'No'}]} />
          </F>
        </>}

        {/* ── Step 5: Mortgage ──────────────────────────────────────── */}
        {step===5 && <>
          <SecHead icon="🏠" title="Mortgage & Real Estate" sub="Your home is often your largest asset — let's plan around it." bgClass="bg-sky-50" />
          <F label="Home ownership status?">
            <Radio val={data.homeOwnership} set={v=>s('homeOwnership',v)}
              opts={[{value:'own',label:'Own outright'},{value:'mortgage',label:'Own with mortgage'},{value:'rent',label:'Renting'},{value:'other',label:'Other'}]} />
          </F>
          {(data.homeOwnership==='own'||data.homeOwnership==='mortgage') && (
            <G2>
              <F label="Estimated Home Value"><TI val={data.homeValue} set={v=>s('homeValue',v)} ph="550,000" pre="$" type="number" /></F>
              <F label="Remaining Mortgage Balance"><TI val={data.mortgageBalance} set={v=>s('mortgageBalance',v)} ph="320,000" pre="$" type="number" /></F>
            </G2>
          )}
          {data.homeOwnership==='mortgage' && <>
            <G2>
              <F label="Interest Rate"><TI val={data.mortgageRate} set={v=>s('mortgageRate',v)} ph="6.75" pre="%" type="number" /></F>
              <F label="Monthly Payment"><TI val={data.monthlyMortgage} set={v=>s('monthlyMortgage',v)} ph="2,400" pre="$" type="number" /></F>
            </G2>
            <G2>
              <F label="Mortgage Type">
                <Sel val={data.mortgageType} set={v=>s('mortgageType',v)} ph="Select"
                  opts={[{value:'fixed_30',label:'30-yr Fixed'},{value:'fixed_15',label:'15-yr Fixed'},{value:'arm',label:'Adjustable (ARM)'},{value:'other',label:'Other'}]} />
              </F>
              <F label="Years Remaining"><TI val={data.yearsRemaining} set={v=>s('yearsRemaining',v)} ph="22" type="number" /></F>
            </G2>
          </>}
          <F label="Additional properties?">
            <Radio val={data.hasSecondProperty} set={v=>s('hasSecondProperty',v)}
              opts={[{value:'yes_rental',label:'Yes — rental'},{value:'yes_vacation',label:'Yes — vacation home'},{value:'no',label:'No'}]} />
          </F>
        </>}

        {/* ── Step 6: Tax ───────────────────────────────────────────── */}
        {step===6 && <>
          <SecHead icon="🧾" title="Tax Planning" sub="Smart tax planning can meaningfully grow your net wealth over time." bgClass="bg-lime-50" />
          <G2>
            <F label="Filing Status">
              <Sel val={data.filingStatus} set={v=>s('filingStatus',v)} ph="Select"
                opts={[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}]} />
            </F>
            <F label="Federal Tax Bracket">
              <Sel val={data.taxBracket} set={v=>s('taxBracket',v)} ph="Select"
                opts={[{value:'10',label:'10%'},{value:'12',label:'12%'},{value:'22',label:'22%'},{value:'24',label:'24%'},{value:'32',label:'32%'},{value:'35',label:'35%'},{value:'37',label:'37%'}]} />
            </F>
          </G2>
          <G2>
            <F label="Federal Taxes Paid Last Year"><TI val={data.lastYearTaxes} set={v=>s('lastYearTaxes',v)} ph="18,000" pre="$" type="number" /></F>
            <F label="Pay quarterly estimated taxes?">
              <Radio val={data.estimatedTaxes} set={v=>s('estimatedTaxes',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
            </F>
          </G2>
          <G2>
            <F label="Work with a CPA?">
              <Radio val={data.hasAccountant} set={v=>s('hasAccountant',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'},{value:'self',label:'Self-file'}]} />
            </F>
            <F label="Interested in tax-loss harvesting?">
              <Radio val={data.taxLossHarvesting} set={v=>s('taxLossHarvesting',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'},{value:'unsure',label:'Not sure'}]} />
            </F>
          </G2>
          <G2>
            <F label="Business / self-employment income?">
              <Radio val={data.hasBusinessIncome} set={v=>s('hasBusinessIncome',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
            </F>
            <F label="Maxing out your 401(k)?">
              <Radio val={data.maxing401k} set={v=>s('maxing401k',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'},{value:'na',label:'N/A'}]} />
            </F>
          </G2>
        </>}

        {/* ── Step 7: Estate ────────────────────────────────────────── */}
        {step===7 && <>
          <SecHead icon="📋" title="Estate Planning" sub="Protect your legacy and ensure your wishes are honoured." bgClass="bg-fuchsia-50" />
          <G2>
            <F label="Do you have a will?">
              <Radio val={data.hasWill} set={v=>s('hasWill',v)} opts={[{value:'yes',label:'Yes, current'},{value:'outdated',label:'Yes, outdated'},{value:'no',label:'No'}]} />
            </F>
            <F label="Do you have a living trust?">
              <Radio val={data.hasTrust} set={v=>s('hasTrust',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
            </F>
          </G2>
          <G2>
            <F label="Power of Attorney in place?">
              <Radio val={data.hasPOA} set={v=>s('hasPOA',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
            </F>
            <F label="Healthcare directive?">
              <Radio val={data.hasHealthcareDirective} set={v=>s('hasHealthcareDirective',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
            </F>
          </G2>
          <G2>
            <F label="Estimated Total Estate Value"><TI val={data.estateValue} set={v=>s('estateValue',v)} ph="1,200,000" pre="$" type="number" /></F>
            <F label="Beneficiaries up to date?">
              <Radio val={data.hasBeneficiaries} set={v=>s('hasBeneficiaries',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'},{value:'unsure',label:'Not sure'}]} />
            </F>
          </G2>
          <G2>
            <F label="Last estate plan review?">
              <Sel val={data.lastReviewedEstate} set={v=>s('lastReviewedEstate',v)} ph="Select"
                opts={[{value:'within_1yr',label:'Within last year'},{value:'1_3yr',label:'1–3 years ago'},{value:'3_5yr',label:'3–5 years ago'},{value:'5yr+',label:'5+ years ago'},{value:'never',label:'Never / No plan'}]} />
            </F>
            <F label="Estate attorney on file?">
              <Radio val={data.hasEstateAttorney} set={v=>s('hasEstateAttorney',v)} opts={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
            </F>
          </G2>
        </>}

        {/* ── Step 8: Priorities ────────────────────────────────────── */}
        {step===8 && <>
          <SecHead icon="🎯" title="Your Priorities" sub="Help us focus on what matters most to you right now." bgClass="bg-rose-50" />
          <F label="Top Financial Priority" req>
            <Sel val={data.topPriority1} set={v=>s('topPriority1',v)} ph="Select your #1 priority"
              opts={[{value:'retirement',label:'Retirement planning'},{value:'debt',label:'Eliminating debt'},{value:'savings',label:'Building savings'},{value:'insurance',label:'Insurance & protection'},{value:'estate',label:'Estate planning'},{value:'tax',label:'Reducing taxes'},{value:'investments',label:'Growing investments'},{value:'education',label:'Education funding'},{value:'home',label:'Buying a home'}]} />
          </F>
          <G2>
            <F label="Second Priority">
              <Sel val={data.topPriority2} set={v=>s('topPriority2',v)} ph="Select"
                opts={[{value:'retirement',label:'Retirement'},{value:'debt',label:'Debt elimination'},{value:'savings',label:'Building savings'},{value:'insurance',label:'Protection'},{value:'estate',label:'Estate planning'},{value:'tax',label:'Tax reduction'},{value:'investments',label:'Investments'},{value:'education',label:'Education'},{value:'home',label:'Home purchase'}]} />
            </F>
            <F label="Third Priority">
              <Sel val={data.topPriority3} set={v=>s('topPriority3',v)} ph="Select"
                opts={[{value:'retirement',label:'Retirement'},{value:'debt',label:'Debt elimination'},{value:'savings',label:'Building savings'},{value:'insurance',label:'Protection'},{value:'estate',label:'Estate planning'},{value:'tax',label:'Tax reduction'},{value:'investments',label:'Investments'},{value:'education',label:'Education'},{value:'home',label:'Home purchase'}]} />
            </F>
          </G2>
          <F label="Biggest Financial Concern" req>
            <textarea
              value={data.biggestConcern}
              onChange={e=>s('biggestConcern',e.target.value)}
              placeholder="e.g. I worry about outliving my savings and not being able to retire comfortably..."
              className="w-full border-[1.5px] border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-900 bg-gray-50 outline-none resize-y transition-colors duration-150 leading-relaxed focus:border-brand-400 focus:bg-white"
              rows={4}
            />
          </F>
          <F label="When would you like to start?" req>
            <Radio val={data.timelineToStart} set={v=>s('timelineToStart',v)}
              opts={[{value:'asap',label:'ASAP'},{value:'1month',label:'Within 1 month'},{value:'3months',label:'1–3 months'},{value:'6months',label:'3–6 months'},{value:'exploring',label:'Just exploring'}]} />
          </F>
          <F label="How did you hear about us?">
            <Sel val={data.referralSource} set={v=>s('referralSource',v)} ph="Select"
              opts={[{value:'referral',label:'Friend / colleague referral'},{value:'google',label:'Google search'},{value:'linkedin',label:'LinkedIn'},{value:'advisor',label:'From my advisor'},{value:'event',label:'Event or conference'},{value:'other',label:'Other'}]} />
          </F>
          <F label="Anything else your advisor should know?">
            <textarea
              value={data.additionalNotes}
              onChange={e=>s('additionalNotes',e.target.value)}
              placeholder="Any additional context, goals, or concerns..."
              className="w-full border-[1.5px] border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-900 bg-gray-50 outline-none resize-y transition-colors duration-150 leading-relaxed focus:border-brand-400 focus:bg-white"
              rows={3}
            />
          </F>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 text-xs text-amber-800 leading-relaxed mt-6">
            <strong>Regulatory notice:</strong> This assessment is for informational purposes only and does not constitute
            financial, investment, tax, or legal advice. All information is confidential. Consult a licensed financial
            advisor before making investment decisions. Subject to FINRA and SEC regulations.
          </div>
        </>}

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
          {step>0
            ? <button
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={goBack}
              >← Back</button>
            : <div className="hidden sm:block" />
          }
          <div className="flex items-center justify-between sm:justify-end gap-3.5">
            <span className="text-xs text-gray-400 font-medium">{step+1} / {STEPS.length}</span>
            {step<STEPS.length-1
              ? <button
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                  onClick={goNext}
                >Continue →</button>
              : <button
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={submit}
                  disabled={loading}
                >
                  {loading ? 'Submitting…' : 'Submit Assessment ✓'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
