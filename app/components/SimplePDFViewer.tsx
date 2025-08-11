"use client"

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SimplePDFViewerProps = {
  fileUrl: string;
  title?: string;
}

export default function SimplePDFViewer({ fileUrl, title }: SimplePDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

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

  // Test if we can fetch the PDF
  useEffect(() => {
    const testPdfFetch = async () => {
      try {
        console.log('Testing PDF fetch for:', absoluteFileUrl);
        const response = await fetch(absoluteFileUrl);
        
        if (!response.ok) {
          setError(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        } else {
          setLoading(false);
        }
      } catch (error) {
        setError(`Failed to fetch PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    if (absoluteFileUrl) {
      testPdfFetch();
    }
  }, [absoluteFileUrl]);

  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, 3.0);
    setScale(newScale);
    setIframeKey(prev => prev + 1); // Force iframe reload
  };

  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.3);
    setScale(newScale);
    setIframeKey(prev => prev + 1); // Force iframe reload
  };

  // Get zoom level for PDF URL parameters
  const getPdfZoomLevel = () => {
    if (scale <= 0.5) return 50;
    if (scale <= 0.75) return 75;
    if (scale <= 1.25) return 100;
    if (scale <= 1.5) return 125;
    if (scale <= 2.0) return 150;
    if (scale <= 2.5) return 200;
    return 250;
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
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">PDF Viewer</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setScale(1.0);
              setIframeKey(prev => prev + 1);
            }}
            title="Reset Zoom"
            className="text-xs px-2"
          >
            100%
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.open(absoluteFileUrl, '_blank')}
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center h-full">
          <div 
            className={`bg-white shadow-lg overflow-hidden ${isFullscreen ? 'w-full h-full' : 'rounded-lg'}`}
            style={{ 
              width: isFullscreen ? '100%' : '100%', 
              height: isFullscreen ? '100%' : '100%',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <iframe
              key={iframeKey}
              src={`${absoluteFileUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=${getPdfZoomLevel()}`}
              className="w-full h-full border-0"
              title={title || "PDF Document"}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError("Failed to load PDF in iframe");
                setLoading(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 