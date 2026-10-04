// Vercel Serverless Function: Secure Invoice & Receipt Email Dispatch
// Configured sender: no-reply@twinspace360.com
// Never exposes credentials to client-side code or Local Storage.

import { verifyFirebaseAdminToken } from '../_lib/otpStore.ts'

interface SendDocumentPayload {
  type: 'invoice' | 'receipt'
  recipientEmail: string
  clientName: string
  propertyName: string
  propertyLocation?: string
  accountNumber?: string
  documentNumber: string
  documentDate: string
  dueDateOrPaymentDate?: string
  billingFrequency?: string
  items: Array<{ id: string; description: string; qty: number; rate: number }>
  subtotal: number
  discount?: number
  tax?: number
  totalAmount: number
  paymentMethod?: string
  paymentDetailsOrRef?: string
  pdfAttachment?: {
    filename: string
    content: string // Base64-encoded PDF
  }
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function generateHtmlEmail(data: SendDocumentPayload): string {
  const isReceipt = data.type === 'receipt'
  const title = isReceipt ? 'PAYMENT RECEIPT' : 'INVOICE'
  const subjectLabel = isReceipt ? 'Payment Receipt' : 'Invoice'
  const primaryColor = isReceipt ? '#10b981' : '#0b0f19'
  const accentColor = '#d9a373'

  const itemsRows = (data.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
        ${escapeHtml(item.description)}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #475569; text-align: center;">
        ${item.qty || 1}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #475569; text-align: right;">
        KES ${(Number(item.rate) || 0).toLocaleString('en-KE')}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; color: #1e293b; text-align: right;">
        KES ${((Number(item.qty) || 1) * (Number(item.rate) || 0)).toLocaleString('en-KE')}
      </td>
    </tr>
  `,
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subjectLabel)} ${escapeHtml(data.documentNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="640" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: ${primaryColor}; padding: 32px 36px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">TWINSPACE</span>
                    <span style="display: block; font-size: 11px; color: ${accentColor}; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;">Virtual Tours &amp; Digital Twins</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.12); color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                      ${title}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Document Meta & Client Info -->
          <tr>
            <td style="padding: 28px 36px 16px 36px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="55%" valign="top" style="padding-right: 16px;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #94a3b8;">Billed To</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${escapeHtml(data.clientName || 'Valued Client')}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">${escapeHtml(data.propertyName)}</p>
                    ${data.propertyLocation ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">${escapeHtml(data.propertyLocation)}</p>` : ''}
                    ${data.accountNumber ? `<p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 600; color: #0284c7;">Account: ${escapeHtml(data.accountNumber)}</p>` : ''}
                  </td>
                  <td width="45%" valign="top" style="text-align: right;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; color: #64748b; padding-bottom: 4px; text-align: right;">${escapeHtml(subjectLabel)} #:</td>
                        <td style="font-size: 13px; font-weight: 700; color: #0f172a; padding-bottom: 4px; text-align: right; padding-left: 12px;">${escapeHtml(data.documentNumber)}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; color: #64748b; padding-bottom: 4px; text-align: right;">Date:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #334155; padding-bottom: 4px; text-align: right; padding-left: 12px;">${escapeHtml(data.documentDate)}</td>
                      </tr>
                      ${
                        data.dueDateOrPaymentDate
                          ? `<tr>
                        <td style="font-size: 12px; color: #64748b; padding-bottom: 4px; text-align: right;">${isReceipt ? 'Paid Date:' : 'Due Date:'}</td>
                        <td style="font-size: 13px; font-weight: 600; color: #334155; padding-bottom: 4px; text-align: right; padding-left: 12px;">${escapeHtml(data.dueDateOrPaymentDate)}</td>
                      </tr>`
                          : ''
                      }
                      ${
                        data.billingFrequency
                          ? `<tr>
                        <td style="font-size: 12px; color: #64748b; text-align: right;">Frequency:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #334155; text-align: right; padding-left: 12px;">${escapeHtml(data.billingFrequency)}</td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 16px 36px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f1f5f9;">
                    <th style="padding: 10px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #475569;">Description</th>
                    <th style="padding: 10px 16px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #475569; width: 60px;">Qty</th>
                    <th style="padding: 10px 16px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #475569; width: 100px;">Rate</th>
                    <th style="padding: 10px 16px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #475569; width: 110px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Summary -->
          <tr>
            <td style="padding: 12px 36px 28px 36px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="55%" valign="top" style="padding-right: 20px;">
                    <div style="background-color: #f8fafc; border-left: 3px solid ${accentColor}; padding: 14px 16px; border-radius: 4px;">
                      <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">
                        ${isReceipt ? 'Payment Confirmation' : 'Payment Instructions'}
                      </p>
                      <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1e293b;">
                        ${escapeHtml(data.paymentDetailsOrRef || 'Paybill: 247247 | Account: ' + (data.accountNumber || data.documentNumber))}
                      </p>
                    </div>
                  </td>
                  <td width="45%" valign="top">
                    <table width="100%" border="0" cellspacing="0" cellpadding="4">
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Subtotal:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">KES ${(data.subtotal || 0).toLocaleString('en-KE')}</td>
                      </tr>
                      ${
                        data.discount
                          ? `<tr>
                        <td style="font-size: 13px; color: #16a34a;">Discount:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #16a34a; text-align: right;">-KES ${(data.discount || 0).toLocaleString('en-KE')}</td>
                      </tr>`
                          : ''
                      }
                      ${
                        data.tax
                          ? `<tr>
                        <td style="font-size: 13px; color: #64748b;">VAT (16%):</td>
                        <td style="font-size: 13px; font-weight: 600; color: #1e293b; text-align: right;">KES ${(data.tax || 0).toLocaleString('en-KE')}</td>
                      </tr>`
                          : ''
                      }
                      <tr style="border-top: 2px solid #e2e8f0;">
                        <td style="font-size: 15px; font-weight: 700; color: #0f172a; padding-top: 8px;">
                          ${isReceipt ? 'Total Paid:' : 'Total Due:'}
                        </td>
                        <td style="font-size: 16px; font-weight: 800; color: ${primaryColor}; text-align: right; padding-top: 8px;">
                          KES ${(data.totalAmount || 0).toLocaleString('en-KE')}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #334155;">Thank you for partnering with TwinSpace.</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Immersive spaces. Extraordinary experiences.</p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8;">
                TwinSpace Virtual Tours &bull; Sent securely from no-reply@twinspace360.com &bull; Inquiries: info@twinspace360.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed. Only POST requests are permitted.' })
  }

  try {
    // 1. Enforce admin authentication
    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const idToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (typeof req.body === 'object' && req.body?.idToken) || ''

    const isVerifiedAdmin = await verifyFirebaseAdminToken(idToken)
    if (!isVerifiedAdmin) {
      return res.status(401).json({
        error: 'Unauthorized: valid team@twinspace360.com admin credentials required to dispatch documents.',
      })
    }

    const body: SendDocumentPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}

    // Validation
    if (!body.recipientEmail || typeof body.recipientEmail !== 'string' || !EMAIL_REGEX.test(body.recipientEmail.trim())) {
      return res.status(400).json({ error: 'A valid recipient email address is required.' })
    }

    if (!body.documentNumber || !body.totalAmount) {
      return res.status(400).json({ error: 'Missing required document details (documentNumber or totalAmount).' })
    }

    const recipient = body.recipientEmail.trim().toLowerCase()
    const isReceipt = body.type === 'receipt'
    const subject = isReceipt
      ? `Twinspace Payment Receipt – ${body.documentNumber}`
      : `Twinspace Invoice – ${body.documentNumber}`
    const html = generateHtmlEmail(body)

    const senderEmail = 'TwinSpace <no-reply@twinspace360.com>'

    // Live dispatch via Resend API if configured
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      const emailPayload: any = {
        from: senderEmail,
        to: [recipient],
        subject,
        html,
      }

      if (body.pdfAttachment && body.pdfAttachment.content) {
        emailPayload.attachments = [
          {
            filename: body.pdfAttachment.filename.endsWith('.pdf')
              ? body.pdfAttachment.filename
              : `${body.pdfAttachment.filename}.pdf`,
            content: body.pdfAttachment.content,
          },
        ]
      }

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text()
        console.error('[send-invoice] Resend API error:', resendResponse.status, errorText)
        return res.status(502).json({
          error: `Email delivery failed: ${errorText || 'Upstream mail service error.'}`,
          sender: 'no-reply@twinspace360.com',
        })
      }

      const resendData = await resendResponse.json()
      return res.status(200).json({
        success: true,
        delivered: true,
        messageId: resendData.id,
        recipient,
        sender: 'no-reply@twinspace360.com',
        hasPdfAttachment: Boolean(body.pdfAttachment?.content),
        message: `Email dispatched successfully to ${recipient} from no-reply@twinspace360.com${body.pdfAttachment ? ` with PDF (${body.pdfAttachment.filename}) attached` : ''}.`,
      })
    }

    // In local dev or environments without external API keys:
    console.log(
      `[send-invoice] Prepared dispatch to ${recipient} from no-reply@twinspace360.com (Live RESEND_API_KEY not set in env). Attached PDF: ${body.pdfAttachment?.filename || 'None'}`,
    )

    return res.status(200).json({
      success: true,
      delivered: false,
      simulated: true,
      recipient,
      sender: 'no-reply@twinspace360.com',
      hasPdfAttachment: Boolean(body.pdfAttachment?.content),
      message: `Email prepared for ${recipient} from no-reply@twinspace360.com${body.pdfAttachment ? ` with PDF (${body.pdfAttachment.filename}) attached` : ''}. (Server mail gateway ready; live API key not set in environment).`,
    })
  } catch (err: any) {
    console.error('[send-invoice] Handler error:', err)
    return res.status(500).json({
      error: err.message || 'Internal server error processing email dispatch.',
    })
  }
}
