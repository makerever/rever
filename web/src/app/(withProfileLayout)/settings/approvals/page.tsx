// Page to show approvals UI

"use client";
import { BillApproval, POApproval, Tabs, VendorCreditApproval } from "@rever/common";
import { approvalTabOptions } from "@rever/constants";
import { useState } from "react";
import { useTranslate } from "@rever/i18n";

function Approvals() {
  const translate = useTranslate();
  const [activeTab, setActiveTab] = useState<string | undefined>("PO approval");

  return (
    <>
      <div className="rounded-b-[20px] bg-white p-4 h-28 border border-secondary-200 flex items-end justify-start">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 w-full h-8">
          <div className="flex items-center gap-2">
            <p className="text-neutral-1100 text-2xl font-medium">{translate("sidebar.settings.approvals")}</p>
          </div>
        </div>
      </div>

      <div className="w-full rounded-[20px] border bg-white shadow-xs min-h-[calc(100vh-162px)]">
        <Tabs
          tabNames={approvalTabOptions}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="p-4">
          {activeTab === "PO approval" ? <POApproval /> : null}
          {activeTab === "Bill approval" ? <BillApproval /> : null}
          {activeTab === "Vendor credit approval" ? (
            <VendorCreditApproval />
          ) : null}
        </div>
      </div>
    </>
  );
}

export default Approvals;
