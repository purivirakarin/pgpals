'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Send, Settings } from 'lucide-react';

export default function TelegramDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [initDataParsed, setInitDataParsed] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from PGPals bot! 🤖');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Read Telegram Mini App initData on mount
  useEffect(() => {
    try {
      const anyWindow = window as any;
      const tg = anyWindow?.Telegram?.WebApp;
      const raw = tg?.initData || tg?.initDataUnsafe ? tg.initData : null;
      setInitData(raw || null);
      // Parse similar to SDK's retrieveLaunchParams behavior
      const unsafe = tg?.initDataUnsafe || {};
      setInitDataParsed(unsafe || null);
    } catch {
      setInitData(null);
      setInitDataParsed(null);
    }
  }, []);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/debug');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Failed to fetch debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!chatId || !testMessage) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: testMessage })
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Failed to send test message:', error);
      setTestResult({ error: 'Failed to send test message', details: error });
    } finally {
      setLoading(false);
    }
  };

  const sendQuickTest = async () => {
    if (!chatId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Failed to send quick test:', error);
      setTestResult({ error: 'Failed to send quick test', details: error });
    } finally {
      setLoading(false);
    }
  };

  const setWebhook = async () => {
    if (!webhookUrl) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });
      const data = await response.json();
      setWebhookResult(data);
    } catch (error) {
      console.error('Failed to set webhook:', error);
      setWebhookResult({ error: 'Failed to set webhook', details: error });
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/set-webhook', {
        method: 'DELETE'
      });
      const data = await response.json();
      setWebhookResult(data);
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      setWebhookResult({ error: 'Failed to delete webhook', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Telegram Bot Debug</h1>
        <p className="text-gray-600">Debug and test your Telegram bot configuration</p>
      </div>

      {/* Debug Info Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Bot Configuration</h2>
          <button
            onClick={fetchDebugInfo}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Loading...' : 'Check Status'}
          </button>
        </div>

        {/* Init Data Viewer */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Telegram Init Data</h3>
          {!initData && (
            <p className="text-sm text-gray-600">No initData detected. Open this page inside Telegram Mini App.</p>
          )}
          {initData && (
            <>
              <div className="mb-2 text-sm text-gray-700"><span className="font-semibold">initDataRaw</span></div>
              <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto break-all whitespace-pre-wrap">
                {initData}
              </pre>
            </>
          )}
          {initDataParsed && (
            <div className="mt-3">
              <div className="mb-2 text-sm text-gray-700"><span className="font-semibold">initData (parsed)</span></div>
              <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                {JSON.stringify(initDataParsed, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {debugInfo && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Environment</h3>
                <div className="space-y-1 text-sm">
                  <p>Token: {debugInfo.environment?.hasToken ? '✅ Present' : '❌ Missing'}</p>
                  <p>NextAuth URL: {debugInfo.environment?.nextAuthUrl || '❌ Not set'}</p>
                  <p>Token working: {debugInfo.tokenWorking ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Bot Info</h3>
                {debugInfo.botInfo ? (
                  <div className="space-y-1 text-sm">
                    <p>Name: {debugInfo.botInfo.first_name}</p>
                    <p>Username: @{debugInfo.botInfo.username}</p>
                    <p>ID: {debugInfo.botInfo.id}</p>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">Failed to get bot info</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Webhook Info</h3>
              {debugInfo.webhookInfo ? (
                <div className="space-y-1 text-sm">
                  <p>URL: {debugInfo.webhookInfo.url || 'Not set'}</p>
                  <p>Pending updates: {debugInfo.webhookInfo.pending_update_count || 0}</p>
                  <p>Last error: {debugInfo.webhookInfo.last_error_message || 'None'}</p>
                </div>
              ) : (
                <p className="text-red-600 text-sm">Failed to get webhook info</p>
              )}
            </div>

            {debugInfo.recentUpdates?.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Recent Updates</h3>
                <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                  {JSON.stringify(debugInfo.recentUpdates, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Webhook Management */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Webhook Management</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/api/telegram/webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              For local development, use ngrok or similar tunneling service
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={setWebhook}
              disabled={loading || !webhookUrl}
              className="btn-primary flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Set Webhook
            </button>
            <button
              onClick={deleteWebhook}
              disabled={loading}
              className="btn-secondary"
            >
              Delete Webhook
            </button>
          </div>

          {webhookResult && (
            <div className={`p-4 rounded-lg ${webhookResult.error ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center">
                {webhookResult.error ? (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                )}
                <span className={webhookResult.error ? 'text-red-800' : 'text-green-800'}>
                  {webhookResult.error || webhookResult.message || 'Webhook updated successfully'}
                </span>
              </div>
              {webhookResult.details && (
                <p className="text-sm mt-2 text-gray-600">{webhookResult.details}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Test Message */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Test Message</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Enter your Telegram chat ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Send a message to your bot, then check the debug info above to get your chat ID
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Message
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={sendQuickTest}
              disabled={loading || !chatId}
              className="btn-primary flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Quick Test
            </button>
            <button
              onClick={sendTestMessage}
              disabled={loading || !chatId || !testMessage}
              className="btn-secondary flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Custom Message
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.error ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center">
                {testResult.error ? (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                )}
                <span className={testResult.error ? 'text-red-800' : 'text-green-800'}>
                  {testResult.error || 'Test message sent successfully!'}
                </span>
              </div>
              {testResult.details && (
                <p className="text-sm mt-2 text-gray-600">{testResult.details}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 card p-6 bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Troubleshooting Steps</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>1. <strong>Check bot status:</strong> Click &quot;Check Status&quot; to verify your bot token is working</li>
          <li>2. <strong>For local development:</strong> Use ngrok to create a public URL for your local server</li>
          <li>3. <strong>Set webhook:</strong> Enter your public URL + /api/telegram/webhook and click &quot;Set Webhook&quot;</li>
          <li>4. <strong>Test bot:</strong> Send a message to your bot and check if it appears in recent updates</li>
          <li>5. <strong>Debug responses:</strong> Check your console logs for webhook activity</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p className="text-sm font-medium text-blue-900">Local Development Setup:</p>
          <code className="block text-xs mt-1 text-blue-800">
            # Install ngrok<br/>
            npm install -g ngrok<br/>
            <br/>
            # In one terminal, start your Next.js app<br/>
            npm run dev<br/>
            <br/>
            # In another terminal, expose your local server<br/>
            ngrok http 3000<br/>
            <br/>
            # Use the ngrok URL in webhook setup above
          </code>
        </div>
      </div>
    </div>
  );
}