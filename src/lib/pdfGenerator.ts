import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatExportFilename } from './exportFilename'

export interface GeneratedPdfResult {
  filename: string
  base64: string
  blob: Blob
  download: () => void
}

export interface GeneratePdfOptions {
  clientOrProperty?: string | null
  tourType?: string | null
  date?: string | Date | null
  filename?: string
}

/**
 * Generate a high-resolution, print-accurate A4 PDF from a DOM element (the document sheet),
 * adhering to the TwinSpace naming structure ([Client/Property Name]_[Tour Type]_[Date].pdf)
 * and ignoring any .no-print interactive controls.
 */
export async function generateDocumentPdf(
  element: HTMLElement,
  options: GeneratePdfOptions = {},
): Promise<GeneratedPdfResult> {
  const baseFilename =
    options.filename ||
    formatExportFilename({
      clientOrProperty: options.clientOrProperty,
      tourType: options.tourType,
      date: options.date,
    })

  const fullFilename = baseFilename.endsWith('.pdf') ? baseFilename : `${baseFilename}.pdf`

  // Capture canvas with 2x resolution for retina-grade sharpness
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#fbf9f5',
    windowWidth: element.scrollWidth || 800,
    ignoreElements: (el) => {
      return el.classList && el.classList.contains('no-print')
    },
  })

  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pdfWidth = pdf.internal.pageSize.getWidth() // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight() // 297mm
  const imgWidth = pdfWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
  heightLeft -= pdfHeight

  while (heightLeft > 5) {
    position -= pdfHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight
  }

  const blob = pdf.output('blob')
  const dataUri = pdf.output('datauristring')
  const base64 = dataUri.split(',')[1] || ''

  return {
    filename: fullFilename,
    base64,
    blob,
    download: () => {
      pdf.save(fullFilename)
    },
  }
}
