'use client';

import { useState } from 'react';

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  config?: any;
}

export default function EmailTestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  const runTest = async (testType: string) => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          testType, 
          recipientEmail: recipientEmail || undefined 
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            📧 Email System Test
          </h1>

          <div className="space-y-6">
            {/* Configuration Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">1. Configuration Test</h2>
              <p className="text-gray-600 mb-3">
                Check if email configuration is properly set up.
              </p>
              <button
                onClick={() => runTest('config')}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                {loading ? 'Testing...' : 'Test Configuration'}
              </button>
            </div>

            {/* Connection Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">2. Gmail Connection Test</h2>
              <p className="text-gray-600 mb-3">
                Test OAuth2 connection to Gmail servers.
              </p>
              <button
                onClick={() => runTest('connection')}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                {loading ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {/* Email Sending Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">3. Email Sending Test</h2>
              <p className="text-gray-600 mb-3">
                Send a test email to verify end-to-end functionality.
              </p>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email:
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter email address to test"
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => runTest('basic')}
                disabled={loading || !recipientEmail}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>

            {/* Results */}
            {testResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Test Results</h2>
                <div className={`p-4 rounded-md ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center mb-2">
                    <span className={`text-lg mr-2 ${
                      testResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testResult.success ? '✅' : '❌'}
                    </span>
                    <span className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? 'Success!' : 'Failed'}
                    </span>
                  </div>
                  
                  {testResult.message && (
                    <p className={`mb-2 ${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResult.message}
                    </p>
                  )}
                  
                  {testResult.error && (
                    <p className="text-red-700 font-mono text-sm bg-red-100 p-2 rounded">
                      {testResult.error}
                    </p>
                  )}
                  
                  {testResult.config && (
                    <div className="mt-3">
                      <h4 className="font-medium text-gray-800 mb-2">Configuration:</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        {JSON.stringify(testResult.config, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">💡 Testing Instructions</h3>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• <strong>Configuration Test:</strong> Verifies environment variables are set correctly</li>
                <li>• <strong>Connection Test:</strong> Tests OAuth2 authentication with Gmail</li>
                <li>• <strong>Email Test:</strong> Sends an actual test email to verify end-to-end functionality</li>
                <li>• Make sure you&apos;re logged in as an admin user to access these tests</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
