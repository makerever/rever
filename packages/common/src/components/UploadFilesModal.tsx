// This component allows users to upload files with drag-and-drop functionality

"use client";

import { useState, useRef } from "react";
import {
  CircleCheck,
  CircleX,
  Image,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import Modal from "./Modal";

import { UploadFilesModalProps } from "@rever/types";
import { getDocument, uploadDocument } from "@rever/services";
import { showErrorToast } from "./Toast";
import { CustomTooltip } from "./TooltipWrapper";
import { getStatusLabelForExtraction } from "@rever/utils";

const getStatusIcon = (status: string, error_message?: string) => {
  switch (status) {
    case "uploading":
      return (
        <LoaderCircle className="animate-spin text-neutral-1000" size={16} />
      );
    case "processing":
      return <LoaderCircle className="animate-spin text-blue-500" size={16} />;
    case "extracting":
      return (
        <LoaderCircle className="animate-spin text-purple-500" size={16} />
      );
    case "enriched":
      return <CircleCheck className="text-green-500" size={16} />;
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
            <CircleX className="text-danger-600" size={16} />
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
      className="w-1/3"
    >
      <div className="pt-0">
        {/* Modal Header */}
        <div className="p-4 flex items-center justify-between border-b border-secondary-200 pb-2">
          <div className="w-full flex items-center gap-1">
            {/* {fileUploadEnded ? (
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
            )} */}

            <div className="w-full">
              <p className="text-xl font-medium text-neutral-1100">
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
                      <span className="text-neutral-1100">
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
                <p className="text-xs font-medium text-secondary-700">
                  Select and upload the files of your choice
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (fileUploadStarted) {
                showErrorToast(
                  "Uploading files... Please wait or close after completion.",
                );
              } else {
                onClose();
              }
            }}
            className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          {files.length > 0 ? (
            <div className="max-h-112 overflow-y-auto custom_scrollbar">
              <ul>
                {files.map((item, index) => (
                  <li
                    key={index}
                    className="p-3 bg-secondary-100 rounded-lg flex items-center justify-between mb-3"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 min-w-8 min-h-8 bg-secondary-300 rounded-md flex justify-center items-center">
                        <Image size={16} className="text-neutral-1100" />
                      </div>

                      <div className="ms-4">
                        <p className="text-neutral-1100 text-sm font-semibold line-clamp-1 w-60">
                          {item.file.name}
                        </p>
                        <p
                          className={`text-neutral-700 text-sm font-medium mt-0.5 capitalize ${
                            item.status === "processing" ||
                            item.status === "extracting"
                              ? "italic"
                              : ""
                          }`}
                        >
                          {getStatusLabelForExtraction(item.status)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-6"
                      //   onClick={() => removeFile(index)}
                    >
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
              className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-38 ${
                dragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <div className="rounded-full flex items-center justify-center mb-2">
                <Upload className="w-6 h-6 text-neutral-1100" />
              </div>

              <h3 className="text-sm font-medium text-neutral-900 mb-1.5">
                Click or drop files to upload
              </h3>
              <p className="text-xs text-neutral-700 font-medium">
                Upload up to {maxFiles} files, each not exceeding 5 MB in size.
              </p>

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
