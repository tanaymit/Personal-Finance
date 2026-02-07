'use client';

import { UploadedReceipt } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Image as ImageIcon, Loader } from 'lucide-react';

interface ReceiptPreviewProps {
  receipt: UploadedReceipt | null;
  isLoading?: boolean;
}

export function ReceiptPreview({ receipt, isLoading = false }: ReceiptPreviewProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-8 flex flex-col items-center justify-center min-h-96">
        <div className="p-4 bg-blue-100 rounded-full mb-4">
          <Loader size={32} className="text-blue-600 animate-spin" />
        </div>
        <p className="text-slate-600 font-medium">Processing receipt...</p>
        <p className="text-sm text-slate-500 mt-1">Using OCR to extract information</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-8 flex flex-col items-center justify-center min-h-96">
        <div className="p-4 bg-slate-200 rounded-full mb-4">
          <ImageIcon size={32} className="text-slate-500" />
        </div>
        <p className="text-slate-600 font-medium">No receipt selected</p>
        <p className="text-sm text-slate-500 mt-1">Upload a receipt to preview</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-2">Uploaded File</h3>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <ImageIcon size={24} className="text-slate-400" />
          <div>
            <p className="font-medium text-slate-900 break-all">{receipt.fileName}</p>
            <p className="text-xs text-slate-500">{formatDate(receipt.uploadDate)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Merchant</p>
          <p className="font-semibold text-slate-900">{receipt.ocrData.merchant}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Amount</p>
          <p className="font-semibold text-slate-900">{formatCurrency(receipt.ocrData.amount)}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Date</p>
          <p className="font-semibold text-slate-900">{formatDate(receipt.ocrData.date)}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Suggested Category</p>
          <p className="font-semibold text-slate-900">{receipt.ocrData.suggestedCategory}</p>
        </div>
      </div>

      {receipt.ocrData.items && receipt.ocrData.items.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-slate-900 mb-3">Items</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {receipt.ocrData.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 border-b border-slate-100 last:border-b-0"
              >
                <span className="text-sm text-slate-700">{item.name}</span>
                <span className="text-sm font-medium text-slate-900">
                  {formatCurrency(item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
