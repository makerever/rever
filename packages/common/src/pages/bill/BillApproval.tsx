// Component for bill approval

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
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Minus, MoveDown } from "lucide-react";

import type {
  ApprovalListProps,
  ApproverAssignment,
  AssignApproverPayload,
  EnableApprovalProps,
  MemberDataAPIType,
  Option,
} from "@rever/types";

const model_name = "bill";

interface Approver {
  approver: Option | null;
  level?: number;
}

const BillApproval = () => {
  const user = useUserStore((state) => state.user);
  const [isOn, setIsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [membersList, setMembersList] = useState<Option[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([{ approver: null }]);
  const [isApprovalAvailable, setIsApprovalAvailable] = useState(false);

  const [isConfirmRejectPopupOpen, setIsConfirmRejectPopupOpen] =
    useState(false);

  // AUTOSAVE REFS
  const isInitialLoad = useRef(true);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedApprovers = useRef<string>("");
  const shouldAutoSave = useRef(false);

  // FETCH INITIAL DATA
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

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
        lastSavedApprovers.current = JSON.stringify(formatted);
        setIsApprovalAvailable(true);
      } else {
        setApprovers([{ approver: null }]);
        lastSavedApprovers.current = JSON.stringify([{ approver: null }]);
        setIsApprovalAvailable(false);
      }
    } catch (err) {
      showErrorToast("Failed to load approval data");
    } finally {
      setIsLoading(false);

      // Enable autosave AFTER initial load
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 300);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ENABLE / DISABLE APPROVAL WORKFLOW
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
    shouldAutoSave.current = false; // prevent autosave
    if (approvers.length < 5) {
      setApprovers([...approvers, { approver: null }]);
    }
  };

  const handleRemove = (index: number) => {
    shouldAutoSave.current = false; // prevent autosave
    setApprovers(approvers.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: Option | null) => {
    shouldAutoSave.current = true; // allow autosave only for selects

    const updated = [...approvers];
    updated[index].approver = value ?? null;
    setApprovers(updated);
  };

  // AUTOSAVE FUNCTION
  const autoSave = async (currentData: Approver[]) => {
    try {
      const validAssignments: ApproverAssignment[] = currentData
        .filter((v) => v.approver?.value !== undefined)
        .map((v, i) => ({
          approver: v.approver!.value,
          level: i + 1,
        }));

      const dataObj: AssignApproverPayload = {
        model_name,
        assignments: validAssignments,
      };

      const res = await assignApproverApi(dataObj);

      if (res?.status === 200) {
        showSuccessToast("Changes have been autosaved");
        lastSavedApprovers.current = JSON.stringify(currentData);
      } else {
        showErrorToast("An approver can't be assigned to multiple levels.");
      }
    } catch {
      showErrorToast("Failed to auto-save approvers");
    }
  };

  useEffect(() => {
    if (isInitialLoad.current) return;
    if (!shouldAutoSave.current) return;

    const currentSerialized = JSON.stringify(approvers);

    if (currentSerialized === lastSavedApprovers.current) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(() => {
      autoSave(approvers);
      shouldAutoSave.current = false; // reset after autosave
    }, 500);
  }, [approvers]);

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="w-full">
          <div className="w-fit flex items-start justify-between mb-6">
            <ToggleSwitch isOn={isOn} setIsOn={handleToggle} />
            <div className="ms-3 -mt-0.5">
              <p className="font-medium text-sm text-neutral-1100 dark:text-gray-200">
                Enable bill approval workflow
              </p>
              <p className="mt-1 font-medium text-xs text-secondary-700 dark:text-gray-200">
                Allow finance managers to streamline the bill approval process.
              </p>
            </div>
          </div>

          {isOn ? (
            <div className="lg:w-5/12 w-full">
              {approvers.map((item, index) => (
                <div key={index}>
                  <div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs text-secondary-700 font-medium">
                          LEVEL {index + 1}
                        </p>
                        {approvers.length > 1 && !item.level && (
                          <CustomTooltip content="Remove">
                            <IconWrapper
                              onClick={() => handleRemove(index)}
                              icon={
                                <Minus className="text-red-500" width={16} />
                              }
                            />
                          </CustomTooltip>
                        )}
                      </div>
                    </div>

                    <SelectComponent
                      title="Approver"
                      name={`approver_${index}`}
                      options={membersList}
                      value={item.approver}
                      placeholder="Select approver"
                      onChange={(value) => handleChange(index, value)}
                    />
                  </div>
                  <div className="text-secondary-300 flex justify-center my-2">
                    {approvers.length > 1 && !item.level && (
                      <div>
                        <MoveDown width={18} />
                      </div>
                    )}
                  </div>

                  {index === approvers.length - 1 && (
                    <div className="flex items-center justify-between mt-5">
                      <Button
                        onClick={handleAdd}
                        name="Add approver"
                        button_type="secondary"
                        icon_type="plus"
                        disabled={approvers.length >= 5 || !item.approver}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Save button removed */}
            </div>
          ) : (
            <div className="relative w-full mt-4 h-100">
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

export default BillApproval;