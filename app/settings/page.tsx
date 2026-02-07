'use client';

import { useState } from 'react';
import { Save, Bell, Lock, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    monthlyBudget: '5400',
    currency: 'USD',
    theme: 'light',
    notifications: true,
    emailAlerts: true,
    budgetAlerts: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your account and preferences</p>
      </div>

      {/* Save Notification */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span>✓</span>
          <span>Settings saved successfully</span>
        </div>
      )}

      {/* Account Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Account Settings</h2>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={e => handleChange('fullName', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Monthly Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monthly Budget
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-medium">$</span>
                <input
                  type="number"
                  value={formData.monthlyBudget}
                  onChange={e => handleChange('monthlyBudget', e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={e => handleChange('currency', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Preferences</h2>

        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">Theme</p>
                <p className="text-sm text-slate-500">Choose your preferred appearance</p>
              </div>
            </div>
            <select
              value={formData.theme}
              onChange={e => handleChange('theme', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">Notifications</p>
                <p className="text-sm text-slate-500">Receive app notifications</p>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={e => handleChange('notifications', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600"
              />
            </label>
          </div>

          {/* Email Alerts */}
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">Email Alerts</p>
                <p className="text-sm text-slate-500">Receive email notifications</p>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.emailAlerts}
                onChange={e => handleChange('emailAlerts', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600"
              />
            </label>
          </div>

          {/* Budget Alerts */}
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">Budget Alerts</p>
                <p className="text-sm text-slate-500">Alert when approaching budget limits</p>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.budgetAlerts}
                onChange={e => handleChange('budgetAlerts', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
          Delete Account
        </button>
        <p className="text-xs text-slate-600 mt-2">
          This action cannot be undone. All your data will be permanently deleted.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Save size={18} />
          Save Changes
        </button>
        <button className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
          Cancel
        </button>
      </div>
    </div>
  );
}
