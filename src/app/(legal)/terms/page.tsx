/**
 * Terms of Service Page
 *
 * 서비스 이용약관 페이지
 */

import { Metadata } from 'next'
import { getMetadata } from '@/lib/constants/seo'

export const metadata: Metadata = getMetadata({
  path: '/terms',
  title: '이용약관',
  description: '바투 AI 마케팅 솔루션 서비스 이용약관입니다.',
})

export default function TermsPage() {
  const lastUpdated = '2024년 12월 29일'

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="not-prose mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          이용약관
        </h1>
        <p className="mt-2 text-muted-foreground">
          최종 수정일: {lastUpdated}
        </p>
      </header>

      <section>
        <h2>제1조 (목적)</h2>
        <p>
          이 약관은 바투(이하 &quot;회사&quot;)가 제공하는 AI 마케팅 솔루션
          서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의
          권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section>
        <h2>제2조 (정의)</h2>
        <ol>
          <li>
            <strong>&quot;서비스&quot;</strong>란 회사가 제공하는 AI 기반 마케팅
            자동화, 광고 캠페인 관리, KPI 대시보드, 보고서 생성 등의 기능을
            말합니다.
          </li>
          <li>
            <strong>&quot;이용자&quot;</strong>란 이 약관에 따라 회사가 제공하는
            서비스를 받는 회원을 말합니다.
          </li>
          <li>
            <strong>&quot;회원&quot;</strong>이란 회사와 서비스 이용계약을
            체결하고 이용자 아이디(ID)를 부여받은 자를 말합니다.
          </li>
        </ol>
      </section>

      <section>
        <h2>제3조 (서비스 이용)</h2>
        <h3>3.1 서비스 제공</h3>
        <p>회사는 다음의 서비스를 제공합니다:</p>
        <ul>
          <li>Meta 광고 캠페인 자동 생성 및 관리</li>
          <li>AI 기반 광고 카피 생성</li>
          <li>실시간 KPI 대시보드</li>
          <li>주간 성과 보고서 자동 생성</li>
          <li>광고 성과 분석 및 최적화 제안</li>
        </ul>

        <h3>3.2 서비스 이용 시간</h3>
        <p>
          서비스는 연중무휴 24시간 제공됨을 원칙으로 합니다. 다만, 시스템 점검,
          장애 발생 등의 경우 일시적으로 서비스 이용이 제한될 수 있습니다.
        </p>

        <h3>3.3 이용 제한</h3>
        <p>
          MVP 기간 동안 서비스 이용에는 다음과 같은 제한이 적용될 수 있습니다:
        </p>
        <ul>
          <li>캠페인 생성: 주 5회</li>
          <li>AI 카피 생성: 일 20회</li>
          <li>AI 분석: 주 5회</li>
        </ul>
      </section>

      <section>
        <h2>제4조 (이용자의 의무)</h2>
        <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
        <ol>
          <li>타인의 정보 도용</li>
          <li>회사가 게시한 정보의 변경</li>
          <li>회사가 정한 정보 이외의 정보 등의 송신 또는 게시</li>
          <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
          <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
          <li>
            서비스를 이용한 불법적인 광고 게재 또는 법령에 위반되는 마케팅 활동
          </li>
        </ol>
      </section>

      <section>
        <h2>제5조 (지적재산권)</h2>
        <p>
          회사가 제작한 서비스의 저작권 및 지적재산권은 회사에 귀속됩니다.
          이용자가 서비스를 통해 생성한 광고 카피, 보고서 등의 콘텐츠에 대한
          사용권은 이용자에게 있습니다.
        </p>
      </section>

      <section>
        <h2>제6조 (면책조항)</h2>
        <ol>
          <li>
            회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인
            사유로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.
          </li>
          <li>
            회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을
            지지 않습니다.
          </li>
          <li>
            회사는 AI가 생성한 콘텐츠의 정확성, 적법성에 대해 보증하지 않으며,
            이용자는 생성된 콘텐츠를 검토 후 사용해야 합니다.
          </li>
        </ol>
      </section>

      <section>
        <h2>제7조 (분쟁 해결)</h2>
        <p>
          서비스 이용과 관련하여 회사와 이용자 간에 분쟁이 발생한 경우, 양
          당사자는 분쟁의 해결을 위해 성실히 협의합니다. 협의가 이루어지지 않을
          경우, 대한민국 법률에 따라 관할 법원에서 해결합니다.
        </p>
      </section>

      <section>
        <h2>제8조 (약관의 변경)</h2>
        <p>
          회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할
          수 있습니다. 약관이 변경되는 경우 회사는 변경사항을 서비스 내 공지사항
          또는 이메일을 통해 공지합니다.
        </p>
      </section>

      <footer className="not-prose mt-12 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          본 약관에 관한 문의사항이 있으시면{' '}
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
