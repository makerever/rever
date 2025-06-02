// Renders the reset password user interface

import { AuthLayout, ResetPasswordComponent } from "@rever/common";

const ResetPassword = () => {
  return (
    <AuthLayout
      mainTitle={"Create new password"}
      subTitle={"Please enter strong password to secure your account"}
    >
      <ResetPasswordComponent />
    </AuthLayout>
  );
};

export default ResetPassword;
