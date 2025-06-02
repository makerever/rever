//Reusable component for phone input with country codes

"use client";

import "react-phone-input-2/lib/style.css";
import { type FC } from "react";

import dynamic from "next/dynamic";
const PhoneInput = dynamic(() => import("react-phone-input-2"), { ssr: false });

type PhoneInputCompProps = {
  onChange: (e: { target: { name: string; value: string } }) => void;
  value: string;
  disabled?: boolean;
  keyName?: string;
  error?: string;
};

const PhoneInputComp: FC<PhoneInputCompProps> = ({
  onChange,
  value,
  disabled = false,
  keyName = "mobile",
  error,
}) => {
  return (
    <div className="relative">
      <PhoneInput
        country={"us"}
        value={value}
        onChange={(e) => {
          onChange({
            target: {
              name: keyName,
              value: e,
            },
          });
        }}
        inputStyle={{
          backgroundColor: disabled ? "#f3f4f6" : "#fff", // dark:bg-zinc-900
          color: "#1e293b", // dark:text-zinc-100
          height: "2rem", // h-8
          width: "100%",
          borderRadius: "0.375rem", // rounded-md
          paddingLeft: "2.5rem", // px-3
          paddingRight: "0.75rem",
          fontSize: "0.875rem", // text-sm
          border: `1px solid ${
            error
              ? "#ef4444" // red-500
              : "#e5e7eb" // gray-200
          }`,
          transition: "border 0.2s ease-in-out",
        }}
        buttonStyle={{
          backgroundColor: disabled ? "#f3f4f6" : "transparent",
          border: "none",
        }}
        containerStyle={{
          width: "100%",
          backgroundColor: disabled ? "#f3f4f6" : "transparent",
        }}
        disabled={disabled}
      />

      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

export default PhoneInputComp;
