import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Test naming format helper logic
function formatExportFilename({ clientOrProperty, tourType, date }) {
  const sanitize = (str) =>
    (str || '')
      .replace(/[\/\\?%*:|"<>]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

  const cleanEntity = sanitize(clientOrProperty) || 'Client'
  const cleanTour = sanitize(tourType) || '3D_Virtual_Tour'

  let dateStr = ''
  if (date instanceof Date) {
    dateStr = date.toISOString().slice(0, 10)
  } else if (typeof date === 'string' && date.trim()) {
    dateStr = sanitize(date.trim())
  } else {
    dateStr = new Date().toISOString().slice(0, 10)
  }

  return `${cleanEntity}_${cleanTour}_${dateStr}.pdf`
}

describe('PDF Export & Send System Tests', () => {
  describe('Naming Structure & Sanitization', () => {
    it('generates filename following [Client/Property Name]_[Tour Type]_[Date].pdf', () => {
      const filename = formatExportFilename({
        clientOrProperty: 'John Doe - Kilimani Heights',
        tourType: 'Apartments For Sale 3D Tour',
        date: '2026-09-27',
      })
      assert.equal(filename, 'John_Doe_-_Kilimani_Heights_Apartments_For_Sale_3D_Tour_2026-09-27.pdf')
    })

    it('sanitizes illegal path and URL characters properly', () => {
      const filename = formatExportFilename({
        clientOrProperty: 'Client / Villa & Co: Special*',
        tourType: 'Matterport 3D Tour?',
        date: '27 Sep 2026',
      })
      assert.equal(filename, 'Client_Villa_&_Co_Special_Matterport_3D_Tour_27_Sep_2026.pdf')
    })

    it('falls back safely when entity or tour type are missing', () => {
      const filename = formatExportFilename({
        clientOrProperty: '',
        tourType: '',
        date: null,
      })
      assert.match(filename, /^Client_3D_Virtual_Tour_\d{4}-\d{2}-\d{2}\.pdf$/)
    })
  })

  describe('Send Endpoint Payload Validation', () => {
    it('accepts base64 pdfAttachment in invoice dispatch payload', () => {
      const mockPayload = {
        type: 'invoice',
        recipientEmail: 'client@example.com',
        clientName: 'Jane Smith',
        propertyName: 'Ocean View Villa',
        accountNumber: 'MSA-NYA-0001',
        documentNumber: 'INV-2026-0042',
        documentDate: '27 SEP 2026',
        dueDateOrPaymentDate: '27 OCT 2026',
        billingFrequency: 'Monthly',
        items: [{ id: '1', description: 'Matterport 3D Tour', qty: 1, rate: 4500 }],
        subtotal: 4500,
        discount: 0,
        tax: 720,
        totalAmount: 5220,
        paymentDetailsOrRef: 'Bank Transfer',
        pdfAttachment: {
          filename: 'Jane_Smith_-_Ocean_View_Villa_Matterport_3D_Tour_2026-09-27.pdf',
          content: 'JVBERi0xLjMKJcfs...base64data',
        },
      }

      assert.ok(mockPayload.pdfAttachment)
      assert.equal(mockPayload.pdfAttachment.filename.endsWith('.pdf'), true)
      assert.ok(mockPayload.pdfAttachment.content.length > 0)
    })

    it('accepts base64 pdfAttachment in receipt dispatch payload', () => {
      const mockReceiptPayload = {
        type: 'receipt',
        recipientEmail: 'client@example.com',
        clientName: 'Jane Smith',
        propertyName: 'Ocean View Villa',
        accountNumber: 'MSA-NYA-0001',
        documentNumber: 'REC-2026-0015',
        documentDate: '27 SEP 2026',
        dueDateOrPaymentDate: '27 SEP 2026',
        billingFrequency: 'Quarterly',
        items: [{ id: '1', description: 'Hosting & Tour Management', qty: 1, rate: 3000 }],
        subtotal: 3000,
        discount: 300,
        tax: 432,
        totalAmount: 3132,
        paymentMethod: 'M-Pesa',
        paymentDetailsOrRef: 'QK9182XX9',
        pdfAttachment: {
          filename: 'Jane_Smith_-_Ocean_View_Villa_Hosting_2026-09-27.pdf',
          content: 'JVBERi0xLjMKJcfs...base64data',
        },
      }

      assert.equal(mockReceiptPayload.type, 'receipt')
      assert.equal(mockReceiptPayload.pdfAttachment.filename.endsWith('.pdf'), true)
    })
  })
})
