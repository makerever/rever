// Reusable component for date picker

"use client";

import * as React from "react";
import { format } from "date-fns";
import { BadgeInfo, CalendarIcon, XIcon } from "lucide-react";

import { cn } from "@rever/utils";
// import { ButtonCn, Calendar } from "@rever/common";
// import { Popover, PopoverContent, PopoverTrigger } from "@rever/common";
import { DateComponentProps } from "@rever/types";
import { FieldValues } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { ButtonCn } from "../../ui/button";
import { Calendar } from "../../ui/calendar";

// Generic DatePicker component for forms
const DatePickerDemo = <T extends FieldValues>({
  placeholder = "Pick a date",
  register,
  name,
  trigger,
  error,
  title,
  value,
  disabledBefore,
}: DateComponentProps<T>) => {
  const [date, setDate] = React.useState<Date | undefined>();
  const [open, setOpen] = React.useState(false);

  // Update local date state when value prop changes
  React.useEffect(() => {
    if (value) {
      setDate(new Date(value));
    } else {
      setDate(undefined);
    }
  }, [value]);

  // Handle date selection from calendar
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setOpen(false);

    // Update form state if using react-hook-form
    if (register && name) {
      const event = {
        target: {
          name,
          value: selectedDate,
        },
      };
      register(name)?.onChange?.(event);
    }

    // Trigger validation if provided
    if (name && trigger) {
      trigger(name);
    }
  };

  // Handle clearing the selected date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);

    // Update form state to undefined
    if (register && name) {
      const event = {
        target: {
          name,
          value: undefined,
        },
      };
      register(name)?.onChange?.(event);
    }

    // Trigger validation if provided
    if (name && trigger) {
      trigger(name);
    }
  };

  return (
    <div className="relative w-full">
      {/* Popover for calendar picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <ButtonCn
            variant={"outline"}
            className={cn(
              `w-full px-2.5 date-input cursor-pointer ${
                error
                  ? "input-danger input-shadow-danger"
                  : "input-default input-shadow"
              }`,
              !date && "text-neutral-500 hover:text-neutral-500 hover:bg-white",
            )}
          >
            {date ? format(date, "PPP") : <span>{placeholder}</span>}

            {/* Show clear icon if date is selected */}
            {date && (
              <div
                onClick={handleClear}
                className="absolute right-8 cursor-pointer top-1/2 -translate-y-1/2"
              >
                <XIcon width={16} />
              </div>
            )}
            <CalendarIcon width={13} />
          </ButtonCn>
        </PopoverTrigger>
        {/* Calendar popover content */}
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            {...(register && name ? register(name) : {})}
            mode="single"
            selected={date ?? undefined}
            defaultMonth={date ?? undefined}
            onSelect={handleSelect}
            initialFocus
            disabled={disabledBefore ? { before: disabledBefore } : undefined}
          />
        </PopoverContent>
      </Popover>
      {/* Show error message if validation fails */}
      {error && (
        <div className="flex items-center gap-1 text-danger-500 text-xs mt-1">
          <BadgeInfo width={14} height={14} />
          <span>{title} is required</span>
        </div>
      )}
    </div>
  );
};

export default DatePickerDemo;
