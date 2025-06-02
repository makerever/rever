// Component to display alphabet list filter

"use client";

import { AlphabetFilterProps } from "@rever/types";
import { CircleX } from "lucide-react";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const AlphabetFilter = ({
  selectedLetter,
  onSelect,
  onClear,
}: AlphabetFilterProps) => {
  return (
    <div className="ms-1 mt-10 flex flex-col justify-between items-center text-2xs">
      <div className="flex flex-col items-center gap-[2px]">
        {alphabet.map((char) => (
          <button
            key={char}
            onClick={() => onSelect(char)}
            className={`w-5 h-5 flex items-center transition duration-300 justify-center rounded-full ${
              selectedLetter === char
                ? "bg-primary-500 text-white"
                : "text-slate-500 hover:underline hover:scale-150"
            }`}
          >
            {char}
          </button>
        ))}
      </div>

      <button
        onClick={onClear}
        className="text-slate-600 underline text-2xs ps-1"
      >
        <CircleX width={16} />
      </button>
    </div>
  );
};

export default AlphabetFilter;
