import { INDUSTRY_BENCHMARKS } from '@/domain/value-objects/MarketingScience'

// Re-export from single source of truth
export { INDUSTRY_BENCHMARKS }

// Extended benchmark data with additional metrics
export const EXTENDED_INDUSTRY_BENCHMARKS: Record<string, {
  avgCTR: number
  avgCVR: number
  avgROAS: number
  avgCPC: number
  avgCPM: number
  avgFrequency: number
  mobileTrafficPercent: number
  topPerformingFormats: string[]
  peakSeasons: string[]
}> = {
  ecommerce: {
    avgCTR: 1.2, avgCVR: 2.5, avgROAS: 3.0,
    avgCPC: 850, avgCPM: 12000, avgFrequency: 2.5,
    mobileTrafficPercent: 78,
    topPerformingFormats: ['carousel', 'video', 'collection'],
    peakSeasons: ['11월', '12월', '1월', '5월'],
  },
  food_beverage: {
    avgCTR: 1.5, avgCVR: 3.0, avgROAS: 2.5,
    avgCPC: 650, avgCPM: 9500, avgFrequency: 3.0,
    mobileTrafficPercent: 85,
    topPerformingFormats: ['video', 'story', 'reels'],
    peakSeasons: ['12월', '1월', '2월', '8월'],
  },
  beauty: {
    avgCTR: 1.8, avgCVR: 3.5, avgROAS: 4.0,
    avgCPC: 550, avgCPM: 8500, avgFrequency: 3.5,
    mobileTrafficPercent: 90,
    topPerformingFormats: ['reels', 'video', 'carousel'],
    peakSeasons: ['3월', '5월', '10월', '11월'],
  },
  fashion: {
    avgCTR: 1.4, avgCVR: 2.8, avgROAS: 3.5,
    avgCPC: 700, avgCPM: 10000, avgFrequency: 2.8,
    mobileTrafficPercent: 88,
    topPerformingFormats: ['carousel', 'reels', 'collection'],
    peakSeasons: ['3월', '9월', '11월', '12월'],
  },
  education: {
    avgCTR: 0.9, avgCVR: 1.5, avgROAS: 2.0,
    avgCPC: 1200, avgCPM: 15000, avgFrequency: 2.0,
    mobileTrafficPercent: 65,
    topPerformingFormats: ['video', 'image', 'lead_form'],
    peakSeasons: ['1월', '2월', '8월', '9월'],
  },
  service: {
    avgCTR: 1.0, avgCVR: 2.0, avgROAS: 2.5,
    avgCPC: 950, avgCPM: 13000, avgFrequency: 2.2,
    mobileTrafficPercent: 72,
    topPerformingFormats: ['video', 'lead_form', 'image'],
    peakSeasons: ['1월', '3월', '9월'],
  },
  saas: {
    avgCTR: 0.8, avgCVR: 1.2, avgROAS: 3.0,
    avgCPC: 1500, avgCPM: 18000, avgFrequency: 1.8,
    mobileTrafficPercent: 55,
    topPerformingFormats: ['video', 'image', 'lead_form'],
    peakSeasons: ['1월', '4월', '9월'],
  },
  health: {
    avgCTR: 1.3, avgCVR: 2.2, avgROAS: 2.8,
    avgCPC: 800, avgCPM: 11000, avgFrequency: 2.5,
    mobileTrafficPercent: 82,
    topPerformingFormats: ['video', 'carousel', 'image'],
    peakSeasons: ['1월', '3월', '5월', '9월'],
  },
}
