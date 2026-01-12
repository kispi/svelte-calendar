# Justodo 📅

SvelteKit으로 제작된 모던하고 직관적인 개인용 캘린더 & 노트 애플리케이션입니다.
깔끔한 인터페이스와 효율적인 일정 관리 기능을 제공합니다.

## ✨ 주요 기능

- **통합 캘린더 & 노트**: 세련된 에버그린 테마의 직관적인 레이아웃
- **편리한 일정 관리**: 클릭 한 번으로 일정을 생성하고 관리하는 모달 기반 편집기
- **간편한 로그인**: Auth.js(v5) 기반의 카카오 계정 로그인 지원
- **카테고리 분류**: '일정'과 '기념일'을 색상으로 구분하여 한눈에 파악 가능
- **반응형 디자인**: 모바일과 태블릿 환경에 최적화된 UX/UI
- **정밀한 날짜 선택**: `flatpickr`를 활용한 세밀한 날짜 및 시간 설정

---

## 🛠 기술 스택

- **Framework**: [SvelteKit 5](https://svelte.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Database**: [SQLite](https://www.sqlite.org/) (Better-SQLite3)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Auth.js](https://authjs.dev/)
- **Deployment**: [Node Adapter](https://svelte.dev/docs/kit/adapter-node) + PM2 + GitHub Actions

---

## 🚀 시작하기

### 1. 설치 및 의존성 설치

```bash
git clone <repository-url>
cd svelte-calendar
npm install
```

### 2. 환경 변수 설정

루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 입력합니다:

```env
DB_PATH=local.db
AUTH_SECRET=<your_generated_secret> # npx auth secret
KAKAO_CLIENT_ID=<kakao_rest_api_key>
KAKAO_CLIENT_SECRET=<kakao_client_secret>
```

### 3. 데이터베이스 초기화

Drizzle을 사용하여 로컬 SQLite 데이터베이스를 생성하고 스키마를 동기화합니다:

```bash
npx drizzle-kit push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

---

## 📦 배포 및 자동화 (EC2)

이 프로젝트는 EC2 환경에서 PM2와 GitHub Actions를 이용한 자동 배포가 설정되어 있습니다.

### 빌드 및 실행

```bash
# 빌드
npm run build

# PM2 실행 (최초 1회)
pm2 start build/index.js --name "svelte-calendar" --node-args="-r dotenv/config"

# 재시작
pm2 restart svelte-calendar
```

### GitHub Actions를 통한 자동 배포
`main` 브랜치에 푸시하면 `.github/workflows/deploy.yml` 워크플로우가 실행되어 서버에 코드를 배포하고 애플리케이션을 자동으로 재시작합니다.

---

## 📄 라이선스

MIT
