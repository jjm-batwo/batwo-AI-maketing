export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  avatarColor: string
  content: string
  highlight: string   // substring of content to be highlighted in primary color
  rating: number
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: '김민*',
    role: '마케팅 매니저',
    company: '패션몰 A',
    avatarColor: 'bg-indigo-500',
    content:
      '바투 도입 이후 광고 관리에 들이던 시간이 70% 줄었어요. AI가 알아서 최적화해주니 다른 업무에 집중할 수 있게 되었고 ROAS도 45% 향상됐습니다.',
    highlight: 'AI가 알아서 최적화해주니 다른 업무에 집중할 수 있게 되었고 ROAS도 45% 향상됐습니다.',
    rating: 5,
  },
  {
    id: '2',
    name: '이지*',
    role: '대표',
    company: '뷰티 스토어 B',
    avatarColor: 'bg-pink-500',
    content:
      '마케팅 지식이 없어도 쉽게 광고를 운영할 수 있어서 정말 좋아요. 주간 보고서 덕분에 성과 파악도 간편해졌습니다. 주간 업무 시간이 8시간이나 절약됐어요.',
    highlight: '주간 보고서 덕분에 성과 파악도 간편해졌습니다.',
    rating: 5,
  },
  {
    id: '3',
    name: '박준*',
    role: '이커머스 팀장',
    company: '리빙 브랜드 C',
    avatarColor: 'bg-green-500',
    content:
      '대행사에 맡기던 광고를 직접 운영하게 되었습니다. 비용도 월 200만원 절감되고 성과도 더 좋아졌어요. 강력 추천합니다!',
    highlight: '비용도 월 200만원 절감되고 성과도 더 좋아졌어요.',
    rating: 5,
  },
  {
    id: '4',
    name: '최서*',
    role: '마케터',
    company: '푸드 스타트업 D',
    avatarColor: 'bg-amber-500',
    content:
      'AI 카피 생성 기능이 정말 유용합니다. 매번 문구 고민하던 시간이 확 줄었고, 전환율도 32% 향상되는 놀라운 결과를 얻었습니다.',
    highlight: '전환율도 32% 향상되는 놀라운 결과를 얻었습니다.',
    rating: 5,
  },
  {
    id: '5',
    name: '정현*',
    role: 'CEO',
    company: '테크 커머스 E',
    avatarColor: 'bg-sky-500',
    content:
      '바투 도입 후 데이터 기반 의사결정이 가능해졌어요. 대시보드가 직관적이라 팀원들도 쉽게 활용하고, 매출이 58% 증가했습니다.',
    highlight: '대시보드가 직관적이라 팀원들도 쉽게 활용하고, 매출이 58% 증가했습니다.',
    rating: 5,
  },
  {
    id: '6',
    name: '한소*',
    role: '브랜드 매니저',
    company: '패션 브랜드 F',
    avatarColor: 'bg-violet-500',
    content:
      '처음 Meta 광고를 시작하는 분들께 강력 추천드려요. 설정부터 운영까지 정말 쉽고, 신규 고객이 1,200명이나 늘었습니다.',
    highlight: '신규 고객이 1,200명이나 늘었습니다.',
    rating: 5,
  },
]
