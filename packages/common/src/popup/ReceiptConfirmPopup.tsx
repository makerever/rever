// Popup UI for Receipt Confirmation

import { ReceiptConfirmPopupProps } from "@rever/types";
import { CirclePlus, History } from "lucide-react";

const ReceiptConfirmPopup = ({
  handleReqConfirmation,
  handleVersionHistory,
  reqConfirmStatus,
  confirmHistoryAvailable,
}: ReceiptConfirmPopupProps) => {
  return (
    <div
      className={`popup-slide-down left-0.5 top-1 text-slate-800 absolute z-20 w-48 rounded-md shadow-5xl bg-white p-2`}
    >
      {reqConfirmStatus !== "confirmed" ? (
        <div className="menu-item" onClick={handleReqConfirmation}>
          <CirclePlus size={16} />
          <p className="ms-1.5">Request confirmation</p>
        </div>
      ) : null}

      {confirmHistoryAvailable ? (
        <div className="menu-item" onClick={handleVersionHistory}>
          <History size={16} />
          <p className="ms-1.5">View confirmations</p>
        </div>
      ) : null}
    </div>
  );
};

export default ReceiptConfirmPopup;
