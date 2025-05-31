// Page to show approvals UI

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  assignApproverApi,
  disableApprovalStatusApi,
  enableApprovalStatusApi,
  getApprovalStatusApi,
  getAssignApprovalApi,
  getMembersListApi,
} from "@rever/services";
import { useUserStore } from "@rever/stores";
import { EnableApprovalProps, MemberDataAPIType, Option } from "@rever/types";
import { addApproverSchema } from "@rever/validations";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Form data interface for approver selection
interface ApprovalFormData {
  approver: string;
}

// Main Approvals component
function Approvals() {
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
    const response = await getAssignApprovalApi();
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
        model_name: "bill",
        approval_enabled: true,
      });
      if (response?.status === 200) {
        getApprovalStatus();
      }
    }
  };

  // Fetch approval status for "bill" model
  const getApprovalStatus = async () => {
    const response = await getApprovalStatusApi();
    if (response?.status === 200) {
      if (response?.data && response?.data?.length) {
        const filterItem = response?.data?.find(
          (v: EnableApprovalProps) => v.model_name === "bill",
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
    const response = await assignApproverApi({ ...data, model_name: "bill" });
    if (response?.status === 200 && response?.data?.detail) {
      showSuccessToast(response?.data?.detail);
      getAssignApproval();
    }
  };

  const handleDisable = async () => {
    const response = await disableApprovalStatusApi();
    if (response?.status === 200) {
      setIsConfirmRejectPopupOpen(false);
      setValue("approver", "");
      getApprovalStatus();
    } else {
      if (response?.data?.detail) {
        showErrorToast(
          "Cannot disable approval, some bills are still under approval.",
        );
      }
    }
  };

  return (
    <>
      {/* Page heading */}
      <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
        Bill approval
      </p>

      {/* Show content only when not loading */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="w-80">
            {/* Toggle switch for enabling/disabling approval */}
            <div className="flex items-center justify-start gap-2 mb-4">
              <ToggleSwitch isOn={isOn} setIsOn={handleToggle} />
              <p className="text-sm">Add approver</p>
            </div>
            {/* Show form only if approval is enabled */}
            {isOn && (
              <form
                onSubmit={handleSubmit(handleApproval)}
                className="flex flex-col gap-4"
              >
                <div>
                  {/* Approver selection dropdown */}
                  <Label htmlFor="approver" text="Approver" isRequired />
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
                {/* Save button */}
                <div className="grid grid-cols-2 w-fit gap-3">
                  <Button type="submit" text="Save" className="text-white" />
                </div>
              </form>
            )}
          </div>
        </>
      )}

      <ConfirmationPopup
        title="Confirmation"
        isOpen={isConfirmRejectPopupOpen}
        onClose={() => setIsConfirmRejectPopupOpen(false)}
        onConfirm={handleDisable}
        buttonText="Disable"
        message="Disabling this may impact bills under approval, if any"
      />
    </>
  );
}

export default Approvals;
