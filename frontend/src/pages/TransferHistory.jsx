import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getTransferAllHistory } from '../api/account'
import Navbar from '../components/Navbar'

// [리팩토링] 이체 내역 조회 페이지 신규 추가
export default function TransferHistory() {
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getTransferAllHistory()
      .then(setHistory)
      .catch(() => setError('이체 내역 조회에 실패했습니다.'))
  }, [])

  return (
    <div style={s.wrap}>
      <Navbar />
      <div style={s.pageContainer}>
        <Sidebar />
        <div style={s.content}>
          <h2 style={s.title}>이체 내역 조회</h2>

          {error && <p style={s.errMsg}>{error}</p>}

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>상품명</th>
                <th style={s.th}>보내는분</th>
                <th style={s.th}>받는분</th>
                <th style={s.th}>거래일시</th>
                <th style={{ ...s.th, textAlign: 'right' }}>금액</th>
                <th style={{ ...s.th, textAlign: 'right' }}>거래 후 잔액</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={s.empty}>이체 내역이 없습니다.</td>
                </tr>
              ) : (
                history.map((h, idx) => (
                  <tr key={idx} style={s.tr}>
                    <td style={s.td}>{h.product}</td>
                    <td style={s.td}>{h.sender}</td>
                    <td style={s.td}>{h.receiver}</td>
                    <td style={s.td}>{h.createdAt}</td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: '600', color: '#e53935' }}>
                      -{Number(h.amount.replace('-', '')).toLocaleString()}원
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      {Number(h.afterBalance).toLocaleString()}원
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#003366', color: 'white', padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' },

  errMsg: { color: '#e53935', fontSize: '13px', margin: '8px 0' },
}
