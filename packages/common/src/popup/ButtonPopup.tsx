// Popup UI for button actions

type BtnActionProps = {
  actions: string[];
  handleClick: (item: string) => void;
};

const ButtonPopup = ({ actions, handleClick }: BtnActionProps) => {
  return (
    <div
      className={`popup-slide-down right-0 top-10 text-slate-800 absolute z-20 w-40 rounded-md shadow-5xl bg-white p-2`}
    >
      {actions.map((item, index) => {
        return (
          <div
            onClick={() => handleClick(item)}
            key={index}
            className="menu-item"
          >
            <p className="ms-1.5">{item}</p>
          </div>
        );
      })}
    </div>
  );
};

export default ButtonPopup;
