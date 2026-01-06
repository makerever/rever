// Component to show toast messages

"use client";

import { toast } from "sonner";
import { CircleCheck, Info } from "lucide-react";

export const showErrorToast = (message: string) => {
  toast(message, {
    icon: <Info width={16} />,
    className: "toast toast-error",
    duration: 2500,
  });
};

export const showSuccessToast = (message: string) => {
  toast(message, {
    icon: <CircleCheck width={16} />,
    className: "toast toast-success",
    duration: 2500,
  });
};

export const showDefaultToast = (message: string) => {
  toast(message, {
    className: "toast toast-default",
    duration: 2500,
  });
};
