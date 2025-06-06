// Component to render view vendor details

"use client";

import { IconWrapper } from "@rever/common";
import { Label } from "@rever/common";
import { hasPermission } from "@rever/utils";
import { getCombineAddress, getLabelForTerm } from "@rever/utils";
import { ViewVendorDetailsProps } from "@rever/types";
import { SquarePen, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomTooltip } from "@rever/common";

const ViewVendorDetails = ({
  vendorData,
  deleteVendor,
}: ViewVendorDetailsProps) => {
  const router = useRouter();

  return (
    <>
      <div className="">
        <div>
          {/* Header with vendor name and action icons */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-1">
              <p className="text-slate-800 mr-1 text-lg font-semibold">
                {vendorData?.vendor_name ?? ""}
              </p>
              <span
                className={`text-2xs border py-1 px-1.5 rounded-md ${
                  vendorData?.is_active
                    ? "text-green-600 bg-green-50 border-green-200"
                    : "text-red-500 bg-red-50 border-red-200"
                }`}
              >
                {(vendorData?.is_active ?? "") ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Edit icon, visible if user has update permission */}
              {hasPermission("vendor", "update") && (
                <CustomTooltip content="Edit vendor">
                  <div>
                    <IconWrapper
                      onClick={() =>
                        router.push("/vendor/update?id=" + vendorData?.id)
                      }
                      icon={<SquarePen width={16} />}
                    />
                  </div>
                </CustomTooltip>
              )}

              {/* Delete icon, visible if user has delete permission */}
              {hasPermission("vendor", "delete") && (
                <CustomTooltip content="Delete vendor">
                  <div>
                    <IconWrapper
                      onClick={deleteVendor}
                      icon={<Trash width={16} />}
                      className="hover:bg-red-100 hover:text-red-500"
                    />
                  </div>
                </CustomTooltip>
              )}
            </div>
          </div>

          {/* Vendor main details: company, mobile, email */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5">
            <div>
              <Label text="Company name" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.company_name || "-"}
              </p>
            </div>
            <div>
              <Label text="Mobile" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.mobile || "-"}
              </p>
            </div>
            <div>
              <Label text="Email" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.email || "-"}
              </p>
            </div>

            <div>
              <Label text="Tax ID" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.tax_id || "-"}
              </p>
            </div>
            <div>
              <Label text="Website" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.website || "-"}
              </p>
            </div>
            <div>
              <Label text="Payment terms" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {getLabelForTerm(vendorData?.payment_terms || "")}
              </p>
            </div>
          </div>

          {/* Vendor address */}
          <div className="grid lg:grid-cols-3 gap-x-5">
            <div>
              <Label text="Vendor address" />
              <p className="text-slate-800 text-sm font-medium">
                {getCombineAddress({
                  line1: vendorData?.billing_address?.line1 ?? "",
                  line2: vendorData?.billing_address?.line2 ?? "",
                  city: vendorData?.billing_address?.city ?? "",
                  state: vendorData?.billing_address?.state ?? "",
                  zip_code: vendorData?.billing_address?.zip_code ?? "",
                  country: vendorData?.billing_address?.country ?? "",
                })}
              </p>
            </div>
          </div>

          {/* Vendor bank details*/}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 my-5 gap-x-5">
            <div>
              <Label text="Accounnt holder name" />
              <p className="text-slate-800 text-sm font-medium">
                {vendorData?.bank_account?.account_holder_name || "-"}
              </p>
            </div>
            <div>
              <Label text="Account number" />
              <p className="text-slate-800 text-sm font-medium">
                {vendorData?.bank_account?.account_number || "-"}
              </p>
            </div>
            <div>
              <Label text="Bank name" />
              <p className="text-slate-800 text-sm font-medium">
                {vendorData?.bank_account?.bank_name || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewVendorDetails;
