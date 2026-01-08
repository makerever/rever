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
      <div className="flex items-center justify-between bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
        <div className="flex items-center justify-between w-full h-8">
          <div className="flex items-center gap-3">
            <p className="text-neutral-1100 text-2xl font-medium">
              Change Password
            </p>
          </div>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(submitForm)}
        className="bg-white rounded-[20px] p-4 border border-secondary-200"
        style={{
          minHeight: `calc(100vh - 10rem - 2px)`,
        }}
      >
        <div className="grid grid-cols-1">
          {/* Old Password Field */}
          <div className="border-b border-neutral-200 flex items-center pb-3">
            <Label
              htmlFor="old_password"
              text="Old password:"
              className="text-neutral-700 font-medium text-sm max-w-60 w-full"
            />
            <div className="max-w-80 w-full">
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
          </div>
          {/* New Password Field */}
          <div className="border-b border-neutral-200 flex items-center py-3">
            <Label
              htmlFor="new_password"
              text="New password:"
              className="text-neutral-700 font-medium text-sm max-w-60 w-full"
            />
            <div className="max-w-80 w-full">
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
          </div>
          {/* Confirm Password Field */}
          <div className="border-b border-neutral-200 flex items-center py-3">
            <Label
              htmlFor="confirmPassword"
              text="Confirm password:"
              className="text-neutral-700 font-medium text-sm max-w-60 w-full"
            />
            <div className="max-w-80 w-full">
              <PasswordInput
                register={register("confirmPassword")}
                id="confirmPassword"
                placeholder="Enter confirm password"
                error={errors.confirmPassword}
                value={getValues("confirmPassword")}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-start mt-6 gap-3">
          <Button
            type="submit"
            disabled={
              isPasswordValid || isConfirmPasswordValid || isLoaderFormSubmit
            }
            name="Save changes"
            button_type="primary"
            icon_type={isLoaderFormSubmit ? "loader" : null}
          />
        </div>
      </form>
    </>
  );
};

export default ChangePassword;