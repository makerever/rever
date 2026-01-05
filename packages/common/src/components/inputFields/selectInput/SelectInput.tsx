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
  props: ClearIndicatorProps<Option, boolean, GroupBase<Option>>
) => {
  const {
    selectProps: { isDisabled },
  } = props;

  // Hide clear icon if input is disabled
  if (isDisabled) return null;

  return (
    <components.ClearIndicator {...props}>
      <XIcon
        width={16}
        className={`-mr-2 ${!isDisabled ? "text-neutral-1100" : "text-secondary-500"}`}
      />
    </components.ClearIndicator>
  );
};

// Custom dropdown arrow icon for the select input
const CustomDropdownIndicator = (
  props: DropdownIndicatorProps<Option, boolean, GroupBase<Option>>
) => {
  const {
    selectProps: { isDisabled },
  } = props;

  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown
        width={18}
        className={`${!isDisabled ? "text-neutral-1100" : "text-secondary-500"}`}
      />
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
  noErrorIcon,
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
            ? "#fff"
            : "#fff"
          : isDarkMode
            ? "#fff"
            : "#fff",
      borderColor:
        error?.message || noErrorIcon
          ? "var(--danger-600)"
          : isDisabled
            ? isDarkMode
              ? "var(--secondary-100)"
              : "var(--secondary-100)"
            : isDarkMode
              ? "var(--secondary-200)"
              : "var(--secondary-200)",
      boxShadow: "0 1px 1px 0 rgba(26, 26, 26, 0.03)",
      borderRadius: "0.42rem",
      minHeight: "32px",
      cursor: isDisabled ? "not-allowed" : "pointer",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      color: state.isFocused
        ? isDarkMode
          ? "var(--secondary-400)"
          : "var(--secondary-400)"
        : isDisabled
          ? isDarkMode
            ? "var(--secondary-400)"
            : "var(--secondary-400)"
          : isDarkMode
            ? "var(--secondary-400)"
            : "var(--secondary-400)",
      fontSize: ".875rem",
      height: "32px",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.75rem",
      marginTop: "0.25rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      backgroundColor: isDarkMode ? "var(--neutral-1100)" : "#fff",
    }),
    menuList: (provided) => ({
      ...provided,
      padding: 0,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? isDarkMode
          ? "var(--neutral-1100)"
          : "var(--primary-600)"
        : state.isFocused
          ? isDarkMode
            ? "var(--neutral-1100)"
            : "var(--primary-200)"
          : isDarkMode
            ? "var(--neutral-1100)"
            : "#ffffff",
      color: state.isSelected
        ? "var(--neutral-1100)"
        : isDarkMode
          ? "#fff"
          : "var(--neutral-1100)",
      padding: "0.5rem",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontSize: "12px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDarkMode ? "var(--neutral-1100)" : "var(--neutral-1100)",
      fontSize: ".875rem",
      height: "24px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDarkMode
        ? "var(--secondary-700)"
        : isDisabled
          ? "var(--secondary-500)"
          : "var(--secondary-700)",
      fontSize: ".875rem",
      height: "24px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
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
        options.find((option) => option.value === selectedValue) || null
      );
    }
    // For multi select
    if (isMulti && Array.isArray(selectedValue)) {
      setSelectedOption(
        options.filter((option) => selectedValue.includes(option.value)) || []
      );
    }
    // If value prop is provided, use it
    if (value) {
      setSelectedOption(value);
    } else if (!selectedValue) {
      setSelectedOption(null);
    }
  }, [selectedValue, options, isMulti, value]);

  // Handle select value change
  const handleChange = (
    selectedOption: SingleValue<Option> | MultiValue<Option> | null
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
            primary: "var(--secondary-300)", // selected option & active border
            // primary25: "#01242D", // hover color for options
            primary50: "var(--primary-300)", // focused color for options
          },
        })}
      />
      {/* Error message display */}
      {!noErrorIcon && error && (
        <div className="flex items-center gap-1 text-danger-600 text-xs mt-1">
          <BadgeInfo width={14} height={14} />
          <span>{title} is required</span>
        </div>
      )}
    </>
  );
};

export default SelectComponent;
