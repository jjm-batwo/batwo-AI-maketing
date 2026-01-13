import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Quote } from 'lucide-react'

interface Testimonial {
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

const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    name: '김민수',
    role: '마케팅 매니저',
    company: '패션몰 A',
    avatar: 'https://ui-avatars.com/api/?name=김민수&background=6366f1&color=fff',
    content:
      '광고 관리에 들이던 시간이 70% 줄었어요. AI가 알아서 최적화해주니 다른 업무에 집중할 수 있습니다.',
    rating: 5,
    metrics: { label: 'ROAS 향상', value: '+45%' },
  },
  {
    id: '2',
    name: '이지영',
    role: '대표',
    company: '뷰티 스토어 B',
    avatar: 'https://ui-avatars.com/api/?name=이지영&background=ec4899&color=fff',
    content:
      '마케팅 지식 없이도 쉽게 광고를 운영할 수 있어서 좋아요. 주간 보고서 덕분에 성과 파악도 간편합니다.',
    rating: 5,
    metrics: { label: '시간 절약', value: '주 8시간' },
  },
  {
    id: '3',
    name: '박준혁',
    role: '이커머스 팀장',
    company: '리빙 브랜드 C',
    avatar: 'https://ui-avatars.com/api/?name=박준혁&background=22c55e&color=fff',
    content:
      '대행사에 맡기던 광고를 직접 운영하게 되면서 비용도 줄고 성과도 좋아졌습니다. 강력 추천합니다!',
    rating: 5,
    metrics: { label: '비용 절감', value: '월 200만원' },
  },
  {
    id: '4',
    name: '최서연',
    role: '마케터',
    company: '푸드 스타트업 D',
    avatar: 'https://ui-avatars.com/api/?name=최서연&background=f59e0b&color=fff',
    content:
      'AI 카피 생성 기능이 정말 유용해요. 매번 문구 고민하던 시간이 확 줄었습니다.',
    rating: 5,
    metrics: { label: '전환율 향상', value: '+32%' },
  },
  {
    id: '5',
    name: '정현우',
    role: 'CEO',
    company: '테크 커머스 E',
    avatar: 'https://ui-avatars.com/api/?name=정현우&background=0ea5e9&color=fff',
    content:
      '데이터 기반 의사결정이 가능해졌어요. 대시보드가 직관적이라 팀원들도 쉽게 활용합니다.',
    rating: 5,
    metrics: { label: '매출 증가', value: '+58%' },
  },
  {
    id: '6',
    name: '한소희',
    role: '브랜드 매니저',
    company: '패션 브랜드 F',
    avatar: 'https://ui-avatars.com/api/?name=한소희&background=8b5cf6&color=fff',
    content:
      '처음 Meta 광고를 시작하는 분들께 추천드려요. 설정부터 운영까지 정말 쉽습니다.',
    rating: 5,
    metrics: { label: '신규 고객', value: '+1,200명' },
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
          }`}
        />
      ))}
    </div>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="group h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 cursor-default">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Quote Icon */}
        <Quote className="h-8 w-8 text-primary/20 mb-4 transition-all duration-300 group-hover:text-primary/40 group-hover:scale-110" />

        {/* Content */}
        <p className="text-muted-foreground flex-1 mb-4">
          &ldquo;{testimonial.content}&rdquo;
        </p>

        {/* Rating */}
        <StarRating rating={testimonial.rating} />

        {/* Metrics Badge */}
        {testimonial.metrics && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm w-fit transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
            <span className="font-semibold">{testimonial.metrics.value}</span>
            <span>{testimonial.metrics.label}</span>
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t">
          <Avatar>
            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
            <AvatarFallback>{testimonial.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{testimonial.name}</div>
            <div className="text-sm text-muted-foreground">
              {testimonial.role} · {testimonial.company}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            실제 사용자들의 이야기
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            바투를 사용하는 커머스 사업자들의 생생한 후기를 확인하세요
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTestimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}
