# 📒 공유 가계부 — Vercel 배포 가이드

## 파일 구조
```
budget-app/
├── index.html        ← 앱 전체 (프론트엔드)
├── api/
│   └── roast.js      ← AI 질타 서버리스 함수
├── vercel.json       ← Vercel 설정
└── README.md
```

---

## 🚀 배포 방법 (5단계, 10분이면 완료)

### 1단계 — GitHub 레포 만들기
1. [github.com](https://github.com) 접속 → **New repository**
2. 이름: `budget-app` (아무거나 OK)
3. **Public** 선택 → **Create repository**
4. 이 폴더 안 파일 4개를 모두 업로드
   - `index.html`
   - `api/roast.js` ← `api` 폴더 안에 넣어야 함
   - `vercel.json`
   - `README.md`

### 2단계 — Vercel 계정 만들기
1. [vercel.com](https://vercel.com) 접속
2. **Sign up with GitHub** 클릭 → GitHub 계정으로 연동

### 3단계 — 프로젝트 배포
1. Vercel 대시보드에서 **Add New → Project**
2. GitHub 레포 `budget-app` 선택 → **Import**
3. 설정은 건드릴 것 없음 → **Deploy** 클릭
4. 1~2분 기다리면 배포 완료 🎉

### 4단계 — Anthropic API 키 설정 (AI 질타 기능)
1. [console.anthropic.com](https://console.anthropic.com) → API Keys → **Create Key**
2. 키 복사 (`sk-ant-...` 형태)
3. Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables**
4. 아래 내용 입력:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: 복사한 API 키 붙여넣기
5. **Save** → 프로젝트 **Redeploy** (Settings → Deployments → 최신 건 → Redeploy)

### 5단계 — 링크 공유
Vercel이 `https://budget-app-xxx.vercel.app` 형태의 링크를 줘요.
이 링크를 친구한테 보내면 바로 사용 가능해요!

---

## ✅ 기능 정리
| 기능 | 설명 |
|---|---|
| 멤버 선택 | 닉네임 입력으로 본인 가계부 시작 |
| 내 가계부 | 수입/지출 입력, 월별 이동 |
| 멤버 보기 | 다른 멤버 내역 열람 (수정 불가) |
| 예산 설정 | 카테고리별 월 한도 설정 |
| 통계 | 6개월 막대 + 파이 차트 |
| 🔥 AI 질타 | Anthropic API로 소비 습관 분석 |

## ⚠️ 주의사항
- 데이터는 각 사용자 브라우저 `localStorage`에 저장돼요
- 같은 기기, 같은 브라우저에서 열어야 데이터가 유지돼요
- 멤버 간 실시간 동기화는 지원하지 않아요 (각자 데이터 독립)
- API 키는 절대 `index.html`이나 공개 파일에 넣지 마세요 — 반드시 Vercel 환경변수로!
