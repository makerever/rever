"use client";

import { ChevronDown } from "lucide-react";
import ButtonPopup from "../popup/ButtonPopup";
import OutsideClickHandler from "./OutsideClickHandler";
import { DropdownButtonProps } from "@rever/types";

function DropdownButton({
  name,
  onActionBtClick,
  onClose,
  onBtnPopupItemsClick,
  onClickArrow,
  showBtnPopup,
  btnPopupItems,
  button_type,
}: DropdownButtonProps) {
  return (
    <div className="relative">
      <OutsideClickHandler onClose={onClose}>
        <div
          className={`dropdown-btn btn-${button_type} flex items-center pl-3`}
        >
          <div onClick={onActionBtClick} className="flex items-center">
            <div
              className={`border-r border-${button_type}-500 flex items-center pr-2.5`}
            >
              <p className="py-2 text-xs font-medium">{name}</p>
            </div>
          </div>
          <span
            onClick={onClickArrow}
            className="pr-2.5 pl-2 flex items-center justify-center"
          >
            <ChevronDown width={16} />
          </span>
        </div>

        {showBtnPopup && (
          <div className="transition-all duration-300 ease-out">
            <ButtonPopup
              handleClick={(value) => {
                if (value === btnPopupItems[0] && onActionBtClick) {
                  onActionBtClick();
                } else if (value === btnPopupItems[1] && onBtnPopupItemsClick) {
                  onBtnPopupItemsClick(btnPopupItems[1]);
                }
              }}
              actions={btnPopupItems}
            />
          </div>
        )}
      </OutsideClickHandler>
    </div>
  );
}

export default DropdownButton;
