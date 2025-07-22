"use client"

import React, { useState, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  try {
    // Try multiple worker sources for better compatibility
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  } catch (error) {
    console.error('Failed to set PDF worker:', error);
  }
}

type SimplePDFViewerProps = {
  fileUrl: string;
  title?: string;
}

export default function SimplePDFViewer({ fileUrl, title }: SimplePDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log('SimplePDFViewer - fileUrl:', fileUrl);
    console.log('SimplePDFViewer - title:', title);
  }, [fileUrl, title]);

  // Convert relative URL to absolute URL if needed
  const getAbsoluteUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // For relative URLs, make them absolute
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    return url;
  };

  const absoluteFileUrl = getAbsoluteUrl(fileUrl);
  console.log('SimplePDFViewer - absoluteFileUrl:', absoluteFileUrl);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      fileUrl: absoluteFileUrl
    });
    setError(`Failed to load PDF: ${error.message}`);
    setLoading(false);
  };

  const onPageLoadError = (error: Error) => {
    console.error('Page load error:', error);
    console.error('Page error details:', {
      message: error.message,
      stack: error.stack,
      pageNumber,
      fileUrl: absoluteFileUrl
    });
    setError(`Failed to load PDF page: ${error.message}`);
  };

  const goToPrevPage = () => {
    setPageNumber(pageNumber - 1 <= 1 ? 1 : pageNumber - 1);
  };

  const goToNextPage = () => {
    setPageNumber(pageNumber + 1 >= (numPages || 1) ? (numPages || 1) : pageNumber + 1);
  };

  const zoomIn = () => {
    setScale(scale * 1.2);
  };

  const zoomOut = () => {
    setScale(scale / 1.2);
  };

  const rotate = () => {
    setRotation(rotation + 90);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg">
        <div className="text-red-500 text-lg font-medium mb-2">Error Loading PDF</div>
        <div className="text-red-600 text-sm text-center">{error}</div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b rounded-t-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <Document
              file={absoluteFileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center w-full h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              }
              error={
                <div className="text-red-500 p-4 bg-red-50 rounded">
                  Failed to load PDF document
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                onLoadError={onPageLoadError}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div className="flex items-center justify-center w-full h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                }
              />
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
} 