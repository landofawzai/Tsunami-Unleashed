// Sequence Engine - Processes automated drip campaign steps
// Handles enrollment, step progression, and scheduled sending

import { prisma } from './prisma'
import { firePabblyWebhook, buildDeliveryPayload, canDeliverToChannel } from './pabbly-integration'
import { adaptForChannel } from './channel-adapter'
import { translateMessage } from './translator'
import { updateCommunicationMetrics, generateAlert } from './campaign-helpers'

/**
 * Process all sequence enrollments that are due
 * Called via cron-style API endpoint or Pabbly scheduled trigger
 */
export async function processSequenceQueue(): Promise<{
  processed: number
  sent: number
  failed: number
  completed: number
}> {
  const now = new Date()

  // Find enrollments where nextSendAt <= now and status = 'active'
  const dueEnrollments = await prisma.sequenceEnrollment.findMany({
    where: {
      status: 'active',
      nextSendAt: { lte: now },
    },
    include: {
      sequence: {
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      },
      contact: true,
    },
  })

  let processed = 0
  let sent = 0
  let failed = 0
  let completed = 0

  for (const enrollment of dueEnrollments) {
    processed++

    // Find the current step to send
    const nextStepNumber = enrollment.currentStep + 1
    const step = enrollment.sequence.steps.find(
      (s) => s.stepNumber === nextStepNumber
    )

    if (!step) {
      // No more steps — mark as completed
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'completed',
          completedAt: now,
          nextSendAt: null,
        },
      })
      completed++
      continue
    }

    const channels: string[] = JSON.parse(step.channels || '["email"]')
    let stepSent = 0
    let stepFailed = 0

    for (const channel of channels) {
      if (!canDeliverToChannel(enrollment.contact, channel)) continue

      try {
        // Translate if needed
        let messageBody = step.body
        if (enrollment.contact.language !== 'en') {
          const translation = await translateMessage(
            step.body,
            'en',
            enrollment.contact.language,
            `seq-${enrollment.sequenceId}-step-${step.stepNumber}`
          )
          messageBody = translation.text
        }

        // Adapt for channel
        const adapted = await adaptForChannel(messageBody, channel, {
          campaignType: 'sequence_step',
          subject: step.subject || enrollment.sequence.name,
        })

        // Fire delivery
        const payload = buildDeliveryPayload(
          `seq-${enrollment.sequenceId}`,
          `step-${step.stepNumber}`,
          enrollment.contact,
          channel,
          adapted.subject || step.subject || enrollment.sequence.name,
          adapted.body,
          'normal'
        )

        const result = await firePabblyWebhook(payload)
        if (result.success) {
          stepSent++
        } else {
          stepFailed++
        }
      } catch (error) {
        console.error(`Sequence send error for ${enrollment.contact.name}:`, error)
        stepFailed++
      }
    }

    if (stepSent > 0) {
      sent += stepSent

      // Advance to next step
      const nextStep = enrollment.sequence.steps.find(
        (s) => s.stepNumber === nextStepNumber + 1
      )

      if (nextStep) {
        // Calculate next send time
        const nextSendAt = new Date(now)
        nextSendAt.setDate(nextSendAt.getDate() + nextStep.delayDays)

        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStepNumber,
            nextSendAt,
          },
        })
      } else {
        // This was the last step
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStepNumber,
            status: 'completed',
            completedAt: now,
            nextSendAt: null,
          },
        })
        completed++
      }
    } else {
      failed += stepFailed
      // Generate alert on complete failure
      await generateAlert(
        'warning',
        'sequence_error',
        `Sequence step ${nextStepNumber} failed for ${enrollment.contact.name} in "${enrollment.sequence.name}"`,
        {
          enrollmentId: enrollment.id,
          sequenceId: enrollment.sequenceId,
          contactId: enrollment.contactId,
          stepNumber: nextStepNumber,
        }
      )
    }
  }

  // Update metrics
  if (sent > 0 || failed > 0) {
    await updateCommunicationMetrics({
      messagesSent: sent + failed,
      messagesDelivered: sent,
      messagesFailed: failed,
    })
  }

  return { processed, sent, failed, completed }
}

/**
 * Enroll a contact in a sequence
 */
export async function enrollContact(
  sequenceId: string,
  contactId: string
): Promise<{ success: boolean; error?: string }> {
  const sequence = await prisma.sequence.findUnique({
    where: { id: sequenceId },
    include: { steps: { orderBy: { stepNumber: 'asc' } } },
  })

  if (!sequence) return { success: false, error: 'Sequence not found' }
  if (sequence.status !== 'active') return { success: false, error: 'Sequence is not active' }

  // Check if already enrolled
  const existing = await prisma.sequenceEnrollment.findUnique({
    where: { sequenceId_contactId: { sequenceId, contactId } },
  })
  if (existing) return { success: false, error: 'Contact already enrolled' }

  const firstStep = sequence.steps[0]
  const nextSendAt = new Date()
  if (firstStep) {
    nextSendAt.setDate(nextSendAt.getDate() + firstStep.delayDays)
  }

  await prisma.sequenceEnrollment.create({
    data: {
      sequenceId,
      contactId,
      currentStep: 0,
      status: 'active',
      nextSendAt,
    },
  })

  return { success: true }
}
