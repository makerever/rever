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
            : "Log in or Sign up"
        }
        subTitle={
          showStep === STEP.FORGOT_PASSWORD
            ? "We’ll send a code to this email"
            : "Rever, where finance works better"
        }
      >
        <LoginSignup showStep={showStep} setShowStep={setShowStep} />
      </AuthLayout>
    </>
  );
}
