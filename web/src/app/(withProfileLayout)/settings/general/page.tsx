// Page to show general settings UI

"use client";

import { GeneralSettings } from "@rever/common";
import { useTranslate } from "@rever/i18n";

const GeneralSettingsPage = () => {
  const translate = useTranslate();

  return (
    <>
      <div className="rounded-b-[20px] bg-white p-4 h-28 border border-secondary-200 flex items-end justify-start">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 w-full h-8">
          <div className="flex items-center gap-2">
            <p className="text-neutral-1100 text-2xl font-medium">{translate("sidebar.settings.general")}</p>
          </div>
        </div>
      </div>

      <GeneralSettings />
    </>
  );
};

export default GeneralSettingsPage;
