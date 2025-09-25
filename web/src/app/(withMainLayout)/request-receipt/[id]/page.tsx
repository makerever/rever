// View page for request receipt

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bill, ReqConfirmedApiType } from "@rever/types";
import { confirmRequestApi, getBillDetailsByIdApi } from "@rever/services";
import {
  PageLoader,
  RequestReceiptView,
  showSuccessToast,
} from "@rever/common";
import { useUserStore } from "@rever/stores";

export default function RequestReceiptPage() {
  const router = useRouter();

  const params = useParams();
  const idValue = params.id; // Get userId from route params

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [billDetails, setBillDetails] = useState<Partial<Bill>>({});

  const [isReqConfirmLoading, setIsReqConfirmLoading] =
    useState<boolean>(false);

  // Get user data from store
  const user = useUserStore((state) => state.user);

  // Fetch bill details and attachment by ID
  const getBillDetailsById = useCallback(
    async (idValue: string) => {
      const response = await getBillDetailsByIdApi(idValue);
      if (response?.status === 200) {
        setBillDetails(response?.data);
        setIsLoading(false);
      } else {
        router.push("/request-receipt/list");
      }
    },
    [router],
  );

  // On mount, fetch bill details or redirect if no ID
  useEffect(() => {
    if (!idValue) {
      router.push("/request-receipt/list");
    } else {
      if (user?.role !== "lite_user") {
        router.back();
      } else {
        getBillDetailsById(idValue as string);
      }
    }
  }, [getBillDetailsById, idValue, router, user?.role]);

  const confirmRequest = async (data: ReqConfirmedApiType) => {
    setIsReqConfirmLoading(true);
    const response = await confirmRequestApi(idValue as string, data);
    if (response?.status === 200) {
      showSuccessToast("Request confirmed successfully");
      router.push("/request-receipt/list");
    } else {
      setIsReqConfirmLoading(false);
    }
  };

  return isLoading ? (
    <PageLoader />
  ) : (
    <RequestReceiptView
      isLoading={isReqConfirmLoading}
      bill={billDetails}
      onSubmit={(data: ReqConfirmedApiType) => {
        confirmRequest(data);
      }}
    />
  );
}
