// Renders Approval bills List page UI

"use client";

import {
  BillApprovalList,
  POApprovalList,
  VendorCreditApprovalList
} from "@rever/common";
import { approvalTabOptions } from "@rever/constants";
import { useState } from "react";

// Main component for displaying the approval list
const ApprovalList = () => {
  const [activeTab, setActiveTab] = useState<string | undefined>("PO approval");

  return (
    <>
      <>
        {activeTab === "PO approval" ? (
          <POApprovalList
            tabs={approvalTabOptions}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        ) : null}
        {activeTab === "Bill approval" ? (
          <BillApprovalList
            tabs={approvalTabOptions}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        ) : null}
        {activeTab === "Vendor credit approval" ? (
          <VendorCreditApprovalList
            tabs={approvalTabOptions}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        ) : null}
      </>
    </>
  );
};

export default ApprovalList;
