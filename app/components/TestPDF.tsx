"use client";
import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function TestPDF() {
  const [numPages, setNumPages] = useState<number | null>(null);

  return (
    <div style={{ width: 900, margin: "2rem auto" }}>
      <Document
        file="https://il1edqpklicyhn08.public.blob.vercel-storage.com/Revised%20Elevations%201-9-25.pdf"
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<div>Loading PDF...</div>}
        error={<div>Failed to load PDF</div>}
      >
        <Page pageNumber={1} width={900} />
      </Document>
      {numPages && <div>Number of pages: {numPages}</div>}
    </div>
  );
}