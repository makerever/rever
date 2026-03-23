// Renders the authentication user interface

"use client";

import { AuthLayout, LoginSignup } from "@rever/common";
import { STEP, StepType } from "@rever/constants";
import { useState } from "react";
import { useTranslate } from "@rever/i18n";

export default function Home() {
  const [showStep, setShowStep] = useState<StepType>(STEP.EMAIL);
  const translate = useTranslate();
  return (
    <>
      <AuthLayout
        mainTitle={
          showStep === STEP.FORGOT_PASSWORD
            ? translate("auth.page_titles.reset_your_password")
            : showStep === STEP.OTP
              ? translate("auth.page_titles.verify_email")
              : showStep === STEP.EMAIL
                ? translate("auth.page_titles.sign_in_or_get_started")
                : translate("auth.page_titles.sign_in_to_account")
        }
        subTitle={
          showStep === STEP.FORGOT_PASSWORD
            ? translate("auth.page_subtitles.send_code_to_email")
            : ""
        }
      >
        <LoginSignup showStep={showStep} setShowStep={setShowStep} />
      </AuthLayout>
    </>
  );
}
