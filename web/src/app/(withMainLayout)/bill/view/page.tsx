// Renders bill view page UI

"use client";

import {
  PageLoader,
  showErrorToast,
  showSuccessToast,
  ViewBillDetails,
} from "@rever/common";
import { ConfirmationPopup } from "@rever/common";
import {
  deleteBillAttachment,
  deleteBillByIdApi,
  getApprovalStatusApi,
  getBillAttachment,
  getBillDetailsByIdApi,
  sendBillForApprovalApi,
  updateBillApi,
} from "@rever/services";
import { AttachmentProps, Bill, EnableApprovalProps } from "@rever/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState, useCallback } from "react";

// Main component to view a bill, fetches bill details and handles actions
const ViewBillWithParams = () => {
  const searchParams = useSearchParams();
  const idValue = searchParams.get("id");

  const router = useRouter();

  const [billDetails, setBillDetails] = useState<Partial<Bill>>({});

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isConfirmRejectPopupOpen, setIsConfirmRejectPopupOpen] =
    useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [showPdf, setShowPdf] = useState<boolean>(false);

  const [fileResponse, setFileResponse] = useState<AttachmentProps>({});

  const [isApproverAvailable, setIsApproverAvailable] =
    useState<boolean>(false);

  // Fetch approval status for the bill model
  const getApprovalStatus = useCallback(async () => {
    const response = await getApprovalStatusApi();
    if (response?.status === 200) {
      if (response?.data?.length) {
        const filterItem = response?.data?.find(
          (v: EnableApprovalProps) => v.model_name === "bill",
        );
        setIsApproverAvailable(filterItem?.approval_enabled);
      } else {
        setIsApproverAvailable(false);
      }
    } else {
      setIsApproverAvailable(false);
    }
    setIsLoading(false);
  }, []);

  // Fetch bill details and attachment by ID
  const getBillDetailsById = useCallback(
    async (idValue: string) => {
      const response = await getBillDetailsByIdApi(idValue);
      if (response?.status === 200) {
        setBillDetails(response?.data);
        const responseFile = await getBillAttachment(idValue);
        if (responseFile?.status === 200) {
          setFileResponse(responseFile?.data?.results[0]);
          setFileUrl(responseFile?.data?.results[0]?.file);
        }
        getApprovalStatus();
      } else {
        router.push("/bill/list");
      }
    },
    [getApprovalStatus, router],
  );

  // On mount, fetch bill details or redirect if no ID
  useEffect(() => {
    if (!idValue) {
      router.push("/bill/list");
    } else {
      setIsLoading(true);
      getBillDetailsById(idValue);
    }
  }, [getBillDetailsById, idValue, router]);

  // Handle bill deletion and its attachment
  const handleDelete = async () => {
    const response = await deleteBillByIdApi(idValue || "");
    if (response?.status === 204) {
      if (fileResponse?.id) {
        await deleteBillAttachment(fileResponse?.id || "");
      }
      setIsPopupOpen(false);
      showSuccessToast("Bill deleted successfully");
      router.push("/bill/list");
    }
  };

  // Handle bill approval or rejection
  const handleBillApprovalRejection = async () => {
    if (idValue) {
      setIsLoaderFormSubmit(true);
      const billDetails = {
        status: isConfirmRejectPopupOpen ? "rejected" : "approved",
      };
      const response = await updateBillApi(billDetails, idValue);
      if (response?.status === 200) {
        setIsConfirmRejectPopupOpen(false);
        setIsLoaderFormSubmit(false);
        showSuccessToast(
          `Bill ${
            isConfirmRejectPopupOpen ? "rejected" : "approved"
          } successfully`,
        );
        router.push("/bill/list");
      } else {
        if (response?.data?.detail) {
          showErrorToast(response?.data?.detail);
        }
        setIsLoaderFormSubmit(false);
      }
    }
  };

  // Handle sending bill for approval
  const handleSendBillApproval = async () => {
    setIsLoaderFormSubmit(true);
    const response = await sendBillForApprovalApi(idValue);
    if (response?.status === 200) {
      setIsLoaderFormSubmit(false);
      showSuccessToast("Bill sent for approval");
      router.push("/bill/list");
    } else {
      setIsLoaderFormSubmit(false);
      if (response?.data?.detail) {
        showErrorToast(response?.data?.detail);
      }
    }
  };

  return (
    <>
      <div className="flex lg:flex-row gap-4 justify-between flex-col w-full">
        {/* Show bill details if not loading */}
        {isLoading ? (
          <PageLoader />
        ) : (
          <div>
            <ViewBillDetails
              deleteBill={() => setIsPopupOpen(true)}
              billDetails={billDetails}
              fileUrl={fileUrl}
              showPdf={showPdf}
              setShowPdf={(val) => setShowPdf(val)}
              isLoaderFormSubmit={isLoaderFormSubmit}
              handleRejectBill={() => setIsConfirmRejectPopupOpen(true)}
              handleApproveBill={handleBillApprovalRejection}
              isApproverAvailable={isApproverAvailable}
              handleSendBillApproval={handleSendBillApproval}
            />
          </div>
        )}
      </div>

      {/* Popup for confirming bill deletion */}
      <ConfirmationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this bill?"
      />

      {/* Popup for confirming bill rejection */}
      <ConfirmationPopup
        isOpen={isConfirmRejectPopupOpen}
        onClose={() => setIsConfirmRejectPopupOpen(false)}
        onConfirm={handleBillApprovalRejection}
        message="Are you sure you want to reject this bill?"
      />
    </>
  );
};

// Suspense wrapper for the main bill view component
const ViewBIll = () => {
  return (
    <Suspense>
      <ViewBillWithParams />
    </Suspense>
  );
};

export default ViewBIll;
