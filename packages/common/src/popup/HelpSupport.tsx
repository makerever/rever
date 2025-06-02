// Popup UI for help support

import { BookOpenText, MailQuestion } from "lucide-react";
import Link from "next/link";

// OrgProfile component displays a popup with organization actions and profile info
const HelpSupport = () => {
  return (
    <div
      className={`popup-slide-down right-12 top-14 text-slate-800 absolute z-20 w-40 rounded-md shadow-5xl bg-white p-2`}
    >
      <Link
        href="https://github.com/makerever/rever?tab=readme-ov-file#rever"
        target="_blank"
      >
        <div className="menu-item">
          <BookOpenText size={16} />
          <p className="ms-1.5">Documentation</p>
        </div>
      </Link>

      <a href="mailto:support@reverfin.ai">
        <div className="menu-item">
          <MailQuestion size={16} />
          <p className="ms-1.5">Email us</p>
        </div>
      </a>
    </div>
  );
};

export default HelpSupport;
