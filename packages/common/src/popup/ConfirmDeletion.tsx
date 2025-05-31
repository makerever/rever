import { ConfirmationPopupProps } from "@rever/types";

// ConfirmationPopup component displays a modal for confirming deletion or other actions
const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  title = "Confirm deletion",
  isOpen,
  onClose,
  onConfirm,
  message,
  saveButton,
  buttonText = "Delete",
}) => {
  // If popup is not open, render nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6 dark:bg-gray-600">
        <h2 className="text-gray-800 font-semibold dark:text-gray-200">
          {title}
        </h2>
        <p className="mt-2 mb-5 text-xs text-gray-600 dark:text-gray-300">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="mt-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-800 dark:border-gray-600 dark:bg-transparent dark:text-gray-300"
          >
            Cancel
          </button>
          {/* Confirm button (Delete or Save) */}
          <button
            onClick={onConfirm}
            className={`mt-3 flex items-center justify-center rounded-lg px-4 py-2 text-xs font-medium text-white ${
              saveButton
                ? "bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-500"
                : "bg-red-600 hover:bg-red-700 dark:hover:bg-primary-500"
            } disabled:bg-gray-300 dark:disabled:bg-gray-600 dark:disabled:text-gray-400`}
          >
            {saveButton || buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
