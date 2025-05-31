// Component for displaying the register interface

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@rever/common";
import { TextInput } from "@rever/common";
import { Button } from "@rever/common";
import { ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, registerSchemaValues } from "@rever/validations";
import { PasswordInput } from "@rever/common";
import { registerSteps } from "@rever/constants";
import { useRouter } from "next/navigation";
import { RegisterStepProps } from "@rever/types";
import { Stepper } from "@rever/common";
import { completeSignupApi, getLoggedInUserDetails } from "@rever/services";
import Cookies from "js-cookie";
import { setAuthToken } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { showErrorToast } from "@rever/common";
import { SelectComponent } from "@rever/common";
import { currencyOptions } from "@rever/constants";

// Main RegisterForm component
const RegisterForm = ({ showStep, setShowStep }: RegisterStepProps) => {
  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    getValues,
    watch,
    clearErrors,
    trigger,
    setFocus,
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  // Watch form fields for changes
  const first_name = watch("first_name");
  const last_name = watch("last_name");
  const org_name = watch("org_name");
  const password = watch("password");
  const org_currency = watch("currency");

  const router = useRouter();

  // Local state for UI logic
  const [isMounted, setIsMounted] = useState(false); // For SSR/CSR hydration
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false); // Loader state for form submission
  const [email, setEmail] = useState<string>(""); // Email from session storage

  // Validation helpers
  const isProfileValid =
    !Boolean(first_name) ||
    !Boolean(last_name) ||
    !Boolean(org_name) ||
    !Boolean(org_currency);

  const isOrgNameValid =
    isLoaderFormSubmit || !Boolean(errors.org_name?.message);

  const isPasswordValid =
    isLoaderFormSubmit || Boolean(errors.password?.message);

  const isConfirmPasswordValid =
    isLoaderFormSubmit || Boolean(errors.confirmPassword?.message);

  // Store user details in global state
  const setUser = useUserStore((state) => state.setUser);

  // On mount: set mounted, get email from session storage, redirect if not found
  useEffect(() => {
    setIsMounted(true); // Set mounted to true after first render

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

  // Handle form submission for registration
  const submitForm = async (data: registerSchemaValues) => {
    if (showStep === 2) {
      setIsLoaderFormSubmit(true);
      const response = await completeSignupApi({
        email: sessionStorage.getItem("registerEmail") || "",
        ...data,
      });
      if (response?.status === 200) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("registerEmail");
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
            router.push("/home");
          }
        }
      } else {
        if (response?.data?.detail) {
          showErrorToast(response?.data?.detail);
        }
        setIsLoaderFormSubmit(false);
      }
    }
  };

  // Go to next registration step
  const goToNextStep = () => {
    if (showStep < registerSteps.length) setShowStep(showStep + 1);
  };

  // Go to previous registration step
  const goToPreviousStep = () => {
    setFocus("first_name");
    clearErrors("password");
    if (showStep > 1) setShowStep(showStep - 1);
  };

  // If the component isn't mounted yet, return null to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Stepper for registration steps */}
      <Stepper steps={registerSteps} activeStep={showStep} />

      {/* Registration form */}
      <form onSubmit={handleSubmit(submitForm)} className="space-y-5">
        {/* Step 1: Profile details */}
        {showStep === 1 && (
          <>
            <div>
              <Label htmlFor="email" text="Email" />
              <TextInput disabled id="email" value={email} type="email" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <Label htmlFor="first_name" text="First name" isRequired />
                <TextInput
                  register={register("first_name")}
                  id="first_name"
                  placeholder="Enter first name"
                  error={errors.first_name}
                  value={getValues("first_name")}
                />
              </div>
              <div>
                <Label htmlFor="last_name" text="Last name" isRequired />
                <TextInput
                  register={register("last_name")}
                  id="last_name"
                  placeholder="Enter last name"
                  error={errors.last_name}
                  value={getValues("last_name")}
                />
              </div>
            </div>

            <div className="mb-5">
              <Label htmlFor="org_name" text="Organization name" isRequired />
              <TextInput
                register={register("org_name")}
                id="org_name"
                placeholder="Enter organization name"
                error={errors.org_name}
                value={getValues("org_name")}
                onEnterPress={() => {
                  if (!isProfileValid && isOrgNameValid) {
                    goToNextStep();
                  }
                }}
              />
            </div>

            <div className="mb-5">
              <Label
                htmlFor="base_currency"
                text="Organization currency"
                isRequired
              />
              <SelectComponent
                title="Currency"
                name="currency"
                register={register}
                trigger={trigger}
                error={errors?.currency}
                getValues={getValues}
                options={currencyOptions}
                placeholder="Select organization currency"
              />
            </div>
          </>
        )}

        {/* Step 2: Password setup */}
        {showStep === 2 && (
          <div className="grid grid-cols-1 gap-4 mb-5">
            <div>
              <Label htmlFor="password" text="Password" />
              <PasswordInput
                register={register("password")}
                id="password"
                placeholder="Enter password"
                error={touchedFields.password ? errors.password : undefined}
                value={getValues("password")}
                password={password}
                showPasswordStrength
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" text="Confirm password" />
              <PasswordInput
                register={register("confirmPassword")}
                id="confirmPassword"
                placeholder="Enter confirm password"
                error={errors.confirmPassword}
                value={getValues("confirmPassword")}
              />
            </div>
          </div>
        )}

        {/* Register button for step 2 */}
        {showStep === 2 && (
          <Button
            className="text-white"
            isLoading={isLoaderFormSubmit}
            text="Register"
            type="submit"
            disabled={isPasswordValid || isConfirmPasswordValid}
          />
        )}
      </form>
      <div>
        {/* Continue button for step 1 */}
        {showStep === 1 && (
          <Button
            onClick={goToNextStep}
            className="text-white mt-5"
            text="Continue"
            type="button"
            disabled={isProfileValid || !isOrgNameValid}
          />
        )}

        {/* Back button for step 2 */}
        {showStep === 2 && (
          <Button
            onClick={goToPreviousStep}
            className="mt-1 bg-transparent hover:bg-transparent disabled:bg-transparent disabled:hover:bg-transparent text-slate-500"
            text="Back"
            type="button"
            icon={<ChevronLeft width={18} height={18} />}
            disabled={isLoaderFormSubmit}
          />
        )}
      </div>
    </>
  );
};

export default RegisterForm;
