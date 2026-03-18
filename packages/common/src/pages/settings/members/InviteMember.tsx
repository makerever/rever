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
import { memberRoleOptions as memberRoleOptionsBase } from "@rever/constants";
import { useTranslate } from "@rever/i18n";
type RoleDescriptionsProps = {
  role: string;
};

function RoleDescriptions({ role }: RoleDescriptionsProps) {
  const translate = useTranslate();
  return (
    <div className="mt-2 w-full px-4">
      <p className="text-xs font-medium text-secondary-700 mb-5">
        {translate('invite_member.about')}
      </p>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5">
        {/* Admin */}
        {role === "admin" ? (
          <div>
            <h3 className="text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleCheck width={14} /> {translate('invite_member.roles.admin.admin_can')}
            </h3>

            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-2">
              <li>
                {translate('invite_member.roles.admin.description1')}
              </li>
              <li className="mt-2">
                  {translate('invite_member.roles.admin.description2')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.admin.description3')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.admin.description4')}
              </li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleX width={14} /> {translate('invite_member.roles.admin.admin_cannot')}
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-1">
              <li>
                {translate('invite_member.roles.admin.description5')}
              </li>
            </ul>
          </div>
        ) : null}

        {/* Member */}
        {role === "member" ? (
          <div>
            <h3 className="text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleCheck width={14} /> {translate('invite_member.roles.member.member_can')}
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-2">
              <li>
                {translate('invite_member.roles.member.description1')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.member.description2')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.member.description3')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.member.description4')}
              </li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleX width={14} /> {translate('invite_member.roles.member.member_cannot')}
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-1">
              <li>
                {translate('invite_member.roles.member.description5')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.member.description6')}
              </li>
            </ul>
          </div>
        ) : null}

        {/* Finance Manager */}
        {role === "finance_manager" ? (
          <div>
            <h3 className="text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleCheck width={14} /> {translate('invite_member.roles.finance_manager.finance_manager_can')}
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-2">
              <li>
                {translate('invite_member.roles.finance_manager.description1')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.finance_manager.description2')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.finance_manager.description3')}
              </li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleX width={14} /> {translate('invite_member.roles.finance_manager.finance_manager_cannot')}
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-1">
              <li>
                {translate('invite_member.roles.finance_manager.description4')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.finance_manager.description5')}
              </li>
            </ul>
          </div>
        ) : null}

        {/* Lite User */}
        {role === "lite_user" ? (
          <div>
            <h3 className="text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleCheck width={14} /> {translate('invite_member.roles.lite_user.lite_user_can')}
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-2">
              <li>
                {translate('invite_member.roles.lite_user.description1')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.lite_user.description2')}
              </li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-neutral-1100 flex items-center gap-1.5">
              <CircleX width={14} /> {translate('invite_member.roles.lite_user.lite_user_cannot')}
            </h3>
            <ul className="font-medium ms-5 text-xs text-neutral-1100 mt-1">
              <li>
                {translate('invite_member.roles.lite_user.description3')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.lite_user.description4')}
              </li>
              <li className="mt-2">
                {translate('invite_member.roles.lite_user.description5')}
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
  const translate = useTranslate();
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
  const memberRoleOptions = memberRoleOptionsBase.map((option)=>{
    return{...option, label:translate('member_role_options.' + option.value)}
  })

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
        showSuccessToast(translate('invite_member.success_message.member_update_success'));
        if (response?.status === 200) {
          setUser(response?.data);
          onClose();
        } else {
          onClose();
        }
      } else {
        if (response?.data?.role && response?.data?.role[0]) {
          setIsLoaderFormSubmit(false);
          showErrorToast(translate('invite_member.error_message.member_update_failed') + " " + response?.data?.role[0]);
        }
      }
    } else {
      // Invite new member
      const response = await inviteUserApi(data);
      if (response?.status === 202) {
        const response = await getLoggedInUserDetails();
        showSuccessToast(translate('invite_member.success_message.invitation_sent'));
        if (response?.status === 200) {
          setUser(response?.data);
          onClose();
        } else {
          onClose();
        }
      } else {
        if (response?.data?.detail) {
          setIsLoaderFormSubmit(false);
          showErrorToast(translate('invite_member.error_message.invitation_failed') + " " + response?.data?.detail);
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
              <Label htmlFor="email" text={translate('placeholders.enter_email')} isRequired />
              <TextInput
                register={register("email")}
                id="email"
                placeholder={translate('placeholders.enter_email')}
                error={errors.email}
                value={getValues("email")}
                disabled={editMemberData ? true : false}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="role" text={translate('profile.role')} isRequired />
              <SelectComponent
                title={translate('invite_member.roles.member_role')}
                name="role"
                isDisabled={false ? true : false}
                register={register}
                trigger={trigger}
                getValues={getValues}
                error={errors.role}
                options={memberRoleOptions}
                placeholder={translate('invite_member.roles.select_role')}
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
