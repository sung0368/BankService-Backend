import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'

export default function Login() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await login(userId, password)
      /**
       * [리팩토링] 로그인 성공 시 토큰 저장
       * - 기존: HttpSession → 서버가 로그인 상태 보관
       * - 변경: JWT를 localStorage에 저장, 이후 모든 API 요청에 자동 첨부
       *         accessExpiresIn: Navbar 타이머에서 남은 시간 표시에 사용
       *         refreshToken: 토큰 갱신 시 사용 (httpOnly Cookie에도 중복 저장됨)
       */
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('userName', data.userName)
      localStorage.setItem('accessExpiresIn', data.accessExpiresIn)
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>로그인</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="아이디"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit">로그인</button>
        </form>
        <p style={styles.link}>
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' },
  card: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '360px' },
  title: { textAlign: 'center', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
  button: { padding: '12px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' },
  error: { color: 'red', fontSize: '13px', margin: 0 },
  link: { textAlign: 'center', marginTop: '16px', fontSize: '14px' },
}
