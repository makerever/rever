// Confirmation popup component

import { ConfirmationPopupProps } from "@rever/types";
import { Loader, X } from "lucide-react";
import Button from "../components/Button";
import { useTranslate } from "@rever/i18n";


// ConfirmationPopup component displays a modal for confirming deletion or other actions
const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  title = "confirmations.title",
  isOpen,
  onClose,
  onConfirm,
  message,
  saveButton,
  buttonText = "confirmations.delete",
  isConfirmLoading,
}) => {
  // If popup is not open, render nothing
  const translate = useTranslate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white dark:bg-gray-600 w-96">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl text-neutral-1100 font-semibold overflow-hidden text-ellipsis mr-5 whitespace-pre">
            {translate(title)}
          </h2>
          <button
            onClick={onClose}
            className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
          >
            <X size={16} />
          </button>
        </div>
        <p className="p-4 text-sm font-medium text-neutral-1100 dark:text-gray-300">
          {message}
        </p>
        <div className="flex justify-end gap-2 p-4">
          <Button
            name="Cancel"
            onClick={onClose}
            disabled={isConfirmLoading}
            button_type="secondary-outline"
          />
          {/* Confirm button (Delete or Save) */}
          {/* <button
            onClick={onConfirm}
            disabled={isConfirmLoading}
            className={`mt-3 flex items-center justify-center rounded-lg px-4 py-2 text-xs font-medium text-white ${saveButton
              ? "bg-primary-500 hover:bg-primary-600"
              : "bg-red-600 hover:bg-red-700"
              } disabled:cursor-not-allowed`}
          >
            {isConfirmLoading ? (
              <div className="flex items-center justify-center gap-1">
                <Loader
                  width={16}
                  height={16}
                  className={`animate-spin text-white`}
                />
                {saveButton || buttonText}
              </div>
            ) : (
              <>{saveButton || buttonText}</>
            )}
          </button> */}
          <Button
            name={translate(buttonText)}
            onClick={onConfirm}
            disabled={isConfirmLoading}
            button_type={saveButton ? "primary" : "danger"}
            icon_type={isConfirmLoading ? "loader" : null}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
