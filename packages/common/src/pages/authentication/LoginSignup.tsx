// Component for displaying the login steps interface

"use client";

import { Button } from "@rever/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchemaValues, loginSignupSchema } from "@rever/validations";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmailStep from "./authSteps/EmailStep";
import PasswordStep from "./authSteps/PasswordStep";
import OtpStep from "./authSteps/OtpStep";
import { LoginStepProps } from "@rever/types";
import {
  checkEmailRegisteredApi,
  forgotPasswordApi,
  getLoggedInUserDetails,
  loginApi,
  loginViaOtpApi,
  loginViaOtpSubmitApi,
  signupEmailVerifyApi,
} from "@rever/services";
import { showErrorToast, showSuccessToast } from "@rever/common";
import Cookies from "js-cookie";
import { setAuthToken } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { STEP } from "@rever/constants";

// Main LoginSignup component
const LoginSignup = ({ showStep, setShowStep }: LoginStepProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
    clearErrors,
    trigger,
  } = useForm({
    resolver: zodResolver(loginSignupSchema),
    mode: "onChange",
  });

  // Watch form fields for changes
  const email = watch("email");
  const password = watch("password");
  const otp = watch("otp") || "";

  const router = useRouter();

  // Local state for UI logic
  const [isMounted, setIsMounted] = useState<boolean>(false); // For SSR/CSR hydration
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState<boolean>(false); // Loader state for form submission
  const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false); // Tracks if user is registered
  const [otpSending, setOtpSending] = useState<boolean>(false);

  // Validation helpers
  const isEmailValid = !Boolean(email) || Boolean(errors.email?.message);
  const isPasswordEmpty = !Boolean(password);
  const isOtpValid = otp.length < 6;

  // Store user details in global state
  const setUser = useUserStore((state) => state.setUser);

  // Set mounted state to true after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if email is registered and set next step accordingly
  const handleEmailCheck = async () => {
    setIsLoaderFormSubmit(true);
    const response = await checkEmailRegisteredApi({
      email: getValues("email"),
    });
    if (response?.status === 400) {
      setIsUserRegistered(true);
      setShowStep(STEP.PASSWORD);
      setIsLoaderFormSubmit(false);
    } else {
      setIsUserRegistered(false);
      setShowStep(STEP.OTP);
      setIsLoaderFormSubmit(false);
    }
  };

  // Handle login form submission
  const submitForm = async (data: loginFormSchemaValues) => {
    setIsLoaderFormSubmit(true);
    const response = await loginApi({ ...data, remember_me: true });
    if (response?.status === 200) {
      setAuthToken(response?.data?.access);
      Cookies.set("token", response?.data?.access, {
        expires: 7,
      });
      const responseUserDetails = await getLoggedInUserDetails();
      if (responseUserDetails?.status === 200) {
        Cookies.set("role", responseUserDetails?.data?.role, {
          expires: 7,
        });
        setUser(responseUserDetails?.data);
        if (responseUserDetails?.data?.role === "lite_user") {
          router.push("/request-receipt/list");
        } else {
          router.push("/home");
        }
      } else {
        setIsLoaderFormSubmit(false);
      }
    } else if (response?.data?.non_field_errors) {
      setIsLoaderFormSubmit(false);
      showErrorToast(response?.data?.non_field_errors[0]);
    } else {
      setIsLoaderFormSubmit(false);
    }
  };

  // Handle OTP authentication for login or signup
  const handleAuthViaOtp = async () => {
    setIsLoaderFormSubmit(true);
    if (isUserRegistered) {
      // Login via OTP
      const response = await loginViaOtpSubmitApi({
        email: getValues("email"),
        code: otp,
      });
      if (response?.status === 200) {
        setIsLoaderFormSubmit(false);
        setAuthToken(response?.data?.access);
        Cookies.set("token", response?.data?.access, {
          expires: 7,
        });
        const responseUserDetails = await getLoggedInUserDetails();
        if (responseUserDetails?.status === 200) {
          Cookies.set("role", responseUserDetails?.data?.role, {
            expires: 7,
          });
          setUser(responseUserDetails?.data);
          if (responseUserDetails?.data?.role === "lite_user") {
            router.push("/request-receipt/list");
          } else {
            router.push("/home");
          }
        }
      } else {
        setIsLoaderFormSubmit(false);
        if (response?.data?.detail) {
          showErrorToast(response?.data?.detail);
        }
      }
    } else {
      // Signup email verification via OTP
      const response = await signupEmailVerifyApi({
        email: getValues("email"),
        code: otp,
      });

      if (response?.status === 200) {
        setIsLoaderFormSubmit(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("registerEmail", getValues("email"));
          router.push("/register");
        }
      } else {
        setIsLoaderFormSubmit(false);
        if (response?.data?.detail) {
          showErrorToast(response?.data?.detail);
        }
      }
    }
  };

  // Send OTP for login
  const otpLogin = async (isResendOtp?: boolean) => {
    const response = await loginViaOtpApi({ email: getValues("email") });
    if (response?.status === 202) {
      if (isResendOtp) {
        showSuccessToast("OTP resent. Check your inbox.");
      } else {
        setShowStep(STEP.OTP);
      }
    }
  };

  // Resend OTP logic for login or signup
  const resendOtp = async () => {
    if (isUserRegistered) {
      otpLogin(true);
    } else {
      setOtpSending(true);
      const response = await checkEmailRegisteredApi({
        email: getValues("email"),
      });
      if (response?.status === 202) {
        showSuccessToast("OTP resent. Check your inbox.");
        setOtpSending(false);
        setShowStep(STEP.OTP);
      } else {
        setOtpSending(false);
      }
    }
  };

  // Handle forgot password: send reset code
  const handleGetResetCode = async () => {
    setIsLoaderFormSubmit(true);
    const response = await forgotPasswordApi({ email: getValues("email") });
    if (response?.status === 202) {
      if (typeof window !== "undefined") {
        setIsLoaderFormSubmit(false);
        sessionStorage.setItem("registerEmail", getValues("email"));
        router.push("/reset-password");
      }
    } else {
      setIsLoaderFormSubmit(false);
    }
  };

  // Prevent rendering until mounted (for SSR/CSR consistency)
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Email step: always rendered */}
      <div className="mb-4">
        <EmailStep
          errors={errors}
          isEmailValid={isEmailValid}
          register={register}
          setShowStep={setShowStep}
          getValues={getValues}
          setValue={setValue}
          trigger={trigger}
          showStep={showStep}
          clearErrors={clearErrors}
          handleEmailCheck={handleEmailCheck}
          isLoaderFormSubmit={isLoaderFormSubmit}
        />
      </div>

      {/* Password step: shown if user is registered */}
      {showStep === STEP.PASSWORD ? (
        <>
          <PasswordStep
            register={register}
            getValues={getValues}
            errors={errors}
            setValue={setValue}
            clearErrors={clearErrors}
            trigger={trigger}
            isPasswordEmpty={isPasswordEmpty}
            handleSubmit={handleSubmit}
            submitForm={submitForm}
            isLoaderFormSubmit={isLoaderFormSubmit}
            handleForgotPwd={() => setShowStep(STEP.FORGOT_PASSWORD)}
          />
          {/* Divider and OTP login button */}
          <div className="flex items-center gap-2 text-slate-600 text-xs my-4">
            <div className="h-px flex-1 bg-secondary-200" />
            <span className="mb-0.5">Or</span>
            <div className="h-px flex-1 bg-secondary-200" />
          </div>
          <Button
            onClick={() => otpLogin()}
            disabled={isLoaderFormSubmit}
            name="Sign in using OTP"
            button_type="secondary"
            width="w-full"
          />
        </>
      ) : null}

      {/* OTP step: shown if user is not registered or chooses OTP login */}
      {showStep === STEP.OTP ? (
        <>
          <OtpStep
            register={register}
            setValue={setValue}
            trigger={trigger}
            getValues={getValues}
            isOtpValid={isOtpValid || isLoaderFormSubmit}
            errors={errors}
            clearErrors={clearErrors}
            handleContinue={handleAuthViaOtp}
            resendOtp={resendOtp}
            isLoaderFormSubmit={isLoaderFormSubmit}
            otpSending={otpSending}
          />
        </>
      ) : null}

      {/* Forgot password step */}
      {showStep === STEP.FORGOT_PASSWORD ? (
        <>
          <Button
            onClick={handleGetResetCode}
            disabled={isLoaderFormSubmit}
            name="Get reset code"
            button_type="primary"
            width="w-full"
          />

          <div className="mt-5">
            <Button
              onClick={() => {
                setShowStep(STEP.PASSWORD);
              }}
              disabled={isLoaderFormSubmit}
              name="Go back to sign in"
              button_type="secondary-outline"
              width="w-full"
            />
          </div>
        </>
      ) : null}
    </>
  );
};

export default LoginSignup;
