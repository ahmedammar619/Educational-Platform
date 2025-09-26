import { useState, useEffect } from 'react';
import { initAgora, checkBrowserSupport, getDeviceCapabilities } from '../../utils/agora';

const AgoraTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdkInfo, setSdkInfo] = useState(null);
  const [browserSupport, setBrowserSupport] = useState(null);
  const [devices, setDevices] = useState(null);

  useEffect(() => {
    testAgoraSDK();
  }, []);

  const testAgoraSDK = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize Agora SDK
      const AgoraRTC = await initAgora();
      
      // Get SDK info
      setSdkInfo({
        version: AgoraRTC.VERSION,
        build: AgoraRTC.BUILD,
        mode: 'RTC'
      });

      // Check browser support
      const support = checkBrowserSupport();
      setBrowserSupport(support);

      // Get device capabilities
      const deviceCapabilities = await getDeviceCapabilities();
      setDevices(deviceCapabilities);

      console.log('✅ Agora SDK test completed successfully');
    } catch (err) {
      console.error('❌ Agora SDK test failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Testing Agora SDK...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">SDK Test Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={testAgoraSDK}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Agora SDK Test Successful!</h1>
            <p className="text-gray-600">Your Agora Web SDK is properly integrated and working.</p>
          </div>

          {/* SDK Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">SDK Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">Version:</span>
                  <span className="font-mono text-blue-900">{sdkInfo?.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Build:</span>
                  <span className="font-mono text-blue-900">{sdkInfo?.build}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Mode:</span>
                  <span className="font-mono text-blue-900">{sdkInfo?.mode}</span>
                </div>
              </div>
            </div>

            {/* Browser Support */}
            <div className={`rounded-lg p-6 ${browserSupport?.supported ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${browserSupport?.supported ? 'text-green-900' : 'text-red-900'}`}>
                Browser Support
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={browserSupport?.supported ? 'text-green-700' : 'text-red-700'}>Supported:</span>
                  <span className={`font-semibold ${browserSupport?.supported ? 'text-green-900' : 'text-red-900'}`}>
                    {browserSupport?.supported ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={browserSupport?.supported ? 'text-green-700' : 'text-red-700'}>Browser:</span>
                  <span className={`font-mono ${browserSupport?.supported ? 'text-green-900' : 'text-red-900'}`}>
                    {browserSupport?.browser}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={browserSupport?.supported ? 'text-green-700' : 'text-red-700'}>Version:</span>
                  <span className={`font-mono ${browserSupport?.supported ? 'text-green-900' : 'text-red-900'}`}>
                    {browserSupport?.version}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Device Capabilities */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Capabilities</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">📹 Cameras</h4>
                <div className="text-2xl font-bold text-blue-600">{devices?.cameras?.length || 0}</div>
                <p className="text-sm text-gray-500">Available cameras</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">🎤 Microphones</h4>
                <div className="text-2xl font-bold text-green-600">{devices?.microphones?.length || 0}</div>
                <p className="text-sm text-gray-500">Available microphones</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">🔊 Speakers</h4>
                <div className="text-2xl font-bold text-purple-600">{devices?.speakers?.length || 0}</div>
                <p className="text-sm text-gray-500">Available speakers</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">🚀 Next Steps</h3>
            <div className="space-y-2 text-blue-800">
              <p>✅ Agora SDK is properly integrated</p>
              <p>✅ Browser compatibility verified</p>
              <p>✅ Device capabilities detected</p>
              <p>🎯 Ready to create and join Agora meetings!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgoraTest;
