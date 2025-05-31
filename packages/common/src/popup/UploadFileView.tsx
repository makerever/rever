// Popup UI for upload file view

"use client";

import { FileOptions } from "@rever/types";
import { Trash } from "lucide-react";

const UploadFileView = ({ fileName, removeFile }: FileOptions) => {
  return (
    <div
      className={`popup-slide-down absolute flex items-center justify-between right-5 z-20 text-xs w-48 rounded-md shadow-5xl bg-white p-2`}
    >
      <p className="w-32 break-words">{fileName}</p>

      <button
        type="button"
        onClick={removeFile}
        className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-red-100 hover:text-red-500 transition"
      >
        <Trash width={16} />
      </button>
    </div>
  );
};

export default UploadFileView;
