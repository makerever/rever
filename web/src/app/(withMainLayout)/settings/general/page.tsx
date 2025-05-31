// Page to show general settings UI

import { GeneralSettings } from "@rever/common";

const GeneralSettingsPage = () => {
  return (
    <>
      <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
        General settings
      </p>

      <GeneralSettings />
    </>
  );
};

export default GeneralSettingsPage;
