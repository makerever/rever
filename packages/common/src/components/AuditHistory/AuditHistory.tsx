//This component is for Audit History side section

"use client";

import { useEffect } from "react";
import { AuditHistoryDataProps } from "@rever/types";
import { formatDate, getStatusClass, getStatusTranslationKey } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { useTranslate } from "@rever/i18n";
import PageLoader from "../Loader";
import AuditHistoryCard from "./AuditHistoryCard";
import PillItem from "../PillItem";

const AuditHistory = ({ data, isLoading, setAuditVersionDate, handleClickAuditHistoryCard, currentVersion, setCurrentVersion }: AuditHistoryDataProps) => {
  const orgDetails = useUserStore((state) => state.user?.organization);
  const translate = useTranslate();

  useEffect(() => {
    setAuditVersionDate(
      formatDate(
        data[0]?.changed_on,
        orgDetails?.date_format,
        undefined,
        false,
        true,
      )
    )
  }, []);

  return (
    <>
      {/* Show list only when not loading */}
      {isLoading ? (
        <PageLoader />
        // <></>
      ) : (
        <>
          <div className="p-4">
            <p className="mb-4 pb-0 text-neutral-1100 text-xl font-medium">
              {translate("bills.actions.audit_history")}
            </p>
            <div className="">
              {
                data.length > 0 ?
                  data?.map((item, key) => {
                    return (
                      <div key={key}>
                        <AuditHistoryCard
                          modifiedDate={formatDate(
                            item?.changed_on,
                            orgDetails?.date_format,
                            undefined,
                            false,
                            true,
                          )}
                          isCurrent={item?.is_current}
                          isActive={currentVersion === item?.history_id}
                          modifiedBy={item?.changed_by}
                          pills={
                            <>
                              <PillItem
                                className={`${getStatusClass(item?.status || "")}`}
                                isRounded={true}
                                name={
                                  getStatusTranslationKey(item?.status || "")
                                    ? translate(getStatusTranslationKey(item?.status || "")!)
                                    : (item?.status || "")
                                }
                              />
                            </>
                          }
                          onClick={() => {
                            handleClickAuditHistoryCard(item?.history_id ?? 0);
                            setCurrentVersion(item?.history_id);
                            setAuditVersionDate(
                              formatDate(
                                item?.changed_on,
                                orgDetails?.date_format,
                                undefined,
                                false,
                                true,
                              )
                            )
                          }}
                        />
                      </div>
                    )
                  })
                  :
                  <>
                    <p
                      className="text-center text-sm text-slate-400"
                    >
                      {translate("common.no_audit_data")}
                    </p>
                  </>
              }
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AuditHistory;
