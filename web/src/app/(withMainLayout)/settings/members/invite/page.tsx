// Members Invite Page UI

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Label,
  PageLoader,
  SelectComponent,
  showErrorToast,
  showSuccessToast,
  TextInput,
} from "@rever/common";
import { memberRoleOptions } from "@rever/constants";
import {
  getMembersListByIdApi,
  inviteUserApi,
  updateMemberApi,
} from "@rever/services";
import {
  inviteMemberSchema,
  inviteMemberSchemaValues,
} from "@rever/validations";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type RoleDescriptionsProps = {
  role: string;
};

function RoleDescriptions({ role }: RoleDescriptionsProps) {
  return (
    <div className="mt-10 lg:w-2/4 w-full">
      <h2 className="font-medium text-slate-600">Role descriptions :-</h2>
      <p className="text-xs text-slate-500 mt-2 mb-4">
        Rever ensures secure, role-based access to streamline your accounts
        payable process. <br /> Each role is designed to maintain clear
        responsibilities and prevent conflicts in financial workflows.
      </p>

      {/* Admin */}
      {role === "admin" ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-600">- Admin</h3>
          <h3 className="text-xs font-medium text-slate-600 mt-2 mb-3">
            # Can do
          </h3>
          <ul className="text-xs text-slate-500 mt-1">
            <li>
              - Can access dashboard showing insights on total bills which are
              approved, reviewed, and awaiting approval.
            </li>
            <li>
              - Manage vendor information and supervise the end-to-end bill
              workflow.
            </li>
            <li>
              - Set up and manage approval workflows and organizational
              configurations.
            </li>
            <li>- Configure approval rules and organization settings.</li>
          </ul>
          <h3 className="text-xs font-medium text-slate-600 mt-3 mb-3">
            # Cannot do
          </h3>
          <ul className="text-xs text-slate-500 mt-1">
            <li>
              - Bill can not be approved as a approver but have ability to
              re-assign the approver
            </li>
          </ul>
        </div>
      ) : null}

      {/* Member */}
      {role === "member" ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-600">- Member</h3>
          <h3 className="text-xs font-medium text-slate-600 mt-2 mb-3">
            # Can do
          </h3>
          <ul className="text-xs text-slate-500 mt-1">
            <li>
              - Can access dashboard showing insights on total bills which are
              approved, reviewed, and awaiting approval.
            </li>
            <li>- Authorized to create and maintain vendor profiles.</li>
            <li>
              - Can create, modify, delete, and submit bills, enabling
              end-to-end management of the bill lifecycle.
            </li>
            <li>
              - Can view team members and organizational details to remain
              informed about the company’s structure and hierarchy.
            </li>
          </ul>
          <h3 className="text-xs font-medium text-slate-600 mt-3 mb-3">
            # Cannot do
          </h3>
          <ul className="text-xs text-slate-500 mt-1">
            <li>
              - Approval actions are restricted to maintain the integrity and
              independence of the approval process.
            </li>
            <li>
              - Restricted from inviting members or modifying approval settings,
              keeping the role focused within its operational boundaries.
            </li>
          </ul>
        </div>
      ) : null}

      {/* Finance Manager */}
      {role === "finance_manager" ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-600">
            - Finance manager
          </h3>
          <h3 className="text-xs font-medium text-slate-600 mt-2 mb-3">
            # Can do
          </h3>
          <ul className="text-xs text-slate-500 mt-1 space-y-0.5">
            <li>
              - Can access dashboard showing insights on total bills which are
              approved, reviewed, and awaiting approval.
            </li>
            <li>
              - Responsible for reviewing, approving, or rejecting bills,
              reinforcing financial oversight and decision-making authority.
            </li>
            <li>
              - Has visibility into vendor, member, and organization details to
              make informed and accurate approval decisions.
            </li>
          </ul>
          <h3 className="text-xs font-medium text-slate-600 mt-3 mb-3">
            # Cannot do
          </h3>
          <ul className="text-xs text-slate-500 mt-1">
            <li>
              - Restricted from creating or modifying vendors or bills, ensuring
              the role remains solely focused on review and approval
              responsibilities.
            </li>
            <li>
              - Access to user management and organizational settings is
              restricted to uphold segregation of duties and ensure compliance.
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

// Main component for inviting or editing a member
function InviteMemberWithParams() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    trigger,
    watch,
  } = useForm({
    resolver: zodResolver(inviteMemberSchema),
    mode: "onChange",
  });

  // Router and search params for navigation and edit mode detection
  const router = useRouter();
  const searchParams = useSearchParams();
  const idValue = searchParams.get("id");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);

  // Watch form fields for validation
  const first_name = watch("first_name");
  const last_name = watch("last_name");

  // Disable Save button if required fields are missing or submitting
  const isBtnDisabled = idValue
    ? !Boolean(first_name) || !Boolean(last_name) || isLoaderFormSubmit
    : isLoaderFormSubmit;

  // Fetch individual member details for editing
  const handleGetIndividualMember = useCallback(async () => {
    const response = await getMembersListByIdApi(idValue ?? "");
    if (response.status === 200) {
      setIsLoading(false);
      setValue("first_name", response?.data.first_name);
      setValue("last_name", response?.data.last_name);
      setValue("email", response?.data.email);
      setValue("role", response?.data.role);
    } else {
      setIsLoading(false);
    }
  }, [idValue, setValue]);

  // On mount or when idValue changes, fetch member data if editing
  useEffect(() => {
    if (idValue) {
      handleGetIndividualMember();
    } else {
      setIsLoading(false);
    }
  }, [handleGetIndividualMember, idValue]);

  // Handle form submission for inviting or updating a member
  const handleInviteMember = async (data: inviteMemberSchemaValues) => {
    setIsLoaderFormSubmit(true);
    if (idValue) {
      // Update existing member
      const response = await updateMemberApi(data, idValue);
      if (response?.status === 200) {
        setIsLoaderFormSubmit(false);
        showSuccessToast("User details updated");
      } else {
        if (response?.data?.detail) {
          setIsLoaderFormSubmit(false);
          showErrorToast(response?.data?.detail);
        }
      }
    } else {
      // Invite new member
      const response = await inviteUserApi(data);
      if (response?.status === 202) {
        setIsLoaderFormSubmit(false);
        showSuccessToast("Invitation request sent");
        router.push("/settings/members");
      } else {
        if (response?.data?.detail) {
          setIsLoaderFormSubmit(false);
          showErrorToast("User already exists in your organization");
        }
      }
    }
  };

  return (
    <>
      {/* Page heading */}
      <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
        Invite member
      </p>

      {/* Show loader or form */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="flex items-start justify-start gap-5 md:gap-10 flex-col sm:flex-row">
          <form
            onSubmit={handleSubmit(handleInviteMember)}
            className="lg:w-2/4 w-full"
          >
            {/* Show name fields only in edit mode */}
            {idValue ? (
              <div className="grid grid-cols-2 gap-5 mb-4">
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
            ) : null}

            {/* Email and role fields */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label htmlFor="email" text="Email" isRequired />
                <TextInput
                  register={register("email")}
                  id="email"
                  placeholder="Enter email"
                  error={errors.email}
                  value={getValues("email")}
                  disabled={idValue ? true : false}
                />
              </div>
              <div>
                <Label htmlFor="role" text="Role" isRequired />
                <SelectComponent
                  title="Member Role"
                  name="role"
                  isDisabled={idValue ? true : false}
                  register={register}
                  trigger={trigger}
                  getValues={getValues}
                  error={errors.role}
                  options={memberRoleOptions}
                  placeholder="Select role"
                  // isClearable={true}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 w-fit gap-3 mt-6">
              <Button
                disabled={isBtnDisabled}
                type="submit"
                text="Save"
                className="text-white"
              />

              <Button
                text="Cancel"
                onClick={() => router.back()}
                disabled={isBtnDisabled}
                className="bg-transparent text-primary-500 border border-primary-500 disabled:hover:bg-transparent disabled:text-primary-500 hover:bg-primary-500 hover:text-white"
              />
            </div>
          </form>
        </div>
      )}

      {!idValue && watch("role") ? (
        <RoleDescriptions role={watch("role")} />
      ) : null}
    </>
  );
}

// Suspense wrapper for InviteMemberWithParams
const InviteMember = () => {
  return (
    <Suspense>
      <InviteMemberWithParams />
    </Suspense>
  );
};

export default InviteMember;
