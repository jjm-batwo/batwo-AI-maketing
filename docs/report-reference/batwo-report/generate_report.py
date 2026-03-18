#!/usr/bin/env python3
"""
바투 AI 마케팅 - 주간 마케팅 리포트 생성기
==========================================
Meta Ads JSON 데이터 → HTML + PDF 보고서 자동 생성

사용법:
    python generate_report.py                          # sample_data.json 사용
    python generate_report.py --data my_data.json      # 커스텀 데이터
    python generate_report.py --html-only              # HTML만 생성
    python generate_report.py --pdf-only               # PDF만 생성
"""

import json
import asyncio
import argparse
import sys
from pathlib import Path
from datetime import datetime

from jinja2 import Environment, FileSystemLoader


# ============================================================
# 1. DATA LOADING
# ============================================================

def load_report_data(data_path: str) -> dict:
    """JSON 파일에서 리포트 데이터 로드"""
    path = Path(data_path)
    if not path.exists():
        print(f"❌ 데이터 파일을 찾을 수 없습니다: {data_path}")
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 기본 검증
    required_keys = ["report_meta", "kpi_summary", "daily_data", "campaigns"]
    missing = [k for k in required_keys if k not in data]
    if missing:
        print(f"❌ 데이터에 필수 키가 없습니다: {missing}")
        sys.exit(1)

    return data


# ============================================================
# 2. HTML RENDERING
# ============================================================

def render_html(data: dict, template_dir: str = "templates") -> str:
    """Jinja2 템플릿으로 HTML 렌더링"""
    env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=False,
    )
    # enumerate를 Jinja2에서 사용할 수 있도록 추가
    env.globals["enumerate"] = enumerate

    template = env.get_template("report.html.j2")

    # 차트용 daily_data JSON
    daily_json = json.dumps(data["daily_data"], ensure_ascii=False)

    html = template.render(data=data, daily_json=daily_json)
    return html


def save_html(html: str, output_path: str) -> str:
    """HTML 파일 저장"""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")
    return str(path.resolve())


# ============================================================
# 3. PDF GENERATION (Playwright)
# ============================================================

async def generate_pdf(html_path: str, pdf_path: str) -> str:
    """Playwright Chromium으로 HTML → PDF 변환"""
    from playwright.async_api import async_playwright

    html_url = Path(html_path).resolve().as_uri()
    pdf_out = Path(pdf_path)
    pdf_out.parent.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # 네트워크 아이들 대기 (폰트, Chart.js 로드)
        await page.goto(html_url, wait_until="networkidle")
        # Chart.js 렌더링 + 폰트 로드 대기
        await page.wait_for_timeout(3000)

        await page.pdf(
            path=str(pdf_out),
            format="A4",
            print_background=True,
            margin={"top": "8mm", "right": "8mm", "bottom": "8mm", "left": "8mm"},
            prefer_css_page_size=False,
        )

        await browser.close()

    return str(pdf_out.resolve())


# ============================================================
# 4. MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="바투 AI 마케팅 리포트 생성기")
    parser.add_argument("--data", default="data/sample_data.json", help="입력 JSON 데이터 경로")
    parser.add_argument("--output-dir", default="output", help="출력 디렉토리")
    parser.add_argument("--html-only", action="store_true", help="HTML만 생성")
    parser.add_argument("--pdf-only", action="store_true", help="PDF만 생성")
    args = parser.parse_args()

    print("=" * 50)
    print("🚀 바투 AI 마케팅 - 주간 리포트 생성기")
    print("=" * 50)

    # 1) 데이터 로드
    print(f"\n📂 데이터 로드: {args.data}")
    data = load_report_data(args.data)
    period = f"{data['report_meta']['period_start']} ~ {data['report_meta']['period_end']}"
    print(f"   기간: {period}")

    # 2) 파일명 생성
    start = data["report_meta"]["period_start"].replace("-", "")
    end = data["report_meta"]["period_end"].replace("-", "")
    report_type = data["report_meta"].get("report_type", "weekly")
    base_name = f"{report_type}_report_{start}_{end}"

    html_path = f"{args.output_dir}/{base_name}.html"
    pdf_path = f"{args.output_dir}/{base_name}.pdf"

    # 3) HTML 생성
    if not args.pdf_only:
        print(f"\n🎨 HTML 생성 중...")
        html = render_html(data)
        saved = save_html(html, html_path)
        print(f"   ✅ HTML 저장: {saved}")

    # 4) PDF 생성
    if not args.html_only:
        # HTML이 아직 없으면 먼저 생성
        if args.pdf_only:
            html = render_html(data)
            save_html(html, html_path)

        print(f"\n📄 PDF 생성 중...")
        pdf_saved = asyncio.run(generate_pdf(html_path, pdf_path))
        print(f"   ✅ PDF 저장: {pdf_saved}")

        # PDF only 모드면 임시 HTML 삭제
        if args.pdf_only:
            Path(html_path).unlink(missing_ok=True)

    print(f"\n{'=' * 50}")
    print("✨ 리포트 생성 완료!")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
