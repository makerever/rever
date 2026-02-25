// Renders vendor credit view page UI

"use client";

import {
  PageLoader,
  showErrorToast,
  showSuccessToast,
  ViewVendorCreditDetails,
} from "@rever/common";
import { ConfirmationPopup } from "@rever/common";
import {
  deleteVendorCreditAttachment,
  deleteVendorCreditByIdApi,
  getAssignApprovalApi,
  getVendorCreditAttachment,
  getVendorCreditDetailsByIdApi,
  sendVendorCreditForApprovalApi,
  updateVendorCreditApi,
} from "@rever/services";
import { useBreadcrumbStore } from "@rever/stores";
import { AttachmentProps, VendorCreditProps } from "@rever/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState, useCallback } from "react";

// Main component to view a vendor credit, fetches vendor credit details and handles actions
const ViewVendorCreditWithParams = () => {
  const searchParams = useSearchParams();
  const idValue = searchParams.get("id");

  const router = useRouter();

  const [vendorCreditDetails, setvendorCreditDetails] = useState<
    Partial<VendorCreditProps>
  >({});

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isConfirmRejectPopupOpen, setIsConfirmRejectPopupOpen] =
    useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [showPdf, setShowPdf] = useState<boolean>(false);

  const [fileResponse, setFileResponse] = useState<AttachmentProps>({});

  const [isApproverAvailable, setIsApproverAvailable] =
    useState<boolean>(false);

  const setDynamicCrumb = useBreadcrumbStore((s) => s.setDynamicCrumb);

  // Fetch approval status for the vendor credit model
  const getApprovalStatus = useCallback(async () => {
    const response = await getAssignApprovalApi("vendorcredit");
    if (response?.status === 200) {
      setIsApproverAvailable(true);
      setIsLoading(false);
    } else {
      setIsApproverAvailable(false);
      setIsLoading(false);
    }
  }, []);

  // Fetch vendor credit details and attachment by ID
  const getvendorCreditDetailsById = useCallback(
    async (idValue: string) => {
      const response = await getVendorCreditDetailsByIdApi(idValue);

      if (response?.status === 200) {
        setDynamicCrumb("/vendorcredit/view", {
          id: response?.data?.id,
          name: response?.data?.credit_note_number || "--",
        });
        setvendorCreditDetails(response?.data);
        const responseFile = await getVendorCreditAttachment(idValue);
        if (responseFile?.status === 200) {
          setFileResponse(responseFile?.data?.results[0]);
          setFileUrl(responseFile?.data?.results[0]?.file);
        }
        getApprovalStatus();
      } else {
        router.push("/vendorcredit/list");
      }
    },
    [getApprovalStatus, router, setDynamicCrumb],
  );

  // On mount, fetch vendor credit details or redirect if no ID
  useEffect(() => {
    if (!idValue) {
      router.push("/vendorcredit/list");
    } else {
      getvendorCreditDetailsById(idValue);
    }
  }, [getvendorCreditDetailsById, idValue, router]);

  // Handle vendor credit deletion and its attachment
  const handleDelete = async () => {
    const response = await deleteVendorCreditByIdApi(idValue || "");
    if (response?.status === 204) {
      if (fileResponse?.id) {
        await deleteVendorCreditAttachment(fileResponse?.id || "");
      }
      setIsPopupOpen(false);
      showSuccessToast("Vendor credit deleted successfully");
      router.push("/vendorcredit/list");
    }
  };

  // Handle vendor credit approval or rejection
  const handleVendorCreditApprovalRejection = async () => {
    if (!idValue) return;

    if (isConfirmRejectPopupOpen) {
      const response = await updateVendorCreditApi(
        { status: "rejected" },
        idValue,
      );
      if (response?.status === 200) {
        setIsConfirmRejectPopupOpen(false);
        showSuccessToast("Vendor credit rejected successfully");
        router.push("/vendorcredit/list");
      } else if (response?.data?.detail) {
        showErrorToast(response.data.detail);
      }
    } else {
      setIsLoaderFormSubmit(true);
      const response = await updateVendorCreditApi(
        { status: "approved" },
        idValue,
      );
      if (response?.status === 200) {
        showSuccessToast("Vendor credit approved successfully");
        router.push("/vendorcredit/list");
      } else if (response?.data?.detail) {
        showErrorToast(response.data.detail);
      }
    }
  };

  // Handle sending vendor credit for approval
  const handleSendVendorCreditApproval = async () => {
    if (idValue) {
      setIsLoaderFormSubmit(true);

      const response = await sendVendorCreditForApprovalApi(idValue);
      if (response?.status === 200) {
        showSuccessToast("Vendor credit sent for approval");
        router.push("/vendorcredit/list");
      } else {
        setIsLoaderFormSubmit(false);
        if (response?.data?.detail) {
          showErrorToast(response?.data?.detail);
        }
      }
    }
  };

  return (
    <>
      <div className="flex lg:flex-row gap-4 justify-between flex-col w-full">
        {/* Show vendor credit details if not loading */}
        {isLoading ? (
          <PageLoader />
        ) : (
          <div>
            <ViewVendorCreditDetails
              deleteVendorCredit={() => setIsPopupOpen(true)}
              vendorCreditDetails={vendorCreditDetails}
              fileUrl={fileUrl}
              showPdf={showPdf}
              setShowPdf={(val) => setShowPdf(val)}
              isLoaderFormSubmit={isLoaderFormSubmit}
              handleRejectVendorCredit={() => setIsConfirmRejectPopupOpen(true)}
              handleApproveVendorCredit={handleVendorCreditApprovalRejection}
              isApproverAvailable={isApproverAvailable}
              handleSendVendorCreditApproval={handleSendVendorCreditApproval}
            />
          </div>
        )}
      </div>

      {/* Popup for confirming vendor credit deletion */}
      <ConfirmationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this vendor credit?"
      />

      {/* Popup for confirming vendor credit rejection */}
      <ConfirmationPopup
        isOpen={isConfirmRejectPopupOpen}
        onClose={() => setIsConfirmRejectPopupOpen(false)}
        onConfirm={handleVendorCreditApprovalRejection}
        message="Are you sure you want to reject this vendor credit?"
        buttonText="Reject"
      />
    </>
  );
};

// Suspense wrapper for the main vendor credit view component
const ViewVendorCredit = () => {
  return (
    <Suspense>
      <ViewVendorCreditWithParams />
    </Suspense>
  );
};

export default ViewVendorCredit;