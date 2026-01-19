// Invitation user page

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AuthLayout,
  Button,
  Label,
  PasswordInput,
  showErrorToast,
  TextInput,
} from "@rever/common";
import {
  completeInviteUserApi,
  getinvitedUserDetailsApi,
  getLoggedInUserDetails,
  setAuthToken,
} from "@rever/services";
import { useUserStore } from "@rever/stores";
import { InvitedMemberDataType } from "@rever/types";
import {
  inviteMemberSignupSchema,
  inviteMemberSignupSchemaValues,
} from "@rever/validations";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Cookies from "js-cookie";

// Main Invitation component for completing user signup after invitation
const Invitation = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    getValues,
    watch,
  } = useForm({
    resolver: zodResolver(inviteMemberSignupSchema),
    mode: "onChange",
  });

  const router = useRouter();
  const params = useParams();
  const userId = params.userId; // Get userId from route params

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState<boolean>(false);
  const [inviteUserDetails, setInviteUserDetails] =
    useState<InvitedMemberDataType>();

  // Watch form fields for validation and UI updates
  const first_name = watch("first_name");
  const last_name = watch("last_name");
  const password = watch("password");

  // Store user details in global state
  const setUser = useUserStore((state) => state.setUser);

  // Fetch invited user details from API and handle invalid user
  const getInviteUserDetailsFunc = useCallback(
    async (user_id: string | string[]) => {
      const response = await getinvitedUserDetailsApi(user_id);
      if (response?.status === 200) {
        if (response?.data) {
          setInviteUserDetails(response?.data);
        } else {
          showErrorToast("Invalid user");
          router.push("/login");
        }
      }
    },
    [router],
  );

  // Fetch invited user details when userId changes
  useEffect(() => {
    if (userId) {
      getInviteUserDetailsFunc(userId);
    }
  }, [getInviteUserDetailsFunc, userId]);

  // Form validation: disables submit if any field is invalid or loading
  const isDataValid =
    isLoaderFormSubmit ||
    !Boolean(first_name) ||
    !Boolean(last_name) ||
    !Boolean(password) ||
    Boolean(errors.password?.message);

  // Handle form submission for completing invitation
  const handleInviteMember = async (data: inviteMemberSignupSchemaValues) => {
    if (userId) {
      setIsLoaderFormSubmit(true); // Show loader
      const response = await completeInviteUserApi(userId, data); // Submit form data
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
      } else {
        if (response?.data?.detail) {
          showErrorToast(response?.data?.detail); // Show error if any
        }
        setIsLoaderFormSubmit(false);
      }
    }
  };

  return (
    <>
      {/* Page background and centered container */}

      <AuthLayout
        mainTitle="Welcome to Rever"
        subTitle={"Fill up your details to get started"}
      >
        <form onSubmit={handleSubmit(handleInviteMember)}>
          <div>
            <Label htmlFor="organization" text="Organization Name" />
            <TextInput
              id="organization"
              value={inviteUserDetails?.organization}
              disabled={true}
            />
          </div>

          <div className="mt-4">
            <Label htmlFor="email" text="Email" />
            <TextInput
              id="email"
              value={inviteUserDetails?.email}
              disabled={true}
            />
          </div>

          <div className="grid grid-cols-2 gap-5 mt-4">
            {/* First name input */}
            <div>
              <Label htmlFor="first_name" text="First Name" isRequired />
              <TextInput
                register={register("first_name")}
                id="first_name"
                placeholder="Enter first name"
                error={errors.first_name}
              // value={getValues("first_name")}
              />
            </div>
            {/* Last name input */}
            <div>
              <Label htmlFor="last_name" text="Last Name" isRequired />
              <TextInput
                register={register("last_name")}
                id="last_name"
                placeholder="Enter last name"
                error={errors.last_name}
              // value={getValues("last_name")}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="mt-4 mb-5">
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

          {/* Submit button */}
          <Button
            type="submit"
            name="Let's get started"
            disabled={isDataValid}
            button_type="primary"
            icon_type={isLoaderFormSubmit ? "loader" : null}
            width="w-full"
          />
        </form>
      </AuthLayout>
    </>
  );
};

export default Invitation;
