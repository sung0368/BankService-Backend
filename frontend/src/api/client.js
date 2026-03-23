import axios from 'axios'

/**
 * [리팩토링] axios 인스턴스 생성
 * - 기존: Thymeleaf form submit으로 서버에 요청
 * - 변경: axios 인스턴스로 통일
 *         baseURL '/api' → Vite 프록시가 localhost:8080으로 전달
 *         withCredentials: true → httpOnly Cookie(refreshToken) 자동 전송
 */
const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

/**
 * [리팩토링] 요청 인터셉터 추가
 * - 기존: 인증 없이 요청, 서버가 세션으로 사용자 식별
 * - 변경: 모든 요청에 localStorage의 accessToken을 Authorization 헤더에 자동 추가
 *         각 API 함수마다 헤더를 직접 설정할 필요 없음
 */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * [리팩토링] 응답 인터셉터 추가 - AccessToken 자동 갱신
 * - 기존: 토큰 만료 시 로그인 페이지로 강제 이동
 * - 변경: 401 응답 시 refreshToken으로 accessToken 재발급 후 원래 요청 재시도
 *         사용자는 토큰 만료를 인식하지 못하고 서비스 이용 가능
 *
 * 흐름:
 *   1. API 요청 → 401 응답
 *   2. /api/auth/refresh 호출
 *   3. 새 accessToken을 localStorage에 저장
 *   4. 원래 요청을 새 토큰으로 재시도
 *   5. refresh도 실패 → localStorage 초기화 + /login 이동
 */
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const res = await axios.post('/api/auth/refresh', { refreshToken }, { withCredentials: true })
        const newAccessToken = res.data.accessToken

        localStorage.setItem('accessToken', newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return client(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default client
