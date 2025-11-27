// This component allows users to upload files with drag-and-drop functionality

"use client";

import { useState, useRef } from "react";
import {
  Check,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CloudUpload,
  Loader,
  Paperclip,
  X,
} from "lucide-react";
import Modal from "./Modal";
import IconWrapper from "./IconWrapper";
import { UploadFilesModalProps } from "@rever/types";
import { getDocument, uploadDocument } from "@rever/services";
import { showErrorToast } from "./Toast";
import { CustomTooltip } from "./TooltipWrapper";
import { getStatusLabelForExtraction } from "@rever/utils";

const getStatusIcon = (status: string, error_message?: string) => {
  switch (status) {
    case "uploading":
      return <Loader className="animate-spin text-slate-800" size={16} />;
    case "processing":
      return <Loader className="animate-spin text-blue-500" size={16} />;
    case "extracting":
      return (
        <CircleDashed className="animate-spin text-purple-500" size={16} />
      );
    case "enriched":
      return <CircleCheck className="text-green-600" size={16} />;
    case "failed":
      return (
        <CustomTooltip
          content={
            error_message
              ? error_message
              : "File must be under 5MB and limited to 5 pages"
          }
          side="right"
        >
          <div>
            <CircleAlert className="text-red-500" size={16} />
          </div>
        </CustomTooltip>
      );
    default:
      return null;
  }
};

const UploadFilesModal = ({
  isOpen,
  onClose,
  maxFiles = 50,
  acceptedFormats = "application/pdf",
  document_type,
}: UploadFilesModalProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<
    { file: File; status: string; task_id?: string; error_message?: string }[]
  >([]);

  const [fileUploadStarted, setFileUploadStarted] = useState(false);
  const [fileUploadEnded, setFileUploadEnded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // const removeFile = (index: number) => {
  //   setFiles((prev) => prev.filter((_, i) => i !== index));
  // };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
  };

  const processFiles = async (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter((file) =>
      acceptedFormats.includes(file.type),
    );
    const limitedFiles = validFiles.slice(0, maxFiles);

    const fileWithStatus = limitedFiles.map((file) => ({
      file,
      status: "uploading",
    }));

    setFiles(fileWithStatus);
    setFileUploadStarted(true);

    for (let i = 0; i < limitedFiles.length; i++) {
      await uploadAndTrackStatus(limitedFiles[i], i);
    }

    setFileUploadStarted(false);
    setFileUploadEnded(true);
  };

  const uploadAndTrackStatus = async (file: File, index: number) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", document_type ?? "");

    setFiles((prev) => {
      const updated = [...prev];
      updated[index].status = "uploading";
      return updated;
    });

    const uploadRes = await uploadDocument(formData);
    if (uploadRes?.status === 202) {
      const { task_id, error_message } = await uploadRes.data;

      setFiles((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: "uploading",
          error_message,
          task_id,
        };
        return updated;
      });

      await pollDocumentStatus(task_id, index);
    } else {
      if (
        uploadRes &&
        uploadRes?.data[0] ===
          "Your subscription has expired. Please renew to continue."
      ) {
        showErrorToast(uploadRes?.data[0]);
        setFiles((prev) => {
          const updated = [...prev];
          updated[index].status = "failed";
          updated[index].error_message = uploadRes?.data[0];
          return updated;
        });
      } else {
        setFiles((prev) => {
          const updated = [...prev];
          updated[index].status = "failed";
          return updated;
        });
      }
    }
  };

  const pollDocumentStatus = async (id: string, index: number) => {
    const MAX_ATTEMPTS = 20;
    const DELAY_MS = 2000;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const fileRes = await getDocument(id);
        if (fileRes.status !== 200) throw new Error("Fetch failed");
        const responseData = fileRes.data;

        setFiles((prev) => {
          const updated = [...prev];
          updated[index].status = responseData?.status;
          updated[index].error_message = responseData?.message;
          return updated;
        });

        if (["completed", "failed"].includes(responseData?.status)) {
          break;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  };

  const total = files.length;
  const failedCount = files.filter((f) => f.status === "failed").length;
  const enrichedCount = files.filter((f) => f.status === "completed").length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (fileUploadStarted) {
          showErrorToast(
            "Uploading files... Please wait or close after completion.",
          );
        } else {
          onClose();
        }
      }}
    >
      <div className="pt-0">
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="w-full flex items-center gap-1">
            {fileUploadEnded ? (
              <div className="w-9 h-9 min-w-9 min-h-9 rounded-full border border-green-600 flex items-center justify-center mr-2">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            ) : fileUploadStarted ? (
              <div className="w-9 h-9 min-w-9 min-h-9 rounded-full border border-slate-300 flex items-center justify-center mr-2">
                <Loader className="w-5 h-5 text-slate-500 animate-spin" />
              </div>
            ) : (
              <div className="w-9 h-9 min-w-9 min-h-9 rounded-full border border-slate-300 flex items-center justify-center mr-2">
                <CloudUpload className="w-5 h-5 text-slate-500" />
              </div>
            )}

            <div className="w-full">
              <p className="text-md font-semibold text-slate-800">
                {fileUploadStarted
                  ? "Uploading files..."
                  : total > 0
                    ? "Files processed"
                    : "Upload files"}
              </p>

              {fileUploadStarted || total > 0 ? (
                <div className="mt-1 w-full">
                  <div className="w-56 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300 ease-in-out bg-blue-500"
                      style={{
                        width: `${Math.round(
                          ((enrichedCount + failedCount) / total) * 100 || 0,
                        )}%`,
                      }}
                    />
                  </div>
                  {enrichedCount + failedCount === total && total > 0 ? (
                    <p className="text-xs font-medium mt-1">
                      <span className="text-slate-800">
                        {total} files processed:&nbsp;
                      </span>
                      <span className="text-green-600">
                        {enrichedCount} enriched
                      </span>

                      {failedCount > 0 ? (
                        <span>
                          ,{" "}
                          <span className="text-red-500">
                            {failedCount} failed
                          </span>
                        </span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-xs font-medium mt-1 text-slate-500">
                      Processing... {enrichedCount + failedCount}/{total}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-500">
                  Select and upload the files of your choice
                </p>
              )}
            </div>
          </div>
          <IconWrapper
            onClick={() => {
              if (fileUploadStarted) {
                showErrorToast(
                  "Uploading files... Please wait or close after completion.",
                );
              } else {
                onClose();
              }
            }}
            icon={<X width={16} />}
          />
        </div>

        <div className="p-5">
          {files.length > 0 ? (
            <div className="bg-white custom_box_shadow rounded-md max-h-[450px] overflow-y-auto custom_scrollbar">
              <ul>
                {files.map((item, index) => (
                  <li
                    key={index}
                    className={`flex items-center justify-between p-3 ${
                      index < files.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <Paperclip
                        size={14}
                        className="ms-1 mr-4 text-gray-500"
                      />
                      <span className="text-xs font-medium truncate w-80">
                        {item.file.name}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-6"
                      //   onClick={() => removeFile(index)}
                    >
                      <p
                        className={`text-slate-800 text-xs capitalize ${
                          item.status === "processing" ||
                          item.status === "uploading"
                            ? "italic"
                            : ""
                        }`}
                      >
                        {getStatusLabelForExtraction(item.status)}
                      </p>
                      {getStatusIcon(
                        getStatusLabelForExtraction(item.status),
                        item?.error_message,
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] ${
                dragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <CloudUpload className="w-6 h-6 text-gray-500" />
              </div>

              <h3 className="text-md font-medium text-gray-700 mb-1">
                Choose a file or drag & drop it here
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Upload up to {maxFiles} PDF files, each not exceeding 5MB in
                size
              </p>

              <button
                onClick={triggerFileInput}
                className="px-4 py-2 text-sm font-medium text-primary-500 border border-primary-500 rounded-md hover:bg-primary-500 hover:text-white transition-colors"
              >
                Browse files
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedFormats}
                onChange={handleChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadFilesModal;
