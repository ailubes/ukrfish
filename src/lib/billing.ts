import { type MembershipBillingCycle } from '@prisma/client'

export function billingCycleMultiplier(cycle: MembershipBillingCycle): number {
  if (cycle === 'YEARLY') {
    return 10
  }

  if (cycle === 'QUARTERLY') {
    return 3
  }

  return 1
}

export function calculateInvoiceAmountMinor(monthlyPriceUah: number, cycle: MembershipBillingCycle): number {
  return Math.max(0, monthlyPriceUah) * billingCycleMultiplier(cycle) * 100
}

export function formatMoneyUahFromMinor(amountMinor: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 2,
  }).format(amountMinor / 100)
}

export function cycleLabelUk(cycle: MembershipBillingCycle): string {
  if (cycle === 'YEARLY') {
    return 'Щорічно (10 міс.)'
  }

  if (cycle === 'QUARTERLY') {
    return 'Щоквартально'
  }

  return 'Щомісячно'
}

export function statusLabelUk(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Чернетка',
    ISSUED: 'Виставлено',
    PARTIALLY_PAID: 'Частково сплачено',
    PAID: 'Сплачено',
    OVERDUE: 'Прострочено',
    CANCELED: 'Скасовано',
    VOID: 'Анульовано',
    PENDING: 'Очікує перевірки',
    CONFIRMED: 'Підтверджено',
    REJECTED: 'Відхилено',
    FAILED: 'Неуспішно',
    REFUNDED: 'Повернуто',
  }

  return labels[status] ?? status
}
