"use client";

import { Button } from "@rever/common";
import { PasswordInput } from "@rever/common";
import { Label } from "@rever/common";
import { PasswordStepProps } from "@rever/types";
import { FieldError, FieldValues, Path } from "react-hook-form";

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
  return (
    <>
      {/* Password input field with label */}
      <div className="mb-5">
        <Label htmlFor="password" text="Password" />
        <PasswordInput
          register={register("password" as Path<T>)} // Register password field
          id="password"
          placeholder="Enter password"
          onEnterPress={!isPasswordEmpty ? handleSubmit(submitForm) : () => {}} // Submit on Enter if not empty
          error={errors["password"] as FieldError} // Show error if present
          value={getValues("password" as Path<T>)} // Controlled value
        />
        {/* Forgot password link */}
        <div
          onClick={handleForgotPwd}
          className="w-fit flex items-center font-medium cursor-pointer text-primary-500 text-2xs mt-1"
        >
          <span>Forgot your password?</span>
        </div>
      </div>
      {/* Login button */}
      <Button
        type="submit"
        onClick={handleSubmit(submitForm)} // Submit form on click
        text="Login"
        disabled={isPasswordEmpty || isLoaderFormSubmit} // Disable if empty or loading
        className="text-white"
        isLoading={isLoaderFormSubmit}
      />
    </>
  );
};

export default PasswordStep;
