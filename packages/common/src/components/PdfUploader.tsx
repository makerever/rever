// Reusable component for PDF Render

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import PageLoader from "./Loader";
import { ZoomIn, ZoomOut } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  fileUrl: string;
  maxWidth?: number;
};

const PDFViewer: React.FC<Props> = ({ fileUrl, maxWidth = 800 }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [scale, setScale] = useState(1.0);

  const containerRef = useRef<HTMLDivElement>(null);

  // use relative url for PDF.js to work correctly
  const urlObject = new URL(fileUrl);
  const relativeUrl = fileUrl.startsWith("blob:")
    ? fileUrl
    : urlObject.pathname + urlObject.search;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onScroll = useCallback(() => {
    if (!containerRef.current || numPages === 0) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    let closestPage = 1;
    let closestDistance = Infinity;

    for (let i = 1; i <= numPages; i++) {
      const pageEl = document.getElementById(`page_${i}`);
      if (!pageEl) continue;

      const pageRect = pageEl.getBoundingClientRect();
      const pageMidY = pageRect.top + pageRect.height / 2;
      const distance = Math.abs(pageMidY - containerRect.top);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = i;
      }
    }

    setCurrentPage((prev) => (prev !== closestPage ? closestPage : prev));
  }, [numPages]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(Math.min(containerRef.current.clientWidth, maxWidth));
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, [maxWidth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", onScroll);
    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [numPages, onScroll]);

  const pdfOptions = useMemo(
    () => ({
      isEvalSupported: false,
    }),
    [],
  );

  return (
    <div className="pdf_uploader" style={{ maxWidth, margin: "0 auto" }}>
      <div
        ref={containerRef}
        style={{
          height: "580px",
          overflowY: "scroll",
          width: "100%",
        }}
        className="custom_scrollbar"
      >
        {isLoading && <PageLoader />}
        <Document
          file={relativeUrl}
          options={pdfOptions}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error: any) => console.error("PDF load error:", error)}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div id={`page_${index + 1}`} key={`page_${index + 1}`}>
              <Page
                pageNumber={index + 1}
                scale={scale} // Use scale for zoom
                width={containerWidth} // still constrains initial size
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </Document>
      </div>

      <div className="flex justify-between items-center mb-1">
        <div></div>
        <div
          style={{
            marginTop: 8,
            textAlign: "center",
            fontSize: 12,
            color: "#555",
            userSelect: "none",
          }}
          className="flex justify-end mb-1.5 ms-10"
        >
          Page {currentPage} of {numPages}
        </div>
        {/* Zoom Controls */}
        <div
          style={{ display: "flex", justifyContent: "center" }}
          className="text-slate-600"
        >
          <div
            onClick={() => setScale((prev) => Math.min(prev + 0.2, 3))}
            className="cursor-pointer mr-2"
          >
            <ZoomIn width={14} />
          </div>
          <button
            onClick={() => setScale((prev) => Math.max(prev - 0.2, 0.5))}
            className="cursor-pointer mr-4"
          >
            <ZoomOut width={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
