// Renders Members List page UI

"use client";

import {
  CheckBox,
  ConfirmationPopup,
  DataTable,
  PageLoader,
  showErrorToast,
} from "@rever/common";
import { memberTabOptions } from "@rever/constants";
import {
  deleteMemberByIdApi,
  getInvitedMembersListApi,
  getLoggedInUserDetails,
  getMembersListApi,
} from "@rever/services";
import { useUserStore } from "@rever/stores";
import { InvitedMemberDataAPIType, MemberDataAPIType } from "@rever/types";
import {
  getLabelForMemberStatus,
  getLabelForRoles,
  getStatusClass,
  hasPermission,
} from "@rever/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const MembersList = () => {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore.getState().setUser;

  const columns: ColumnDef<MemberDataAPIType>[] = useMemo(
    () => [
      {
        accessorKey: "first_name",
        header: ({ table }) => (
          <div className="flex items-center gap-4">
            <CheckBox
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
            <span>First name</span>
          </div>
        ),
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-4 cursor">
            <CheckBox
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
            <span
              onClick={() => {
                if (
                  hasPermission("members", "update") &&
                  user?.id !== String(row.original.id)
                ) {
                  router.push(`/settings/members/invite?id=${row.original.id}`);
                }
              }}
              className={`${
                hasPermission("members", "update") &&
                user?.id !== String(row.original.id)
                  ? "font-semibold cursor-pointer"
                  : ""
              } overflow-hidden text-ellipsis w-24`}
            >
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "last_name",
        header: "Last name",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis w-24">
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis w-52">
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Role",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis w-32">
              {getLabelForRoles(getValue() as string)}
            </span>
          </div>
        ),
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue?.length) return true;
          return filterValue.includes(row.getValue(columnId) as string);
        },
      },
    ],
    [router, user?.id],
  );
  const invitedMemberColumns: ColumnDef<InvitedMemberDataAPIType>[] = useMemo(
    () => [
      {
        accessorKey: "email",
        header: ({ table }) => (
          <div className="flex items-center gap-4">
            <CheckBox
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
            <span>Email</span>
          </div>
        ),
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-4 cursor">
            <CheckBox
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
            <span className={`overflow-hidden text-ellipsis w-60`}>
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "invited_by",
        header: "Invited by",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis w-40">
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "organization",
        header: "Organization name",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis w-40">
              {getValue() as string}
            </span>
          </div>
        ),
      },

      {
        accessorKey: "status",
        header: "Role",
        cell: ({ getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center gap-1">
              <span className="overflow-hidden text-ellipsis w-40">
                {value}
              </span>
            </div>
          );
        },
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue?.length) return true;
          return filterValue.includes(row.getValue(columnId) as string);
        },
      },
      {
        accessorKey: "invite_status",
        header: "Status",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span
              className={`text-2xs border py-1 px-1.5 rounded-md ${getStatusClass(
                getValue() as string,
              )}`}
            >
              {getValue() as string}
            </span>
          </div>
        ),
      },
    ],
    [],
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [membersList, setMembersList] = useState<MemberDataAPIType[]>([]);
  const [invitedMembersList, setInvitedMembersList] = useState<
    InvitedMemberDataAPIType[]
  >([]);
  const [search, setSearch] = useState<string>("");

  const [memberId, setMemberId] = useState<string>();
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string | undefined>(
    "Active members",
  );

  const [userUpdate, setUserUpdate] = useState<boolean>(false);

  // Fetch members list when component mounts or user changes
  useEffect(() => {
    getMembersList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch members from API and filter out current user
  const getMembersList = async () => {
    setUserUpdate(true);
    if (user) {
      setIsLoading(true);
      const response = await getMembersListApi();
      if (response?.status === 200) {
        const allData = response?.data
          ?.filter((v: MemberDataAPIType) => v?.first_name)
          .map((v: MemberDataAPIType) => {
            return {
              ...v,
              status: getLabelForRoles(v?.role),
            };
          });
        setMembersList(allData);
        getInvitedMembersList();
      } else {
        setIsLoading(false);
      }
    }
  };

  const getInvitedMembersList = async () => {
    if (user) {
      const response = await getInvitedMembersListApi();
      if (response?.status === 200) {
        const allData = response?.data.map((v: InvitedMemberDataAPIType) => {
          return {
            ...v,
            status: getLabelForRoles(v?.role),
            invite_status: getLabelForMemberStatus(v?.status),
          };
        });
        setInvitedMembersList(allData);
        if (userUpdate) {
          const responseUserDetails = await getLoggedInUserDetails();
          if (responseUserDetails?.status === 200) {
            updateUser(responseUserDetails?.data);
            setUserUpdate(false);
            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
  };

  // Redirect to invite member page
  const handleRedirect = () => {
    router.push("members/invite");
  };

  // Open confirmation popup for deleting a member
  const handleDelete = (row: MemberDataAPIType) => {
    setMemberId(String(row?.id));
    setIsPopupOpen(true);
  };

  // Delete member by ID and refresh list
  const handleDeleteUser = async () => {
    const response = await deleteMemberByIdApi(memberId);
    if (response?.status === 204) {
      setIsPopupOpen(false);
      getMembersList();
    } else {
      if (response?.data?.detail) {
        showErrorToast(
          "Cannot delete user as they are assigned as an approver",
        );
      }
    }
  };

  // Filter members based on search input
  const filteredMembers = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return membersList?.filter((member) => {
      return (
        member.first_name.toLowerCase().includes(lowerSearch) ||
        member.last_name.toLowerCase().includes(lowerSearch) ||
        member.email.toLowerCase().includes(lowerSearch) ||
        member.role.toLowerCase().includes(lowerSearch)
      );
    });
  }, [search, membersList]);

  // Filter invited members based on search input
  const filteredInvitedMembers = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return invitedMembersList?.filter((member) => {
      return (
        member.role.toLowerCase().includes(lowerSearch) ||
        member.email.toLowerCase().includes(lowerSearch)
      );
    });
  }, [search, invitedMembersList]);

  return (
    <>
      {/* Show DataTable if not loading */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          {activeTab === "Active members" ? (
            <DataTable
              onActionBtClick={handleRedirect}
              addBtnText={hasPermission("members", "create") ? "Invite" : ""}
              tableHeading="Members"
              tableData={filteredMembers}
              columns={columns}
              tabNames={memberTabOptions}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              actions={hasPermission("members", "delete") ? true : false}
              handleDelete={handleDelete}
              isMembers={true}
              setSearch={setSearch}
              search={search}
              clearSearch={() => setSearch("")}
              filterHeading="Role"
            />
          ) : (
            <DataTable
              onActionBtClick={handleRedirect}
              addBtnText={hasPermission("members", "create") ? "Invite" : ""}
              tableHeading="Members"
              tableData={filteredInvitedMembers}
              columns={invitedMemberColumns}
              tabNames={memberTabOptions}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isMembers={true}
              setSearch={setSearch}
              search={search}
              clearSearch={() => setSearch("")}
              filterHeading="Role"
            />
          )}
        </>
      )}

      {/* Confirmation popup for deleting a member */}
      <ConfirmationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onConfirm={handleDeleteUser}
        message="Are you sure you want to delete this member?"
      />
    </>
  );
};

export default MembersList;
