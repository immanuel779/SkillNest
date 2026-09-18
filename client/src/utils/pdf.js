import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Point pdf.js at its worker (Vite bundles it with ?url)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

/**
 * Extract plain text from a PDF File object.
 * Returns a string. Throws if the PDF can't be read.
 */
export async function extractPdfText(file) {
  if (!file) throw new Error('No file provided.')

  // Only handle PDFs — DOCX extraction needs a different lib
  const isPdf =
    file.type === 'application/pdf' ||
    file.name?.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    throw new Error('Not a PDF file.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Group text items into lines using their Y position
    const lines = []
    let currentY = null
    let currentLine = []

    for (const item of content.items) {
      if (!item.str) continue
      const y = item.transform?.[5] ?? 0

      if (currentY === null || Math.abs(y - currentY) < 2) {
        currentLine.push(item.str)
        currentY = y
      } else {
        lines.push(currentLine.join(' ').trim())
        currentLine = [item.str]
        currentY = y
      }
    }
    if (currentLine.length) lines.push(currentLine.join(' ').trim())

    pages.push(lines.filter(Boolean).join('\n'))
  }

  const text = pages.join('\n\n').trim()

  if (!text) {
    throw new Error(
      'No readable text found in this PDF. It may be a scanned image.'
    )
  }

  return text
}