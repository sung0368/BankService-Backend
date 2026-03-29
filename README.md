# Bank Service

Spring Boot + React 기반 은행 서비스 웹 애플리케이션

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA |
| Frontend | React 18, React Router 6, Axios, Vite |
| Database | PostgreSQL, Redis (Refresh Token 저장) |
| Auth | JWT (Access Token + Refresh Token) |
| Test | k6 (부하 테스트) |
| Build | Gradle |


## 주요 기능



- **회원 인증**: JWT AccessToken / RefreshToken 기반 인증
- **회원 가입**: 아이디, 비밀번호, 이메일, 이름, 주민등록번호, 전화번호 유효성 검증
- **계좌 개설**: 본인 인증, 계좌 비밀번호(PIN) 설정, 계좌번호 자동 생성
- **계좌 이체**: PIN 인증 후 이체, 실패 횟수 추적 및 계좌 잠금
- **동시성 제어**: 비관적 잠금(PESSIMISTIC_WRITE)으로 동시성 제어, 데드락 방지
- **거래 내역 조회**: 월별/전체 내역 조회, N+1 쿼리 최적화(배치 로딩)
- **계좌 관리**: 계좌 개설, 조회, PIN 변경, 해지


## 프로젝트 구조

```
bankservice/
├── src/main/java/com/bankservice/
│   ├── auth/                          # 인증/인가
│   │   ├── AuthController.java        #   로그인, 로그아웃, 토큰 갱신 API
│   │   ├── AuthService.java           #   인증 비즈니스 로직
│   │   ├── JwtProvider.java           #   JWT 생성/검증
│   │   ├── JwtAuthenticationFilter.java  # JWT 인증 필터
│   │   └── dto/                       #   요청/응답 DTO
│   ├── account/                       # 계좌 관리
│   │   ├── AccountController.java     #   계좌 API (개설, 조회, PIN 변경, 해지)
│   │   ├── AccountService.java        #   계좌 비즈니스 로직
│   │   ├── Account.java               #   계좌 엔티티
│   │   ├── AccountRepository.java     #   JPA 레포지토리 (비관적 잠금 포함)
│   │   └── PinVerifier.java           #   PIN 검증 (실패 횟수 제한)
│   ├── transfer/                      # 이체/거래
│   │   ├── TransferController.java    #   이체, 내역 조회 API
│   │   ├── TransferService.java       #   이체 로직 (잠금, N+1 최적화)
│   │   ├── Transaction.java           #   거래 엔티티
│   │   └── AccountHistory.java        #   잔액 변경 이력 엔티티
│   ├── user/                          # 사용자
│   │   ├── UserController.java        #   회원가입 API
│   │   ├── UserService.java           #   회원가입 로직
│   │   ├── User.java                  #   사용자 엔티티
│   │   └── UserProfile.java           #   프로필 엔티티 (주민번호 암호화)
│   ├── config/                        # 설정
│   │   ├── SecurityConfig.java        #   Spring Security + JWT 설정
│   │   ├── GlobalExceptionHandler.java  # 전역 예외 처리
│   │   └── RedisConfig.java           #   Redis 설정
│   └── token/
│       └── RefreshTokenRedisRepository.java  # RT Redis 저장소
│
├── frontend/src/                      # React 프런트엔드
│   ├── api/                           #   Axios 클라이언트 (토큰 자동 갱신)
│   ├── components/                    #   Navbar, PrivateRoute (인증 라우트 가드)
│   └── pages/                         #   로그인, 회원가입, 계좌 개설, 이체, 내역 조회
│
├── db/schema.sql                      # DB 스키마
└── k6/                                # 부하 테스트 스크립트
```

## 실행 방법

### 사전 준비
- Java 17
- PostgreSQL (bankdb / bankuser / bankpass)
- Redis
- Node.js

### Backend
```bash
./gradlew bootRun
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:8080
- Frontend: http://localhost:5173

## 성능 최적화

### N+1 쿼리 개선
이체 내역 조회 시 개별 조회(`findById`)를 일괄 조회(`findAllById`)로 리팩토링하여 쿼리 수를 고정 5회로 줄였다.

| 지표 | 개선 전 (N+1) | 개선 후 (배치) |
|------|-------------|-------------|
| 처리량 | 35 RPS | 443 RPS |
| 평균 응답시간 | 1,390ms | 112ms |
| 500ms 이하 비율 | 0.2% | 99.97% |

### 동시성 제어
- 비관적 잠금(`@Lock(PESSIMISTIC_WRITE)`)으로 동시 이체 시 잔액 정합성 보장
- 잠금 순서 고정(계좌 ID 오름차순)으로 데드락 방지

### 확장성 테스트

| 지표 | 10 VUs | 50 VUs | 100 VUs |
|------|--------|--------|---------|
| 처리량 (RPS) | 460 | 443 | 418 |
| 평균 응답시간 | 21ms | 112ms | 237ms |
| HTTP 실패율 | 0% | 0% | 0% |

## API 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/refresh` | 토큰 갱신 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/users` | 회원가입 |
| GET | `/api/accounts` | 계좌 목록 조회 |
| POST | `/api/accounts` | 계좌 개설 |
| POST | `/api/accounts/verify-identity` | 본인 인증 |
| PUT | `/api/accounts/{accountNumber}/pin` | PIN 변경 |
| PUT | `/api/accounts/{accountNumber}/close` | 계좌 해지 |
| POST | `/api/transfer` | 계좌 이체 |
| GET | `/api/transfer/history` | 월별 이체 내역 |
| GET | `/api/transfer/all-history` | 전체 이체 내역 |
