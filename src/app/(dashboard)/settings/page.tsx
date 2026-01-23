'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Radio } from 'lucide-react'

const settingsItems = [
  {
    title: 'Meta 광고 계정',
    description: 'Meta (Facebook/Instagram) 광고 계정을 연결하여 캠페인을 관리하세요',
    href: '/settings/meta-connect',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    title: '픽셀 설치',
    description: 'Meta 픽셀을 설치하여 웹사이트 전환을 추적하세요',
    href: '/settings/pixel',
    icon: <Radio className="h-6 w-6 text-purple-500" />,
  },
]

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground">계정 및 서비스 설정을 관리하세요</p>
      </div>

      <div className="space-y-4">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
