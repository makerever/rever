// Component to render profile setting UI

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Label } from "@rever/common";
import { TextInput } from "@rever/common";
import { useEffect, useState } from "react";
import { Button } from "@rever/common";
import {
  profileSettingSchema,
  profileSettingSchemaValues,
} from "@rever/validations";
import { useUserStore } from "@rever/stores";
import { SelectComponent } from "@rever/common";
import { getLoggedInUserDetails, updateProfileApi } from "@rever/services";
import { memberRoleOptions, timezoneList } from "@rever/constants";
import { showErrorToast, showSuccessToast } from "@rever/common";
import { PageLoader } from "@rever/common";

const ProfileSettings = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    trigger,
  } = useForm({
    resolver: zodResolver(profileSettingSchema),
    mode: "onChange",
  });

  // Get user and setUser from Zustand store
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Populate form fields with user data when user changes
  useEffect(() => {
    setValue("first_name", user?.first_name || "");
    setValue("last_name", user?.last_name || "");
    setValue("email", user?.email || "");
    setValue("role", user?.role);
    setValue("timezone", user?.timezone || "UTC");
    setIsLoading(false);
  }, [setValue, user]);

  // Fetch latest user details and update store
  const getUserDetails = async () => {
    const response = await getLoggedInUserDetails();
    if (response?.status === 200) {
      setUser(response?.data);
      setIsLoaderFormSubmit(false);
      showSuccessToast("Profile details updated");
    } else {
      setIsLoaderFormSubmit(false);
      showErrorToast("Something went wrong");
    }
  };

  // Handle form submission to update profile
  const submitForm = async (data: profileSettingSchemaValues) => {
    setIsLoaderFormSubmit(true);
    const response = await updateProfileApi(data);
    if (response?.status === 200) {
      getUserDetails();
    } else {
      setIsLoaderFormSubmit(false);
      showErrorToast("Something went wrong");
    }
  };

  return (
    <>
      {/* Show nothing while loading user data */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <form onSubmit={handleSubmit(submitForm)}>
          <div className="lg:w-3/4 w-full">
            {/* First row: First name, Last name, Email */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
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
                <Label htmlFor="last_name" text="Last name" />
                <TextInput
                  register={register("last_name")}
                  id="last_name"
                  placeholder="Enter last name"
                  error={errors.last_name}
                  value={getValues("last_name")}
                />
              </div>
              <div>
                <Label htmlFor="email" text="Email" />
                <TextInput
                  register={register("email")}
                  id="email"
                  disabled
                  placeholder="Enter email"
                  error={errors.email}
                  value={getValues("email")}
                />
              </div>
            </div>

            {/* Second row: Display name, Timezone, Role */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              {/* <div>
                <Label htmlFor="display_name" text="Display name" />
                <TextInput
                  register={register("display_name")}
                  id="display_name"
                  placeholder="Enter display name"
                  error={errors.display_name}
                  value={getValues("display_name")}
                />
              </div> */}
              <div>
                <Label htmlFor="timezone" text="Timezone" />
                <SelectComponent
                  name="timezone"
                  register={register}
                  trigger={trigger}
                  getValues={getValues}
                  error={errors?.timezone}
                  options={timezoneList}
                  placeholder="Select timezone"
                  isClearable={true}
                />
              </div>
              <div>
                <Label htmlFor="role" text="Role" />
                <SelectComponent
                  name="role"
                  register={register}
                  trigger={trigger}
                  error={errors?.role}
                  getValues={getValues}
                  options={memberRoleOptions}
                  isDisabled
                  placeholder="Select role"
                  isClearable={true}
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="grid grid-cols-2 w-fit gap-3 mt-6">
            <Button
              type="submit"
              text="Save"
              disabled={isLoaderFormSubmit}
              className="text-white"
            />
          </div>
        </form>
      )}
    </>
  );
};

export default ProfileSettings;
