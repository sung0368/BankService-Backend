import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Home() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName') || '사용자'

  return (
    <div style={styles.container}>
      <Navbar />

      <main style={styles.main}>
        <h2>환영합니다, {userName}님!</h2>
        <p style={styles.subtext}>Bank Service 홈 화면입니다.</p>

        <div style={styles.menuGrid}>
          <div style={styles.menuCard} onClick={() => navigate('/account/open')}>
            <span style={styles.menuIcon}>🏦</span>
            <span>계좌 개설</span>
          </div>
        </div>
      </main>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5' },
  main: { maxWidth: '800px', margin: '60px auto', padding: '0 20px' },
  subtext: { color: '#666', marginBottom: '40px' },
  menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' },
  menuCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '30px 20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: '15px', fontWeight: '500' },
  menuIcon: { fontSize: '32px' },
}
