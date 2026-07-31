import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ExtractedPdf {
  totalPages: number;
  pages: Record<string, string>;
}

export async function extractPdfText(
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<ExtractedPdf> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: Record<string, string> = {};

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages[String(i)] = text;
    onProgress?.(i, doc.numPages);
  }

  return { totalPages: doc.numPages, pages };
}
