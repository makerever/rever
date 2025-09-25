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

const RequestConfirmationModal = ({
  onClose,
  billDetails,
  reqConfirmed,
}: RequestConfirmModalProps) => {
  const [membersList, setMembersList] = useState<Option[]>([]);

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
        <h2 className="text-md text-slate-800 font-semibold overflow-hidden text-ellipsis mr-5 whitespace-pre">
          Request Confirmation - {billDetails?.bill_number}
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4">
        <Label htmlFor="select_user" text="Lite user" />
        <SelectComponent
          placeholder="Select lite user"
          options={membersList}
          value={selectedLiteUser}
          onChange={(e) => setSelectedLiteUser(e)}
        />

        <div className="mt-14 w-full flex justify-end mb-4">
          <div className="w-fit flex">
            <Button
              text="Cancel"
              onClick={onClose}
              disabled={isReqConfirmLoading}
              className="mr-2 bg-white text-primary-500 border border-primary-500 disabled:hover:bg-transparent disabled:text-primary-500 hover:bg-primary-500 hover:text-white"
            />
            <Button
              onClick={requestConfirmation}
              type="submit"
              text="Request"
              className="text-white"
              disabled={!selectedLiteUser || isReqConfirmLoading}
              isLoading={isReqConfirmLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestConfirmationModal;
