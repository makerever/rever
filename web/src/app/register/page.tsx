// Renders the register user interface

"use client";

import { AuthLayout, RegisterStep } from "@rever/common";
import { useState } from "react";
import { useTranslate } from "@rever/i18n";

const Register = () => {
  const [showStep, setShowStep] = useState(1);
  const translate = useTranslate();

  return (
    <AuthLayout
      mainTitle={showStep === 1 ? translate("auth.page_titles.welcome_to_rever") : translate("auth.page_titles.secure_account")}
      subTitle={
        showStep === 1
          ? translate("auth.page_subtitles.fill_up_details")
          : translate("auth.page_subtitles.set_strong_password")
      }
    >
      <RegisterStep showStep={showStep} setShowStep={setShowStep} />
    </AuthLayout>
  );
};

export default Register;
