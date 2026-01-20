//This component is for Audit history clickable card

"use client"

import React from 'react'

export interface AuditHistoryCardProps {
  modifiedDate: string;
  modifiedBy: string;
  pills: React.ReactNode | null;
  onClick: () => void;
  isActive: boolean;
  isCurrent:boolean;
}

function AuditHistoryCard({ modifiedDate, modifiedBy, pills, onClick, isActive, isCurrent }: AuditHistoryCardProps) {
  return (
    <>
      <div
        className={`group hover:bg-neutral-100 ${isActive ? "bg-neutral-100" : ""} transition-all duration-300 p-2 rounded-xl flex items-start flex-col gap-1.5 cursor-pointer`}
        onClick={onClick}
      >
        <p className={`text-sm text-neutral-900 font-medium group-hover:font-semibold ${isActive ? "font-semibold" : ""}`}>{modifiedDate}</p>
        <p className='text-neutral-700 text-xs'>{modifiedBy?modifiedBy:"--"} {isCurrent?"- Current version":null}</p>
        <div>
          {pills}
        </div>
      </div>
    </>
  )
}

export default AuditHistoryCard