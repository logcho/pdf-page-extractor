'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Highlight {
  id: string;
  rects: { top: number; left: number; width: number; height: number }[];
  pageIndex: number;
  text?: string;
}

interface PDFHighlighterProps {
  file: File;
}

const PDFHighlighter: React.FC<PDFHighlighterProps> = ({ file }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setCurrentPage(1);
    setHighlights([]);
  }

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const pageElement = pageRef.current;

    if (!pageElement || !pageElement.contains(range.commonAncestorContainer)) return;

    const rects = Array.from(range.getClientRects());
    const pageRect = pageElement.getBoundingClientRect();

    const relativeRects = rects.map(rect => ({
      top: rect.top - pageRect.top,
      left: rect.left - pageRect.left,
      width: rect.width,
      height: rect.height,
    }));

    if (relativeRects.length > 0) {
      const newHighlight: Highlight = {
        id: crypto.randomUUID(),
        rects: relativeRects,
        pageIndex: currentPage - 1,
        text: selection.toString(),
      };

      setHighlights(prev => [...prev, newHighlight]);
      selection.removeAllRanges();
    }
  }, [currentPage]);

  const removeHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  const handleSave = async () => {
    if (highlights.length === 0) {
      alert('No highlights to save.');
      return;
    }

    setIsSaving(true);
    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      const pages = pdfDoc.getPages();

      // We assume the rendered width is 800px as set in the Page component
      // Note: responsive resizing would require tracking actual rendered width
      const RENDERED_WIDTH = 800;

      highlights.forEach(highlight => {
        const page = pages[highlight.pageIndex];
        if (!page) return;

        const { width: pageWidth, height: pageHeight } = page.getSize();
        const scaleFactor = pageWidth / RENDERED_WIDTH;

        highlight.rects.forEach(rect => {
          // Convert DOM coordinates (top-left origin) to PDF coordinates (bottom-left origin)
          // x = left * scale
          // y = pageHeight - ((top + height) * scale) (or similar, depending on exact alignment)

          // rect.top is distance from top of rendered page
          // pdf y is distance from bottom of pdf page

          const x = rect.left * scaleFactor;
          const height = rect.height * scaleFactor;
          const width = rect.width * scaleFactor;

          // In DOM, y increases downwards. In PDF, y increases upwards.
          // y in PDF starts from bottom.
          // The 'top' in DOM is distance from top.
          // So y_pdf = pageHeight - (top_dom * scale) - height_pdf
          const y = pageHeight - (rect.top * scaleFactor) - height;

          page.drawRectangle({
            x,
            y,
            width,
            height,
            color: rgb(1, 1, 0), // Yellow
            opacity: 0.4,
          });
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `highlighted-${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Failed to save PDF.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full bg-gray-100 min-h-screen p-4">
      {/* Controls */}
      <div className="bg-white p-2 rounded shadow mb-4 flex gap-4 items-center sticky top-4 z-10 w-full max-w-4xl justify-between">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || numPages === 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="font-medium">
            Page {currentPage} of {numPages || '--'}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages || numPages === 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {highlights.length} total highlights
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || highlights.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {isSaving ? 'Saving...' : '💾 Save PDF'}
          </button>
        </div>
      </div>

      {/* PDF View */}
      <div
        className="relative bg-white shadow-lg select-text"
        ref={pageRef}
        onMouseUp={handleMouseUp}
        style={{ minHeight: '500px' }} // Placeholder height
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="p-10">Loading PDF...</div>}
        >
          <Page
            pageNumber={currentPage}
            renderTextLayer={true}
            renderAnnotationLayer={false}
            width={800} // Fixed width for simplicity, could be responsive
            className="border"
          />
        </Document>

        {/* Highlights Overlay */}
        {highlights
          .filter(h => h.pageIndex === currentPage - 1)
          .map(highlight => (
            <React.Fragment key={highlight.id}>
              {highlight.rects.map((rect, idx) => (
                <div
                  key={`${highlight.id}-${idx}`}
                  className="absolute bg-yellow-300 opacity-40 hover:opacity-60 cursor-pointer pointer-events-auto mix-blend-multiply"
                  style={{
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                  }}
                  title={highlight.text}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Remove this highlight?')) {
                      removeHighlight(highlight.id);
                    }
                  }}
                />
              ))}
            </React.Fragment>
          ))}
      </div>

      <div className="mt-8 w-full max-w-4xl">
        <h3 className="text-lg font-bold mb-2">Highlights Log</h3>
        <div className="bg-white p-4 rounded border h-40 overflow-y-auto font-mono text-sm">
          {highlights.length === 0 ? (
            <span className="text-gray-400">No highlights yet. Select text on the PDF to highlight.</span>
          ) : (
            highlights.map(h => (
              <div key={h.id} className="mb-1 border-b pb-1 last:border-0">
                <span className="text-gray-500">[Page {h.pageIndex + 1}]</span>: "{h.text?.substring(0, 50)}{h.text && h.text.length > 50 ? '...' : ''}"
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFHighlighter;
