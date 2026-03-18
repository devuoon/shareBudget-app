# 📒 공유 가계부

친구들과 함께 쓰는 공유 가계부 앱입니다.

🔗 **배포 주소**: https://share-budget-app.vercel.app

## 기능
- 멤버별 수입/지출 입력 및 관리
- 카테고리별 예산 설정
- 월별 통계 차트
- 멤버 간 지출 비교 (열람 전용)
- 🔥 AI 소비 습관 분석 (Claude)
- Notion 실시간 저장

## 파일 구조
```
├── index.html
├── vercel.json
└── api/
    ├── tx-save.js
    ├── tx-load.js
    ├── tx-delete.js
    └── roast.js
```

## 환경변수 (Vercel)
| 변수명 | 설명 |
|---|---|
| `NOTION_TOKEN` | Notion Integration Secret |
| `ANTHROPIC_API_KEY` | Claude API 키 (AI 질타용) |
