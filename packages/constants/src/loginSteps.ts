// Constant values for login steps

// Enum-like object for login step identifiers
export const STEP = {
  EMAIL: 1,
  PASSWORD: 2,
  OTP: 3,
  FORGOT_PASSWORD: 4,
} as const;

// Type representing possible step values
export type StepType = (typeof STEP)[keyof typeof STEP];

// Steps for user registration process
export const registerSteps = [
  { id: 1, label: "Profile info" },
  { id: 2, label: "Security" },
];
