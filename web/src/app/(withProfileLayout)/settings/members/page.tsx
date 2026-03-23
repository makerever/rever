// Renders Members List page UI

"use client";

import {
  CheckBox,
  ConfirmationPopup,
  DataTable,
  InviteMemberModal,
  Modal,
  PillItem,
  PopupButton,
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
  getLabelForBillStatus,
  getLabelForRoles,
  getStatusClass,
  hasPermission,
} from "@rever/utils";
import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Pencil, Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslate } from "@rever/i18n";

const MembersList = () => {
  const translate = useTranslate();
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore.getState().setUser;
  const [openRowId, setOpenRowId] = useState<string | null>(null);

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
            <span>{translate("auth.register.first_name")}</span>
          </div>
        ),
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-4 cursor">
            <CheckBox
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
            <span className={`overflow-hidden text-ellipsis`}>
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "last_name",
        header: translate("auth.register.last_name"),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis">
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: translate("profile.email"),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis">
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: translate("profile.role"),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis">
              {getLabelForRoles(getValue() as string)}
            </span>
          </div>
        ),
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue?.length) return true;
          return filterValue.includes(row.getValue(columnId) as string);
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          String(row?.original?.id) !== user?.id && user?.role === "admin" ? (
            <div className="flex justify-end relative overflow-visible">
              <PopupButton
                btnPopupItems={[
                  {
                    name: translate("invite_member.edit_prefix"),
                    icon: <Pencil size={16} />,
                    isShown: true,
                    onClick: () => {
                      handleEdit(row.original);
                      setOpenRowId(null);
                    },
                  },
                  {
                    name: translate("confirm_deletion.delete"),
                    icon: <Trash size={16} />,
                    isShown: true,
                    onClick: () => {
                      handleDelete(row.original);
                      setOpenRowId(null);
                    },
                  },
                ]?.filter((item) => item.isShown)}
                showBtnPopup={openRowId === row.id}
                onClose={() =>
                  setOpenRowId(openRowId === row.id ? null : openRowId)
                }
              >
                <button
                  className="popup-btn rounded-[8px] size-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenRowId(openRowId === row.id ? null : row.id);
                  }}
                >
                  <EllipsisVertical size={16} />
                </button>
              </PopupButton>
            </div>
          ) : null,
      },
    ],
    [openRowId, user?.id, user?.role, translate],
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
            <span>{translate("profile.email")}</span>
          </div>
        ),
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-4 cursor">
            <CheckBox
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
            <span className={`overflow-hidden text-ellipsis`}>
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "invited_by",
        header: translate("members.invited_by"),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis">
              {getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "organization",
        header: translate("general.org_name"),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis">
              {getValue() as string}
            </span>
          </div>
        ),
      },

      {
        accessorKey: "status",
        header: translate("profile.role"),
        cell: ({ getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center gap-1">
              <span className="overflow-hidden text-ellipsis">{value}</span>
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
        header: translate("vendors.table_headers.status"),
        sortDescFirst: false,
        cell: ({ getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center pr-2 justify-between w-32">
              <PillItem
                className={`${getStatusClass(getLabelForBillStatus(value) || "")}`}
                isRounded={true}
                name={getLabelForBillStatus(value || "")}
              />
            </div>
          );
        },
      },
    ],
    [translate],
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

  const [inviteMemberModal, setInviteMemberModal] = useState(false);

  const [editMemberData, setEditMemberData] =
    useState<MemberDataAPIType | null>();

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
            invite_status: v?.status,
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
    setInviteMemberModal(true);
  };

  // Open confirmation popup for deleting a member
  const handleDelete = (row: MemberDataAPIType) => {
    setMemberId(String(row?.id));
    setIsPopupOpen(true);
  };

  // Edit member details (functionality to be implemented)
  const handleEdit = (row: MemberDataAPIType) => {
    setEditMemberData(row);
    setInviteMemberModal(true);
  };

  // Delete member by ID and refresh list
  const handleDeleteUser = async () => {
    const response = await deleteMemberByIdApi(memberId);
    if (response?.status === 204) {
      setIsPopupOpen(false);
      getMembersList();
    } else {
      if (response?.data?.detail) {
        showErrorToast(translate("members.cannot_delete"));
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
      <>
        {activeTab === "Active members" ? (
          <DataTable
            onActionBtClick={handleRedirect}
            addBtnText={
              hasPermission("members", "create") ? translate("members.invite_members") : ""
            }
            tableHeading={translate("sidebar.settings.members")}
            tableData={filteredMembers}
            columns={columns}
            tabNames={memberTabOptions}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMembers={true}
            setSearch={setSearch}
            search={search}
            clearSearch={() => setSearch("")}
            filterHeading={translate("profile.role")}
            isLoading={isLoading}
          />
        ) : (
          <DataTable
            onActionBtClick={handleRedirect}
            addBtnText={
              hasPermission("members", "create") ? translate("members.invite_members") : ""
            }
            tableHeading={translate("sidebar.settings.members")}
            tableData={filteredInvitedMembers}
            columns={invitedMemberColumns}
            tabNames={memberTabOptions}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMembers={true}
            setSearch={setSearch}
            search={search}
            clearSearch={() => setSearch("")}
            filterHeading={translate("profile.role")}
            isLoading={isLoading}
          />
        )}
      </>

      {/* Confirmation popup for deleting a member */}
      <ConfirmationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onConfirm={handleDeleteUser}
        message={translate("members.delete_confirm")}
      />

      <Modal
        isOpen={inviteMemberModal}
        onClose={() => setInviteMemberModal(false)}
        className="lg:w-[35%] md:2/6 w-5/6"
      >
        <InviteMemberModal
          editMemberData={editMemberData}
          onClose={() => setInviteMemberModal(false)}
          reqConfirmed={() => {
            setInviteMemberModal(false);
          }}
        />
      </Modal>
    </>
  );
};

export default MembersList;