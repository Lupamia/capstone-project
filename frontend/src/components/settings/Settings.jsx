import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Settings as SettingsIconLucide,
  ListCheck,
  Upload,
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

import SmsTab from "./SmsTab";
import SystemTab from "./SystemTab";
import NotificationTab from "./NotificationTab";
import FormFieldsPage from "./FormFieldPage";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("system");
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🌐 Use backend API from .env or fallback to localhost
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";

  // 📄 Parse Excel/CSV for preview
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      setPreviewData(jsonData);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // 📤 Upload Excel/CSV to backend
  const handleBulkUpload = async () => {
    if (!file) {
      Swal.fire({
        icon: "warning",
        title: "No File Selected",
        text: "Please select a file before uploading!",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      Swal.fire({
        title: "Uploading...",
        text: "Please wait while we process your file.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/senior-citizens/bulk-insert`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      Swal.close();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with ${response.status}`);
      }

      Swal.fire({
        icon: "success",
        title: "Upload Successful!",
        text: `✅ Inserted ${data.inserted || 0} senior records successfully.`,
        timer: 3000,
        showConfirmButton: false,
      });

      // 🔁 Trigger refresh in SeniorCitizenList
      window.dispatchEvent(new Event("seniorDataUpdated"));
      setFile(null);
      setPreviewData([]);
    } catch (err) {
      console.error("❌ Upload error:", err);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text:
          err.message ||
          `Unable to connect to backend at ${API_BASE_URL}. Please check that the backend is online.`,
      });
    } finally {
      setLoading(false);
    }
  };

  // 🧭 Handle tab + hash routing
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#senior-form") setActiveTab("senior-form");

    const handleHashChange = () => {
      if (window.location.hash === "#senior-form") setActiveTab("senior-form");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap -mb-px">
          <button
            onClick={() => setActiveTab("system")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "system"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <SettingsIconLucide className="inline-block h-4 w-4 mr-2" /> System
            Settings
          </button>
          <button
            onClick={() => setActiveTab("sms")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "sms"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <MessageSquare className="inline-block h-4 w-4 mr-2" /> SMS Settings
          </button>
          <button
            onClick={() => setActiveTab("senior-form")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "senior-form"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <ListCheck className="inline-block h-4 w-4 mr-2" /> Senior Citizen
            Form
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === "system" && <SystemTab />}
        {activeTab === "sms" && <SmsTab />}
        {activeTab === "notifications" && <NotificationTab />}
        {activeTab === "senior-form" && (
          <>
            <FormFieldsPage />

            {/* 📦 Bulk Upload Section */}
            <div className="mt-10 border-t pt-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" /> Bulk Upload Senior Data
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Upload multiple senior records using an Excel (.xlsx) or CSV
                file.
              </p>

              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                className="border rounded p-2 mb-3 w-full"
              />
              <button
                onClick={handleBulkUpload}
                disabled={loading}
                className={`px-4 py-2 text-white rounded ${
                  loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Uploading..." : "Upload File"}
              </button>

              {previewData.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <h3 className="font-semibold mb-2">Preview:</h3>
                  <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
                    <thead>
                      <tr>
                        {Object.keys(previewData[0]).map((col) => (
                          <th
                            key={col}
                            className="border px-2 py-1 bg-gray-100"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="border px-2 py-1">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;
