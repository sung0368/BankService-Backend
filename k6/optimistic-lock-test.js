import http from 'k6/http'
import { check } from 'k6'

// 동시 이체 요청으로 낙관적 잠금(Optimistic Lock) 동작 검증
export const options = {
  vus: 5,        // 동시 사용자 5명
  iterations: 5, // 총 5번 요청 (동시에)
}

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJraW5nc2l3b28iLCJyb2xlIjoiVVNFUiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzQ2NzA4MzcsImV4cCI6MTc3NDY3MTQzN30.SamHXuWzYq8ttXT9INsGhQv-g_6FoYeuut43vqVtzNs'

export default function () {
  const res = http.post(
    'http://localhost:8080/api/transfer',
    JSON.stringify({
      fromAccountNumber: '110-965952-24',
      toAccountNumber: '110-255405-46',
      amount: '5000000',
      pin: '1234',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  )

  check(res, {
    '200 성공': (r) => r.status === 200,
    '400 잔액부족': (r) => r.status === 400,
  })

  console.log(`status: ${res.status} | body: ${res.body}`)
}
