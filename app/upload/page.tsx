'use client';

import { useState } from 'react';
import { UploadedReceipt } from '@/lib/types';
import { uploadReceipt, createTransaction } from '@/lib/api';
import { DropZone } from '@/components/upload/DropZone';
import { ReceiptPreview } from '@/components/upload/ReceiptPreview';
import { OCRResults } from '@/components/upload/OCRResults';

type UploadStep = 'initial' | 'preview' | 'confirm' | 'success';

export default function UploadPage() {
  const [currentStep, setCurrentStep] = useState<UploadStep>('initial');
  const [receipt, setReceipt] = useState<UploadedReceipt | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [autoCreatedTxId, setAutoCreatedTxId] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      console.log(`🔄 Processing file: ${files[0].name}`);
      const uploadedReceipt = await uploadReceipt(files[0]);
      console.log(`✅ Received receipt data:`, uploadedReceipt);
      // Auto-create a transaction from OCR data so dashboards populate immediately
      try {
        const tx = await createTransaction({
          merchant: uploadedReceipt.ocrData.merchant || 'Unknown Merchant',
          amount: Number(uploadedReceipt.ocrData.amount) || 0,
          category: uploadedReceipt.ocrData.suggestedCategory || 'Other',
          date: uploadedReceipt.ocrData.date || new Date().toISOString().split('T')[0],
          description: `Auto-created from receipt ${uploadedReceipt.fileName}`
        });
        // mark initialized so dashboard shows data
        if (typeof window !== 'undefined') localStorage.setItem('dataInitialized', '1');
        setAutoCreatedTxId(tx.id);
      } catch (e) {
        console.warn('Auto-create transaction failed, will still show preview', e);
        setAutoCreatedTxId(null);
      }

      setReceipt(uploadedReceipt);
      setCurrentStep('preview');
    } catch (error) {
      console.error('❌ Failed to upload receipt:', error);
      alert(`Failed to upload receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async (data: {
    merchant: string;
    amount: number;
    date: string;
    category: string;
  }) => {
    try {
      // If we already auto-created a transaction on upload, skip creating duplicate
      if (!autoCreatedTxId) {
        await createTransaction({
          merchant: data.merchant,
          amount: data.amount,
          category: data.category,
          date: data.date,
          description: `Receipt: ${receipt?.fileName}`
        });
        if (typeof window !== 'undefined') localStorage.setItem('dataInitialized', '1');
      }

      setSuccessMessage(`Transaction recorded: ${data.merchant} for $${data.amount.toFixed(2)}`);
      setCurrentStep('success');

      // Reset after 3 seconds
      setTimeout(() => {
        setCurrentStep('initial');
        setReceipt(null);
        setAutoCreatedTxId(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Upload Receipt</h1>
        <p className="text-slate-400">Upload a receipt to automatically categorize your spending</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
            ['initial', 'preview', 'confirm', 'success'].includes(currentStep)
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          1
        </div>
        <div className={`flex-1 h-1 ${currentStep !== 'initial' ? 'bg-cyan-500' : 'bg-slate-800'}`} />
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
            ['preview', 'confirm', 'success'].includes(currentStep)
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          2
        </div>
        <div className={`flex-1 h-1 ${['confirm', 'success'].includes(currentStep) ? 'bg-cyan-500' : 'bg-slate-800'}`} />
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
            currentStep === 'success' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}
        >
          3
        </div>
      </div>

      {/* Success Message */}
      {currentStep === 'success' && (
        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-800/50 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2 text-emerald-300">✓</div>
          <h3 className="text-lg font-semibold text-emerald-100 mb-1">Transaction Saved!</h3>
          <p className="text-emerald-200">{successMessage}</p>
          <p className="text-sm text-emerald-300 mt-3">Redirecting in 3 seconds...</p>
        </div>
      )}

      {/* Step 1: Upload File */}
      {currentStep === 'initial' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8">
          <DropZone onFilesSelected={handleFilesSelected} />
          <p className="text-xs text-slate-400 text-center mt-6">
            💡 Pro tip: Upload clear, well-lit photos for better OCR accuracy
          </p>
        </div>
      )}

      {/* Step 2: Preview & Confirm OCR */}
      {currentStep === 'preview' && receipt && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-100 mb-3">Receipt Preview</h3>
              <ReceiptPreview receipt={receipt} isLoading={isProcessing} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 mb-3">Transaction Details</h3>
              <OCRResults
                receipt={receipt}
                onConfirm={handleConfirm}
                onCancel={() => {
                  setCurrentStep('initial');
                  setReceipt(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
