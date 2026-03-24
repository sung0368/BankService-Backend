import client from './client'

export const verifyIdentity = async (name, ssn, phone) => {
  const res = await client.post('/accounts/verify-identity', { name, ssn, phone })
  return res.data
}

export const getAccounts = async () => {
  const res = await client.get('/accounts')
  return res.data
}

export const openAccount = async (product, password) => {
  const res = await client.post('/accounts', { product, password })
  return res.data
}

export const changePin = async (accountNumber, currentPin, newPin) => {
  const res = await client.patch(`/accounts/${accountNumber}/pin`, { currentPin, newPin })
  return res.data
}

export const closeAccount = async (accountNumber, pin) => {
  const res = await client.patch(`/accounts/${accountNumber}/close`, { pin })
  return res.data
}

export const transfer = async (fromAccountNumber, toAccountNumber, amount, pin) => {
  const res = await client.post('/transfer', { fromAccountNumber, toAccountNumber, amount: String(amount), pin })
  return res.data
}
