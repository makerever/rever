// Popup UI for button actions

import { DropdownItemProps } from "@rever/types";

type BtnActionProps = {
  actions: string[] | DropdownItemProps[];
  handleClick: (item: string) => void;
};

const ButtonPopup = ({ actions, handleClick }: BtnActionProps) => {
  return (
    <div className={`popup popup-shadow popup-slide-down text-slate-800`}>
      {actions.map((item: string | DropdownItemProps, index: number) => (
        <div
          key={index}
          onClick={() =>
            handleClick(typeof item === "string" ? item : item.name)
          }
          className="menu-item menu-item-default"
        >
          {typeof item !== "string" && item.icon}
          <p className="ms-1.5">
            {typeof item === "string" ? item : item.name}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ButtonPopup;
