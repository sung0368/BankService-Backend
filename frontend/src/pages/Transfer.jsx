import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getAccounts, transfer } from '../api/account'
import Navbar from '../components/Navbar'

// [리팩토링] 계좌이체 페이지 신규 추가
export default function Transfer() {
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState({
    fromAccountNumber: '',
    bank: '우리은행',
    recipient: '',
    toAccountNumber: '',
    amount: '',
    pin: '',
  })
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => setError('계좌 정보를 불러오는데 실패했습니다.'))
  }, [])

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    setError('')
  }

  const handleTransfer = async () => {
    setError('')
    if (!form.fromAccountNumber) { setError('출금 계좌를 선택해주세요.'); return }
    if (!form.toAccountNumber) { setError('입금 계좌번호를 입력해주세요.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setError('이체 금액을 올바르게 입력해주세요.'); return }
    if (!form.pin) { setError('계좌 비밀번호를 입력해주세요.'); return }

    try {
      const res = await transfer(form.fromAccountNumber, form.toAccountNumber, form.amount, form.pin)
      setResult({
        message: res.message,
        trackingId: res.trackingId,
        fromAccount: form.fromAccountNumber,
        toAccount: form.toAccountNumber,
        amount: form.amount,
      })
    } catch (err) {
      setError(err.response?.data?.message || '이체에 실패했습니다.')
    }
  }

  // 이체 완료 화면
  if (result) {
    return (
      <div style={s.wrap}>
        <Navbar />
        <div style={s.pageContainer}>
          <Sidebar />
          <div style={s.content}>
            <h2 style={s.title}>이체 완료</h2>
            <div style={s.resultBox}>
              <p style={s.resultMsg}>{result.message}</p>
              <table style={s.resultTable}>
                <tbody>
                  <tr><td style={s.resultLabel}>출금계좌</td><td style={s.resultValue}>{result.fromAccount}</td></tr>
                  <tr><td style={s.resultLabel}>입금계좌</td><td style={s.resultValue}>{result.toAccount}</td></tr>
                  <tr><td style={s.resultLabel}>이체금액</td><td style={s.resultValue}>{Number(result.amount).toLocaleString()}원</td></tr>
                </tbody>
              </table>
              <button style={{ ...s.btn, ...s.primaryBtn, marginTop: '24px' }} onClick={() => {
                setResult(null)
                setForm({ fromAccountNumber: '', bank: '우리은행', recipient: '', toAccountNumber: '', amount: '', pin: '' })
              }}>
                추가 이체
              </button>
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
        <Sidebar />
        <div style={s.content}>
          <h2 style={s.title}>계좌이체</h2>
          <h3 style={s.subtitle}>이체정보입력</h3>

          <div style={s.formBox}>
            <div style={s.field}>
              <label style={s.label}>출금계좌</label>
              <select style={s.select} value={form.fromAccountNumber} onChange={set('fromAccountNumber')}>
                <option value="">계좌를 선택해주세요</option>
                {accounts.map(a => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.product} ({a.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>입금은행</label>
              <select style={s.select} value={form.bank} onChange={set('bank')}>
                <option>우리은행</option>
                <option>국민은행</option>
                <option>신한은행</option>
                <option>하나은행</option>
                <option>농협은행</option>
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>받는분</label>
              <input style={s.input} placeholder="받는분 성함" value={form.recipient} onChange={set('recipient')} />
            </div>

            <div style={s.field}>
              <label style={s.label}>입금계좌번호</label>
              <input style={s.input} placeholder="계좌번호 입력" value={form.toAccountNumber} onChange={set('toAccountNumber')} />
            </div>

            <div style={s.field}>
              <label style={s.label}>이체금액</label>
              <input style={s.input} type="number" placeholder="금액 입력" value={form.amount} onChange={set('amount')} />
            </div>

            <div style={s.field}>
              <label style={s.label}>계좌비밀번호</label>
              <input style={s.input} type="password" placeholder="비밀번호 입력" value={form.pin} onChange={set('pin')} />
            </div>

            {error && <p style={s.errMsg}>{error}</p>}

            <button style={{ ...s.btn, ...s.primaryBtn, width: '100%', marginTop: '8px' }} onClick={handleTransfer}>
              이체하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <div style={s.sidebar}>
      <h3 style={s.sidebarTitle}>계좌 서비스</h3>
      <NavLink to="/account/open" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>계좌 개설</NavLink>
      <NavLink to="/account/lookup" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>계좌 조회</NavLink>
      <NavLink to="/transfer" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>계좌 이체</NavLink>
      <NavLink to="/account/history" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>거래 내역 조회</NavLink>
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
  title: { marginBottom: '8px', color: '#003366' },
  subtitle: { marginBottom: '24px', color: '#555', fontWeight: '500', fontSize: '16px' },

  formBox: {
    maxWidth: '480px', background: '#fafbfc', border: '1px solid #e0e0e0',
    borderRadius: '8px', padding: '32px',
  },

  field: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' },
  input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', background: 'white' },

  btn: { padding: '12px 24px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  primaryBtn: { background: '#003366', color: 'white' },

  errMsg: { color: '#e53935', fontSize: '13px', margin: '4px 0 0' },

  // 결과 화면
  resultBox: { maxWidth: '480px', textAlign: 'center', padding: '40px 0' },
  resultMsg: { fontSize: '18px', fontWeight: '700', color: '#003366', marginBottom: '24px' },
  resultTable: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  resultLabel: { padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: '#666', borderBottom: '1px solid #eee', width: '120px' },
  resultValue: { padding: '10px 16px', fontSize: '14px', color: '#333', borderBottom: '1px solid #eee' },
}
