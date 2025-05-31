// Outside handle click component

"use client";

import { useEffect, useRef, ReactNode } from "react";

interface OutsideClickHandlerProps {
  children: ReactNode;
  onClose: () => void;
}

const OutsideClickHandler: React.FC<OutsideClickHandlerProps> = ({
  children,
  onClose,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return <div ref={wrapperRef}>{children}</div>;
};

export default OutsideClickHandler;
