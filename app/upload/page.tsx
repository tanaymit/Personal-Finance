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

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const uploadedReceipt = await uploadReceipt(files[0]);
      setReceipt(uploadedReceipt);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      alert('Failed to upload receipt. Please try again.');
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
      await createTransaction({
        merchant: data.merchant,
        amount: data.amount,
        category: data.category,
        date: data.date,
        description: `Receipt: ${receipt?.fileName}`
      });

      setSuccessMessage(`Transaction recorded: ${data.merchant} for $${data.amount.toFixed(2)}`);
      setCurrentStep('success');

      // Reset after 3 seconds
      setTimeout(() => {
        setCurrentStep('initial');
        setReceipt(null);
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Receipt</h1>
        <p className="text-slate-600">Upload a receipt to automatically categorize your spending</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
            ['initial', 'preview', 'confirm', 'success'].includes(currentStep)
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          1
        </div>
        <div className={`flex-1 h-1 ${currentStep !== 'initial' ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
            ['preview', 'confirm', 'success'].includes(currentStep)
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          2
        </div>
        <div className={`flex-1 h-1 ${['confirm', 'success'].includes(currentStep) ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
            currentStep === 'success' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          3
        </div>
      </div>

      {/* Success Message */}
      {currentStep === 'success' && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">Transaction Saved!</h3>
          <p className="text-green-700">{successMessage}</p>
          <p className="text-sm text-green-600 mt-3">Redirecting in 3 seconds...</p>
        </div>
      )}

      {/* Step 1: Upload File */}
      {currentStep === 'initial' && (
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <DropZone onFilesSelected={handleFilesSelected} />
          <p className="text-xs text-slate-500 text-center mt-6">
            💡 Pro tip: Upload clear, well-lit photos for better OCR accuracy
          </p>
        </div>
      )}

      {/* Step 2: Preview & Confirm OCR */}
      {currentStep === 'preview' && receipt && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Receipt Preview</h3>
              <ReceiptPreview receipt={receipt} isLoading={isProcessing} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Transaction Details</h3>
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
