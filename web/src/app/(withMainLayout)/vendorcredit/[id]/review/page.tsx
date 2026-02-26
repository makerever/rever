// Renders vendor credit approval view page UI

"use client";

import {
    Button,
    Label,
    Modal,
    PageLoader,
    showSuccessToast,
    TextAreaInput,
    ViewVendorCreditDetails,
} from "@rever/common";
import {
    acceptRejectVendorCreditApi,
    getVendorCreditAttachment,
    getVendorCreditDetailsByIdApi,
} from "@rever/services";
import { VendorCreditProps } from "@rever/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, Suspense, useState, useCallback } from "react";

// Component to fetch and display vendor credit details based on URL params
const ViewVendorCreditApprovalWithParams = () => {
    const params = useParams();
    const idValue = params.id; // Get userId from route params

    const router = useRouter();

    const [vendorCreditDetails, setVendorCreditDetails] = useState<
        Partial<VendorCreditProps>
    >({});

    const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fileUrl, setFileUrl] = useState<string>("");
    const [showPdf, setShowPdf] = useState<boolean>(false);

    const [confirmVendorCreditReject, setConfirmVendorCreditReject] =
        useState<boolean>(false);
    const [rejectReason, setRejectReason] = useState<string>("");

    // Fetch vendor credit details by ID, along with attachment
    const getVendorCreditDetailsById = useCallback(
        async (idValue: string) => {
            setIsLoading(true);
            const response = await getVendorCreditDetailsByIdApi(idValue);
            if (
                response?.status === 200 &&
                response?.data?.status === "under_approval"
            ) {
                setVendorCreditDetails(response?.data);

                const responseFile = await getVendorCreditAttachment(idValue);
                if (responseFile?.status === 200) {
                    setFileUrl(responseFile?.data?.results[0]?.file);
                }

                setIsLoading(false);
            } else {
                router.push("/approvals/list/review");
            }
        },
        [router],
    );

    // Fetch vendor credit details on mount or when idValue changes
    useEffect(() => {
        if (!idValue) {
            // If no ID, redirect to list page
            router.push("/approvals/list/review");
        } else {
            setIsLoading(true);
            getVendorCreditDetailsById(idValue as string);
        }
    }, [getVendorCreditDetailsById, idValue, router]);

    // Approve vendor credit (for user approval action)
    const handleApprovalAction = async () => {
        setIsLoaderFormSubmit(true);
        const data = {
            action: "approve",
        };
        const response = await acceptRejectVendorCreditApi(data, idValue as string);
        if (response?.status === 200) {
            router.push("/approvals/list/review");
            showSuccessToast("Vendor credit approved successfully");
            setIsLoaderFormSubmit(false);
        } else {
            setIsLoaderFormSubmit(false);
        }
    };

    // Reject vendor credit with reason (from modal)
    const rejectVendorCredit = async () => {
        setIsLoaderFormSubmit(true);
        const data = {
            action: "reject",
            comment: rejectReason,
        };
        const response = await acceptRejectVendorCreditApi(data, idValue as string);
        if (response?.status === 200) {
            router.push("/approvals/list/review");
            showSuccessToast("Vendor credit rejected successfully");
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
                        <ViewVendorCreditDetails
                            deleteVendorCredit={() => { }}
                            vendorCreditDetails={vendorCreditDetails}
                            fileUrl={fileUrl}
                            showPdf={showPdf}
                            setShowPdf={(val) => setShowPdf(val)}
                            isLoaderFormSubmit={isLoaderFormSubmit}
                            handleApprovalAction={handleApprovalAction}
                            handleRejectionAction={() => setConfirmVendorCreditReject(true)}
                            isUserApproval
                        />
                    </div>
                )}
            </div>

            {/* Modal for entering reject reason */}
            <Modal
                title={`Confirm reject vendor credit`}
                isOpen={confirmVendorCreditReject}
                onClose={() => {
                    setConfirmVendorCreditReject(false);
                    setRejectReason("");
                }}
            >
                <div className="mt-8">
                    <Label text="Reject reason" htmlFor="rejectInput" />
                    <TextAreaInput
                        onChange={(e) => setRejectReason(e.target.value)}
                        id="rejectInput"
                    />
                    <div className="flex items-center justify-end w-full">
                        <p className="text-neutral-600 text-xs text-right">{rejectReason?.length} /500 characters.</p>
                    </div>
                    <div className="flex justify-end items-center gap-3 w-fit mt-3">
                        {/* <Button
              disabled={isLoaderFormSubmit}
              text="Reject"
              onClick={rejectVendorCredit}
              className="text-white bg-red-500 hover:bg-red-600"
            /> */}
                        <Button
                            name="Reject"
                            onClick={rejectVendorCredit}
                            disabled={isLoaderFormSubmit || (rejectReason?.length > 500)}
                            button_type="danger"
                            icon_type="reject"
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
};

// Suspense wrapper for async param loading
const ViewApprovalVendorCredit = () => {
    return (
        <Suspense>
            <ViewVendorCreditApprovalWithParams />
        </Suspense>
    );
};

export default ViewApprovalVendorCredit;