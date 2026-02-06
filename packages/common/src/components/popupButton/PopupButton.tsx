// Component for a button that shows a popup menu when clicked  

"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

import OutsideClickHandler from "../OutsideClickHandler";
import { PopupButtonProps } from "@rever/types";
import PopupButtonMenu from "./PopupMenu";

function PopupButton({
  onClose,
  children,
  showBtnPopup,
  btnPopupItems,
}: PopupButtonProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // State to store popup coordinates
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Update coordinates on open, scroll, or resize
  useLayoutEffect(() => {
    if (!showBtnPopup || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      setCoords({
        top: rect.bottom + scrollTop - 30, // 6px gap
        left: rect.right + scrollLeft - 0, // adjust to align right
      });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showBtnPopup]);

  return (
    <>
      {/* Trigger stays in table */}
      <div ref={triggerRef}>{children}</div>

      {/* Popup portal */}
      {showBtnPopup &&
        triggerRef.current &&
        createPortal(
          <OutsideClickHandler onClose={onClose} refs={[triggerRef, popupRef]}>
            <div
              ref={popupRef}
              className="absolute z-20"
              style={{
                top: coords.top,
                left: coords.left,
              }}
            >
              <PopupButtonMenu menu={btnPopupItems} />
            </div>
          </OutsideClickHandler>,
          document.body,
        )}
    </>
  );
}

export default PopupButton;
