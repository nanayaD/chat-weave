# Chat Weave 온보딩

## 프로젝트 목적

Chat Weave는 사용자가 직접 복사한 X 또는 Discord 대화 텍스트를 로컬에서 정리해 세로 스크롤형 백업본으로 만드는 도구입니다. 서버 업로드, API 연동, 스크래핑은 하지 않습니다.

## 1차 제작 범위

현재 버전은 전용 뷰어 제작을 우선합니다.

- React + TypeScript + Vite 앱
- X/Discord 기본 파서
- 화자 1~4명 등록
- 프로필 이미지 Data URL 처리
- 3열 편집 화면: 왼쪽 설정, 가운데 미리보기, 오른쪽 원문
- 실시간 미리보기
- 표시 정보 토글
- 익명 처리
- 기본 스택형 테마, 좌우형 전환, 미리보기 다크 모드 체크 옵션
- 편집기 전체 다크 모드
- 글자 크기 ±5pt 조정
- 연속 발화 개별/시각적 묶음/텍스트 병합
- 제외/불확실 항목 확인, 미리보기 표시, 원문/앞뒤 대화 이동
- 단일 HTML 내보내기
- 티스토리 코드 복사
- 프로젝트 JSON 저장/불러오기

## 후순위 기능

- PNG 긴 이미지 내보내기
- 정교한 모바일 바텀시트 UI
- 원문 드래그 기반 화자/아이디 지정 숏컷
- 긴 대화(약 400개+) 분할 내보내기 또는 마크업 추가 경량화

## 다음 개발 계획

0.1.1 이후 작업은 작은 단위로 나눠 안정적으로 진행합니다.

- 파서 안정화: X/Discord 로그 변형 예제를 더 모아 불확실 항목 분리와 화자 인식을 보강합니다.
- 원문 드래그 화자 지정: 원문에서 닉네임이나 아이디를 선택했을 때 화자 이름/아이디로 바로 지정하는 숏컷을 검토합니다.
- 모바일 대응: 현재 PC 3열 구성을 유지하되, 모바일에서는 원문/설정/미리보기를 전환하는 구조를 검토합니다.

## 폴더 구조

```text
src/
  App.tsx
  main.tsx
  components/
    PreviewPane.tsx
    SettingsPanel.tsx
    SpeakerForm.tsx
    RawTextInput.tsx
    MessageBlock.tsx
    TopBar.tsx
    UnmatchedPanel.tsx
  data/
    defaults.ts
  parsers/
    index.ts
    parseCommon.ts
    parseX.ts
    parseDiscord.ts
  render/
    anonymize.ts
    buildDisplayBlocks.ts
    exportHtml.ts
    imageResize.ts
  styles/
    base.css
    preview.css
    themes.css
  types/
    project.ts
```

## 핵심 데이터 흐름

1. `App.tsx`가 프로젝트 상태를 관리합니다.
2. `SettingsPanel`에서 플랫폼, 화자, 렌더 옵션을 수정합니다.
3. `RawTextInput`에서 원문을 입력하고 파싱을 실행합니다.
4. `parseRawText`가 플랫폼에 따라 X 또는 Discord 파서를 호출합니다.
5. 파싱 결과는 `messages`와 `unmatchedBlocks`로 나뉩니다.
6. `PreviewPane`은 메시지와 불확실 항목을 원문 줄 순서대로 렌더링합니다.
7. `exportHtml.ts`는 현재 프로젝트 상태를 단일 HTML 파일 또는 티스토리용 HTML 코드로 생성합니다.

## 중요한 구현 원칙

- 원본 메시지는 렌더 옵션 때문에 직접 변경하지 않습니다.
- 익명 처리는 표시와 내보내기 단계에서만 적용합니다.
- 연속 발화 병합은 표시용 블록에서만 처리합니다.
- HTML 내보내기에는 사용자 입력을 반드시 escape 처리합니다.
- 자동 저장은 하지 않고 JSON 저장/불러오기로 복원합니다.
- 화자 정보는 전역 저장하지 않고 프로젝트 JSON에만 포함합니다.
- 프로필 이미지는 업로드 시 `imageResize.ts`로 96px JPEG로 축소해 Data URL 용량을 낮춥니다.
- 아바타는 내보내기 시 블록마다 중복 삽입하지 않고 화자별 CSS(`cw-spk-N`)로 한 번만 정의합니다.
- 배포본은 의존성/새 파일 추가 없이 단일 HTML로 빌드합니다. `npm run build` 끝의 node 인라인 단계가 JS/CSS를 `index.html`에 합치므로 더블클릭으로 바로 열립니다.

## 개발 명령

```bash
npm install
npm run dev
npm run build   # dist/index.html 단일 파일 생성(assets 인라인)
```

## 검증 체크리스트

- `npm run build`가 통과하는지 확인합니다.
- X/Discord 텍스트를 파싱했을 때 메시지가 가운데 미리보기에 보이는지 확인합니다.
- 등록되지 않은 화자가 불확실 항목과 미리보기 블록에 표시되는지 확인합니다.
- 미리보기 블록 클릭 시 원문 위치로 이동하는지 확인합니다.
- 불확실 항목의 앞/뒤 숏컷 클릭 시 미리보기 블록이 강조되는지 확인합니다.
- 표시 정보 토글이 미리보기에 즉시 반영되는지 확인합니다.
- 익명 처리 시 이름, 아이디, 프로필이 대체되는지 확인합니다.
- JSON 저장 후 다시 불러올 수 있는지 확인합니다.
- HTML 내보내기 파일을 열었을 때 독립 뷰어가 표시되는지 확인합니다.

## 변경 이력

### 2026-06-04 — 티스토리 용량 최적화 · 단일 HTML 배포

긴 대화를 티스토리에 백업할 때 코드 용량이 커서 저장이 실패하는 문제를 다뤘습니다. 원인은 코드 복잡도/글자수가 아니라 프로필 이미지(base64 Data URL)였습니다.

- **아바타 출력 중복 제거**: `exportHtml.ts`에서 블록마다 `<img>`로 Data URL을 반복하던 것을 화자별 CSS(`cw-spk-N`, `buildAvatarCss`)로 1회만 정의하도록 변경. 이미지 삽입이 메시지 수가 아니라 화자 수(최대 4)에 비례.
- **업로드 리사이징**: `imageResize.ts` 추가. 프로필 이미지 첨부 시 96px JPEG(품질 0.82)로 재인코딩해 수백 KB → 수 KB.
- **코드 용량 표시**: `getExportSizeInfo`로 티스토리 코드 복사·모달에 바이트 크기와 안전/주의/위험(기준 100KB·150KB) 신호 표시.
- **무설치 단일 HTML 빌드**: `npm run build` 끝에 node 인라인 단계를 추가해 JS/CSS를 `index.html` 하나로 합침(외부 참조 0, file:// 더블클릭 실행). 별도 플러그인/패키지·새 파일 없이 처리.

남은 과제: 메시지 약 400개 이상의 매우 긴 대화는 단일 글 한계에 다시 닿을 수 있어, 분할 내보내기 또는 추가 마크업 경량화는 후순위로 둠.
