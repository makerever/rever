// Renders the register user interface

"use client";

import { AuthLayout, RegisterStep } from "@rever/common";
import { useState } from "react";

const Register = () => {
  const [showStep, setShowStep] = useState(1);

  return (
    <AuthLayout
      mainTitle={showStep === 1 ? "Welcome to Rever" : "Secure your account"}
      subTitle={
        showStep === 1
          ? "Start your journey — set up your profile"
          : "Set a strong password to protect your account"
      }
    >
      <RegisterStep showStep={showStep} setShowStep={setShowStep} />
    </AuthLayout>
  );
};

export default Register;
