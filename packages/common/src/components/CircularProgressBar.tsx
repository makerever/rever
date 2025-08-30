// Component to show progress bar count

import React from "react";

type CircularProgressBarProps = {
  percentage: number;
};

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  percentage,
}) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (value: number): string => {
    if (value <= 40) return "#ef4444"; // red-500
    if (value <= 70) return "#f97316"; // orange-500
    return "#22c55e"; // green-500
  };

  const strokeColor = getColor(percentage);
  const textColor =
    percentage <= 40
      ? "text-red-500"
      : percentage <= 70
        ? "text-orange-500"
        : "text-green-500";

  return (
    <div className="relative flex items-center justify-center">
      {/* Percentage Label */}
      <p className={`mr-1 min-w-8 ${textColor} font-semibold text-2xs`}>
        {percentage}%
      </p>
      <div className="relative">
        {/* Background Circle */}
        <svg className="w-4 h-4" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#D9D9D9"
            strokeWidth="10"
            fill="none"
          />
        </svg>

        {/* Foreground Circle */}
        <svg
          className="absolute top-0 left-0 w-4 h-4 transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={strokeColor}
            strokeWidth="10"
            fill="none"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
      </div>
    </div>
  );
};

export default CircularProgressBar;
