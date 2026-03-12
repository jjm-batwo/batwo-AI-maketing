/**
 * Notification Module - DI 등록
 *
 * 알림 인프라: NotificationChannel/Preference 리포지토리, Slack/Kakao 어댑터, Dispatcher
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'
import { prisma } from '@/lib/prisma'

import type { INotificationChannelRepository } from '@domain/repositories/INotificationChannelRepository'
import type { INotificationPreferenceRepository } from '@domain/repositories/INotificationPreferenceRepository'
import type { INotificationSender } from '@application/ports/INotificationSender'

import { PrismaNotificationChannelRepository } from '@infrastructure/database/repositories/PrismaNotificationChannelRepository'
import { PrismaNotificationPreferenceRepository } from '@infrastructure/database/repositories/PrismaNotificationPreferenceRepository'
import { SlackNotificationSender } from '@infrastructure/notification/SlackNotificationSender'
import { KakaoNotificationSender } from '@infrastructure/notification/KakaoNotificationSender'
import { NotificationDispatcherService } from '@application/services/NotificationDispatcherService'

export function registerNotificationModule(container: Container): void {
  // --- Repositories ---
  container.registerSingleton<INotificationChannelRepository>(
    DI_TOKENS.NotificationChannelRepository,
    () => new PrismaNotificationChannelRepository(prisma)
  )

  container.registerSingleton<INotificationPreferenceRepository>(
    DI_TOKENS.NotificationPreferenceRepository,
    () => new PrismaNotificationPreferenceRepository(prisma)
  )

  // --- Notification Senders ---
  container.registerSingleton<INotificationSender>(
    DI_TOKENS.SlackNotificationSender,
    () => new SlackNotificationSender()
  )

  container.registerSingleton<INotificationSender>(
    DI_TOKENS.KakaoNotificationSender,
    () => new KakaoNotificationSender()
  )

  // --- Dispatcher Service ---
  container.registerSingleton(
    DI_TOKENS.NotificationDispatcherService,
    () =>
      new NotificationDispatcherService(
        container.resolve<INotificationChannelRepository>(DI_TOKENS.NotificationChannelRepository),
        container.resolve<INotificationPreferenceRepository>(
          DI_TOKENS.NotificationPreferenceRepository
        ),
        container.resolve<INotificationSender>(DI_TOKENS.SlackNotificationSender),
        container.resolve<INotificationSender>(DI_TOKENS.KakaoNotificationSender)
      )
  )
}
