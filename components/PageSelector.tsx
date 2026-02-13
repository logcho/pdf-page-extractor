'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface PageSelectorProps {
    file: File;
    onSelectionChange: (selectedPageIndices: number[]) => void;
}

const PageSelector: React.FC<PageSelectorProps> = ({ file, onSelectionChange }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const togglePageSelection = (index: number) => {
        const newSelection = new Set(selectedIndices);
        if (newSelection.has(index)) {
            newSelection.delete(index);
        } else {
            newSelection.add(index);
        }
        setSelectedIndices(newSelection);

        // Sort indices to maintain order
        const sortedIndices = Array.from(newSelection).sort((a, b) => a - b);
        onSelectionChange(sortedIndices);
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-4xl p-4">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-wrap justify-center gap-4"
                    loading={<div className="text-center p-4">Loading PDF...</div>}
                >
                    {Array.from(new Array(numPages), (el, index) => (
                        <div
                            key={`page_${index + 1}`}
                            className={`relative cursor-pointer border-2 transition-all duration-200 ${selectedIndices.has(index)
                                    ? 'border-blue-500 shadow-lg scale-105'
                                    : 'border-transparent hover:border-gray-300'
                                }`}
                            onClick={() => togglePageSelection(index)}
                        >
                            <Page
                                pageNumber={index + 1}
                                width={200}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                            <div
                                className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedIndices.has(index)
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'bg-white/80 border-gray-400'
                                    }`}
                            >
                                {selectedIndices.has(index) && (
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
                                Page {index + 1}
                            </div>
                        </div>
                    ))}
                </Document>
            </div>
        </div>
    );
};

export default PageSelector;
