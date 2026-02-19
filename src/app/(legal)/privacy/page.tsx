/**
 * Privacy Policy Page
 *
 * 개인정보처리방침 페이지
 */

import { Metadata } from 'next'
import { getMetadata } from '@/lib/constants/seo'

// 법적 문서는 하드코딩 콘텐츠이므로 빌드 타임에 완전 정적 생성
export const dynamic = 'force-static'

export const metadata: Metadata = getMetadata({
  path: '/privacy',
  title: '개인정보처리방침',
  description: '바투 AI 마케팅 솔루션 개인정보처리방침입니다.',
})

export default function PrivacyPage() {
  const lastUpdated = '2024년 12월 29일'

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="not-prose mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          개인정보처리방침
        </h1>
        <p className="mt-2 text-muted-foreground">
          최종 수정일: {lastUpdated}
        </p>
      </header>

      <p>
        바투(이하 &quot;회사&quot;)는 이용자의 개인정보를 중요시하며,
        &quot;정보통신망 이용촉진 및 정보보호&quot; 에 관한 법률,
        개인정보보호법을 준수하고 있습니다.
      </p>

      <section>
        <h2>1. 수집하는 개인정보</h2>
        <p>회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다:</p>

        <h3>1.1 회원 가입 시</h3>
        <ul>
          <li>이메일 주소 (필수)</li>
          <li>비밀번호 (필수)</li>
          <li>이름 (선택)</li>
        </ul>

        <h3>1.2 OAuth 연동 시 (Google, 카카오)</h3>
        <ul>
          <li>OAuth 프로필 정보 (이름, 이메일, 프로필 이미지)</li>
        </ul>

        <h3>1.3 Meta 광고 계정 연동 시</h3>
        <ul>
          <li>Meta 사용자 ID</li>
          <li>광고 계정 정보</li>
          <li>광고 캠페인 데이터</li>
        </ul>

        <h3>1.4 자동 수집 정보</h3>
        <ul>
          <li>접속 로그, IP 주소, 쿠키, 서비스 이용 기록</li>
        </ul>
      </section>

      <section>
        <h2>2. 개인정보의 이용</h2>
        <p>수집된 개인정보는 다음의 목적으로 이용됩니다:</p>
        <ul>
          <li>회원 관리: 회원제 서비스 이용에 따른 본인확인, 회원자격 유지</li>
          <li>
            서비스 제공: AI 마케팅 분석, 광고 캠페인 관리, 보고서 생성 등
          </li>
          <li>
            서비스 개선: 신규 서비스 개발, 서비스 품질 향상, 고객 문의 응대
          </li>
          <li>마케팅: 이벤트, 프로모션 정보 안내 (동의 시)</li>
        </ul>
      </section>

      <section>
        <h2>3. 제3자 제공</h2>
        <p>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만,
          아래의 경우에는 예외로 합니다:
        </p>
        <ul>
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 요청이 있는 경우</li>
        </ul>

        <h3>3.1 서비스 제공을 위한 외부 서비스 연동</h3>
        <p>서비스 제공을 위해 다음의 외부 서비스가 연동됩니다:</p>
        <ul>
          <li>
            <strong>Meta Ads API</strong>: 광고 캠페인 관리 및 성과 데이터 조회
          </li>
          <li>
            <strong>OpenAI API</strong>: AI 기반 광고 카피 생성 및 분석
          </li>
        </ul>
        <p>
          위 서비스들은 각자의 개인정보처리방침에 따라 데이터를 처리하며, 회사는
          서비스 제공에 필요한 최소한의 정보만 전달합니다.
        </p>
      </section>

      <section>
        <h2>4. 보관 기간</h2>
        <p>
          회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이
          파기합니다.
        </p>
        <ul>
          <li>회원 정보: 회원 탈퇴 시 즉시 파기</li>
          <li>서비스 이용 기록: 최대 1년 보관 후 파기</li>
          <li>
            법령에 의한 보관: 관계 법령에 따라 필요한 경우 해당 기간 동안 보관
          </li>
        </ul>
      </section>

      <section>
        <h2>5. 이용자의 권리</h2>
        <p>
          이용자는 언제든지 본인의 개인정보에 대해 다음의 권리를 행사할 수
          있습니다:
        </p>
        <ul>
          <li>개인정보 열람 요청</li>
          <li>개인정보 정정 요청</li>
          <li>개인정보 삭제 요청</li>
          <li>개인정보 처리 정지 요청</li>
        </ul>
        <p>
          권리 행사는 서비스 내 설정 메뉴를 통해 직접 하거나, 고객센터에 문의하여
          처리할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>6. 개인정보의 안전성 확보 조치</h2>
        <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취합니다:</p>
        <ul>
          <li>개인정보 암호화</li>
          <li>해킹 등에 대비한 기술적 대책</li>
          <li>개인정보에 대한 접근 제한</li>
          <li>개인정보 취급 직원의 교육</li>
        </ul>
      </section>

      <section>
        <h2>7. 쿠키의 사용</h2>
        <p>
          회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 쿠키(cookie)를
          사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의
          브라우저에게 보내는 아주 작은 텍스트 파일로 이용자의 컴퓨터에
          저장됩니다.
        </p>
        <p>
          이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹브라우저에서 옵션을
          설정함으로써 모든 쿠키를 허용하거나, 거부할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>8. 개인정보 보호책임자</h2>
        <p>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
          관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이
          개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <ul>
          <li>담당부서: 고객지원팀</li>
          <li>이메일: support@batwo.ai</li>
        </ul>
      </section>

      <section>
        <h2>9. 개인정보처리방침의 변경</h2>
        <p>
          이 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의
          추가, 삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 서비스 내
          공지사항을 통해 고지할 것입니다.
        </p>
      </section>

      <footer className="not-prose mt-12 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          개인정보처리에 관한 문의사항이 있으시면{' '}
          <a
            href="mailto:support@batwo.ai"
            className="text-primary hover:underline"
          >
            support@batwo.ai
          </a>
          로 연락해 주시기 바랍니다.
        </p>
      </footer>
    </article>
  )
}
