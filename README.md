# 매탄동 전자회사의 대증적 처방 · 배포 폴더

- `index.html` 플레이어용 · `host.html` 진행자용(번호 99)
- 이 폴더 안의 내용물을 GitHub Pages / Netlify 등에 그대로 올리면 됩니다.

## 실시간 동기화 켜기 (선택, 5분)
끄면: 라운드 코드 입력 방식, 단서 공개는 코드(05-2) 말하기, 채점 결과는 카톡 메시지로 전달.
켜면: 진행자가 버튼으로 라운드 전환 → 전원 폰에 "ROUND 1 종료 → ROUND 2 시작" 화면 · 단서는 선착순 1인만 조사 · 공개 단서 자동 전달 · 채점 결과 자동 집계.

1. https://console.firebase.google.com → 프로젝트 추가 (이름 자유, 애널리틱스 끔)
2. 왼쪽 메뉴 빌드 → **Realtime Database** → 데이터베이스 만들기 → 위치 아무 곳(예: asia-southeast1) → **테스트 모드**로 시작
3. 규칙 탭에서 아래처럼 바꾸고 게시 (게임 전용 DB라 공개 읽기/쓰기로 둡니다. 게임 끝나면 DB를 삭제하세요)
```
{ "rules": { "games": { ".read": true, ".write": true } } }
```
4. 데이터 탭 상단에 보이는 주소(예: `https://프로젝트-default-rtdb.asia-southeast1.firebasedatabase.app`)를 복사
5. `data/config.js` 를 열어 `const SYNC_URL = "여기에 붙여넣기";` 로 저장 → 다시 배포
6. 진행자: `host.html` → 게임 초기화 → **새 게임 코드 만들기** → 생성된 플레이어 링크(`index.html?g=XXXX`)를 공유하고, 진행자도 `host.html?g=XXXX`로 접속
