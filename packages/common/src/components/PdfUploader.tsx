// Reusable component for PDF Render

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import PageLoader from "./Loader";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type Props = {
  fileUrl: string;
  maxWidth?: number;
};

const PDFViewer: React.FC<Props> = ({ fileUrl, maxWidth = 800 }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  // Scroll handler to find page closest to top inside container
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

      // Distance from top of container viewport to vertical midpoint of page
      const pageMidY = pageRect.top + pageRect.height / 2;
      const distance = Math.abs(pageMidY - containerRect.top);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = i;
      }
    }

    setCurrentPage((prev) => (prev !== closestPage ? closestPage : prev));
  }, [numPages]);

  // Update container width on mount and resize
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

  // Attach scroll event
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", onScroll);
    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [numPages, onScroll]);

  const proxyUrl = `/proxy/cors?url=${encodeURIComponent(fileUrl)}`;
  const actualUrl = fileUrl.startsWith("blob:") ? fileUrl : proxyUrl;

  const pdfOptions = useMemo(
    () => ({
      isEvalSupported: false,
    }),
    [],
  );

  return (
    <div
      className="pdf_uploader"
      style={{ maxWidth: maxWidth, margin: "0 auto" }}
    >
      <div
        ref={containerRef}
        style={{
          height: "580px",
          overflowY: "scroll",
          width: "100%",
        }}
        className="custom_scrollbar overflow-hidden"
      >
        {isLoading && <PageLoader />}
        <Document
          file={actualUrl}
          options={pdfOptions}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error: any) => console.error("PDF load error:", error)}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div id={`page_${index + 1}`} key={`page_${index + 1}`}>
              <Page
                pageNumber={index + 1}
                width={containerWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </Document>
      </div>

      <div
        style={{
          marginTop: 8,
          textAlign: "center",
          fontSize: 12,
          color: "#555",
          userSelect: "none",
        }}
      >
        Page {currentPage} of {numPages}
      </div>
    </div>
  );
};

export default PDFViewer;
