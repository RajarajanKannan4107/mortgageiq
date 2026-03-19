import React, { useState, useMemo } from 'react';

/* ── Helpers ── */
const fmt  = n => Math.round(n).toLocaleString('en-US');
const fmtD = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = n => n >= 1_000_000
  ? '$' + (n / 1_000_000).toFixed(2) + 'M'
  : '$' + fmt(n / 1000) + 'K';

/* ── Donut Chart ── */
function Donut({ principal, tax, insurance }) {
  const total = principal + tax + insurance;
  if (!total) return null;
  const r = 56, cx = 70, cy = 70, stroke = 18;
  const circ = 2 * Math.PI * r;
  const segments = [
    { val: principal, color: '#7dc98f' },
    { val: tax,       color: '#c9963a' },
    { val: insurance, color: '#6b9fc9' },
  ].filter(s => s.val > 0);

  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg className="donut-svg" width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const pct  = seg.val / total;
          const dash = pct * circ;
          const gap  = circ - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ + circ / 4}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(.22,1,.36,1)' }}
            />
          );
          offset += pct;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="DM Sans, sans-serif">Monthly</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="15" fontFamily="DM Serif Display, serif">
          ${fmt(total)}
        </text>
      </svg>
    </div>
  );
}

/* ── Tooltip ── */
function Tip({ text }) {
  return (
    <span className="tooltip-wrap">
      <i className="tooltip-icon">?</i>
      <span className="tooltip-box">{text}</span>
    </span>
  );
}

/* ── Slider Field ── */
function SliderField({ label, value, setValue, min, max, step, prefix, suffix, tooltip }) {
  const pct = ((value - min) / (max - min)) * 100;
  const bg  = `linear-gradient(to right, var(--gold) ${pct}%, var(--sand) ${pct}%)`;
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}{tooltip && <Tip text={tooltip} />}</span>
        <span className="field-value">
          {prefix}{prefix === '$' ? fmt(value) : value}{suffix}
        </span>
      </div>
      <div className="slider-track">
        <input type="range" min={min} max={max} step={step} value={value}
          style={{ background: bg }}
          onChange={e => setValue(Number(e.target.value))} />
      </div>
      <div className="slider-labels">
        <span>{prefix}{prefix === '$' ? fmt(min) : min}{suffix}</span>
        <span>{prefix}{prefix === '$' ? fmt(max) : max}{suffix}</span>
      </div>
    </div>
  );
}

/* ── Number Field ── */
function NumberField({ label, value, setValue, prefix, tooltip }) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}{tooltip && <Tip text={tooltip} />}</span>
      </div>
      <div className="input-wrap">
        {prefix && <span className="input-prefix">{prefix}</span>}
        <input type="number" value={value}
          onChange={e => setValue(Number(e.target.value) || 0)} />
      </div>
    </div>
  );
}

/* ── Loan Types ── */
const LOAN_TYPES = [
  { id: 'fixed30', label: '30-yr Fixed', icon: '🏛️', rate: 6.8  },
  { id: 'fixed15', label: '15-yr Fixed', icon: '⚡',  rate: 6.1  },
  { id: 'arm5',    label: '5/1 ARM',    icon: '📈', rate: 6.3  },
];

/* ── Main App ── */
export default function App() {
  const [homePrice, setHomePrice] = useState(450000);
  const [downPct,   setDownPct]   = useState(20);
  const [loanType,  setLoanType]  = useState('fixed30');
  const [rate,      setRate]      = useState(6.8);
  const [propTax,   setPropTax]   = useState(0.9);
  const [insurance, setInsurance] = useState(1200);
  const [hoa,       setHoa]       = useState(0);
  const [pmi,       setPmi]       = useState(true);
  const [income,    setIncome]    = useState(120000);
  const [showAmort, setShowAmort] = useState(false);

  const years    = loanType === 'fixed15' ? 15 : 30;
  const downAmt  = homePrice * (downPct / 100);
  const loanAmt  = homePrice - downAmt;
  const needsPMI = pmi && downPct < 20;

  const calc = useMemo(() => {
    const r = rate / 100 / 12;
    const n = years * 12;
    const P = loanAmt;
    const monthly = r === 0 ? P / n : P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const taxMo   = (homePrice * propTax / 100) / 12;
    const insMo   = insurance / 12;
    const pmiMo   = needsPMI ? (P * 0.005 / 12) : 0;
    const hoaMo   = hoa;
    const totalMo = monthly + taxMo + insMo + pmiMo + hoaMo;
    const totalPaid     = monthly * n;
    const totalInterest = totalPaid - P;
    const dti           = income > 0 ? (totalMo / (income / 12)) * 100 : 0;

    /* Amortization — first 24 + last 12 months */
    const amort = [];
    let bal = P;
    for (let i = 1; i <= n; i++) {
      const intPay  = bal * r;
      const prinPay = monthly - intPay;
      bal = Math.max(bal - prinPay, 0);
      if (i <= 24 || i > n - 12) amort.push({ month: i, principal: prinPay, interest: intPay, balance: bal });
      else if (i === 25) amort.push(null);
    }
    return { monthly, taxMo, insMo, pmiMo, hoaMo, totalMo, totalPaid, totalInterest, dti, amort, n };
  }, [homePrice, downPct, rate, years, loanAmt, propTax, insurance, needsPMI, hoa, income]);

  const dtiColor = calc.dti < 28 ? '#7dc98f' : calc.dti < 36 ? '#e8b850' : '#e07070';

  const handleReset = () => {
    setHomePrice(450000); setDownPct(20); setRate(6.8); setLoanType('fixed30');
    setPropTax(0.9); setInsurance(1200); setHoa(0); setPmi(true); setIncome(120000);
  };

  const steps = [
    { label: 'Property', state: 'done'   },
    { label: 'Loan',     state: 'done'   },
    { label: 'Results',  state: 'active' },
    { label: 'Apply',    state: ''       },
  ];

  return (
    <div>
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <span className="logo-mark">Mortgage<span>IQ</span></span>
          <span className="logo-tag">Smart Finance</span>
        </div>
        <div className="header-badge">Live Calculator</div>
      </header>

      {/* HERO */}
      <section className="hero">
        <p className="hero-eyebrow">Home Purchase Estimator</p>
        <h1>Know Your Numbers<br /><em>Before You Sign</em></h1>
        <p>Get an accurate monthly payment estimate — including taxes, insurance, and PMI — in seconds.</p>
      </section>

      {/* STEPS */}
      <div className="steps-bar">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className={`step-item ${s.state}`}>
              <div className="step-bubble">{s.state === 'done' ? '✓' : i + 1}</div>
              <span className="step-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-connector ${steps[i + 1].state === 'done' || s.state === 'done' ? 'done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* MAIN */}
      <main className="main">
        {/* LEFT — INPUT FORM */}
        <div className="left-col">
          <div className="card">
            <div className="card-title">Property &amp; Loan Details</div>
            <div className="card-sub">Adjust the sliders or type directly into the fields</div>

            <SliderField label="Home Price" value={homePrice} setValue={setHomePrice}
              min={50000} max={2000000} step={5000} prefix="$" suffix=""
              tooltip="Total purchase price of the property" />

            <SliderField label="Down Payment" value={downPct} setValue={setDownPct}
              min={3} max={50} step={1} prefix="" suffix="%"
              tooltip="Percentage of home price paid upfront" />

            <div className="field-info">
              Down: <strong>${fmt(downAmt)}</strong>
              &nbsp;·&nbsp;
              Loan: <strong>${fmt(loanAmt)}</strong>
              {downPct < 20 && pmi && <span className="pmi-warning">⚠ PMI required</span>}
            </div>

            <div className="divider" />

            <p className="section-label">Loan Type</p>
            <div className="tab-group">
              {LOAN_TYPES.map(lt => (
                <button key={lt.id}
                  className={`tab-btn${loanType === lt.id ? ' selected' : ''}`}
                  onClick={() => { setLoanType(lt.id); setRate(lt.rate); }}>
                  <span className="tab-icon">{lt.icon}</span>
                  {lt.label}
                </button>
              ))}
            </div>

            <SliderField label="Interest Rate" value={rate} setValue={setRate}
              min={2} max={12} step={0.05} prefix="" suffix="%"
              tooltip="Annual interest rate on your mortgage" />

            <div className="divider" />
            <p className="section-label">Additional Costs</p>

            <SliderField label="Property Tax" value={propTax} setValue={setPropTax}
              min={0.1} max={3} step={0.05} prefix="" suffix="%"
              tooltip="Annual property tax rate (varies by location)" />

            <NumberField label="Annual Home Insurance" value={insurance} setValue={setInsurance}
              prefix="$" tooltip="Annual homeowners insurance premium" />

            <NumberField label="Monthly HOA Fees" value={hoa} setValue={setHoa}
              prefix="$" tooltip="Monthly homeowners association dues" />

            <div className="divider" />

            <div className="toggle-row">
              <div>
                <div className="toggle-label">Include PMI</div>
                <div className="toggle-sub">Required when down payment &lt; 20%</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={pmi} onChange={e => setPmi(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="divider" />

            <NumberField label="Annual Gross Income" value={income} setValue={setIncome}
              prefix="$" tooltip="Used to calculate your debt-to-income ratio" />

            <span className="reset-link" onClick={handleReset}>Reset to defaults</span>
          </div>

          {/* AMORTIZATION */}
          <div className="amort-section">
            <div className="amort-toggle" onClick={() => setShowAmort(!showAmort)}>
              <div>
                <div className="amort-toggle-label">📊 Amortization Schedule</div>
                <div className="amort-toggle-sub">
                  Month-by-month breakdown for {years} years ({calc.n} payments)
                </div>
              </div>
              <span className={`amort-chevron${showAmort ? ' open' : ''}`}>▼</span>
            </div>
            {showAmort && (
              <div className="amort-table-wrap">
                <table>
                  <thead>
                    <tr><th>Month</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Balance</th></tr>
                  </thead>
                  <tbody>
                    {calc.amort.map((row, i) =>
                      row === null ? (
                        <tr key="sep" className="sep-row">
                          <td colSpan="5">· · · months 26–{calc.n - 12} omitted · · ·</td>
                        </tr>
                      ) : (
                        <tr key={i}>
                          <td>{row.month}</td>
                          <td>${fmtD(row.principal + row.interest)}</td>
                          <td className="principal-col">${fmtD(row.principal)}</td>
                          <td className="interest-col">${fmtD(row.interest)}</td>
                          <td>${fmt(row.balance)}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — RESULTS */}
        <aside className="results-card">
          <div className="results-header">
            <div className="results-title">Your Estimate</div>
            <span className="live-badge">Live</span>
          </div>

          <div className="monthly-block">
            <div className="monthly-label">Estimated Monthly Payment</div>
            <div className="monthly-amount"><sup>$</sup>{fmt(calc.totalMo)}</div>
            <div className="monthly-sub">Principal &amp; interest + taxes + insurance</div>
          </div>

          <Donut principal={calc.monthly} tax={calc.taxMo} insurance={calc.insMo + calc.pmiMo + calc.hoaMo} />

          <div className="breakdown-list">
            <div className="breakdown-row">
              <div className="breakdown-dot" style={{ background: '#7dc98f' }} />
              <span className="breakdown-name">Principal &amp; Interest</span>
              <span className="breakdown-val">${fmtD(calc.monthly)}</span>
            </div>
            <div className="breakdown-row">
              <div className="breakdown-dot" style={{ background: '#c9963a' }} />
              <span className="breakdown-name">Property Tax</span>
              <span className="breakdown-val">${fmtD(calc.taxMo)}</span>
            </div>
            <div className="breakdown-row">
              <div className="breakdown-dot" style={{ background: '#6b9fc9' }} />
              <span className="breakdown-name">Home Insurance</span>
              <span className="breakdown-val">${fmtD(calc.insMo)}</span>
            </div>
            {calc.pmiMo > 0 && (
              <div className="breakdown-row">
                <div className="breakdown-dot" style={{ background: '#b85c38' }} />
                <span className="breakdown-name">PMI</span>
                <span className="breakdown-val">${fmtD(calc.pmiMo)}</span>
              </div>
            )}
            {calc.hoaMo > 0 && (
              <div className="breakdown-row">
                <div className="breakdown-dot" style={{ background: '#9b8caa' }} />
                <span className="breakdown-name">HOA Fees</span>
                <span className="breakdown-val">${fmtD(calc.hoaMo)}</span>
              </div>
            )}
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Loan Amount</div>
              <div className="stat-val">{fmtK(loanAmt)}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Loan Term</div>
              <div className="stat-val">{years} yrs</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total Interest</div>
              <div className={`stat-val${calc.totalInterest / loanAmt > 0.5 ? ' warn' : ''}`}>
                {fmtK(calc.totalInterest)}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total Cost</div>
              <div className="stat-val">{fmtK(calc.totalPaid)}</div>
            </div>
          </div>

          <div className="afford-bar">
            <div className="afford-top">
              <span className="afford-label">Debt-to-Income Ratio</span>
              <span className="afford-pct" style={{ color: dtiColor }}>{fmtD(calc.dti)}%</span>
            </div>
            <div className="afford-track">
              <div className="afford-fill" style={{
                width: `${Math.min(calc.dti, 100)}%`,
                background: `linear-gradient(90deg, #7dc98f, ${dtiColor})`
              }} />
            </div>
            <div className="afford-msg">
              {calc.dti < 28
                ? '✓ Excellent — within recommended range'
                : calc.dti < 36
                ? '⚠ Acceptable — some lenders may restrict'
                : '✗ High — consider a larger down payment'}
            </div>
          </div>

          <button className="save-btn">↗ Get Pre-Qualified — Free</button>
        </aside>
      </main>
    </div>
  );
}
