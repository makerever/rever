// Component to render change password UI

"use client";

import { changePasswordApi } from "@rever/services";
import { useState } from "react";
import {
  changePasswordSchema,
  changePasswordSchemaValues,
} from "@rever/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Label } from "@rever/common";
import { PasswordInput } from "@rever/common";
import { Button } from "@rever/common";
import { showErrorToast, showSuccessToast } from "@rever/common";

const ChangePassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    getValues,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  // Watch for changes in new password and confirm password fields
  const new_password = watch("new_password");
  const confirmPassword = watch("confirmPassword");

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const isPasswordValid =
    !Boolean(new_password) || Boolean(errors.new_password?.message);
  const isConfirmPasswordValid =
    !Boolean(confirmPassword) || Boolean(errors.confirmPassword?.message);

  // Handle form submission
  const submitForm = async (data: changePasswordSchemaValues) => {
    setIsLoaderFormSubmit(true);
    const response = await changePasswordApi({
      old_password: data.old_password,
      new_password: data.confirmPassword,
    });
    if (response?.status === 200) {
      if (typeof window !== "undefined") {
        showSuccessToast("Password changed successfully!");
        setIsLoaderFormSubmit(false);
        reset();
      }
    } else {
      setIsLoaderFormSubmit(false);
      if (response?.data?.old_password) {
        showErrorToast(response?.data?.old_password[0]);
      }
    }
  };

  return (
    <>
      {/* Change Password Form */}
      <form
        onSubmit={handleSubmit(submitForm)}
        className="space-y-5 lg:w-96 w-full"
      >
        <div className="grid grid-cols-1 gap-4 mb-5">
          {/* Old Password Field */}
          <div>
            <Label htmlFor="old_password" text="Old password" />
            <PasswordInput
              register={register("old_password")}
              id="old_password"
              placeholder="Enter old password"
              error={
                touchedFields.old_password ? errors.old_password : undefined
              }
              value={getValues("old_password")}
              showPasswordStrength
            />
          </div>
          {/* New Password Field */}
          <div>
            <Label htmlFor="new_password" text="New password" />
            <PasswordInput
              register={register("new_password")}
              id="new_password"
              placeholder="Enter new password"
              error={
                touchedFields.new_password ? errors.new_password : undefined
              }
              value={getValues("new_password")}
              password={new_password}
              showPasswordStrength
            />
          </div>
          {/* Confirm Password Field */}
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

        {/* Save Button */}
        <div className="w-fit">
          <Button
            className="text-white"
            text="Save"
            type="submit"
            disabled={
              isPasswordValid || isConfirmPasswordValid || isLoaderFormSubmit
            }
          />
        </div>
      </form>
    </>
  );
};

export default ChangePassword;
