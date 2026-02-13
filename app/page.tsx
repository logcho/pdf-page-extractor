'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import FileUploader from '@/components/FileUploader';
import { extractPages } from '@/utils/pdfUtils';

const PageSelector = dynamic(() => import('@/components/PageSelector'), {
  ssr: false,
});

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setSelectedPages([]);
    setDownloadUrl(null);
  };

  const handlePageSelectionChange = (indices: number[]) => {
    setSelectedPages(indices);
  };

  const handleExtract = async () => {
    if (!file || selectedPages.length === 0) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      const newPdfBytes = await extractPages(pdfBytes, selectedPages);

      const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (error) {
      console.error('Error extracting pages:', error);
      alert('Failed to extract pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSelectedPages([]);
    setDownloadUrl(null);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-8 bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-5xl mb-12 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            PDF <span className="text-blue-600">Extractor</span>
          </h1>
          <nav>
            <a href="/highlight" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors hover:underline decoration-blue-200 underline-offset-4">
              ✨ Go to Highlighter
            </a>
          </nav>
        </div>
        {file && (
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Start Over
          </button>
        )}
      </header>

      <main className="w-full flex flex-col items-center flex-grow">
        {!file ? (
          <div className="flex flex-col items-center justify-center flex-grow w-full">
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                Extract PDF Pages Instantly
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                Upload your PDF, select the pages you want to keep, and download a new PDF.
                Everything happens in your browser—your files are private and secure.
              </p>
            </div>
            <FileUploader onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="w-full max-w-6xl flex flex-col items-center animate-fade-in">
            <div className="w-full flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 sticky top-4 z-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">
                  PDF
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-md">
                    {file.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedPages.length} pages selected
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {downloadUrl ? (
                  <a
                    href={downloadUrl}
                    download={`extracted-${file.name}`}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </a>
                ) : (
                  <button
                    onClick={handleExtract}
                    disabled={selectedPages.length === 0 || isProcessing}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-md ${selectedPages.length === 0 || isProcessing
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                      }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        Extract {selectedPages.length > 0 ? `${selectedPages.length} Pages` : 'Selected'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
              <PageSelector file={file} onSelectionChange={handlePageSelectionChange} />
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} PDF Extractor. Built with Next.js & pdf-lib.</p>
      </footer>
    </div>
  );
}
