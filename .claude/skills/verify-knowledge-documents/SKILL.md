---
name: verify-knowledge-documents
description: 마크다운 파일(지식 베이스 문서)의 파일명 규칙(숫자 두자리 접두사)과 첫 헤더(#) 존재 여부를 검증합니다. RAG 지식 문서 추가 후 사용.
---

# 지식 베이스 문서 패턴 검증

## Purpose

1. **파일명 규칙 준수** — `00-name.md` 형태의 숫자 두자리 접두사 규칙 확인
2. **필수 헤더 유무** — 마크다운 문서 내에 최상단 제목으로 인식될 H1(`#`) 헤더가 존재하는지 확인

## When to Run

- 새로운 마케팅 지식 문서(`prisma/seeds/marketing-knowledge/*.md`)를 추가하거나 수정한 후
- `seed-knowledge-base.ts` 스크립트를 실행하기 전에 정상적인 파싱이 가능한지 확인할 때

## Related Files

| File | Purpose |
|------|---------|
| `prisma/seeds/marketing-knowledge/*.md` | RAG 시스템에 로드될 시드 지식 문서들 |

## Workflow

### Step 1: 파일명 규칙 유효성 검사

**파일:** `prisma/seeds/marketing-knowledge/*.md`

**검사:** 파일명이 숫자 2자리와 하이픈(`00-`)으로 시작하며 `.md` 확장자인지 검사합니다.

```bash
find prisma/seeds/marketing-knowledge -name "*.md" | grep -vE '/[0-9]{2}-[a-zA-Z0-9-]+\.md$' || true
```

*(참고: `grep -vE`가 필터링 후 남는 라인이 없을 때 exit code 1을 반환하여 파이프라인이 중단되는 것을 막기 위해 `|| true`를 추가합니다)*

**PASS 기준:** 출력이 없거나 출력이 비어 있음 (모든 파일이 규칙을 준수)
**FAIL 기준:** 출력 결과에 경로가 출력됨 (파일명 규칙 위반)

**수정 방법:** 
출력된 파일명을 `00-topic-name.md` 형태로 변경합니다.

### Step 2: H1 헤더 존재 확인

**파일:** `prisma/seeds/marketing-knowledge/*.md`

**검사:** 각 마크다운 파일 내용 중에 `# `으로 시작하는 타이틀 헤더가 존재하는지 확인합니다. 파서가 제목을 추출하기 위해 필요합니다.

```bash
for file in prisma/seeds/marketing-knowledge/*.md; do
  if ! grep -q "^# " "$file"; then
    echo "Missing H1 header: $file"
  fi
done
```

**PASS 기준:** 루프의 출력 결과가 없음 (모든 파일에 `# ` 헤더가 하나 이상 존재함)
**FAIL 기준:** 출력 결과에 나타난 파일은 `# ` (H1 타이틀)가 없음

**수정 방법:** 파일 내용 최상단에 `# 제목` 형식의 헤더를 추가합니다.

## Output Format

```markdown
### verify-knowledge-documents 결과

| # | 검사 | 상태 | 상세 |
|---|---|---|---|
| 1 | 파일명 규칙 유효성 검사 | PASS/FAIL | 위반 파일: X |
| 2 | H1 헤더 존재 확인 | PASS/FAIL | H1 헤더가 없는 파일 목록 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **README 파일** — 마크다운이지만 지식 베이스 시드 문서 디렉토리에 속하지 않는 경우는 제외.
2. **비 마크다운 문서** — `.ts`, `.json` 등은 검사 대상이 아님.
