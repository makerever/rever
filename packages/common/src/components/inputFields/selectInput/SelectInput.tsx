// Reusable component for select input

"use client";

import { useThemeStore } from "@rever/stores";
import { Option, SelectComponentProps } from "@rever/types";
import { BadgeInfo, ChevronDown, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FieldValues } from "react-hook-form";
import Select, {
  GroupBase,
  MultiValue,
  SingleValue,
  StylesConfig,
  components,
} from "react-select";
import type { ClearIndicatorProps, DropdownIndicatorProps } from "react-select";

// Custom clear (X) icon for the select input
const CustomClearIndicator = (
  props: ClearIndicatorProps<Option, boolean, GroupBase<Option>>,
) => {
  const {
    selectProps: { isDisabled },
  } = props;

  // Hide clear icon if input is disabled
  if (isDisabled) return null;

  return (
    <components.ClearIndicator {...props}>
      <XIcon width={16} className="-mr-3 text-slate-800" />
    </components.ClearIndicator>
  );
};

// Custom dropdown arrow icon for the select input
const CustomDropdownIndicator = (
  props: DropdownIndicatorProps<Option, boolean, GroupBase<Option>>,
) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown width={18} className=" text-slate-800" />
    </components.DropdownIndicator>
  );
};

// Main SelectComponent definition, generic for react-hook-form FieldValues
const SelectComponent = <T extends FieldValues>({
  placeholder = "Select an option",
  isDisabled,
  options,
  name,
  register,
  error,
  getValues,
  trigger,
  isMulti,
  title,
  value,
  onChange,
  isClearable,
}: SelectComponentProps<T>) => {
  const { theme } = useThemeStore();
  const isDarkMode = theme === "light" ? false : true;

  // Custom styles for react-select, adapting to theme and error state
  const customStyles: StylesConfig<Option, boolean, GroupBase<Option>> = {
    container: (provided) => ({
      ...provided,
      width: "100%",
    }),
    control: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? "transparent"
        : isDisabled
          ? isDarkMode
            ? "#18181b"
            : "#f3f4f6"
          : isDarkMode
            ? "#1f2937"
            : "#ffffff",
      borderColor: error?.message
        ? "#f87171"
        : isDisabled
          ? isDarkMode
            ? "#6b7280"
            : "#d1d5db"
          : isDarkMode
            ? "#374151"
            : "#e5e7eb",
      boxShadow: "none",
      borderRadius: "0.42rem",
      minHeight: "32px",
      cursor: isDisabled ? "not-allowed" : "pointer",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      color: state.isFocused
        ? isDarkMode
          ? "#d1d5db"
          : "#18181b"
        : isDisabled
          ? isDarkMode
            ? "#9ca3af"
            : "#9ca3af"
          : isDarkMode
            ? "#9ca3af"
            : "#9ca3af",
      fontSize: ".875rem",
      height: "32px",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.75rem",
      marginTop: "0.25rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
    }),
    menuList: (provided) => ({
      ...provided,
      padding: 0,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? isDarkMode
          ? "#22c55e"
          : "#22c55e"
        : state.isFocused
          ? isDarkMode
            ? "#374151"
            : "#f3f4f6"
          : isDarkMode
            ? "#1f2937"
            : "#ffffff",
      color: state.isSelected ? "#ffffff" : isDarkMode ? "#d1d5db" : "#18181b",
      padding: "0.5rem",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontSize: "12px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDarkMode ? "#d1d5db" : "#18181b",
      fontSize: ".875rem",
      height: "24px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDarkMode ? "#9ca3af" : "#9ca3af",
      fontSize: ".875rem",
      height: "24px",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: "32px",
    }),
    groupHeading: (provided) => ({
      ...provided,
      textTransform: "capitalize",
      fontSize: ".875rem",
      fontWeight: "600",
      color: isDarkMode ? "#d1d5db" : "#18181b",
      padding: "0.4rem 0.50rem",
    }),
  };

  // State to track if component is mounted (for SSR/CSR compatibility)
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<
    SingleValue<Option> | MultiValue<Option>
  >(null);

  // Get selected value from react-hook-form or parent
  const selectedValue = getValues?.(name) || "";

  // Set mounted state on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync selected option with form state or parent value
  useEffect(() => {
    // For single select
    if (selectedValue && !isMulti) {
      setSelectedOption(
        options.find((option) => option.value === selectedValue) || null,
      );
    }
    // For multi select
    if (isMulti && Array.isArray(selectedValue)) {
      setSelectedOption(
        options.filter((option) => selectedValue.includes(option.value)) || [],
      );
    }
    // If value prop is provided, use it
    if (value) {
      setSelectedOption(value);
    }
  }, [selectedValue, options, isMulti, value]);

  // Handle select value change
  const handleChange = (
    selectedOption: SingleValue<Option> | MultiValue<Option> | null,
  ) => {
    setSelectedOption(selectedOption);
    // If using react-hook-form, trigger its onChange
    if (name && register) {
      const value = isMulti
        ? selectedOption
          ? (selectedOption as MultiValue<Option>).map((option) => option.value)
          : []
        : selectedOption
          ? (selectedOption as SingleValue<Option>)?.value
          : "";

      const event = {
        target: {
          name,
          value,
        },
      };
      register(name)?.onChange(event);
    } else {
      // Otherwise, call provided onChange handler
      if (onChange) {
        onChange(selectedOption as SingleValue<Option>);
      }
    }
  };

  // Highlight search text in options
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, "gi");
    return text.replace(regex, `<strong>$1</strong>`);
  };

  // Prevent SSR hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Main Select input */}
      <Select
        {...(register && name ? register(name) : {})}
        isDisabled={isDisabled}
        options={options}
        onInputChange={(input: string) => setSearch(input)}
        placeholder={placeholder}
        styles={customStyles}
        isClearable={isClearable}
        onBlur={() => name && trigger?.(name)}
        value={selectedOption}
        onChange={handleChange}
        components={{
          ClearIndicator: CustomClearIndicator,
          DropdownIndicator: CustomDropdownIndicator,
        }}
        formatOptionLabel={({ label = "" }) => (
          <span
            dangerouslySetInnerHTML={{
              __html: highlightText(label.toString(), search),
            }}
          />
        )}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: "#22c55e", // selected option & active border
            // primary25: "#22c55e", // hover color for options
            primary50: "#EEFFEF", // focused color for options
          },
        })}
      />
      {/* Error message display */}
      {error && (
        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <BadgeInfo width={14} height={14} />
          <span>{title} is required</span>
        </div>
      )}
    </>
  );
};

export default SelectComponent;
