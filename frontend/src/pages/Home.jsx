import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Home() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName')

  return (
    <div style={s.wrap}>
      <Navbar />

      {/* 히어로 배너 */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroText}>
            <p style={s.heroSub}>대한민국 No.1 디지털 뱅킹</p>
            <h1 style={s.heroTitle}>
              언제 어디서나<br />
              <span style={s.heroAccent}>스마트하게</span> 관리하세요
            </h1>
            <p style={s.heroDesc}>
              계좌 개설부터 이체까지, 모든 금융 서비스를<br />
              한 곳에서 간편하게 이용하세요.
            </p>
            {userName ? (
              <button style={s.heroBtn} onClick={() => navigate('/account/lookup')}>
                내 계좌 바로가기 →
              </button>
            ) : (
              <div style={s.heroBtns}>
                <button style={s.heroBtn} onClick={() => navigate('/login')}>로그인</button>
                <button style={{ ...s.heroBtn, ...s.heroBtnOutline }} onClick={() => navigate('/signup')}>
                  회원가입
                </button>
              </div>
            )}
          </div>
          <div style={s.heroCard}>
            <div style={s.bankCard}>
              <div style={s.cardTop}>
                <span style={s.cardBank}>BANK SERVICE</span>
                <span style={s.cardChip} />
              </div>
              <div style={s.cardNumber}>**** **** **** 1234</div>
              <div style={s.cardBottom}>
                <span>{userName || '홍 길 동'}</span>
                <span>12/28</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 빠른 서비스 */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <h2 style={s.sectionTitle}>빠른 서비스</h2>
          <div style={s.quickGrid}>
            {[
              { icon: '📂', label: '계좌 개설', desc: '새 계좌를 개설하세요', path: '/account/open' },
              { icon: '📋', label: '계좌 조회', desc: '내 계좌 목록 확인', path: '/account/lookup' },
              { icon: '💸', label: '계좌 이체', desc: '빠르고 안전한 이체', path: '/transfer' },
              { icon: '📊', label: '거래 내역', desc: '거래 내역 조회', path: '/account/history' },
              { icon: '📜', label: '이체 내역', desc: '이체 내역 확인', path: '/transfer/history' },
            ].map((item) => (
              <div key={item.path} style={s.quickCard} onClick={() => navigate(item.path)}>
                <div style={s.quickIcon}>{item.icon}</div>
                <div style={s.quickLabel}>{item.label}</div>
                <div style={s.quickDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 이벤트 배너 */}
      <section style={s.bannerSection}>
        <div style={s.sectionInner}>
          <div style={s.bannerGrid}>
            <div style={{ ...s.banner, background: 'linear-gradient(135deg, #003366 0%, #0066cc 100%)' }}>
              <div style={s.bannerTag}>EVENT</div>
              <div style={s.bannerTitle}>신규 계좌 개설 이벤트</div>
              <div style={s.bannerDesc}>지금 개설하면 특별 혜택 제공</div>
              <button style={s.bannerBtn} onClick={() => navigate('/account/open')}>자세히 보기 →</button>
            </div>
            <div style={{ ...s.banner, background: 'linear-gradient(135deg, #1a5c38 0%, #2e8b57 100%)' }}>
              <div style={s.bannerTag}>NOTICE</div>
              <div style={s.bannerTitle}>안전한 금융 거래 안내</div>
              <div style={s.bannerDesc}>보이스피싱 예방 수칙을 확인하세요</div>
              <button style={s.bannerBtn}>확인하기 →</button>
            </div>
          </div>
        </div>
      </section>

      {/* 공지사항 */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.noticeWrap}>
            <div style={s.noticeBox}>
              <div style={s.noticeHeader}>
                <h3 style={s.noticeTitle}>공지사항</h3>
                <span style={s.noticeMore}>더보기 →</span>
              </div>
              {[
                { date: '2025.03.20', title: '[긴급] 시스템 점검 안내 (3/22 02:00~04:00)' },
                { date: '2025.03.15', title: '개인정보 처리방침 개정 안내' },
                { date: '2025.03.10', title: '모바일 뱅킹 서비스 업데이트 안내' },
                { date: '2025.03.05', title: '이체 한도 변경 안내' },
              ].map((n, i) => (
                <div key={i} style={s.noticeItem}>
                  <span style={s.noticeDate}>{n.date}</span>
                  <span style={s.noticeText}>{n.title}</span>
                </div>
              ))}
            </div>

            <div style={s.noticeBox}>
              <div style={s.noticeHeader}>
                <h3 style={s.noticeTitle}>금융 소식</h3>
                <span style={s.noticeMore}>더보기 →</span>
              </div>
              {[
                { date: '2025.03.21', title: '2025년 1분기 금리 동향 분석' },
                { date: '2025.03.18', title: '디지털 금융 서비스 확대 예정' },
                { date: '2025.03.12', title: '정기예금 금리 우대 이벤트 안내' },
                { date: '2025.03.08', title: '비대면 계좌 개설 절차 간소화' },
              ].map((n, i) => (
                <div key={i} style={s.noticeItem}>
                  <span style={s.noticeDate}>{n.date}</span>
                  <span style={s.noticeText}>{n.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 보안 안내 */}
      <section style={s.securitySection}>
        <div style={s.sectionInner}>
          <div style={s.securityGrid}>
            {[
              { icon: '🔒', title: '안전한 암호화', desc: '모든 거래는 256비트 SSL 암호화로 보호됩니다' },
              { icon: '🛡', title: '24시간 모니터링', desc: '이상 거래 감지 시스템으로 항상 안전하게' },
              { icon: '📱', title: '간편 인증', desc: 'PIN 번호로 빠르고 안전하게 인증하세요' },
            ].map((item, i) => (
              <div key={i} style={s.securityCard}>
                <span style={s.securityIcon}>{item.icon}</span>
                <div style={s.securityTitle}>{item.title}</div>
                <div style={s.securityDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer style={s.footer}>
        <div style={s.sectionInner}>
          <div style={s.footerTop}>
            <div>
              <div style={s.footerLogo}>BANK SERVICE</div>
              <div style={s.footerDesc}>고객의 신뢰를 최우선으로 생각하는 은행입니다.</div>
            </div>
            <div style={s.footerLinks}>
              {['이용약관', '개인정보처리방침', '금융소비자보호', '사이트맵'].map((t, i) => (
                <span key={i} style={s.footerLink}>{t}</span>
              ))}
            </div>
          </div>
          <div style={s.footerBottom}>
            <span>고객센터 1588-0000 (평일 09:00~18:00)</span>
            <span style={{ margin: '0 16px' }}>|</span>
            <span>© 2025 Bank Service. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

const s = {
  wrap: { minHeight: '100vh', background: '#f8f9fb', fontFamily: 'Arial, sans-serif' },

  // 히어로
  hero: { background: 'linear-gradient(135deg, #001f4d 0%, #003366 60%, #00509e 100%)', padding: '80px 24px' },
  heroInner: { maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px' },
  heroText: { flex: 1 },
  heroSub: { color: '#7eb3ff', fontSize: '14px', fontWeight: '600', letterSpacing: '2px', marginBottom: '16px' },
  heroTitle: { color: 'white', fontSize: '42px', fontWeight: '800', lineHeight: '1.3', marginBottom: '20px' },
  heroAccent: { color: '#4da6ff' },
  heroDesc: { color: '#aaccee', fontSize: '16px', lineHeight: '1.8', marginBottom: '32px' },
  heroBtns: { display: 'flex', gap: '12px' },
  heroBtn: { background: '#4da6ff', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  heroBtnOutline: { background: 'transparent', border: '2px solid #4da6ff', color: '#4da6ff' },

  // 카드
  heroCard: { flex: '0 0 320px' },
  bankCard: {
    background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
    borderRadius: '16px', padding: '28px', color: 'white',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    aspectRatio: '1.586',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  cardBank: { fontSize: '16px', fontWeight: '800', letterSpacing: '2px' },
  cardChip: { width: '40px', height: '30px', background: 'linear-gradient(135deg, #d4a843, #f0c040)', borderRadius: '6px' },
  cardNumber: { fontSize: '18px', letterSpacing: '4px', marginBottom: '24px', fontFamily: 'monospace' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600' },

  // 섹션 공통
  section: { padding: '60px 24px' },
  sectionInner: { maxWidth: '1100px', margin: '0 auto' },
  sectionTitle: { fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '32px' },

  // 빠른 서비스
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' },
  quickCard: {
    background: 'white', borderRadius: '12px', padding: '28px 16px',
    textAlign: 'center', cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    transition: 'transform 0.15s',
    border: '1px solid #eee',
  },
  quickIcon: { fontSize: '36px', marginBottom: '12px' },
  quickLabel: { fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '6px' },
  quickDesc: { fontSize: '12px', color: '#888' },

  // 배너
  bannerSection: { padding: '0 24px 60px' },
  bannerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  banner: { borderRadius: '12px', padding: '36px', color: 'white' },
  bannerTag: { fontSize: '11px', fontWeight: '700', letterSpacing: '2px', marginBottom: '12px', opacity: 0.8 },
  bannerTitle: { fontSize: '22px', fontWeight: '800', marginBottom: '8px' },
  bannerDesc: { fontSize: '14px', opacity: 0.85, marginBottom: '24px' },
  bannerBtn: { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', color: 'white', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  // 공지사항
  noticeWrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  noticeBox: { background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  noticeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  noticeTitle: { fontSize: '17px', fontWeight: '800', color: '#111' },
  noticeMore: { fontSize: '13px', color: '#003366', cursor: 'pointer', fontWeight: '600' },
  noticeItem: { display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' },
  noticeDate: { fontSize: '12px', color: '#999', whiteSpace: 'nowrap' },
  noticeText: { fontSize: '14px', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  // 보안
  securitySection: { background: '#f0f4ff', padding: '60px 24px' },
  securityGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  securityCard: { textAlign: 'center', padding: '32px 24px' },
  securityIcon: { fontSize: '40px', display: 'block', marginBottom: '16px' },
  securityTitle: { fontSize: '16px', fontWeight: '800', color: '#003366', marginBottom: '8px' },
  securityDesc: { fontSize: '13px', color: '#666', lineHeight: '1.6' },

  // 푸터
  footer: { background: '#1a1a2e', padding: '40px 24px 24px' },
  footerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #333' },
  footerLogo: { color: 'white', fontSize: '20px', fontWeight: '800', letterSpacing: '2px', marginBottom: '8px' },
  footerDesc: { color: '#888', fontSize: '13px' },
  footerLinks: { display: 'flex', gap: '24px' },
  footerLink: { color: '#888', fontSize: '13px', cgiursor: 'pointer' },
  footerBottom: { color: '#666', fontSize: '12px' },
}
