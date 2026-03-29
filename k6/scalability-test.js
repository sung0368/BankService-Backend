import http from 'k6/http'
import { check } from 'k6'

// 확장성 테스트: 10 → 50 → 100 VUs 단계별 부하
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // 10 VUs 30초
    { duration: '30s', target: 50 },   // 50 VUs 30초
    { duration: '30s', target: 100 },  // 100 VUs 30초
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // p95 1초 이내
  },
}

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJraW5nc2l3b28iLCJyb2xlIjoiVVNFUiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzQ3MDI2MDEsImV4cCI6MTc3NDcwNjIwMX0.-XdxMJK1n-9rt4S7yUXkOSV5DOupGz4G3S9y7WSf1fc'

export default function () {
  const res = http.get(
    'http://localhost:8080/api/transfer/all-history',
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  )

  check(res, {
    '200 성공': (r) => r.status === 200,
    '응답시간 500ms 이하': (r) => r.timings.duration < 500,
  })
}
