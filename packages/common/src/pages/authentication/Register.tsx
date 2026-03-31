// Component for displaying the register interface

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@rever/common";
import { TextInput } from "@rever/common";
import { Button } from "@rever/common";
import { ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRegisterSchema, registerSchemaValues } from "@rever/validations";
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
import { useTranslate } from "@rever/i18n";

// Main RegisterForm component
const RegisterForm = ({ showStep, setShowStep }: RegisterStepProps) => {
  const translate = useTranslate();

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
    resolver: zodResolver(createRegisterSchema(translate)),
    mode: "onChange",
  });
  // Watch form fields for changes
  const first_name = watch("first_name");
  const last_name = watch("last_name");
  const org_name = watch("org_name");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
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
    !Boolean(password) ||
    isLoaderFormSubmit ||
    Boolean(errors.password?.message);

  const isConfirmPasswordValid =
    !Boolean(confirmPassword) ||
    isLoaderFormSubmit ||
    Boolean(errors.confirmPassword?.message);

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
          } else {
            setIsLoaderFormSubmit(false);
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
    clearErrors("confirmPassword");
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
            {/* <div>
              <Label htmlFor="email" text="Email" />
              <TextInput disabled id="email" value={email} type="email" />
            </div> */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="first_name" text={translate("auth.register.first_name")} isRequired />
                <TextInput
                  register={register("first_name")}
                  id="first_name"
                  placeholder={translate("auth.register.enter_first_name")}
                  error={errors.first_name}
                  value={getValues("first_name")}
                />
              </div>
              <div>
                <Label htmlFor="last_name" text={translate("auth.register.last_name")} isRequired />
                <TextInput
                  register={register("last_name")}
                  id="last_name"
                  placeholder={translate("auth.register.enter_last_name")}
                  error={errors.last_name}
                  value={getValues("last_name")}
                />
              </div>
            </div>

            <div className="mb-5">
              <Label htmlFor="org_name" text={translate("auth.register.org_name")} isRequired />
              <TextInput
                register={register("org_name")}
                id="org_name"
                placeholder={translate("auth.register.enter_org_name")}
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
                text={translate("auth.register.org_currency")}
                isRequired
              />
              <SelectComponent
                title={translate("auth.register.currency")}
                name="currency"
                register={register}
                trigger={trigger}
                error={errors?.currency}
                getValues={getValues}
                options={currencyOptions}
                placeholder={translate("auth.register.select_org_currency")}
              />
            </div>
          </>
        )}

        {/* Step 2: Password setup */}
        {showStep === 2 && (
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <Label htmlFor="password" text={translate("auth.create_password")} />
              <PasswordInput
                register={register("password")}
                id="password"
                placeholder={translate("auth.create_strong_password")}
                error={touchedFields.password ? errors.password : undefined}
                value={getValues("password")}
                password={password}
                showPasswordStrength
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" text={translate("auth.confirm_password")} />
              <PasswordInput
                register={register("confirmPassword")}
                id="confirmPassword"
                placeholder={translate("auth.confirm_your_password")}
                error={errors.confirmPassword}
                value={getValues("confirmPassword")}
              />
            </div>
          </div>
        )}

        {/* Register button for step 2 */}
        {showStep === 2 && (
          <Button
            type="submit"
            disabled={isPasswordValid || isConfirmPasswordValid}
            name={translate("auth.register.lets_get_started")}
            button_type="primary"
            icon_type={isLoaderFormSubmit ? "loader" : null}
            width="w-full"
          />
        )}
      </form>
      <div>
        {/* Continue button for step 1 */}
        {showStep === 1 && (
          <Button
            onClick={goToNextStep}
            disabled={isProfileValid || !isOrgNameValid}
            name={translate("buttons.continue")}
            button_type="primary"
            width="w-full"
          />
        )}

        {/* Back button for step 2 */}
        {showStep === 2 && (
          <div className="mt-5">
            <Button
              onClick={goToPreviousStep}
              disabled={isLoaderFormSubmit}
              name={translate("buttons.back")}
              button_type="secondary-outline"
              width="w-full"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default RegisterForm;
