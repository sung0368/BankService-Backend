import http from 'k6/http'
import { check } from 'k6'

// 이체 내역 조회 부하 테스트
export const options = {
  vus: 50,        // 동시 사용자 50명
  duration: '30s', // 30초 동안 반복
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
