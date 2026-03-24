import client from './client'

export const verifyIdentity = async (name, ssn, phone) => {
  const res = await client.post('/accounts/verify-identity', { name, ssn, phone })
  return res.data
}

export const openAccount = async (product, password) => {
  const res = await client.post('/accounts', { product, password })
  return res.data
}
