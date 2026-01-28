export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  avatar: string
  content: string
  rating: number
  metrics?: {
    label: string
    value: string
  }
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: '김민*',
    role: '마케팅 매니저',
    company: '패션몰 A',
    avatar: 'https://ui-avatars.com/api/?name=김민*&background=6366f1&color=fff',
    content:
      '광고 관리에 들이던 시간이 70% 줄었어요. AI가 알아서 최적화해주니 다른 업무에 집중할 수 있습니다.',
    rating: 5,
    metrics: { label: 'ROAS 향상', value: '+45%' },
  },
  {
    id: '2',
    name: '이지*',
    role: '대표',
    company: '뷰티 스토어 B',
    avatar: 'https://ui-avatars.com/api/?name=이지*&background=ec4899&color=fff',
    content:
      '마케팅 지식 없이도 쉽게 광고를 운영할 수 있어서 좋아요. 주간 보고서 덕분에 성과 파악도 간편합니다.',
    rating: 5,
    metrics: { label: '시간 절약', value: '주 8시간' },
  },
  {
    id: '3',
    name: '박준*',
    role: '이커머스 팀장',
    company: '리빙 브랜드 C',
    avatar: 'https://ui-avatars.com/api/?name=박준*&background=22c55e&color=fff',
    content:
      '대행사에 맡기던 광고를 직접 운영하게 되면서 비용도 줄고 성과도 좋아졌습니다. 강력 추천합니다!',
    rating: 5,
    metrics: { label: '비용 절감', value: '월 200만원' },
  },
  {
    id: '4',
    name: '최서*',
    role: '마케터',
    company: '푸드 스타트업 D',
    avatar: 'https://ui-avatars.com/api/?name=최서*&background=f59e0b&color=fff',
    content:
      'AI 카피 생성 기능이 정말 유용해요. 매번 문구 고민하던 시간이 확 줄었습니다.',
    rating: 5,
    metrics: { label: '전환율 향상', value: '+32%' },
  },
  {
    id: '5',
    name: '정현*',
    role: 'CEO',
    company: '테크 커머스 E',
    avatar: 'https://ui-avatars.com/api/?name=정현*&background=0ea5e9&color=fff',
    content:
      '데이터 기반 의사결정이 가능해졌어요. 대시보드가 직관적이라 팀원들도 쉽게 활용합니다.',
    rating: 5,
    metrics: { label: '매출 증가', value: '+58%' },
  },
  {
    id: '6',
    name: '한소*',
    role: '브랜드 매니저',
    company: '패션 브랜드 F',
    avatar: 'https://ui-avatars.com/api/?name=한소*&background=8b5cf6&color=fff',
    content:
      '처음 Meta 광고를 시작하는 분들께 추천드려요. 설정부터 운영까지 정말 쉽습니다.',
    rating: 5,
    metrics: { label: '신규 고객', value: '+1,200명' },
  },
]
