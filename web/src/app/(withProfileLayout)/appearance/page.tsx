// Appereance page Ui

"use client";

// import SelectComponent from "@/components/common/inputFields/selectInput/SelectInput";
// import Label from "@/components/common/Label";
// import { showSuccessToast } from "@/components/common/Toast";
// import { themeModes } from "@/constants/drpdownValues";
// import { capitalizeFirstLetter } from "@/lib/utils";
// import { useThemeStore } from "@/stores/themeStore";
// import { useEffect, useState } from "react";

const Appereance = () => {
  // const { theme, setTheme } = useThemeStore();

  // const [selectedTheme, setSelectedTheme] = useState({});

  // useEffect(() => {
  //   if (theme) {
  //     setSelectedTheme({
  //       label: capitalizeFirstLetter(theme),
  //       value: theme,
  //     });
  //   }
  // }, [theme]);

  // const toggleThemeMode = () => {
  //   if (theme === "light") {
  //     setTheme("dark");
  //   } else {
  //     setTheme("light");
  //   }
  //   showSuccessToast("Theme updated successfully")
  // };

  return (
    <>
      <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
        Appereance
      </p>

      {/* <div className="lg:w-96 w-full">
        <Label htmlFor="paymentTerms" text="Theme" />
        <SelectComponent
          options={themeModes}
          value={selectedTheme}
          placeholder="Select theme"
          onChange={toggleThemeMode}
        />
      </div> */}
    </>
  );
};

export default Appereance;
