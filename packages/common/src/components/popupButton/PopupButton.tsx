"use client";

import OutsideClickHandler from "../OutsideClickHandler";
import { PopupButtonProps } from "@rever/types";
import PopupButtonMenu from "./PopupMenu";

function PopupButton({
  onClose,
  children,
  showBtnPopup,
  btnPopupItems,
}: PopupButtonProps) {
  return (
    <div className="relative">
      <OutsideClickHandler onClose={onClose}>
        <div>{children}</div>
        {showBtnPopup && (
          <div className="transition-all duration-300 ease-out">
            <PopupButtonMenu menu={btnPopupItems} />
          </div>
        )}
      </OutsideClickHandler>
    </div>
  );
}

export default PopupButton;
