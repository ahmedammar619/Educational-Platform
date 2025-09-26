// Agora SDK initialization and utilities
import AgoraRTC from 'agora-rtc-sdk-ng';

// Initialize Agora RTC
export const initAgora = async () => {
  try {
    console.log('🎥 Initializing Agora RTC SDK...');
    console.log('Agora SDK Version:', AgoraRTC.VERSION);
    
    // Check if the SDK is available
    if (!AgoraRTC) {
      throw new Error('Agora RTC SDK not loaded');
    }
    
    console.log('✅ Agora RTC SDK initialized successfully');
    return AgoraRTC;
  } catch (error) {
    console.error('❌ Failed to initialize Agora RTC SDK:', error);
    throw error;
  }
};

// Check browser compatibility
export const checkBrowserSupport = () => {
  try {
    const requirements = AgoraRTC.checkSystemRequirements();
    console.log('🌐 Raw Browser Requirements:', requirements);
    
    // AgoraRTC.checkSystemRequirements() returns a boolean, not an object
    const support = {
      supported: requirements,
      browser: getBrowserName(),
      version: getBrowserVersion()
    };
    
    console.log('🌐 Browser Support Check:', support);
    return support;
  } catch (error) {
    console.error('❌ Failed to check browser support:', error);
    return {
      supported: false,
      browser: 'Unknown',
      version: 'Unknown'
    };
  }
};

// Helper function to get browser name
const getBrowserName = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
};

// Helper function to get browser version
const getBrowserVersion = () => {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
  return match ? match[2] : 'Unknown';
};

// Get device capabilities
export const getDeviceCapabilities = async () => {
  try {
    const devices = {
      cameras: await AgoraRTC.getCameras(),
      microphones: await AgoraRTC.getMicrophones(),
      speakers: await AgoraRTC.getPlaybackDevices()
    };
    
    console.log('📱 Device Capabilities:', devices);
    return devices;
  } catch (error) {
    console.error('❌ Failed to get device capabilities:', error);
    return {
      cameras: [],
      microphones: [],
      speakers: []
    };
  }
};

// Create Agora client
export const createAgoraClient = (mode = 'rtc', codec = 'vp8') => {
  try {
    const client = AgoraRTC.createClient({ mode, codec });
    console.log('🎯 Agora client created:', { mode, codec });
    return client;
  } catch (error) {
    console.error('❌ Failed to create Agora client:', error);
    throw error;
  }
};

// Create local tracks
export const createLocalTracks = async (audio = true, video = true) => {
  try {
    const tracks = {};
    
    if (audio) {
      tracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log('🎤 Audio track created');
    }
    
    if (video) {
      tracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
      console.log('📹 Video track created');
    }
    
    return tracks;
  } catch (error) {
    console.error('❌ Failed to create local tracks:', error);
    throw error;
  }
};

// Create screen share track
export const createScreenShareTrack = async () => {
  try {
    const screenTrack = await AgoraRTC.createScreenVideoTrack({
      screen: true,
      audio: false
    });
    console.log('🖥️ Screen share track created');
    return screenTrack;
  } catch (error) {
    console.error('❌ Failed to create screen share track:', error);
    throw error;
  }
};

// Export AgoraRTC for direct access
export { AgoraRTC };

// Default export
export default AgoraRTC;
