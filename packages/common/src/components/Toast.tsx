// Component to show toast messages

"use client";

import { toast } from "sonner";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export const showSuccessToast = (message: string) => {
  toast(
    <div className="flex items-center gap-2">
      <CheckCircle className="text-green-500" size={20} />
      <span className="text-sm">{message}</span>
    </div>,
  );
};

export const showWarningToast = (message: string) => {
  toast(
    <div className="flex items-center gap-2">
      <AlertTriangle className="text-yellow-500" size={20} />
      <span className="text-sm">{message}</span>
    </div>,
  );
};

export const showErrorToast = (message: string) => {
  toast(
    <div className="flex items-center gap-2">
      <XCircle className="text-red-500" size={20} />
      <span className="text-sm">{message}</span>
    </div>,
  );
};
