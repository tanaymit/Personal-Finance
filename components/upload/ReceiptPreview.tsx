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
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-8 flex flex-col items-center justify-center min-h-96 border border-slate-800">
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-full mb-4">
          <Loader size={32} className="text-cyan-300 animate-spin" />
        </div>
        <p className="text-slate-200 font-medium">Processing receipt...</p>
        <p className="text-sm text-slate-400 mt-1">Using OCR to extract information</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-8 flex flex-col items-center justify-center min-h-96 border border-slate-800">
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-full mb-4">
          <ImageIcon size={32} className="text-slate-400" />
        </div>
        <p className="text-slate-200 font-medium">No receipt selected</p>
        <p className="text-sm text-slate-400 mt-1">Upload a receipt to preview</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-slate-100 mb-2">Uploaded File</h3>
        <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
          <ImageIcon size={24} className="text-slate-400" />
          <div>
            <p className="font-medium text-slate-100 break-all">{receipt.fileName}</p>
            <p className="text-xs text-slate-400">{formatDate(receipt.uploadDate)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Merchant</p>
          <p className="font-semibold text-slate-100">{receipt.ocrData.merchant}</p>
        </div>
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Amount</p>
          <p className="font-semibold text-slate-100">{formatCurrency(receipt.ocrData.amount)}</p>
        </div>
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Date</p>
          <p className="font-semibold text-slate-100">{formatDate(receipt.ocrData.date)}</p>
        </div>
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Suggested Category</p>
          <p className="font-semibold text-slate-100">{receipt.ocrData.suggestedCategory}</p>
        </div>
      </div>

      {receipt.ocrData.items && receipt.ocrData.items.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-slate-100 mb-3">Items</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {receipt.ocrData.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 border-b border-slate-800 last:border-b-0"
              >
                <span className="text-sm text-slate-300">{item.name}</span>
                <span className="text-sm font-medium text-slate-100">
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
