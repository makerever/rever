// Page to show approvals UI

"use client";
import { BillApproval, POApproval, Tabs } from "@rever/common";
import { approvalTabOptions } from "@rever/constants";
import { useState } from "react";

function Approvals() {
  const [activeTab, setActiveTab] = useState<string | undefined>("PO approval");

  return (
    <>
      <Tabs
        tabNames={approvalTabOptions}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <>
        {activeTab === "PO approval" ? <POApproval /> : null}
        {activeTab === "Bill approval" ? <BillApproval /> : null}
      </>
    </>
  );
}

export default Approvals;
