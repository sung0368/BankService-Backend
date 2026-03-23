import client from './client'

export const openAccount = async (product, password) => {
  const res = await client.post('/accounts', { product, password })
  return res.data
}
