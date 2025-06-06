// Component for PO approval

"use client";

import {
  Button,
  ConfirmationPopup,
  Label,
  PageLoader,
  SelectComponent,
  showErrorToast,
  showSuccessToast,
  ToggleSwitch,
} from "@rever/common";
import { addApproverSchema } from "@rever/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserStore } from "@rever/stores";
import { EnableApprovalProps, MemberDataAPIType, Option } from "@rever/types";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  assignApproverApi,
  disableApprovalStatusApi,
  enableApprovalStatusApi,
  getApprovalStatusApi,
  getAssignApprovalApi,
  getMembersListApi,
} from "@rever/services";
import Image from "next/image";

// Form data interface for approver selection
interface ApprovalFormData {
  approver: string;
}

const model_name = "purchaseorder";

const POApproval = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    getValues,
  } = useForm({
    resolver: zodResolver(addApproverSchema),
    mode: "onChange",
  });

  const [isOn, setIsOn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfirmRejectPopupOpen, setIsConfirmRejectPopupOpen] =
    useState<boolean>(false);
  const [isApprovalAvailable, setIsApprovalAvailable] =
    useState<boolean>(false);

  // Get current user from store
  const user = useUserStore((state) => state.user);

  const [membersList, setMembersList] = useState<Option[]>([]);

  // On mount, fetch approval status
  useEffect(() => {
    getApprovalStatus();
  }, []);

  // Fetch currently assigned approver
  const getAssignApproval = useCallback(async () => {
    const response = await getAssignApprovalApi(model_name);
    if (response?.status === 200) {
      setValue("approver", response?.data?.approver_id);
      if (response?.data?.approver_id) {
        setIsApprovalAvailable(true);
      }
      setIsLoading(false);
    } else {
      setIsApprovalAvailable(false);
      setIsLoading(false);
    }
  }, [setValue]);

  // Fetch list of finance managers (excluding current user)
  const getMembersList = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      const response = await getMembersListApi();
      if (response?.status === 200) {
        const allData = response?.data
          ?.filter(
            (v: MemberDataAPIType) =>
              v?.first_name && v?.role === "finance_manager",
          )
          ?.filter((v: MemberDataAPIType) => String(v.id) !== user?.id)
          ?.map((v: MemberDataAPIType) => ({
            label: `${v?.first_name} ${v?.last_name}`,
            value: v?.id,
          }));
        setMembersList(allData);
        getAssignApproval(); // safe now because it's memoized
      } else {
        setIsLoading(false);
      }
    }
  }, [user, getAssignApproval]);

  // When user changes, fetch members list
  useEffect(() => {
    getMembersList();
  }, [getMembersList, user]);

  // Handle toggle switch for enabling/disabling approval
  const handleToggle = async () => {
    if (isOn) {
      if (isApprovalAvailable) {
        setIsConfirmRejectPopupOpen(true);
      } else {
        handleDisable();
      }
    } else {
      // Enable approval
      const response = await enableApprovalStatusApi({
        model_name: model_name,
        approval_enabled: true,
      });
      if (response?.status === 200) {
        getApprovalStatus();
      }
    }
  };

  // Fetch approval status for po model
  const getApprovalStatus = async () => {
    const response = await getApprovalStatusApi(model_name);
    if (response?.status === 200) {
      if (response?.data && response?.data?.length) {
        const filterItem = response?.data?.find(
          (v: EnableApprovalProps) => v.model_name === model_name,
        );
        setIsOn(filterItem?.approval_enabled);
      } else {
        setIsOn(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  // Handle form submit to assign approver
  const handleApproval = async (data: ApprovalFormData) => {
    const response = await assignApproverApi({
      ...data,
      model_name: model_name,
    });
    if (response?.status === 200 && response?.data?.detail) {
      showSuccessToast(response?.data?.detail);
      getAssignApproval();
    }
  };

  const handleDisable = async () => {
    const response = await disableApprovalStatusApi(model_name);
    if (response?.status === 200) {
      setIsConfirmRejectPopupOpen(false);
      setValue("approver", "");
      getApprovalStatus();
    } else {
      if (response?.data?.detail) {
        showErrorToast(
          "Cannot disable approval, some PO's are still under approval.",
        );
      }
    }
  };

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="lg:w-5/12 w-full mt-6">
            <div className="flex items-start justify-between mb-4 bg-gray-100 rounded-md p-3">
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-gray-200">
                  Add approver
                </p>
                <p className="mt-1 font-light text-xs text-slate-500 dark:text-gray-200">
                  Set up approvers to manage and streamline your purchase order
                  approvals.
                </p>
              </div>
              <ToggleSwitch isOn={isOn} setIsOn={handleToggle} />
            </div>
            {/* Show form only if approval is enabled */}
            {isOn && (
              <>
                <div className="bg-gray-50 p-3 grid lg:grid-cols-2 md:grid-cols-2 gap-10">
                  <p className="text-xs text-slate-600 font-semibold">
                    Approver
                  </p>
                  <p className="text-xs text-slate-600 font-semibold">Level</p>
                </div>

                <form onSubmit={handleSubmit(handleApproval)}>
                  <div className="border-t px-3 py-4 grid lg:grid-cols-2 md:grid-cols-2 gap-10 items-center">
                    <div>
                      <SelectComponent
                        title="Approver"
                        name="approver"
                        register={register}
                        trigger={trigger}
                        getValues={getValues}
                        error={errors.approver}
                        options={membersList}
                        placeholder="Select approver"
                        // isClearable={true}
                      />
                    </div>

                    <p className="text-xs text-slate-600">Level 1</p>
                  </div>

                  <div className="grid grid-cols-2 w-fit gap-3 mt-6">
                    <Button type="submit" text="Save" className="text-white" />
                  </div>
                </form>
              </>
            )}
          </div>

          {!isOn ? (
            <div className="relative w-full mt-4 h-[400px] mt-8">
              <Image
                alt="Table data not found"
                src="/images/flowImages/poApprovalFlow.svg"
                fill
                className="object-contain"
              />
            </div>
          ) : null}
        </>
      )}

      <ConfirmationPopup
        title="Confirmation"
        isOpen={isConfirmRejectPopupOpen}
        onClose={() => setIsConfirmRejectPopupOpen(false)}
        onConfirm={handleDisable}
        buttonText="Disable"
        message="Disabling this may impact PO under approval, if any"
      />
    </>
  );
};

export default POApproval;
