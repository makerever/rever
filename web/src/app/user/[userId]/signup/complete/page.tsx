// Invitation user page

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
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
import Image from "next/image";

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
      <div className="bg-gray-100 h-screen flex items-center flex-col justify-center">
        <div className="bg-white lg:w-2/5 mx-4 shadow-lg rounded-lg p-8">
          <div className="lg:w-3/5 w-4/5 flex items-center mb-4">
            <Image
              src="/images/reverLogo.svg"
              alt="Inviting user to Rever"
              width={28}
              height={28}
            />
            <p
              className={`text-gray-800 font-medium dark:text-gray-400 ms-2 text-xl`}
            >
              Rever
            </p>
          </div>

          {/* Organization and invitation details */}
          <p className="mt-8 text-md font-semibold text-gray-800">
            {inviteUserDetails?.organization}
          </p>

          <p className="mt-5 text-xs text-gray-600">
            You’ve been invited to join Rever by{" "}
            <span className="font-semibold">
              {inviteUserDetails?.invited_by}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-600">
            We look forward to having you with us!
          </p>

          <p className="mt-2 text-xs text-gray-600">
            Create a Rever account for the email address&nbsp;
            <span className="font-semibold">
              {inviteUserDetails?.email}
            </span>{" "}
            <br /> to accept the invitation.
          </p>

          {/* Signup form */}
          <form onSubmit={handleSubmit(handleInviteMember)}>
            <div className="grid grid-cols-2 gap-5 mt-6">
              {/* First name input */}
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
              {/* Last name input */}
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

            {/* Password input */}
            <div className="mt-4">
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
            <div className="grid grid-cols-2 w-fit gap-3 mt-6">
              <Button
                disabled={isDataValid}
                type="submit"
                text="Save"
                className="text-white"
              />
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Invitation;
