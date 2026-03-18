#!/usr/bin/env python3
"""AI 기반 보고서 생성 — sample_data.json의 analysis/actions를 실제 AI로 대체"""

import json
import os
import sys
from pathlib import Path

def call_openai(data: dict) -> dict:
    """OpenAI API로 성과 분석 + 추천 액션 생성"""
    import urllib.request

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # .env 파일에서 읽기
        env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("OPENAI_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"')
                    break

    if not api_key:
        print("❌ OPENAI_API_KEY not found")
        sys.exit(1)

    # 캠페인 데이터 텍스트
    campaign_text = "\n".join([
        f"캠페인: {c['name']} (목표: {c['objective']})\n"
        f"  지출: {c['spend']:,.0f}원 / 매출: {c['revenue']:,.0f}원 / ROAS: {c['roas']:.2f}x / CTR: {c['ctr']}% / 전환: {c['conversions']}"
        for c in data["campaigns"]
    ])

    creative_text = "\n".join([
        f"소재: {cr['name']} ({cr['format']}) — ROAS: {cr['roas']:.2f}x, CTR: {cr['ctr']}%, 전환: {cr['conversions']}"
        for cr in data["creatives_top5"]
    ])

    fatigue_text = "\n".join([
        f"소재: {f['name']} — 피로도: {f['fatigue_score']}/100, Frequency: {f['frequency']}, CTR: {f['ctr']}%, 활성일: {f['active_days']}일, 상태: {f['level']}"
        for f in data["creative_fatigue"]
    ])

    kpi = data["kpi_summary"]
    report_type = data['report_meta'].get('report_type', 'weekly')
    type_label = '월간' if report_type == 'monthly' else '주간'
    prev_label = '전월' if report_type == 'monthly' else '전주'

    prompt = f"""다음 광고 성과 데이터를 분석하여 JSON으로 응답하세요.

리포트 유형: {type_label}
기간: {data['report_meta']['period_start']} ~ {data['report_meta']['period_end']}

전체 KPI:
- 총 지출: {kpi['total_spend']['value']:,.0f}원 ({prev_label} 대비 {kpi['total_spend']['change_pct']:+.1f}%)
- 총 매출: {kpi['total_revenue']['value']:,.0f}원 ({prev_label} 대비 {kpi['total_revenue']['change_pct']:+.1f}%)
- ROAS: {kpi['roas']['value']:.2f}x ({prev_label} 대비 {kpi['roas']['change_pct']:+.1f}%)
- CTR: {kpi['ctr']['value']:.2f}% ({prev_label} 대비 {kpi['ctr']['change_pct']:+.1f}%)
- 전환: {kpi['conversions']['value']}건 ({prev_label} 대비 {kpi['conversions']['change_pct']:+.1f}%)

캠페인별 성과:
{campaign_text}

소재별 성과 TOP 5:
{creative_text}

소재 피로도:
{fatigue_text}

다음 JSON 형식으로 응답하세요:
{{
  "analysis": {{
    "summary": "전체 성과 요약 2-3문장. {prev_label} 대비 변화 포함. 금액은 '원' 사용",
    "positives": [
      {{ "title": "잘된 점 제목 (캠페인명 포함)", "desc": "구체적 원인 분석 1-2문장", "impact": "HIGH|MEDIUM|LOW" }}
    ],
    "negatives": [
      {{ "title": "개선점 제목 (캠페인명 포함)", "desc": "구체적 원인 분석 1-2문장", "impact": "HIGH|MEDIUM|LOW" }}
    ]
  }},
  "actions": [
    {{
      "priority": "HIGH|MEDIUM|LOW",
      "category": "소재|예산|타겟팅|퍼널|일반",
      "title": "구체적 액션 제목 (캠페인명+수치 포함)",
      "desc": "실행 방법 설명",
      "expected": "예상 효과 (정량화)"
    }}
  ]
}}

규칙:
1. 캠페인별로 머신러닝 상태(주 50건 이상=안정), 소재 효과(CTR vs CVR), 예산 효율(ROAS) 분석
2. 금액은 반드시 "원" 사용. 다른 통화 기호 금지
3. 액션은 캠페인명/소재명을 명시하고 구체적 수치 포함
4. positives 2-3개, negatives 2-3개, actions 4-5개
5. 대행사 시니어 AE가 클라이언트에게 보고하는 전문적 어투
6. 중요: summary, desc 등 텍스트 필드에서 한 문장이 끝나면(마침표 뒤) 반드시 줄바꿈(\\n)을 넣어서 문장을 분리하세요. 긴 문장 하나로 이어붙이지 마세요.
7. 한국어 단어가 중간에 끊기면 안 됩니다. '안정', '전환' 같은 단어가 두 줄에 걸쳐 나뉘지 않도록 하세요."""

    body = json.dumps({
        "model": "gpt-5-mini",
        "messages": [
            {"role": "system", "content": "당신은 한국 퍼포먼스 마케팅 대행사의 시니어 AE입니다. 데이터 기반으로 구체적이고 실행 가능한 분석을 제공합니다. 금액은 반드시 '원'을 사용하세요."},
            {"role": "user", "content": prompt}
        ],
        
        "max_completion_tokens": 8000
    }).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    )

    print("   🤖 AI 분석 요청 중...")
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read())

    # gpt-5는 content 외에 reasoning_content를 반환할 수 있음
    msg = result["choices"][0]["message"]
    content = msg.get("content") or msg.get("reasoning_content") or ""
    # output 배열 형태일 수도 있음 (o1/gpt-5 계열)
    if not content and "output" in result:
        for item in result["output"]:
            if item.get("type") == "message":
                for c in item.get("content", []):
                    if c.get("type") == "output_text":
                        content = c.get("text", "")
    print(f"   📝 AI 응답 길이: {len(content)}자")
    if not content:
        print(f"   ⚠️ 전체 응답 키: {list(result.keys())}")
        print(f"   ⚠️ message 키: {list(msg.keys())}")
        print(f"   ⚠️ 응답 미리보기: {json.dumps(result, ensure_ascii=False)[:500]}")

    # JSON 블록 추출 (여러 형식 대응)
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]

    # 앞뒤 공백/BOM 제거
    content = content.strip().lstrip('\ufeff')

    # { 부터 } 까지만 추출 (혹시 앞뒤에 텍스트가 있을 경우)
    start = content.find('{')
    end = content.rfind('}')
    if start >= 0 and end > start:
        content = content[start:end+1]

    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        print(f"   ❌ JSON 파싱 실패: {e}")
        print(f"   원본 응답 (첫 500자): {content[:500]}")
        sys.exit(1)


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/sample_data.json")
    args = parser.parse_args()

    print("=" * 50)
    print("🚀 바투 AI 마케팅 - AI 기반 리포트 생성")
    print("=" * 50)

    # 1) 데이터 로드
    print(f"\n📂 데이터 로드: {args.data}")
    with open(args.data, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2) AI 분석
    print("\n🧠 AI 성과 분석 생성 중...")
    ai_result = call_openai(data)

    # 3) 데이터에 AI 결과 주입
    data["analysis"] = ai_result["analysis"]
    data["actions"] = ai_result["actions"]

    # 4) AI 결과 포함된 JSON 저장
    ai_data_path = "data/ai_generated_data.json"
    with open(ai_data_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"   ✅ AI 데이터 저장: {ai_data_path}")

    # 5) 보고서 생성
    print("\n📊 보고서 생성 중...")
    import subprocess
    subprocess.run([sys.executable, "generate_report.py", "--data", ai_data_path], check=True)


if __name__ == "__main__":
    main()
