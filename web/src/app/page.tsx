// Renders the authentication user interface

"use client";

import { AuthLayout, LoginSignup } from "@rever/common";
import { STEP, StepType } from "@rever/constants";
import { useState } from "react";

export default function Home() {
  const [showStep, setShowStep] = useState<StepType>(STEP.EMAIL);
  return (
    <>
      <AuthLayout
        mainTitle={
          showStep === STEP.FORGOT_PASSWORD
            ? "Reset Your password"
            : showStep === STEP.OTP
              ? "Verify your email to get started"
              : showStep === STEP.EMAIL
                ? "Sign in or get started"
                : "Sign in to your account"
        }
        subTitle={
          showStep === STEP.FORGOT_PASSWORD
            ? "We’ll send a code to this email"
            : ""
        }
      >
        <LoginSignup showStep={showStep} setShowStep={setShowStep} />
      </AuthLayout>
    </>
  );
}
