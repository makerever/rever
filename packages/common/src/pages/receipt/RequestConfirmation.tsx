// Modal UI for request confirmation froma  lite user

"use client";

import {
  MemberDataAPIType,
  Option,
  RequestConfirmModalProps,
} from "@rever/types";
import { X } from "lucide-react";
import {
  Button,
  Label,
  SelectComponent,
  showSuccessToast,
} from "@rever/common";
import { useCallback, useEffect, useState } from "react";
import { getMembersListApi, requestConfirmationApi } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { useTranslate } from "@rever/i18n";
const RequestConfirmationModal = ({
  onClose,
  billDetails,
  reqConfirmed,
}: RequestConfirmModalProps) => {
  const [membersList, setMembersList] = useState<Option[]>([]);
  const translate = useTranslate();

  const [isReqConfirmLoading, setIsReqConfirmLoading] =
    useState<boolean>(false);
  const [selectedLiteUser, setSelectedLiteUser] = useState<Option | null>(null);

  const getMembersList = useCallback(async () => {
    const membersRes = await getMembersListApi();
    if (membersRes?.status === 200) {
      const members = membersRes.data
        .filter(
          (member: MemberDataAPIType) =>
            member.first_name && member.role === "lite_user",
        )
        .map((v: MemberDataAPIType) => ({
          label: `${v.first_name} ${v.last_name}`,
          value: v.id,
        }));

      setMembersList(members);
    }
  }, []);

  useEffect(() => {
    getMembersList();
  }, []);

  const requestConfirmation = async () => {
    setIsReqConfirmLoading(true);
    let data = {
      assignee_id: selectedLiteUser?.value || "",
    };
    const response = await requestConfirmationApi(
      String(billDetails?.id),
      data,
    );

    if (response?.status === 200) {
      showSuccessToast("Request sent successfully");
      setIsReqConfirmLoading(false);
      reqConfirmed();
    }
  };

  return (
    <>
      <div className="p-4 border-b flex justify-between items-center mb-4">
        <h2 className="text-xl text-neutral-1100 font-semibold overflow-hidden text-ellipsis mr-5 whitespace-pre">
          Request Confirmation
          {/* - {billDetails?.bill_number} */}
        </h2>
        <button
          onClick={onClose}
          className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-4">
        <Label htmlFor="select_user" text={translate('invite_member.roles.lite_user.heading')} />
        <SelectComponent
          placeholder={translate('invite_member.roles.lite_user.select_lite_user')}
          options={membersList}
          value={selectedLiteUser}
          onChange={(e) => setSelectedLiteUser(e)}
        />

        <div className="mt-14 w-full flex justify-end mb-4 gap-3">
          <Button
            name="Cancel"
            onClick={onClose}
            disabled={isReqConfirmLoading}
            button_type="primary-outline"
          />

          <Button
            type="submit"
            name="Request"
            onClick={requestConfirmation}
            disabled={!selectedLiteUser || isReqConfirmLoading}
            button_type="primary"
            icon_type={isReqConfirmLoading ? "loader" : null}
          />
        </div>
      </div>
    </>
  );
};

export default RequestConfirmationModal;
