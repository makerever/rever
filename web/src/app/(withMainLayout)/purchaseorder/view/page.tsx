// Renders PO view page UI

"use client";

import {
  PageLoader,
  showErrorToast,
  showSuccessToast,
  ViewPODetails,
} from "@rever/common";
import { ConfirmationPopup } from "@rever/common";
import { PurchaseOrder } from "@rever/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState, useCallback } from "react";
import {
  deletePOByIdApi,
  getAssignApprovalApi,
  getPODetailsByIdApi,
  sendPOForApprovalApi,
  updatePOApi,
} from "@rever/services";
import { useBreadcrumbStore } from "@rever/stores";

// Main component to view a PO, fetches PO details and handles actions
const ViewPOWithParams = () => {
  const searchParams = useSearchParams();
  const idValue = searchParams.get("id");

  const router = useRouter();

  const [poDetails, setPODetails] = useState<Partial<PurchaseOrder>>({});

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  // const [fileUrl, setFileUrl] = useState<string>("");
  const [showPdf, setShowPdf] = useState<boolean>(false);

  const setDynamicCrumb = useBreadcrumbStore((s) => s.setDynamicCrumb);

  const [isApproverAvailable, setIsApproverAvailable] =
    useState<boolean>(false);

  const [isConfirmRejectPopupOpen, setIsConfirmRejectPopupOpen] =
    useState<boolean>(false);

  // Fetch approval status for the PO model
  const getApprovalStatus = useCallback(async () => {
    const response = await getAssignApprovalApi("purchaseorder");
    if (response?.status === 200) {
      setIsApproverAvailable(true);
      setIsLoading(false);
    } else {
      setIsApproverAvailable(false);
      setIsLoading(false);
    }
  }, []);

  // Fetch PO details and attachment by ID
  const getPODetailsById = useCallback(
    async (idValue: string) => {
      const response = await getPODetailsByIdApi(idValue);
      if (response?.status === 200) {
        setDynamicCrumb("/purchaseorder/view", {
          id: response?.data?.id,
          name: response?.data?.po_number,
        });
        setPODetails(response?.data);
        // const responseFile = await getBillAttachment(idValue);
        // if (responseFile?.status === 200) {
        //   setFileResponse(responseFile?.data?.results[0]);
        //   setFileUrl(responseFile?.data?.results[0]?.file);
        // }
        getApprovalStatus();
      } else {
        router.push("/purchaseorder/list");
      }
    },
    [getApprovalStatus, router, setDynamicCrumb],
  );

  // On mount, fetch PO details or redirect if no ID
  useEffect(() => {
    if (!idValue) {
      router.push("/purchaseorder/list");
    } else {
      getPODetailsById(idValue);
    }
  }, [getPODetailsById, idValue, router]);

  // Handle PO deletion and its attachment
  const handleDelete = async () => {
    const response = await deletePOByIdApi(idValue || "");
    if (response?.status === 204) {
      setIsPopupOpen(false);
      showSuccessToast("Purchase Order deleted successfully");
      router.push("/purchaseorder/list");
    }
  };

  // Handle PO approval or rejection
  const handlePOApprovalRejection = async () => {
    if (idValue) {
      setIsLoaderFormSubmit(true);
      const poDetails = {
        status: isConfirmRejectPopupOpen ? "rejected" : "approved",
      };
      const response = await updatePOApi(poDetails, idValue);
      if (response?.status === 200) {
        setIsConfirmRejectPopupOpen(false);
        setIsLoaderFormSubmit(false);
        showSuccessToast(
          `PO ${isConfirmRejectPopupOpen ? "rejected" : "approved"} successfully`,
        );
        router.push("/purchaseorder/list");
      } else {
        if (response?.data?.detail) {
          showErrorToast(response?.data?.detail);
        }
        setIsLoaderFormSubmit(false);
      }
    }
  };

  // Handle sending PO for approval
  const handleSendPOApproval = async () => {
    setIsLoaderFormSubmit(true);
    const response = await sendPOForApprovalApi(idValue);
    if (response?.status === 200) {
      setIsLoaderFormSubmit(false);
      showSuccessToast("PO sent for approval");
      router.push("/purchaseorder/list");
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
        {/* Show PO details if not loading */}
        {isLoading ? (
          <PageLoader />
        ) : (
          <div>
            <ViewPODetails
              deletePO={() => setIsPopupOpen(true)}
              poDetails={poDetails}
              fileUrl={""}
              showPdf={showPdf}
              setShowPdf={(val) => setShowPdf(val)}
              isLoaderFormSubmit={isLoaderFormSubmit}
              handleRejectPO={() => setIsConfirmRejectPopupOpen(true)}
              handleApprovePO={handlePOApprovalRejection}
              isApproverAvailable={isApproverAvailable}
              handleSendPOApproval={handleSendPOApproval}
            />
          </div>
        )}
      </div>

      {/* Popup for confirming PO deletion */}
      <ConfirmationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this PO?"
      />

      {/* Popup for confirming bill rejection */}
      <ConfirmationPopup
        isOpen={isConfirmRejectPopupOpen}
        onClose={() => setIsConfirmRejectPopupOpen(false)}
        onConfirm={handlePOApprovalRejection}
        message="Are you sure you want to reject this PO?"
        buttonText="Reject"
      />
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
