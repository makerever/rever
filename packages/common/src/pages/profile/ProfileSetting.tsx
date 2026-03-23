// Component to render profile setting UI

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Label } from "@rever/common";
import { TextInput } from "@rever/common";
import { useEffect, useState, useRef } from "react";
import {
  createProfileSettingSchema,
} from "@rever/validations";
import { useUserStore } from "@rever/stores";
import { SelectComponent } from "@rever/common";
import { getLoggedInUserDetails, updateProfileApi } from "@rever/services";
import { timezoneList } from "@rever/constants";
import { showErrorToast, showSuccessToast } from "@rever/common";
import { PageLoader } from "@rever/common";
import { useTranslate } from "@rever/i18n";

const ProfileSettings = () => {
  const translate = useTranslate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    trigger,
    watch,
  } = useForm({
    resolver: zodResolver(createProfileSettingSchema(translate)),
    mode: "onChange",
  });
  // Get user and setUser from Zustand store
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Populate form fields with user data when user changes
  useEffect(() => {
    console.log("Populating form with user data:", user);
    setValue("first_name", user?.first_name || "");
    setValue("last_name", user?.last_name || "");
    setValue("email", user?.email || "");
    setValue("role", user?.role);
    setValue("timezone", user?.timezone || "UTC");
    setIsLoading(false);
  }, [setValue, user]);

  // refs
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitializing = useRef(true);
  const isPopulatingForm = useRef(false);
  const lastSavedData = useRef({});

  // Stop autosave on initial setValue calls
  useEffect(() => {
    setTimeout(() => {
      isInitializing.current = false;
    }, 300);
  }, []);

  useEffect(() => {
    const subscription = watch(async (formData) => {
      try {
        // Skip autosave during initialization or when setValue is populating form
        if (isInitializing.current || isPopulatingForm.current) return;

        // Clear previous debounce timer
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

        autoSaveTimer.current = setTimeout(async () => {
          // Build snapshot for profile settings
          const snapshot = {
            first_name: formData.first_name || "",
            last_name: formData.last_name || "",
            email: formData.email || "",
            role: formData.role || "",
            timezone: formData.timezone || "",
          };

          // If no changes → stop
          if (
            JSON.stringify(lastSavedData.current) === JSON.stringify(snapshot)
          ) {
            return;
          }

          setIsLoaderFormSubmit(true);

          // Your profile update API
          const response = await updateProfileApi(snapshot);
          // console.log(response);
          if (response?.status === 200) {
            // Update store
            setUser({
              id: user?.id,
              first_name: snapshot.first_name,
              last_name: snapshot.last_name,
              email: snapshot.email,
              role: snapshot.role,
              timezone: snapshot.timezone,
              organization: response?.data?.organization,
            });

            lastSavedData.current = snapshot;
            showSuccessToast(translate("approval_settings.autosaved"));
          }

          setIsLoaderFormSubmit(false);
        }, 500); // debounce delay
      } catch (err) {
        setIsLoaderFormSubmit(false);
      }
    });

    return () => {
      // cleanup subscription and timer
      subscription.unsubscribe();
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [watch, user, setUser]);

  return (
    <>
      {/* Show nothing while loading user data */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="flex items-center justify-between bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
            <div className="flex items-center justify-between w-full h-8">
              <div className="flex items-center gap-3">
                <p className="text-neutral-1100 text-2xl font-medium">
                  {translate("profile.heading")}
                </p>
              </div>
            </div>
          </div>
          <form
            className="bg-white rounded-[20px] p-4 border border-secondary-200"
            style={{
              minHeight: `calc(100vh - 10rem - 2px)`,
            }}
          >
            <div className="w-full">
              {/* First row: First name, Last name, Email */}
              <div className="grid grid-cols-1">
                <div className="border-b border-neutral-200 pb-3 flex items-center">
                  <Label
                    htmlFor="first_name"
                    text={translate("profile.first_name") + ":"}
                    className="text-neutral-700 font-medium text-sm max-w-60 w-full"
                  />
                  <div className="max-w-80 w-full">
                    <TextInput
                      register={register("first_name")}
                      id="first_name"
                      placeholder={translate("placeholders.first_name")}
                      error={errors.first_name}
                      value={getValues("first_name")}
                    />
                  </div>
                </div>
                <div className="border-b border-neutral-200 py-3 flex items-center">
                  <Label
                    htmlFor="last_name"
                    text={translate("profile.last_name") + ":"}
                    className="text-neutral-700 font-medium text-sm max-w-60 w-full"
                  />
                  <div className="max-w-80 w-full">
                    <TextInput
                      register={register("last_name")}
                      id="last_name"
                      placeholder={translate("placeholders.last_name")}
                      error={errors.last_name}
                      value={getValues("last_name")}
                    />
                  </div>
                </div>
                <div className="border-b border-neutral-200 py-3 flex items-center">
                  <Label
                    htmlFor="email"
                    text={translate("profile.email") + ":"}
                    className="text-neutral-700 font-medium text-sm max-w-60 w-full"
                  />
                  <div className="max-w-80 w-full">
                    <TextInput
                      register={register("email")}
                      id="email"
                      disabled
                      placeholder={translate("placeholders.enter_email")}
                      error={errors.email}
                      value={getValues("email")}
                    />
                  </div>
                </div>

                <div className="flex items-center pt-3">
                  <Label
                    htmlFor="timezone"
                    text={translate("profile.timezone") + ":"}
                    className="text-neutral-700 font-medium text-sm max-w-60 w-full"
                  />
                  <div className="max-w-80 w-full">
                    <SelectComponent
                      name="timezone"
                      register={register}
                      trigger={trigger}
                      getValues={getValues}
                      error={errors?.timezone}
                      options={timezoneList}
                      placeholder={translate("profile.timezone")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </>
      )}
    </>
  );
};

export default ProfileSettings;
