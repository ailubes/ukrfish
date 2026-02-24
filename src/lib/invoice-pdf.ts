import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { cycleLabelUk, formatMoneyUahFromMinor, statusLabelUk } from '@/lib/billing'
import { type BillingIssuerSnapshot } from '@/lib/billing-issuer'

interface InvoicePdfInput {
  number: string
  issuedAt: Date | null
  dueAt: Date | null
  status: string
  amountMinor: number
  paidMinor: number
  note: string | null
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null
  userName: string | null
  userEmail: string
  organizationName: string | null
  planName: string | null
  issuer: BillingIssuerSnapshot
}

function dateLabel(value: Date | null): string {
  if (!value) {
    return '-'
  }

  return value.toLocaleDateString('uk-UA')
}

export async function buildInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const textColor = rgb(0.08, 0.1, 0.14)
  let y = 800

  const drawLine = (text: string, opts?: { bold?: boolean; size?: number; gap?: number }) => {
    const size = opts?.size ?? 11
    page.drawText(text, {
      x: 44,
      y,
      size,
      font: opts?.bold ? bold : font,
      color: textColor,
    })
    y -= opts?.gap ?? size + 6
  }

  drawLine('РАХУНОК НА ОПЛАТУ', { bold: true, size: 18, gap: 20 })
  drawLine(`Номер: ${input.number}`, { bold: true })
  drawLine(`Дата виставлення: ${dateLabel(input.issuedAt)}`)
  drawLine(`Сплатити до: ${dateLabel(input.dueAt)}`)
  drawLine(`Статус: ${statusLabelUk(input.status)}`)
  y -= 8

  drawLine('Виставник', { bold: true, size: 13, gap: 18 })
  drawLine(input.issuer.legalName)
  drawLine(`Скорочена назва: ${input.issuer.shortName}`)
  drawLine(`ЄДРПОУ: ${input.issuer.edrpou}`)
  drawLine(`IBAN: ${input.issuer.iban}`)
  drawLine(`Банк: ${input.issuer.bankName}`)
  if (input.issuer.mfo) drawLine(`МФО: ${input.issuer.mfo}`)
  if (input.issuer.vatNumber) drawLine(`ПДВ: ${input.issuer.vatNumber}`)
  drawLine(`Адреса: ${input.issuer.legalAddress}`)
  if (input.issuer.email) drawLine(`Email: ${input.issuer.email}`)
  if (input.issuer.phone) drawLine(`Телефон: ${input.issuer.phone}`)
  if (input.issuer.website) drawLine(`Сайт: ${input.issuer.website}`)
  y -= 8

  drawLine('Платник', { bold: true, size: 13, gap: 18 })
  drawLine(`Контакт: ${input.userName ?? 'Без імені'}`)
  drawLine(`Email: ${input.userEmail}`)
  if (input.organizationName) {
    drawLine(`Організація: ${input.organizationName}`)
  }
  y -= 8

  drawLine('Нарахування', { bold: true, size: 13, gap: 18 })
  drawLine(`План: ${input.planName ?? '-'}`)
  drawLine(`Цикл: ${input.billingCycle ? cycleLabelUk(input.billingCycle) : '-'}`)
  drawLine(`Сума: ${formatMoneyUahFromMinor(input.amountMinor)}`, { bold: true })
  drawLine(`Сплачено: ${formatMoneyUahFromMinor(input.paidMinor)}`)
  if (input.note) {
    y -= 4
    drawLine(`Примітка: ${input.note}`)
  }

  y -= 18
  drawLine('Цей документ сформовано автоматично в системі UKRFISH.', { size: 9, gap: 12 })
  if (input.issuer.signatoryName || input.issuer.signatoryPosition) {
    drawLine(
      `Підписант: ${input.issuer.signatoryPosition ?? ''} ${input.issuer.signatoryName ?? ''}`.trim(),
      { size: 9 },
    )
  }

  return doc.save()
}
