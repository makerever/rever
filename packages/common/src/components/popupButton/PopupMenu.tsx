// Popup UI for button actions

import { PopupButtonMenuProps } from "@rever/types";

const PopupButtonMenu = ({ menu }: { menu: PopupButtonMenuProps[] }) => {
  return (
    <div className={`popup popup-shadow popup-slide-down text-slate-800`}>
      {menu
        .filter((item) => {
          return item.isShown;
        })
        .map((item, index) => (
          <div
            key={index}
            onClick={() => item?.onClick?.()}
            className={`menu-item ${item?.name?.toLowerCase().includes("delete") ? "menu-item-danger" : "menu-item-default"}`}
          >
            {item?.icon}
            <p className="ms-1.5 white">{item.name}</p>
          </div>
        ))}
    </div>
  );
};

export default PopupButtonMenu;
