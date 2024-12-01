"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode } from "lucide-react";

interface QRData {
  tableNumber: string;
  type: "menu" | "feedback";
}

export default function GenerateQRPage() {
  const [qrData, setQrData] = useState<QRData>({
    tableNumber: "",
    type: "menu",
  });
  const [generatedQRs, setGeneratedQRs] = useState<QRData[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrData.tableNumber) return;

    setGeneratedQRs((prev) => [...prev, { ...qrData }]);
    setQrData((prev) => ({ ...prev, tableNumber: "" }));
  };

  const getQRValue = (data: QRData) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      table: data.tableNumber,
    });

    return data.type === "menu"
      ? `${baseUrl}/menu?${params.toString()}`
      : `${baseUrl}/feedback?${params.toString()}`;
  };

  const downloadQR = (data: QRData) => {
    const svg = document.getElementById(
      `qr-${data.type}-${data.tableNumber}`
    ) as HTMLElement;
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-${data.type}-table-${data.tableNumber}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-3">
            <QrCode className="w-8 h-8 text-gray-900 dark:text-white" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              QR Code Generator
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="tableNumber"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Table Number
                    </label>
                    <input
                      type="text"
                      id="tableNumber"
                      name="tableNumber"
                      value={qrData.tableNumber}
                      onChange={(e) =>
                        setQrData((prev) => ({
                          ...prev,
                          tableNumber: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="type"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      QR Code Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={qrData.type}
                      onChange={(e) =>
                        setQrData((prev) => ({
                          ...prev,
                          type: e.target.value as "menu" | "feedback",
                        }))
                      }
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="menu">Menu QR</option>
                      <option value="feedback">Feedback QR</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 shadow-sm"
                  >
                    Generate QR Code
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {generatedQRs.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Generated QR Codes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {generatedQRs.map((data, index) => {
                    const qrValue = getQRValue(data);
                    return (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform duration-200 hover:scale-[1.02]"
                        data-testid={`qr-container-${data.type}-${data.tableNumber}`}
                      >
                        <div className="p-6">
                          <div className="flex justify-center mb-4">
                            <div
                              id={`qr-${data.type}-${data.tableNumber}`}
                              data-value={qrValue}
                              className="bg-white p-4 rounded-lg shadow-inner"
                            >
                              <QRCodeSVG
                                value={qrValue}
                                size={180}
                                level="H"
                                includeMargin
                              />
                            </div>
                          </div>
                          <div className="text-center space-y-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Table {data.tableNumber}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {data.type} QR Code
                            </p>
                            <button
                              onClick={() => downloadQR(data)}
                              className="inline-flex items-center space-x-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No QR codes generated yet</p>
                  <p className="text-sm">
                    Fill out the form to generate QR codes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
