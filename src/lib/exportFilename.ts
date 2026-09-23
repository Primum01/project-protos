/**
 * Formats a clean, professional filename for exported PDF documents.
 * Structure: [Client/Property Name]_[Tour Type]_[Date].pdf
 */
export function formatExportFilename({
  clientOrProperty,
  tourType,
  date,
}: {
  clientOrProperty?: string | null
  tourType?: string | null
  date?: string | Date | null
}): string {
  // 1. Clean client or property name
  const rawName = (clientOrProperty || 'Property').trim()
  const cleanName = rawName
    .replace(/[\\/:*?"<>|]+/g, '-') // Replace filesystem illegal characters
    .replace(/\s+/g, ' ')           // Collapse multiple spaces
    .trim() || 'Property'

  // 2. Clean tour type
  const rawTour = (tourType || '3D Virtual Tour').trim()
  const cleanTour = rawTour
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim() || '3D Virtual Tour'

  // 3. Clean date (formatted as YYYY-MM-DD)
  let dateStr = ''
  if (date instanceof Date) {
    dateStr = date.toISOString().slice(0, 10)
  } else if (typeof date === 'string' && date.trim()) {
    const parsed = new Date(date)
    if (!isNaN(parsed.getTime())) {
      dateStr = parsed.toISOString().slice(0, 10)
    } else {
      dateStr = date
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')
        .trim()
    }
  }
  if (!dateStr) {
    dateStr = new Date().toISOString().slice(0, 10)
  }

  // Pre-filled filename without .pdf extension (browser Save-as-PDF appends .pdf automatically)
  return `${cleanName}_${cleanTour}_${dateStr}`
}
