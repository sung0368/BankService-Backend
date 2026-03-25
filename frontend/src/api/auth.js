import client from './client'
import axios from 'axios'

export const login = async (userId, password) => {
  const res = await axios.post('/api/auth/login', { userId, password }, { withCredentials: true })
  return res.data
}

export const logout = async (refreshToken) => {
  await client.post('/auth/logout', { refreshToken })
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userName')
  localStorage.removeItem('accessDuration')
  localStorage.removeItem('accessExpiresAt')
}

export const signup = async (data) => {
  await axios.post('/api/users', data)
}
