'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import FileUploader from '@/components/FileUploader';

const PDFHighlighter = dynamic(() => import('@/components/PDFHighlighter'), {
    ssr: false,
});

export default function HighlightPage() {
    const [file, setFile] = useState<File | null>(null);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-[family-name:var(--font-geist-sans)]">
            <header className="w-full bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">
                        PDF <span className="text-yellow-600">Highlighter</span>
                    </h1>
                </div>

                {file && (
                    <button
                        onClick={() => setFile(null)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Upload Different File
                    </button>
                )}
            </header>

            <main className="flex-grow flex flex-col items-center justify-start p-8">
                {!file ? (
                    <div className="max-w-2xl w-full flex flex-col items-center mt-20">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                            Highlight & Annotate PDFs
                        </h2>
                        <p className="text-gray-600 mb-8 text-center max-w-lg">
                            Upload a document to start highlighting text directly in your browser.
                        </p>
                        <FileUploader onFileSelect={setFile} />
                    </div>
                ) : (
                    <div className="w-full max-w-6xl animate-fade-in">
                        <PDFHighlighter file={file} />
                    </div>
                )}
            </main>
        </div>
    );
}
