import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getAccounts, getTransferHistory } from '../api/account'
import Navbar from '../components/Navbar'

// [리팩토링] 거래 내역 조회 페이지 신규 추가
export default function AccountHistory() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [history, setHistory] = useState([])
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch(() => setError('계좌 정보를 불러오는데 실패했습니다.'))
  }, [])

  const handleSearch = async () => {
    setError('')
    if (!selectedAccount) {
      setError('계좌를 선택해주세요.')
      return
    }
    try {
      const data = await getTransferHistory(selectedAccount, year, month)
      setHistory(data)
      setSearched(true)
    } catch (err) {
      setError(err.response?.data?.message || '거래 내역 조회에 실패했습니다.')
    }
  }

  // 연도 옵션 (현재 연도 기준 -5년)
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y)
  }

  return (
    <div style={s.wrap}>
      <Navbar />
      <div style={s.pageContainer}>
        <Sidebar />
        <div style={s.content}>
          <h2 style={s.title}>거래 내역 조회</h2>

          <div style={s.filterBox}>
            <div style={s.field}>
              <label style={s.label}>내 계좌 선택</label>
              <select
                style={s.select}
                value={selectedAccount}
                onChange={(e) => { setSelectedAccount(e.target.value); setSearched(false) }}
              >
                <option value="">계좌를 선택해주세요</option>
                {accounts.map(a => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.product} ({a.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>월별 조회</label>
              <div style={s.dateRow}>
                <select style={s.dateSelect} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
                <select style={s.dateSelect} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
                <button style={{ ...s.btn, ...s.primaryBtn }} onClick={handleSearch}>조회</button>
              </div>
            </div>
          </div>

          {error && <p style={s.errMsg}>{error}</p>}

          {searched && (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>거래일시</th>
                  <th style={s.th}>보내는분</th>
                  <th style={s.th}>받는분</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>금액</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>잔액</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={s.empty}>해당 기간에 거래 내역이 없습니다.</td>
                  </tr>
                ) : (
                  history.map((h, idx) => {
                    const isIncome = h.amount.startsWith('+')
                    const amountNum = Number(h.amount)
                    return (
                      <tr key={idx} style={s.tr}>
                        <td style={s.td}>{h.createdAt}</td>
                        <td style={s.td}>{h.sender}</td>
                        <td style={s.td}>{h.receiver}</td>
                        <td style={{
                          ...s.td,
                          textAlign: 'right',
                          fontWeight: '600',
                          color: isIncome ? '#1565c0' : '#e53935'
                        }}>
                          {isIncome ? '+' : ''}{amountNum.toLocaleString()}원
                        </td>
                        <td style={{ ...s.td, textAlign: 'right', color: '#333' }}>
                          {Number(h.afterBalance).toLocaleString()}원
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
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
      <NavLink to="/transfer/history" style={({ isActive }) => ({ ...s.sideLink, color: isActive ? '#003366' : '#333' })}>이체 내역 조회</NavLink>
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
  title: { marginBottom: '24px', color: '#003366' },

  filterBox: {
    maxWidth: '600px', background: '#fafbfc', border: '1px solid #e0e0e0',
    borderRadius: '8px', padding: '24px', marginBottom: '24px',
  },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#333' },
  select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', background: 'white' },

  dateRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  dateSelect: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', background: 'white' },

  btn: { padding: '10px 20px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  primaryBtn: { background: '#003366', color: 'white' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#003366', color: 'white', padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' },

  errMsg: { color: '#e53935', fontSize: '13px', margin: '8px 0' },
}
