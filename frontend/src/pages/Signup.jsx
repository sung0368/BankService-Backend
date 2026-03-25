import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api/auth'

const FIELDS = [
  { name: 'userId',         label: '아이디',   type: 'text',     placeholder: '영문/숫자 5~20자' },
  { name: 'password',       label: '비밀번호', type: 'password', placeholder: '8자 이상, 영문·숫자·특수문자 포함' },
  { name: 'name',           label: '이름',     type: 'text',     placeholder: '한글 2~10자' },
  { name: 'email',          label: '이메일',   type: 'email',    placeholder: 'example@email.com' },
  { name: 'residentNumber', label: '주민번호', type: 'text',     placeholder: '901010-1234567' },
  { name: 'phone',          label: '전화번호', type: 'text',     placeholder: '010-1234-5678' },
  { name: 'address',        label: '주소',     type: 'text',     placeholder: '주소를 입력하세요' },
]

export default function Signup() {
  const [form, setForm] = useState({
    userId: '', password: '', name: '', email: '',
    residentNumber: '', phone: '', address: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // 입력 시 해당 필드 에러 지우기
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    try {
      await signup(form)
      navigate('/login')
    } catch (err) {
      console.error('Signup error:', err)
      const data = err.response?.data

      if (!err.response) {
        // 서버 연결 실패 (CORS, 서버 꺼짐 등)
        setFieldErrors({ general: `서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.` })
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // { userId: "...", phone: "..." } 형태 (우리 GlobalExceptionHandler)
        // 또는 { status: 400, message: "...", error: "..." } Spring 기본 형태
        const knownFields = ['userId','password','name','email','residentNumber','phone','address']
        const hasFieldError = Object.keys(data).some(k => knownFields.includes(k))

        if (hasFieldError) {
          setFieldErrors(data)
        } else {
          // Spring Boot 기본 에러 형식
          const msg = data.message || data.error || JSON.stringify(data)
          setFieldErrors({ general: `서버 오류: ${msg}` })
        }
      } else if (typeof data === 'string' && data.includes('<html')) {
        // HTML 에러 페이지 (500 등)
        setFieldErrors({ general: `서버 내부 오류 (HTTP ${err.response.status}). 백엔드 로그를 확인하세요.` })
      } else {
        setFieldErrors({ general: data || '회원가입에 실패했습니다.' })
      }
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>회원가입</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {FIELDS.map((f) => (
            <div key={f.name} style={styles.fieldWrapper}>
              <label style={styles.label}>{f.label}</label>
              <input
                style={{
                  ...styles.input,
                  borderColor: fieldErrors[f.name] ? '#e53935' : '#ddd',
                }}
                type={f.type}
                name={f.name}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={handleChange}
                required
              />
              {fieldErrors[f.name] && (
                <p style={styles.fieldError}>{fieldErrors[f.name]}</p>
              )}
            </div>
          ))}

          {fieldErrors.general && (
            <p style={styles.generalError}>{fieldErrors.general}</p>
          )}

          <button style={styles.button} type="submit">가입하기</button>
        </form>
        <p style={styles.link}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5', padding: '20px' },
  card: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '420px' },
  title: { textAlign: 'center', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '4px' },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', outline: 'none' },
  fieldError: { color: '#e53935', fontSize: '12px', margin: 0 },
  generalError: { color: '#e53935', fontSize: '13px', textAlign: 'center', margin: '4px 0' },
  button: { marginTop: '8px', padding: '12px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' },
  link: { textAlign: 'center', marginTop: '16px', fontSize: '14px' },
}
