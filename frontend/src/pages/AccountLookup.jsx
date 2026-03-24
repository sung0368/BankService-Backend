import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getAccounts, changePin, closeAccount } from '../api/account'
import Navbar from '../components/Navbar'

export default function AccountLookup() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  // 비밀번호 수정 모달
  const [pinModal, setPinModal] = useState(false)
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', newPinConfirm: '' })
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')

  // 해지 모달
  const [closeModal, setCloseModal] = useState(false)
  const [closePin, setClosePin] = useState('')
  const [closeError, setCloseError] = useState('')

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch(() => setError('계좌 정보를 불러오는데 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (accountNumber) => {
    setSelected(prev => prev === accountNumber ? null : accountNumber)
  }

  // 비밀번호 수정 제출
  const handleChangePin = async () => {
    setPinError('')
    setPinSuccess('')
    if (!pinForm.currentPin || !pinForm.newPin || !pinForm.newPinConfirm) {
      setPinError('모든 항목을 입력해주세요.')
      return
    }
    if (pinForm.newPin.length < 4) {
      setPinError('새 비밀번호는 4자리 이상이어야 합니다.')
      return
    }
    if (pinForm.newPin !== pinForm.newPinConfirm) {
      setPinError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    try {
      await changePin(selected, pinForm.currentPin, pinForm.newPin)
      setPinSuccess('비밀번호가 변경되었습니다.')
      setPinForm({ currentPin: '', newPin: '', newPinConfirm: '' })
    } catch (err) {
      setPinError(err.response?.data?.message || '비밀번호 변경에 실패했습니다.')
    }
  }

  const closePinModal = () => {
    setPinModal(false)
    setPinForm({ currentPin: '', newPin: '', newPinConfirm: '' })
    setPinError('')
    setPinSuccess('')
  }

  // 해지 제출
  const handleCloseAccount = async () => {
    setCloseError('')
    if (!closePin) {
      setCloseError('비밀번호를 입력해주세요.')
      return
    }
    try {
      await closeAccount(selected, closePin)
      setAccounts(prev => prev.filter(a => a.accountNumber !== selected))
      setSelected(null)
      setCloseModal(false)
      setClosePin('')
    } catch (err) {
      setCloseError(err.response?.data?.message || '계좌 해지에 실패했습니다.')
    }
  }

  const closeCloseModal = () => {
    setCloseModal(false)
    setClosePin('')
    setCloseError('')
  }

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
        </div>

        <div style={s.content}>
          <h2 style={s.title}>계좌조회</h2>

          {loading && <p style={s.info}>불러오는 중...</p>}
          {error && <p style={s.error}>{error}</p>}

          {!loading && !error && (
            <>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={{ ...s.th, width: '60px', textAlign: 'center' }}>선택</th>
                    <th style={s.th}>상품명</th>
                    <th style={s.th}>계좌번호</th>
                    <th style={s.th}>발급일시</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={s.empty}>개설된 계좌가 없습니다.</td>
                    </tr>
                  ) : (
                    accounts.map((account) => (
                      <tr
                        key={account.accountNumber}
                        style={{ ...s.tr, background: selected === account.accountNumber ? '#f0f4ff' : 'white' }}
                        onClick={() => handleSelect(account.accountNumber)}
                      >
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selected === account.accountNumber}
                            onChange={() => handleSelect(account.accountNumber)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td style={s.td}>{account.product}</td>
                        <td style={s.td}>{account.accountNumber}</td>
                        <td style={s.td}>{account.createdAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div style={s.btnRow}>
                <button
                  style={{ ...s.btn, ...s.editBtn, opacity: selected ? 1 : 0.4 }}
                  disabled={!selected}
                  onClick={() => setPinModal(true)}
                >
                  비밀번호 수정
                </button>
                <button
                  style={{ ...s.btn, ...s.closeBtn, opacity: selected ? 1 : 0.4 }}
                  disabled={!selected}
                  onClick={() => setCloseModal(true)}
                >
                  해지하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 비밀번호 수정 모달 */}
      {pinModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>계좌 비밀번호 수정</h3>
            <p style={s.modalAccount}>{selected}</p>

            <div style={s.field}>
              <label style={s.label}>현재 비밀번호</label>
              <input
                style={s.input}
                type="password"
                placeholder="현재 비밀번호"
                value={pinForm.currentPin}
                onChange={(e) => setPinForm(p => ({ ...p, currentPin: e.target.value }))}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>새 비밀번호</label>
              <input
                style={s.input}
                type="password"
                placeholder="4자리 이상"
                value={pinForm.newPin}
                onChange={(e) => setPinForm(p => ({ ...p, newPin: e.target.value }))}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>새 비밀번호 확인</label>
              <input
                style={s.input}
                type="password"
                placeholder="새 비밀번호를 다시 입력"
                value={pinForm.newPinConfirm}
                onChange={(e) => setPinForm(p => ({ ...p, newPinConfirm: e.target.value }))}
              />
            </div>

            {pinError && <p style={s.errMsg}>{pinError}</p>}
            {pinSuccess && <p style={s.sucMsg}>{pinSuccess}</p>}

            <div style={s.modalBtns}>
              <button style={{ ...s.btn, ...s.cancelBtn }} onClick={closePinModal}>취소</button>
              <button style={{ ...s.btn, ...s.editBtn }} onClick={handleChangePin}>변경</button>
            </div>
          </div>
        </div>
      )}

      {/* 해지 확인 모달 */}
      {closeModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>계좌 해지</h3>
            <p style={s.modalAccount}>{selected}</p>
            <p style={s.modalWarning}>해지된 계좌는 복구할 수 없습니다.<br />비밀번호를 입력하여 해지를 확인해주세요.</p>

            <div style={s.field}>
              <label style={s.label}>계좌 비밀번호</label>
              <input
                style={s.input}
                type="password"
                placeholder="비밀번호 입력"
                value={closePin}
                onChange={(e) => setClosePin(e.target.value)}
              />
            </div>

            {closeError && <p style={s.errMsg}>{closeError}</p>}

            <div style={s.modalBtns}>
              <button style={{ ...s.btn, ...s.cancelBtn }} onClick={closeCloseModal}>취소</button>
              <button style={{ ...s.btn, ...s.closeBtn }} onClick={handleCloseAccount}>해지 확인</button>
            </div>
          </div>
        </div>
      )}
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
  tr: { borderBottom: '1px solid #eee', cursor: 'pointer' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' },

  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
  btn: { padding: '10px 20px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  editBtn: { background: '#003366', color: 'white' },
  closeBtn: { background: '#e53935', color: 'white' },
  cancelBtn: { background: '#eee', color: '#333' },

  // 모달
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: 'white', borderRadius: '8px', padding: '32px', width: '380px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  modalTitle: { margin: '0 0 6px', color: '#003366' },
  modalAccount: { color: '#666', fontSize: '13px', margin: '0 0 20px' },
  modalWarning: { color: '#e53935', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' },
  modalBtns: { display: 'flex', gap: '10px', marginTop: '20px' },

  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' },
  input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' },

  errMsg: { color: '#e53935', fontSize: '13px', margin: '4px 0 0' },
  sucMsg: { color: '#4caf50', fontSize: '13px', margin: '4px 0 0' },

  info: { color: '#999', fontSize: '14px' },
  error: { color: 'red', fontSize: '14px' },
}
