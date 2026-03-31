// Renders the reset password user interface

"use client";

import { AuthLayout, ResetPasswordComponent } from "@rever/common";
import { useTranslate } from "@rever/i18n";

const ResetPassword = () => {
  const translate = useTranslate();
  return (
    <AuthLayout
      mainTitle={translate("auth.page_titles.create_new_password")}
      subTitle={translate("auth.page_subtitles.enter_strong_password")}
    >
      <ResetPasswordComponent />
    </AuthLayout>
  );
};

export default ResetPassword;
