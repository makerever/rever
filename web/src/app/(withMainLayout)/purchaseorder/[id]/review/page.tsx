// Renders PO view page UI

"use client";

import {
  Button,
  Label,
  Modal,
  PageLoader,
  showSuccessToast,
  TextAreaInput,
  ViewPODetails,
} from "@rever/common";
import { PurchaseOrder } from "@rever/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, Suspense, useState, useCallback } from "react";
import { acceptRejectPOApi, getPODetailsByIdApi } from "@rever/services";

// Main component to view a PO, fetches PO details and handles actions
const ViewPOWithParams = () => {
  const params = useParams();
  const idValue = params.id; // Get userId from route params

  const router = useRouter();

  const [poDetails, setPODetails] = useState<Partial<PurchaseOrder>>({});

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [confirmPOReject, setConfirmPOReject] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");

  // Fetch PO details and attachment by ID
  const getPODetailsById = useCallback(
    async (idValue: string) => {
      const response = await getPODetailsByIdApi(idValue);
      if (response?.status === 200) {
        setPODetails(response?.data);
        setIsLoading(false);
      } else {
        router.push("/approvals/list/review");
      }
    },
    [router],
  );

  // On mount, fetch PO details or redirect if no ID
  useEffect(() => {
    if (!idValue) {
      router.push("/approvals/list/review");
    } else {
      getPODetailsById(idValue as string);
    }
  }, [getPODetailsById, idValue, router]);

  // Approve PO (for user approval action)
  const handleApprovalAction = async () => {
    setIsLoaderFormSubmit(true);
    const data = {
      action: "approve",
    };
    const response = await acceptRejectPOApi(data, idValue as string);
    if (response?.status === 200) {
      router.push("/approvals/list/review");
      showSuccessToast("PO approved successfully");
      setIsLoaderFormSubmit(false);
    } else {
      setIsLoaderFormSubmit(false);
    }
  };

  // Reject po with reason (from modal)
  const rejectPO = async () => {
    setIsLoaderFormSubmit(true);
    const data = {
      action: "reject",
      comment: rejectReason,
    };
    const response = await acceptRejectPOApi(data, idValue as string);
    if (response?.status === 200) {
      router.push("/approvals/list/review");
      showSuccessToast("PO rejected successfully");
      setIsLoaderFormSubmit(false);
    } else {
      setIsLoaderFormSubmit(false);
    }
  };

  return (
    <>
      <div className="flex lg:flex-row gap-4 justify-between flex-col w-full">
        {/* Show PO details if not loading */}
        {isLoading ? (
          <PageLoader />
        ) : (
          <div>
            <ViewPODetails
              showPdf={false}
              setShowPdf={() => {}}
              deletePO={() => {}}
              poDetails={poDetails}
              isLoaderFormSubmit={isLoaderFormSubmit}
              handleApprovalAction={handleApprovalAction}
              handleRejectionAction={() => setConfirmPOReject(true)}
              isUserApproval
            />
          </div>
        )}
      </div>
      {/* Modal for entering reject reason */}
      <Modal
        title={`Confirm reject PO`}
        isOpen={confirmPOReject}
        onClose={() => {
          setConfirmPOReject(false);
        }}
      >
        <div className="mt-8">
          <Label text="Reject reason" htmlFor="rejectInput" />
          <TextAreaInput
            onChange={(e) => setRejectReason(e.target.value)}
            id="rejectInput"
          />
          <div className="flex justify-end items-center gap-3 w-fit mt-3">
            <Button
              disabled={isLoaderFormSubmit}
              text="Reject"
              onClick={rejectPO}
              className="text-white bg-red-500 hover:bg-red-600"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

// Suspense wrapper for the main PO view component
const ViewPO = () => {
  return (
    <Suspense>
      <ViewPOWithParams />
    </Suspense>
  );
};

export default ViewPO;
