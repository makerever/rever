// Renders the register user interface

"use client";

import { AuthLayout, RegisterStep } from "@rever/common";
import { useState } from "react";
import { useTranslate } from "@rever/i18n";
const Register = () => {
  const [showStep, setShowStep] = useState(1);
  const t = useTranslate();

  return (
    <AuthLayout
      mainTitle={showStep === 1 ? t("welcome_to_rever") : t("secure_your_account")}
      subTitle={
        showStep === 1
          ? t("fill_up_your_details")
          : t("set_a_strong_password")
      }
    >
      <RegisterStep showStep={showStep} setShowStep={setShowStep} />
    </AuthLayout>
  );
};

export default Register;
