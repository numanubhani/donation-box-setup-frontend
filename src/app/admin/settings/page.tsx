'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useStore';
import { MessageSquare, Save, Send, Settings2 } from 'lucide-react';

const DEFAULT_TEMPLATE =
  'Thank you {name} for your donation! Al-Najaat Foundation has received your amount: PKR {amount}. JazakAllah Khair!';

export default function AdminSettingsPage() {
  const { twilioSettings, fetchTwilioSettings, updateTwilioSettings, sendTwilioTestSms, showToast } =
    useAppStore();

  const [enabled, setEnabled] = useState(true);
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [savedAuthTokenMasked, setSavedAuthTokenMasked] = useState('');
  const [fromNumber, setFromNumber] = useState('');
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TEMPLATE);
  const [testPhone, setTestPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchTwilioSettings().finally(() => setLoading(false));
  }, [fetchTwilioSettings]);

  useEffect(() => {
    if (!twilioSettings) return;
    setEnabled(twilioSettings.enabled);
    setAccountSid(twilioSettings.accountSid || '');
    setAuthToken(twilioSettings.authToken || '');
    setSavedAuthTokenMasked(twilioSettings.authToken || '');
    setFromNumber(twilioSettings.fromNumber || '');
    setMessageTemplate(twilioSettings.messageTemplate || DEFAULT_TEMPLATE);
  }, [twilioSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: {
      enabled: boolean;
      accountSid: string;
      fromNumber: string;
      messageTemplate: string;
      authToken?: string;
    } = {
      enabled,
      accountSid: accountSid.trim(),
      fromNumber: fromNumber.trim(),
      messageTemplate: messageTemplate.trim() || DEFAULT_TEMPLATE,
    };
    const tokenValue = authToken.trim();
    if (tokenValue && tokenValue !== savedAuthTokenMasked && !tokenValue.startsWith('•')) {
      payload.authToken = tokenValue;
    }
    const result = await updateTwilioSettings(payload);
    setSaving(false);
    if (result.success) {
      showToast('Twilio settings saved successfully', 'success');
    } else {
      showToast(result.error || 'Failed to save settings', 'error');
    }
  };

  const handleTestSms = async () => {
    if (!testPhone.trim()) {
      showToast('Enter a phone number for the test SMS', 'warning');
      return;
    }
    setTesting(true);
    const result = await sendTwilioTestSms(testPhone.trim());
    setTesting(false);
    if (result.success) {
      showToast('Test SMS sent successfully', 'success');
    } else {
      showToast(result.error || 'Failed to send test SMS', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Settings2 size={20} className="text-emerald-800" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 font-sora">SMS Settings (Twilio)</h2>
            <p className="text-sm text-slate-500 mt-1">
              Configure Twilio once — donors automatically receive a thank-you SMS every time a collector submits a collection.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-slate-800">Enable donor SMS notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Send thank-you messages when a collector records a donation
              </p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Twilio Account SID</label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Twilio Auth Token</label>
              <input
                type="password"
                className="input-field text-sm"
                placeholder="Your auth token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1">Leave unchanged to keep the saved token</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Twilio From Number</label>
            <input
              type="text"
              className="input-field text-sm"
              placeholder="+923001234567"
              value={fromNumber}
              onChange={(e) => setFromNumber(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">Must be a Twilio-verified number in E.164 format</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Thank-you message template</label>
            <textarea
              className="input-field text-sm min-h-[120px] resize-y"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Placeholders: {'{name}'}, {'{donorName}'}, {'{amount}'}, {'{boxName}'}, {'{boxNumber}'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary bg-emerald-800 hover:bg-emerald-900 flex items-center gap-2">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-emerald-700" />
          <h3 className="text-sm font-semibold text-slate-900 font-sora">Send test SMS</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Save your Twilio credentials first, then send a test message to verify the setup.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="input-field text-sm flex-1"
            placeholder="Donor phone e.g. 03001234567"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
          <button
            type="button"
            onClick={handleTestSms}
            disabled={testing}
            className="btn-secondary flex items-center justify-center gap-2 sm:min-w-[160px]"
          >
            <Send size={16} />
            {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
        <p className="text-xs text-emerald-900 leading-relaxed">
          <strong>Example message:</strong> Thank you Ahmed Khan for your donation! Al-Najaat Foundation has
          received your amount: PKR 5,000. JazakAllah Khair!
        </p>
      </div>
    </div>
  );
}
