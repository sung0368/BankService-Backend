import http from 'k6/http'
import { check } from 'k6'

// 이체 내역 대량 생성 스크립트
// kingsiwoo ↔ kinghong 왕복 이체로 잔액 유지
export const options = {
  vus: 1,
  iterations: 500, // 총 500건 이체
}

const TOKEN_A = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJraW5nc2l3b28iLCJyb2xlIjoiVVNFUiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzQ2OTgxODksImV4cCI6MTc3NDcwMTc4OX0.ye9UYL9zhbMI7dgCbLszwWd-abKZxmP-x953abkeIRg' // kingsiwoo
const TOKEN_B = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJraW5naG9uZyIsInJvbGUiOiJVU0VSIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc3NDY5ODE4OSwiZXhwIjoxNzc0NzAxNzg5fQ.JotKpQTZp1V_-DAduIvXmfKVUrJLOFBvY9057eXZVcs' // kinghong

const ACCOUNT_A = '110-965952-24' // kingsiwoo
const ACCOUNT_B = '110-255405-46' // kinghong

export default function () {
  // 짝수 VU: A→B, 홀수 VU: B→A (잔액 균형 유지)
  const isAtoB = __VU % 2 === 0
  const token = isAtoB ? TOKEN_A : TOKEN_B
  const from  = isAtoB ? ACCOUNT_A : ACCOUNT_B
  const to    = isAtoB ? ACCOUNT_B : ACCOUNT_A
  const pin   = '1234'

  const res = http.post(
    'http://localhost:8080/api/transfer',
    JSON.stringify({ fromAccountNumber: from, toAccountNumber: to, amount: '1000', pin }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
  )

  check(res, { '200 성공': (r) => r.status === 200 })
  if (res.status !== 200) {
    console.log(`실패 status: ${res.status} | body: ${res.body}`)
  }
}
