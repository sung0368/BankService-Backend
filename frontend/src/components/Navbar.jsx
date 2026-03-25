import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

/**
 * [리팩토링] Navbar 컴포넌트 신규 작성
 * - 기존: home.html의 Thymeleaf 서버 렌더링 네비게이션 바
 * - 변경: React 컴포넌트로 재구현, 모든 페이지에서 재사용 가능
 */
export default function Navbar() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName')

  /**
   * [리팩토링] 타이머 구현 방식
   * - 기존 방식(비효율): useState로 남은 시간 관리 → 매초 컴포넌트 전체 re-render 발생
   * - 변경: useRef로 DOM 엘리먼트 직접 접근 → 상태 변경 없이 텍스트만 교체
   *         Navbar 전체가 매초 리렌더링되는 불필요한 비용 제거
   */
  const timerRef = useRef(null)

  useEffect(() => {
    if (!userName) return

    const timerEl = timerRef.current

    const tick = () => {
      const expiresAt = parseInt(localStorage.getItem('accessExpiresAt') || '0', 10)
      const remaining = Math.floor((expiresAt - Date.now()) / 1000)
      if (remaining <= 0) {
        if (timerEl) timerEl.innerText = '로그인이 만료되었습니다'
        handleLogout()
        return
      }
      const m = Math.floor(remaining / 60)
      const s = remaining % 60
      if (timerEl) {
        timerEl.innerText = `로그인 유지시간 ${String(m).padStart(2, '0')}분 ${String(s).padStart(2, '0')}초`
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [userName])

  /**
   * [리팩토링] 로그아웃
   * - 기존: 서버 세션 종료 후 로그인 페이지 리다이렉트
   * - 변경: refreshToken을 body에 담아 서버에 전송 → Redis에서 토큰 삭제
   *         성공/실패 관계없이 로컬 상태 초기화 후 /login 이동
   *         (localStorage 초기화는 auth.js의 logout() 함수에서 처리)
   */
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      await logout(refreshToken)
    } finally {
      navigate('/login')
    }
  }

  return (
    <div style={s.navbar}>
      <div style={s.navbarInner}>

        {/* 메가 메뉴 */}
        <div style={s.navGroup} className="nav-group">
          <div style={s.navLeft}>
            {['조회', '이체', '고객센터', '은행소개'].map((label, i) => (
              <a key={i} href="#" style={s.navLink}
                onClick={(e) => e.preventDefault()}>
                {label}
              </a>
            ))}
          </div>

          <div style={s.megaMenu} className="mega-menu">
            <div style={s.megaInner}>
              <div style={s.megaCol}>
                <div style={s.megaTitle}>조회</div>
                <a href="/account/open" style={s.megaLink}>계좌개설</a>
                <a href="/account/lookup" style={s.megaLink}>계좌조회</a>
                <a href="/account/history" style={s.megaLink}>거래내역조회</a>
              </div>
              <div style={s.megaCol}>
                <div style={s.megaTitle}>이체</div>
                <a href="/transfer" style={s.megaLink}>계좌이체</a>
                <a href="/transfer/history" style={s.megaLink}>이체내역 조회</a>
              </div>
              <div style={s.megaCol}>
                <div style={s.megaTitle}>고객센터</div>
                <a href="/support/complaint" style={s.megaLink}>민원접수</a>
                <a href="/support/my-complaints" style={s.megaLink}>나의 민원 내역</a>
              </div>
              <div style={s.megaCol}>
                <div style={s.megaTitle}>은행소개</div>
                <a href="/about/notices" style={s.megaLink}>공지사항</a>
                <a href="/about/intro" style={s.megaLink}>우리 은행 소개</a>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 로그인 상태 */}
        <div style={s.rightBox}>
          {userName ? (
            <>
              <div style={s.greeting}>{userName}님 안녕하세요</div>
              <div ref={timerRef} style={s.timer}>로그인 유지시간 --분 --초</div>
              <button style={s.logoutBtn} onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <a href="/login" style={s.navLink}>로그인</a>
          )}
        </div>

      </div>

      {/* 메가메뉴 hover CSS */}
      <style>{`
        .nav-group { position: relative; width: 100%; }
        .mega-menu { display: none; }
        .nav-group:hover .mega-menu { display: block; }
      `}</style>
    </div>
  )
}

const s = {
  navbar: { background: '#003366', padding: '16px 24px', position: 'relative', zIndex: 1000 },
  navbarInner: { maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center' },
  navGroup: {},
  navLeft: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center' },
  navLink: { color: 'white', textDecoration: 'none', fontSize: '18px', fontWeight: '800', padding: '12px 0', display: 'block' },
  megaMenu: {
    position: 'absolute', top: '100%', left: 0, width: '100%',
    background: 'white', boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
  },
  megaInner: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '20px 0', textAlign: 'center' },
  megaCol: { display: 'flex', flexDirection: 'column', gap: '10px' },
  megaTitle: { fontWeight: '800', color: '#003366', marginBottom: '8px' },
  megaLink: { color: '#003366', textDecoration: 'none', fontWeight: '600' },
  rightBox: { marginLeft: 'auto', color: 'white', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
  greeting: { color: 'white', fontSize: '14px' },
  timer: { color: 'white', fontSize: '13px' },
  logoutBtn: { background: 'none', border: '1px solid white', color: 'white', padding: '4px 8px', cursor: 'pointer', fontSize: '13px' },
}
