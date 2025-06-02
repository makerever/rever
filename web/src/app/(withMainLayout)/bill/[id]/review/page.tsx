// Renders bill view page UI

"use client";

import {
  Button,
  Label,
  Modal,
  PageLoader,
  showErrorToast,
  showSuccessToast,
  TextAreaInput,
} from "@rever/common";
import { ViewBillDetails } from "@rever/common";
import {
  acceptRejectBillApi,
  getBillAttachment,
  getBillDetailsByIdApi,
  sendBillForApprovalApi,
  updateBillApi,
} from "@rever/services";
import { Bill } from "@rever/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, Suspense, useState, useCallback } from "react";

// Component to fetch and display bill details based on URL params
const ViewBillWithParams = () => {
  const params = useParams();
  const idValue = params.id; // Get userId from route params

  const router = useRouter();

  const [billDetails, setBillDetails] = useState<Partial<Bill>>({});

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfirmRejectPopupOpen, setIsConfirmRejectPopupOpen] =
    useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [showPdf, setShowPdf] = useState<boolean>(false);

  const [confirmBillReject, setConfirmBillReject] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");

  // Fetch bill details by ID, along with attachment
  const getBillDetailsById = useCallback(
    async (idValue: string) => {
      setIsLoading(true);
      const response = await getBillDetailsByIdApi(idValue);
      if (response?.status === 200) {
        setBillDetails(response?.data);

        const responseFile = await getBillAttachment(idValue);
        if (responseFile?.status === 200) {
          setFileUrl(responseFile?.data?.results[0]?.file);
        }

        setIsLoading(false);
      } else {
        router.push("/bill/approvals/list");
      }
    },
    [router],
  );

  // Fetch bill details on mount or when idValue changes
  useEffect(() => {
    if (!idValue) {
      // If no ID, redirect to list page
      router.push("/bill/approvals/list");
    } else {
      setIsLoading(true);
      getBillDetailsById(idValue as string);
    }
  }, [getBillDetailsById, idValue, router]);

  // Approve or reject bill (from popup)
  const handleBillApprovalRejection = async () => {
    if (idValue) {
      setIsLoaderFormSubmit(true);
      const billDetails = {
        status: isConfirmRejectPopupOpen ? "rejected" : "approved",
      };
      const response = await updateBillApi(billDetails, idValue as string);
      if (response?.status === 200) {
        setIsConfirmRejectPopupOpen(false);
        setIsLoaderFormSubmit(false);
        showSuccessToast(
          `Bill ${
            isConfirmRejectPopupOpen ? "rejected" : "approved"
          } successfully`,
        );
        router.push("/bill/approvals/list");
      } else {
        if (response?.data?.detail) {
          showErrorToast(response?.data?.detail);
        }
        setIsLoaderFormSubmit(false);
      }
    }
  };

  // Send bill for approval
  const handleSendBillApproval = async () => {
    setIsLoaderFormSubmit(true);
    const response = await sendBillForApprovalApi(idValue as string);
    if (response?.status === 200) {
      setIsLoaderFormSubmit(false);
      showSuccessToast("Bill sent for approval");
      router.push("/bill/approvals/list");
    } else {
      setIsLoaderFormSubmit(false);
    }
  };

  // Approve bill (for user approval action)
  const handleApprovalAction = async () => {
    setIsLoaderFormSubmit(true);
    const data = {
      action: "approve",
    };
    const response = await acceptRejectBillApi(data, idValue as string);
    if (response?.status === 200) {
      router.push("/bill/approvals/list");
      showSuccessToast("Bill approved successfully");
      setIsLoaderFormSubmit(false);
    } else {
      setIsLoaderFormSubmit(false);
    }
  };

  // Reject bill with reason (from modal)
  const rejectBill = async () => {
    setIsLoaderFormSubmit(true);
    const data = {
      action: "reject",
      comment: rejectReason,
    };
    const response = await acceptRejectBillApi(data, idValue as string);
    if (response?.status === 200) {
      router.push("/bill/approvals/list");
      showSuccessToast("Bill rejected successfully");
      setIsLoaderFormSubmit(false);
    } else {
      setIsLoaderFormSubmit(false);
    }
  };

  return (
    <>
      <div className="flex lg:flex-row gap-4 justify-between flex-col w-full">
        {isLoading ? (
          <PageLoader />
        ) : (
          <div>
            <ViewBillDetails
              deleteBill={() => {}}
              billDetails={billDetails}
              fileUrl={fileUrl}
              showPdf={showPdf}
              setShowPdf={(val) => setShowPdf(val)}
              isLoaderFormSubmit={isLoaderFormSubmit}
              handleRejectBill={() => setIsConfirmRejectPopupOpen(true)}
              handleApproveBill={handleBillApprovalRejection}
              handleSendBillApproval={handleSendBillApproval}
              isUserApproval
              handleApprovalAction={handleApprovalAction}
              handleRejectionAction={() => setConfirmBillReject(true)}
            />
          </div>
        )}
      </div>

      {/* Modal for entering reject reason */}
      <Modal
        title={`Confirm reject bill`}
        isOpen={confirmBillReject}
        onClose={() => {
          setConfirmBillReject(false);
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
              onClick={rejectBill}
              className="text-white bg-red-500 hover:bg-red-600"
            />
            {/* <Button
              text="Cancel"
              onClick={() => setConfirmBillReject(false)}
              disabled={isLoaderFormSubmit}
              className="bg-transparent text-primary-500 border border-primary-500 disabled:hover:bg-transparent disabled:text-primary-500 hover:bg-primary-500 hover:text-white"
            /> */}
          </div>
        </div>
      </Modal>
    </>
  );
};

// Suspense wrapper for async param loading
const ViewApprovalBIll = () => {
  return (
    <Suspense>
      <ViewBillWithParams />
    </Suspense>
  );
};

export default ViewApprovalBIll;
