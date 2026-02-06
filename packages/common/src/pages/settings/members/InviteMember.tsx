// Modal UI for request confirmation froma  lite user

"use client";

import { InviteMemberProps } from "@rever/types";
import { CircleCheck, CircleX, X } from "lucide-react";
import {
  Button,
  Label,
  SelectComponent,
  showErrorToast,
  showSuccessToast,
  TextInput,
} from "@rever/common";
import { useEffect, useState } from "react";
import {
  getLoggedInUserDetails,
  inviteUserApi,
  updateMemberApi,
} from "@rever/services";
import { useUserStore } from "@rever/stores";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createInviteMemberSchema,
  inviteMemberSchemaValues,
} from "@rever/validations";
import { memberRoleOptions } from "@rever/constants";

type RoleDescriptionsProps = {
  role: string;
};

function RoleDescriptions({ role }: RoleDescriptionsProps) {
  return (
    <div className="mt-2 w-full px-4">
      <p className="text-xs font-medium text-secondary-700 mb-5">
        Rever ensures secure, role-based access to streamline your accounts
        payable process by maintaining clear responsibilities and preventing
        conflicts in financial workflows.
      </p>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5">
        {/* Admin */}
        {role === "admin" ? (
          <div>
            <h3 className="text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleCheck width={14} /> Admin can:
            </h3>

            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-2">
              <li>
                - Access the dashboard to view insights on total bills that are
                approved, under review, and awaiting approval.
              </li>
              <li className="mt-2">
                - Manage vendor information and supervise the end-to-end bill
                workflow.
              </li>
              <li className="mt-2">
                - Set up and manage approval workflows and organizational
                configurations.
              </li>
              <li className="mt-2">
                - Configure approval rules and organization settings.
              </li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleX width={14} /> Admin cannot:
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-1">
              <li>
                - Approve a bill as an approver, but can re-assign the approver.
              </li>
            </ul>
          </div>
        ) : null}

        {/* Member */}
        {role === "member" ? (
          <div>
            <h3 className="text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleCheck width={14} /> Member can:
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-2">
              <li>
                - Access the dashboard to view insights on total bills that are
                approved, reviewed, and awaiting approval.
              </li>
              <li className="mt-2">- Create and maintain vendor profiles.</li>
              <li className="mt-2">
                - Create, modify, delete, and submit bills, enabling end-to-end
                management of the bill lifecycle.
              </li>
              <li className="mt-2">
                - Can view team members and organizational details to remain
                informed about the company's structure and hierarchy.
              </li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleX width={14} /> Member cannot:
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-1">
              <li>
                - Approve actions to maintain the integrity and independence of
                the approval process.
              </li>
              <li className="mt-2">
                - Invite members or modify approval settings, keeping the role
                focused within its operational boundaries.
              </li>
            </ul>
          </div>
        ) : null}

        {/* Finance Manager */}
        {role === "finance_manager" ? (
          <div>
            <h3 className="text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleCheck width={14} /> Finance Manager can:
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-2">
              <li>
                - Access dashboard showing insights on total bills that are
                approved, reviewed, and awaiting approval.
              </li>
              <li className="mt-2">
                - Review, approve, or reject bills, reinforcing financial
                oversight and decision-making authority.
              </li>
              <li className="mt-2">
                - Has visibility into vendor, member, and organization details
                to make informed and accurate approval decisions.
              </li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleX width={14} /> Finance Manager cannot:
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-1">
              <li>
                - Create or modify vendors or bills, ensuring the role remains
                solely focused on review and approval responsibilities.
              </li>
              <li className="mt-2">
                - Access to user management and organizational settings is
                restricted to uphold segregation of duties and ensure
                compliance.
              </li>
            </ul>
          </div>
        ) : null}

        {/* Lite User */}
        {role === "lite_user" ? (
          <div>
            <h3 className="text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleCheck width={14} /> LITE User can:
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-2">
              <li>
                - Confirm Request Receipt Confirmations, serving as an
                acknowledgment that a bill or invoice has been received by the
                relevant department or stakeholder.
              </li>
              <li className="mt-2">
                - View the specific documents or transactions assigned to them
                for confirmation, ensuring transparency in the receipt
                lifecycle.
              </li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleX width={14} /> LITE User cannot:
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-1">
              <li>
                - Create, review, approve, or reject bills to ensure this role
                is limited to acknowledgment duties only.
              </li>
              <li className="mt-2">
                - Access financial dashboards, advanced reports, or
                decision-making tools.
              </li>
              <li className="mt-2">
                - Access or manage vendors, users, or organizational settings to
                preserve strict data governance and minimize risk exposure.
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const InviteMember = ({ onClose, editMemberData }: InviteMemberProps) => {
  const userDetails = useUserStore((state) => state.user);
  const domain = userDetails?.email?.split("@")[1];

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(createInviteMemberSchema(domain ?? "")),
    mode: "onChange",
  });

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);

  const setUser = useUserStore((state) => state.setUser);

  // Disable Save button if required fields are missing or submitting
  const isBtnDisabled = isLoaderFormSubmit;

  useEffect(() => {
    if (editMemberData) {
      setValue("email", editMemberData.email);
      setValue("role", editMemberData.role);
    }
  }, [editMemberData]);

  // Handle form submission for inviting or updating a member
  const handleInviteMember = async (data: inviteMemberSchemaValues) => {
    setIsLoaderFormSubmit(true);

    if (editMemberData) {
      // Update existing member
      const response = await updateMemberApi(data, String(editMemberData.id));
      if (response?.status === 200) {
        const response = await getLoggedInUserDetails();
        showSuccessToast("Member updated successfully");
        if (response?.status === 200) {
          setUser(response?.data);
          onClose();
        } else {
          onClose();
        }
      } else {
        if (response?.data?.role && response?.data?.role[0]) {
          setIsLoaderFormSubmit(false);
          showErrorToast("Cannot change role — User has pending approvals.");
        }
      }
    } else {
      // Invite new member
      const response = await inviteUserApi(data);
      if (response?.status === 202) {
        const response = await getLoggedInUserDetails();
        showSuccessToast("Invitation request sent");
        if (response?.status === 200) {
          setUser(response?.data);
          onClose();
        } else {
          onClose();
        }
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
      <div className="p-4 border-b flex justify-between items-center mb-4">
        <h2 className="text-xl text-neutral-1100 font-semibold overflow-hidden text-ellipsis mr-5 whitespace-pre">
          {editMemberData
            ? `Edit ${editMemberData.first_name} ${editMemberData.last_name}`
            : "Invite member"}
        </h2>
        <button
          onClick={onClose}
          className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
        >
          <X size={16} />
        </button>
      </div>

      <div>
        <form onSubmit={handleSubmit(handleInviteMember)}>
          {/* Show name fields only in edit mode */}

          {/* Email and role fields */}
          <div className="px-4">
            <div>
              <Label htmlFor="email" text="Enter email address" isRequired />
              <TextInput
                register={register("email")}
                id="email"
                placeholder="Enter email"
                error={errors.email}
                value={getValues("email")}
                disabled={editMemberData ? true : false}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="role" text="Role" isRequired />
              <SelectComponent
                title="Member Role"
                name="role"
                isDisabled={false ? true : false}
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

          {watch("role") ? <RoleDescriptions role={watch("role")} /> : null}

          <div className="px-4 mt-5 w-full flex justify-end mb-4 gap-3">
            <Button
              name="Cancel"
              onClick={onClose}
              disabled={isBtnDisabled}
              button_type="secondary-outline"
            />

            <Button
              type="submit"
              name={editMemberData ? "Save changes" : "Send invite"}
              disabled={isBtnDisabled}
              button_type="primary"
              icon_type={isLoaderFormSubmit ? "loader" : null}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default InviteMember;
