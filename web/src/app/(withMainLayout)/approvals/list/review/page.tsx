// Renders Approval bills List page UI

"use client";

import { BillApprovalList, POApprovalList, Tabs } from "@rever/common";
import { approvalTabOptions } from "@rever/constants";
import { useState } from "react";

// Main component for displaying the approval list
const ApprovalList = () => {
  const [activeTab, setActiveTab] = useState<string | undefined>("PO approval");

  return (
    <>
      <div className="mb-6">
        <Tabs
          tabNames={approvalTabOptions}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
      <>
        {activeTab === "PO approval" ? <POApprovalList /> : null}
        {activeTab === "Bill approval" ? <BillApprovalList /> : null}
      </>
    </>
  );
};

export default ApprovalList;
