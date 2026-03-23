"use client";

import { Button } from "@rever/common";
import { PasswordInput } from "@rever/common";
import { Label } from "@rever/common";
import { PasswordStepProps } from "@rever/types";
import { FieldError, FieldValues, Path } from "react-hook-form";
import { useTranslate } from "@rever/i18n";

// Generic PasswordStep component for authentication flow
const PasswordStep = <T extends FieldValues>({
  register,
  getValues,
  errors,
  isPasswordEmpty,
  handleSubmit,
  submitForm,
  isLoaderFormSubmit,
  handleForgotPwd,
}: PasswordStepProps<T>) => {
  const translate = useTranslate();
  return (
    <>
      {/* Password input field with label */}
      <div className="mb-5">
        <Label htmlFor="password" text={translate("auth.password")} />
        <PasswordInput
          register={register("password" as Path<T>)} // Register password field
          id="password"
          placeholder={translate("auth.enter_password")}
          onEnterPress={!isPasswordEmpty ? handleSubmit(submitForm) : () => {}} // Submit on Enter if not empty
          error={errors["password"] as FieldError} // Show error if present
          value={getValues("password" as Path<T>)} // Controlled value
        />
        {/* Forgot password link */}
        <div
          onClick={handleForgotPwd}
          className="w-fit flex items-center font-medium cursor-pointer text-primary-800 underline text-xs mt-1"
        >
          <span>{translate("auth.forgot_password")}</span>
        </div>
      </div>

      <Button
        onClick={handleSubmit(submitForm)}
        disabled={isPasswordEmpty || isLoaderFormSubmit}
        name={translate("auth.sign_in")}
        type="submit"
        button_type="primary"
        icon_type={isLoaderFormSubmit ? "loader" : null}
        width="w-full"
      />
    </>
  );
};

export default PasswordStep;
