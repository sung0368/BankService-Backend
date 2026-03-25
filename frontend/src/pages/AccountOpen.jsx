import { useState, useEffect, useRef } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { openAccount, verifyIdentity } from '../api/account'
import Navbar from '../components/Navbar'

const PRODUCTS = [
  { value: '365 SUPER 계좌', label: '365 SUPER 계좌' },
  { value: '적금계좌', label: '적금계좌' },
]

const JOB_TYPES = ['직장인', '자영업자', '학생', '주부', '무직', '기타']
const TRADE_PURPOSES = ['급여/생활비', '저축/투자', '사업', '기타']
const FUND_SOURCES = ['근로소득', '사업소득', '증여/상속', '금융소득', '기타']

const TERMS = [
  {
    title: '제1조 (목적)',
    body: '이 약관은 Bank Service(이하 "은행")가 제공하는 계좌 개설 서비스의 이용 조건 및 절차, 은행과 고객 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (계좌 개설)',
    body: '고객은 은행이 정한 절차에 따라 본인 확인을 완료한 후 계좌를 개설할 수 있습니다. 계좌 개설 시 고객이 제공한 정보는 금융실명거래 및 비밀보장에 관한 법률에 따라 처리됩니다.',
  },
  {
    title: '제3조 (개인정보 수집 및 이용)',
    body: '은행은 계좌 개설 및 금융서비스 제공을 위해 이름, 주민등록번호, 연락처, 주소 등 필요한 최소한의 개인정보를 수집·이용합니다. 수집된 개인정보는 서비스 제공 목적 외에 활용되지 않습니다.',
  },
  {
    title: '제4조 (고객의 의무)',
    body: '고객은 계좌를 불법적인 용도(자금세탁, 사기, 보이스피싱 등)로 사용하여서는 안 됩니다. 위반 시 은행은 해당 계좌를 즉시 정지 또는 해지할 수 있습니다.',
  },
  {
    title: '제5조 (면책)',
    body: '고객의 귀책사유로 발생한 계좌 정보 유출, 비밀번호 노출 등으로 인한 손해에 대해 은행은 책임을 지지 않습니다. 단, 은행의 고의 또는 중대한 과실로 인한 손해는 예외로 합니다.',
  },
]

/**
 * [리팩토링] 계좌 개설 페이지
 * - 기존: account/open.html Thymeleaf 단일 페이지 폼
 * - 변경: React 3단계 스텝 플로우로 재구현
 *         Step 1: 약관 동의 → Step 2: 계좌 정보 → Step 3: 개인정보 + 계좌 비밀번호
 */
const STEPS = ['약관 동의', '계좌 정보', '개인정보']

export default function AccountOpen() {
  const [step, setStep] = useState(1)

  // 모든 입력값을 하나의 form 객체로 관리 (개별 useState 남발 방지)
  const [form, setForm] = useState({
    product: '365 SUPER 계좌', name: '', ssn: '', phone: '',
    password: '', passwordConfirm: '',
    jobType: '', tradePurpose: '', fundSource: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)       // 본인인증 완료 여부
  const [verifyErrors, setVerifyErrors] = useState({})   // 필드별 에러 메시지
  const [result, setResult] = useState(null)             // 계좌 개설 완료 정보
  const navigate = useNavigate()

  /**
   * [리팩토링] setTimeout 정리용 ref
   * - 성공 후 1.5초 뒤 /home 이동하는 타이머
   * - 컴포넌트가 언마운트되면 타이머를 정리해 메모리 누수 방지
   */
  const timerRef = useRef(null)
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    // 입력값이 바뀌면 인증 초기화 (정보 수정 후 재인증 필요)
    if (['name', 'ssn', 'phone'].includes(e.target.name)) {
      setVerified(false)
      setVerifyErrors({})
    }
  }

  const handleVerify = async () => {
    setVerifyErrors({})
    if (!form.name || !form.ssn || !form.phone) {
      setVerifyErrors({ general: '이름, 주민등록번호, 휴대폰번호를 모두 입력해주세요.' })
      return
    }
    try {
      await verifyIdentity(form.name, form.ssn, form.phone)
      setVerified(true)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setVerifyErrors(data)
      } else {
        setVerifyErrors({ general: '본인인증에 실패했습니다.' })
      }
    }
  }

  const handleSubmit = async (e) => {
    // 클라이언트 사이드 비밀번호 유효성 검사
    if (form.password.length < 4) {
      setPwError('비밀번호는 4자리 이상이어야 합니다.')
      return
    }
    if (form.password !== form.passwordConfirm) {
      setPwError('비밀번호가 일치하지 않습니다.')
      return
    }
    setPwError('')
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const data = await openAccount(form.product, form.password)
      setResult(data)
    } catch (err) {
      /**
       * [리팩토링] 에러 처리 개선
       * - 기존: "계좌 개설에 실패했습니다." 고정 메시지
       * - 변경: GlobalExceptionHandler가 JSON으로 에러를 반환하므로
       *         실제 서버 에러 메시지를 화면에 표시
       *         HTML 응답(500 에러 페이지)이 올 경우도 별도 처리
       */
      const data = err.response?.data
      if (data && typeof data === 'object' && data.message) {
        setError(data.message)
      } else if (typeof data === 'string' && data.includes('<html')) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        setError(data?.message || '계좌 개설에 실패했습니다.')
      }
    }
  }

  // 계좌 개설 완료 화면
  if (result) {
    return (
      <div style={s.wrap}>
        <Navbar />
        <div style={s.pageContainer}>
          <div style={s.sidebar}>
            <h3 style={s.sidebarTitle}>계좌 서비스</h3>
            <NavLink to="/account/open" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>계좌 개설</NavLink>
            <NavLink to="/account/lookup" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>계좌 조회</NavLink>
            <NavLink to="/transfer" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>계좌 이체</NavLink>
            <NavLink to="/account/history" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>거래 내역 조회</NavLink>
            <NavLink to="/transfer/history" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>이체 내역 조회</NavLink>
          </div>
          <div style={s.content}>
            <div style={s.formContainer}>
              <div style={s.successIcon}>✓</div>
              <h2 style={s.successTitle}>계좌 개설 완료</h2>
              <p style={s.successSubtitle}>계좌 개설이 성공적으로 완료되었습니다.</p>
              <div style={s.resultBox}>
                <div style={s.resultRow}>
                  <span style={s.resultLabel}>상품명</span>
                  <span style={s.resultValue}>{result.product}</span>
                </div>
                <div style={s.resultRow}>
                  <span style={s.resultLabel}>계좌번호</span>
                  <span style={s.resultValue}>{result.accountNumber}</span>
                </div>
                <div style={s.resultRow}>
                  <span style={s.resultLabel}>발급일시</span>
                  <span style={s.resultValue}>{result.createdAt}</span>
                </div>
              </div>
              <button style={s.yesBtn} onClick={() => navigate('/home')}>홈으로 이동</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <Navbar />

      <div style={s.pageContainer}>

        <div style={s.sidebar}>
          <h3 style={s.sidebarTitle}>계좌 서비스</h3>
          <NavLink to="/account/open" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>계좌 개설</NavLink>
          <NavLink to="/account/lookup" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>계좌 조회</NavLink>
          <NavLink to="/account/history" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>거래 내역 조회</NavLink>
        </div>

        <div style={s.content}>

          {/* 단계 표시 */}
          <div style={s.stepBar}>
            {STEPS.map((label, i) => (
              <div key={i} style={s.stepWrap}>
                <div style={s.stepCircle(step > i + 1, step === i + 1)}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={s.stepLabel(step === i + 1)}>{label}</span>
                {i < STEPS.length - 1 && <div style={s.stepLine(step > i + 1)} />}
              </div>
            ))}
          </div>

          <div style={s.formContainer}>

            {/* ── STEP 1: 약관 동의 ── */}
            {step === 1 && (
              <>
                <h2 style={s.formTitle}>계좌 개설 약관 동의</h2>
                <div style={s.termsBox}>
                  {TERMS.map((t, i) => (
                    <div key={i} style={s.termItem}>
                      <p style={s.termTitle}>{t.title}</p>
                      <p style={s.termBody}>{t.body}</p>
                    </div>
                  ))}
                </div>
                <p style={s.agreeQuestion}>위 약관에 동의하십니까?</p>
                <div style={s.rowButtons}>
                  <button style={s.noBtn} onClick={() => navigate('/home')}>아니오</button>
                  <button style={s.yesBtn} onClick={() => setStep(2)}>예</button>
                </div>
              </>
            )}

            {/* ── STEP 2: 계좌 정보 ── */}
            {step === 2 && (
              <>
                <h2 style={s.formTitle}>계좌 정보 입력</h2>
                <div style={s.formGroup}>
                  <label style={s.label}>상품명</label>
                  <select style={s.input} name="product" value={form.product} onChange={handleChange}>
                    {PRODUCTS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <h3 style={s.sectionTitle}>본인 인증</h3>

                <div style={s.formGroup}>
                  <label style={s.label}>이름</label>
                  <input
                    style={{ ...s.input, borderColor: verifyErrors.name ? '#e53935' : '#ccc' }}
                    type="text" name="name" value={form.name} onChange={handleChange} required
                  />
                  {verifyErrors.name && <p style={s.fieldError}>{verifyErrors.name}</p>}
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>주민등록번호</label>
                  <input
                    style={{ ...s.input, borderColor: verifyErrors.ssn ? '#e53935' : '#ccc' }}
                    type="text" name="ssn" placeholder="예: 900101-1234567" value={form.ssn} onChange={handleChange} required
                  />
                  {verifyErrors.ssn && <p style={s.fieldError}>{verifyErrors.ssn}</p>}
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>휴대폰번호</label>
                  <div style={s.phoneBox}>
                    <input
                      style={{ ...s.input, flex: 1, borderColor: verifyErrors.phone ? '#e53935' : '#ccc' }}
                      type="text" name="phone" placeholder="010-0000-0000" value={form.phone} onChange={handleChange} required
                    />
                    <button
                      type="button"
                      style={{ ...s.verifyBtn, background: verified ? '#4caf50' : '#003366' }}
                      onClick={handleVerify}
                    >
                      {verified ? '인증완료' : '본인확인'}
                    </button>
                  </div>
                  {verifyErrors.phone && <p style={s.fieldError}>{verifyErrors.phone}</p>}
                </div>

                {verifyErrors.general && <p style={s.error}>{verifyErrors.general}</p>}
                {verified && <p style={s.success}>본인인증이 완료되었습니다.</p>}

                <div style={s.rowButtons}>
                  <button style={s.noBtn} onClick={() => setStep(1)}>이전</button>
                  <button
                    style={{ ...s.yesBtn, opacity: verified ? 1 : 0.5 }}
                    disabled={!verified}
                    onClick={() => setStep(3)}
                  >
                    다음
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3: 개인정보 ── */}
            {step === 3 && (
              <>
                <h2 style={s.formTitle}>개인정보</h2>

                <div style={s.formGroup}>
                  <label style={s.label}>직업구분</label>
                  <select style={s.input} name="jobType" value={form.jobType} onChange={handleChange} required>
                    <option value="">-- 선택하세요 --</option>
                    {JOB_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>거래목적</label>
                  <select style={s.input} name="tradePurpose" value={form.tradePurpose} onChange={handleChange} required>
                    <option value="">-- 선택하세요 --</option>
                    {TRADE_PURPOSES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>거래자금원천</label>
                  <select style={s.input} name="fundSource" value={form.fundSource} onChange={handleChange} required>
                    <option value="">-- 선택하세요 --</option>
                    {FUND_SOURCES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <h3 style={s.sectionTitle}>계좌 비밀번호</h3>

                <div style={s.formGroup}>
                  <label style={s.label}>비밀번호</label>
                  <div style={s.pwBox}>
                    <input
                      style={{ ...s.input, flex: 1 }}
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      placeholder="4자리 이상"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <button type="button" style={s.eyeBtn} onClick={() => setShowPw((v) => !v)}>
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>비밀번호 확인</label>
                  <input
                    style={{
                      ...s.input,
                      borderColor: form.passwordConfirm && form.password !== form.passwordConfirm ? '#e53935' : '#ccc',
                    }}
                    type="password"
                    name="passwordConfirm"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={form.passwordConfirm}
                    onChange={handleChange}
                  />
                  {form.passwordConfirm && form.password !== form.passwordConfirm && (
                    <p style={s.fieldError}>비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>

                {pwError && <p style={s.error}>{pwError}</p>}
                {error && <p style={s.error}>{error}</p>}
                {message && <p style={s.success}>{message}</p>}

                <div style={s.rowButtons}>
                  <button style={s.noBtn} onClick={() => setStep(2)}>이전</button>
                  <button
                    style={{ ...s.yesBtn, opacity: (!form.jobType || !form.tradePurpose || !form.fundSource) ? 0.5 : 1 }}
                    disabled={!form.jobType || !form.tradePurpose || !form.fundSource}
                    onClick={handleSubmit}
                  >
                    계좌 개설
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: { minHeight: '100vh', background: '#fff', fontFamily: 'Arial, sans-serif' },
  pageContainer: { display: 'flex' },

  sidebar: {
    width: '220px', background: '#f0f3f7', padding: '30px 20px',
    borderRight: '1px solid #ddd', minHeight: 'calc(100vh - 70px)',
  },
  sidebarTitle: { marginBottom: '20px', color: '#003366' },
  sideLink: { display: 'block', padding: '10px 0', textDecoration: 'none', fontWeight: '600' },

  content: { flex: 1, padding: '40px' },

  // 단계 표시
  stepBar: { display: 'flex', alignItems: 'center', maxWidth: '500px', margin: '0 auto 30px' },
  stepWrap: { display: 'flex', alignItems: 'center', flex: 1 },
  stepCircle: (done, active) => ({
    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 'bold',
    background: done ? '#4caf50' : active ? '#003366' : '#ddd',
    color: (done || active) ? 'white' : '#999',
  }),
  stepLabel: (active) => ({
    fontSize: '12px', marginLeft: '6px', fontWeight: active ? 'bold' : 'normal',
    color: active ? '#003366' : '#999', whiteSpace: 'nowrap',
  }),
  stepLine: (done) => ({
    flex: 1, height: '2px', margin: '0 8px',
    background: done ? '#4caf50' : '#ddd',
  }),

  formContainer: { maxWidth: '500px', margin: '0 auto', background: '#f7f7f7', padding: '30px', borderRadius: '6px' },
  formTitle: { textAlign: 'center', marginBottom: '24px' },

  // 완료 화면
  successIcon: {
    width: '64px', height: '64px', borderRadius: '50%', background: '#4caf50',
    color: 'white', fontSize: '32px', fontWeight: 'bold',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: { textAlign: 'center', color: '#003366', marginBottom: '8px' },
  successSubtitle: { textAlign: 'center', color: '#555', marginBottom: '28px', fontSize: '14px' },
  resultBox: {
    background: 'white', border: '1px solid #ddd', borderRadius: '6px',
    padding: '20px', marginBottom: '24px',
  },
  resultRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #f0f0f0',
  },
  resultLabel: { color: '#888', fontSize: '14px' },
  resultValue: { color: '#003366', fontWeight: 'bold', fontSize: '14px' },
  sectionTitle: { marginBottom: '16px', color: '#333' },

  termsBox: {
    height: '300px', overflowY: 'scroll', border: '1px solid #ccc',
    background: 'white', padding: '16px', marginBottom: '20px',
    fontSize: '13px', lineHeight: '1.7',
  },
  termItem: { marginBottom: '20px' },
  termTitle: { fontWeight: 'bold', color: '#003366', marginBottom: '6px' },
  termBody: { margin: 0, color: '#444' },

  agreeQuestion: { textAlign: 'center', fontWeight: 'bold', fontSize: '15px', margin: '0 0 16px' },

  formGroup: { marginBottom: '20px' },
  label: { fontWeight: 'bold', display: 'block', marginBottom: '6px' },
  input: { width: '100%', padding: '10px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' },

  phoneBox: { display: 'flex', gap: '10px' },
  verifyBtn: { background: '#003366', color: 'white', border: 'none', padding: '10px 16px', cursor: 'pointer', whiteSpace: 'nowrap' },

  pwBox: { display: 'flex', gap: '8px', alignItems: 'center' },
  eyeBtn: { background: 'none', border: '1px solid #ccc', padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '16px' },
  fieldError: { color: '#e53935', fontSize: '12px', margin: '4px 0 0' },

  rowButtons: { display: 'flex', gap: '12px', marginTop: '8px' },
  noBtn: { flex: 1, padding: '12px', background: '#eee', border: 'none', fontSize: '15px', cursor: 'pointer', borderRadius: '4px' },
  yesBtn: { flex: 1, padding: '12px', background: '#003366', color: 'white', border: 'none', fontSize: '15px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' },

  error: { color: 'red', fontSize: '13px', marginBottom: '12px' },
  success: { color: 'green', fontSize: '13px', marginBottom: '12px' },
}
