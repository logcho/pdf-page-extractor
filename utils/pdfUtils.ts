import { PDFDocument } from 'pdf-lib';

/**
 * Extracts specific pages from a PDF and returns a new PDF as a byte array.
 * @param originalPdfBytes The source PDF as a Uint8Array.
 * @param pageIndices The 0-based indices of the pages to extract.
 * @returns A Promise that resolves to the new PDF as a Uint8Array.
 */
export async function extractPages(originalPdfBytes: Uint8Array, pageIndices: number[]): Promise<Uint8Array> {
  // Load the existing PDF
  const pdfDoc = await PDFDocument.load(originalPdfBytes);

  // Create a new PDF
  const newPdf = await PDFDocument.create();

  // Copy the requested pages
  const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);

  // Add the copied pages to the new PDF
  copiedPages.forEach((page) => newPdf.addPage(page));

  // Save the new PDF
  const newPdfBytes = await newPdf.save();

  return newPdfBytes;
}
