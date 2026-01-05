// Component for displaying the reset password interface

"use client";

import { Button, PasswordInput } from "@rever/common";
import { Label } from "@rever/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { showErrorToast, showSuccessToast } from "@rever/common";
import OtpStep from "./authSteps/OtpStep";
import { forgotPasswordApi, resetForgotPasswordApi } from "@rever/services";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  resetPasswordSchema,
  resetPasswordSchemaValues,
} from "@rever/validations";

// Main ResetPasswordComponent
const ResetPasswordComponent = () => {
  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    getValues,
    watch,
    setValue,
    trigger,
    clearErrors,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const router = useRouter();

  // Watch form fields for changes
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const otp = watch("otp") || "";

  // Local state for email and loader
  const [email, setEmail] = useState<string>("");
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [otpSending, setOtpSending] = useState<boolean>(false);

  // Validation helpers
  const isPasswordValid =
    !Boolean(password) ||
    !Boolean(password) ||
    Boolean(errors.password?.message);

  const isConfirmPasswordValid =
    !Boolean(confirmPassword) ||
    !Boolean(confirmPassword) ||
    Boolean(errors.confirmPassword?.message);

  const isOtpValid = otp.length < 6;

  // On mount: get email from session storage, redirect if not found
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("registerEmail");

      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        router.replace("/"); // If no email, redirect to home
      }

      // Cleanup: clear session storage on page unload
      const clearSession = () => {
        sessionStorage.removeItem("registerEmail");
      };

      // window.addEventListener("beforeunload", clearSession);

      return () => {
        window.removeEventListener("beforeunload", clearSession);
      };
    }
  }, [router]);

  // Handle form submission for resetting password
  const submitForm = async (data: resetPasswordSchemaValues) => {
    setIsLoaderFormSubmit(true);
    const response = await resetForgotPasswordApi({
      email: email,
      code: data.otp,
      new_password: data.confirmPassword,
    });
    if (response?.status === 200) {
      if (typeof window !== "undefined") {
        showSuccessToast("Password reset successfully!");
        sessionStorage.removeItem("registerEmail");
        setIsLoaderFormSubmit(false);
        router.push("/");
      }
    } else {
      setIsLoaderFormSubmit(false);
      if (response?.data?.detail) {
        showErrorToast(response?.data?.detail);
      }
    }
  };

  // Handle resend OTP
  const resendOtp = async () => {
    setOtpSending(true);
    const response = await forgotPasswordApi({
      email: email,
    });
    if (response?.status === 202) {
      setOtpSending(false);
      showSuccessToast("OTP resent. Check your inbox.");
    } else {
      setOtpSending(false);
    }
  };

  return (
    <>
      {/* Reset password form */}
      <form onSubmit={handleSubmit(submitForm)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 mb-4">
          {/* OTP input step */}
          <div>
            <OtpStep
              register={register}
              setValue={setValue}
              trigger={trigger}
              getValues={getValues}
              isOtpValid={isOtpValid}
              errors={errors}
              clearErrors={clearErrors}
              resendOtp={resendOtp}
              otpSending={otpSending}
            />
          </div>
          {/* Password input */}
          <div>
            <Label htmlFor="password" text="Create Password" />
            <PasswordInput
              register={register("password")}
              id="password"
              placeholder="Create a strong password"
              error={touchedFields.password ? errors.password : undefined}
              value={getValues("password")}
              password={password}
              showPasswordStrength
            />
          </div>
          {/* Confirm password input */}
          <div>
            <Label htmlFor="confirmPassword" text="Confirm Password" />
            <PasswordInput
              register={register("confirmPassword")}
              id="confirmPassword"
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              value={getValues("confirmPassword")}
            />
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={
            isOtpValid ||
            isPasswordValid ||
            isConfirmPasswordValid ||
            isLoaderFormSubmit
          }
          button_type="primary"
          icon_type={isLoaderFormSubmit ? "loader" : null}
          name="Reset password"
          width="w-full"
        />
      </form>
    </>
  );
};

export default ResetPasswordComponent;
