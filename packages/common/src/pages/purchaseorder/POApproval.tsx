// Component for PO approval

"use client";

import {
  Button,
  ConfirmationPopup,
  CustomTooltip,
  IconWrapper,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";

import type {
  ApprovalListProps,
  ApproverAssignment,
  AssignApproverPayload,
  EnableApprovalProps,
  MemberDataAPIType,
  Option,
} from "@rever/types";

const model_name = "purchaseorder";

interface Approver {
  approver: Option | null;
  level?: number;
}

const POApproval = () => {
  const user = useUserStore((state) => state.user);
  const [isOn, setIsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataSubmitting, setIsDataSubmitting] = useState(false);
  const [isConfirmRejectPopupOpen, setIsConfirmRejectPopupOpen] =
    useState(false);
  const [membersList, setMembersList] = useState<Option[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([{ approver: null }]);
  const [isApprovalAvailable, setIsApprovalAvailable] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch approval status & current approvers in parallel
      const [statusRes, membersRes, approversRes] = await Promise.all([
        getApprovalStatusApi(model_name),
        getMembersListApi(),
        getAssignApprovalApi(model_name),
      ]);

      const approvalEnabled = statusRes?.data?.find(
        (v: EnableApprovalProps) => v.model_name === model_name,
      )?.approval_enabled;

      setIsOn(!!approvalEnabled);

      if (membersRes?.status === 200 && user) {
        const members = membersRes.data
          .filter(
            (member: MemberDataAPIType) =>
              member.first_name &&
              member.role === "finance_manager" &&
              String(member.id) !== user.id,
          )
          .map((v: MemberDataAPIType) => ({
            label: `${v.first_name} ${v.last_name}`,
            value: v.id,
          }));

        setMembersList(members);
      }

      if (approversRes?.status === 200 && approversRes.data.length > 0) {
        const formatted = approversRes.data.map((v: ApprovalListProps) => ({
          approver: { label: v.approver_name, value: v.approver_id },
          level: v.level,
        }));
        setApprovers(formatted);
        setIsApprovalAvailable(true);
      } else {
        setApprovers([{ approver: null }]);
        setIsApprovalAvailable(false);
      }
    } catch (err) {
      console.error("Error fetching initial data", err);
      showErrorToast("Failed to load approval data");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleToggle = async () => {
    try {
      if (isOn) {
        if (isApprovalAvailable) return setIsConfirmRejectPopupOpen(true);
        await handleDisable();
      } else {
        const res = await enableApprovalStatusApi({
          model_name,
          approval_enabled: true,
        });
        if (res?.status === 200) fetchInitialData();
      }
    } catch (err) {
      showErrorToast("Error toggling approval status");
    }
  };

  const handleDisable = async () => {
    try {
      const res = await disableApprovalStatusApi(model_name);
      if (res?.status === 200) {
        setIsConfirmRejectPopupOpen(false);
        fetchInitialData();
      } else {
        showErrorToast(
          res?.data?.detail ||
            "Cannot disable approval; some POs are still under approval.",
        );
      }
    } catch {
      showErrorToast("Failed to disable approval");
    }
  };

  const handleAdd = () => {
    if (approvers.length < 5) {
      setApprovers([...approvers, { approver: null }]);
    }
  };

  const handleRemove = (index: number) => {
    setApprovers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: Option | null) => {
    const updated = [...approvers];
    updated[index].approver = value ?? null;
    setApprovers(updated);
  };

  const getFilteredOptions = (index: number): Option[] => {
    // const selectedValues = approvers
    //   .filter((_, i) => i !== index)
    //   .map((a) => a.approver?.value);

    //       console.log(membersList, "membersList")

    // return membersList.filter(
    //   (option) => selectedValues.includes(option.value),
    // );

    return approvers.map((a) => a.approver).filter(Boolean) as Option[];
  };

  const isAnyApproverMissing = useMemo(() => {
    return approvers.some((a) => !a.approver);
  }, [approvers]);

  const handleSave = async () => {
    try {
      setIsDataSubmitting(true);

      const validAssignments: ApproverAssignment[] = approvers
        .filter(
          (v): v is { approver: { value: string | number } } =>
            v.approver?.value !== undefined,
        )
        .map((v, i) => ({
          approver: v.approver.value,
          level: i + 1,
        }));

      const dataObj: AssignApproverPayload = {
        model_name,
        assignments: validAssignments,
      };

      const response = await assignApproverApi(dataObj);
      if (response?.status === 200) {
        showSuccessToast("Approver assigned successfully");
        fetchInitialData();
      } else {
        showErrorToast("An approver can't be assigned to multiple levels.");
      }
    } catch (err) {
      showErrorToast("Failed to assign approvers");
    } finally {
      setIsDataSubmitting(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="w-full mt-6">
          <div className="lg:w-5/12 w-full flex items-start justify-between mb-4 bg-gray-50 rounded-md p-3">
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

          {isOn ? (
            <div className="lg:w-5/12 w-full">
              <div className="bg-gray-50 p-3 grid lg:grid-cols-2 gap-10">
                <p className="text-xs font-semibold text-slate-600">Approver</p>
                <p className="text-xs font-semibold text-slate-600">Level</p>
              </div>

              {approvers.map((item, index) => (
                <div
                  key={index}
                  className="border-t px-3 py-4 grid lg:grid-cols-2 gap-10 items-center"
                >
                  <SelectComponent
                    title="Approver"
                    name={`approver_${index}`}
                    options={membersList}
                    value={item.approver}
                    placeholder="Select approver"
                    onChange={(value) => handleChange(index, value)}
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">Level {index + 1}</p>
                    <div className="flex items-center gap-2">
                      {approvers.length > 1 && !item.level && (
                        <CustomTooltip content="Remove">
                          <IconWrapper
                            onClick={() => handleRemove(index)}
                            icon={<Minus className="text-red-500" width={16} />}
                          />
                        </CustomTooltip>
                      )}
                      {index === approvers.length - 1 && (
                        <CustomTooltip
                          content={
                            approvers.length >= 5
                              ? "Maximum 5 approvers allowed"
                              : "Add"
                          }
                        >
                          <IconWrapper
                            isDisabled={approvers.length >= 5}
                            onClick={handleAdd}
                            icon={
                              <Plus
                                className={
                                  approvers.length >= 5
                                    ? "text-gray-400"
                                    : "text-green-600"
                                }
                                width={16}
                              />
                            }
                          />
                        </CustomTooltip>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 w-fit gap-3 mt-6">
                <Button
                  text="Save"
                  className="text-white disabled:bg-primary-400 hover:disabled:bg-primary-400"
                  onClick={handleSave}
                  disabled={isAnyApproverMissing || isDataSubmitting}
                  isLoading={isDataSubmitting}
                />
              </div>
            </div>
          ) : (
            <div className="relative w-full mt-4 h-[400px]">
              <Image
                alt="PO Approval Flow"
                src="/images/flowImages/poApprovalFlow.svg"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>
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
