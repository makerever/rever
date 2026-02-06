// Outside handle click component

"use client";

import { useEffect, useRef, ReactNode, RefObject } from "react";

interface OutsideClickHandlerProps {
  children: ReactNode;
  onClose: () => void;
  refs?: RefObject<HTMLElement | null>[];
}

const OutsideClickHandler: React.FC<OutsideClickHandlerProps> = ({
  children,
  onClose,
  refs = [],
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedInsideWrapper = wrapperRef.current?.contains(target);

      const clickedInsideExtraRefs = refs.some(
        (ref) => ref.current && ref.current.contains(target),
      );

      if (!clickedInsideWrapper && !clickedInsideExtraRefs) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, refs]);

  return <div ref={wrapperRef}>{children}</div>;
};

export default OutsideClickHandler;
