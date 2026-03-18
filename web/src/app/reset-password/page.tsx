// Renders the reset password user interface

import { AuthLayout, ResetPasswordComponent } from "@rever/common";
import { useTranslate } from "@rever/i18n";
const ResetPassword = () => {
  const t = useTranslate();
  return (
    <AuthLayout
      mainTitle={t("create_new_password")}
      subTitle={t("please_enter_strong_password_to_secure_your_account")}
    >
      <ResetPasswordComponent />
    </AuthLayout>
  );
};

export default ResetPassword;
