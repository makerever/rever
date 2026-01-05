// Reusable component for a standard button

import { ReactElement } from "react";
import {
  Plus,
  Upload,
  X,
  Check,
  Loader,
  MailPlus,
  LoaderCircle,
  Download,
} from "lucide-react";
import { ButtonProps } from "@rever/types";

const iconData: Record<
  | "upload"
  | "download"
  | "create"
  | "approve"
  | "reject"
  | "loader"
  | "mailPlus"
  | "plus"
  | "loaderCircle",
  ReactElement
> = {
  upload: <Upload size={16} />,
  download: <Download size={16} />,
  create: <Plus size={16} />,
  approve: <Check size={16} />,
  reject: <X size={16} />,
  loader: <Loader size={16} className="animate-spin" />,
  loaderCircle: <LoaderCircle size={16} className="animate-spin" />,
  mailPlus: <MailPlus width={16} />,
  plus: <Plus width={16} />,
};

const Button = ({
  name,
  onClick,
  type = "button",
  disabled = false,
  button_type = "primary",
  icon_type,
  width = "w-max",
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`btn ${width} btn-${button_type} icon-button`}
      type={type}
      disabled={disabled}
    >
      {icon_type ? iconData[icon_type] : null}
      <span className="">{name}</span>
    </button>
  );
};

export default Button;
