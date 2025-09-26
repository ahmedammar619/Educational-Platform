import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Monitor, MonitorOff, Users, Settings, Maximize2, MessageSquare } from 'lucide-react';
import agoraService from '../../services/agoraService';
import { initAgora, createAgoraClient, createLocalTracks, createScreenShareTrack, checkBrowserSupport } from '../../utils/agora';

const AgoraMeetingRoom = ({ meetingId, user, onLeave }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Agora SDK refs
  const clientRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamsRef = useRef(new Map());
  const screenStreamRef = useRef(null);

  // Video elements refs
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});

  useEffect(() => {
    initializeMeeting();
    return () => {
      cleanup();
    };
  }, [meetingId]);

  const initializeMeeting = async () => {
    try {
      setLoading(true);
      
      // Get meeting info and tokens
      const [meetingData, tokenData] = await Promise.all([
        agoraService.getMeetingById(meetingId),
        agoraService.getMeetingToken(meetingId)
      ]);

      setMeetingInfo(meetingData);

      // Initialize Agora SDK
      const AgoraRTC = await initAgora();
      
      // Check browser support
      const browserSupport = checkBrowserSupport();
      console.log('🌐 Browser Support Result:', browserSupport);
      
      if (!browserSupport.supported) {
        const errorMessage = browserSupport.browser !== 'Unknown' 
          ? `Browser not supported. Please use ${browserSupport.browser} ${browserSupport.version} or higher.`
          : 'Browser not supported. Please use Chrome, Firefox, Safari, or Edge.';
        throw new Error(errorMessage);
      }

      clientRef.current = createAgoraClient('rtc', 'vp8');

      // Set up event listeners
      setupAgoraEventListeners();

      // Join the channel
      await joinChannel(tokenData);

      setIsJoined(true);
      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize meeting:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const setupAgoraEventListeners = () => {
    const client = clientRef.current;

    // User joined
    client.on('user-published', async (user, mediaType) => {
      console.log('User published:', user, mediaType);
      
      await client.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        const remoteVideoElement = document.createElement('div');
        remoteVideoElement.id = `remote-video-${user.uid}`;
        remoteVideoElement.className = 'relative bg-gray-900 rounded-lg overflow-hidden';
        remoteVideoElement.style.width = '100%';
        remoteVideoElement.style.height = '200px';
        
        const videoContainer = document.getElementById('remote-videos-container');
        if (videoContainer) {
          videoContainer.appendChild(remoteVideoElement);
        }
        
        user.videoTrack.play(remoteVideoElement);
        remoteVideosRef.current[user.uid] = remoteVideoElement;
      }
      
      if (mediaType === 'audio') {
        user.audioTrack.play();
      }
      
      setParticipants(prev => {
        const existing = prev.find(p => p.uid === user.uid);
        if (!existing) {
          return [...prev, { uid: user.uid, audio: mediaType === 'audio', video: mediaType === 'video' }];
        }
        return prev.map(p => 
          p.uid === user.uid 
            ? { ...p, audio: p.audio || mediaType === 'audio', video: p.video || mediaType === 'video' }
            : p
        );
      });
    });

    // User left
    client.on('user-unpublished', (user, mediaType) => {
      console.log('User unpublished:', user, mediaType);
      
      if (mediaType === 'video') {
        const videoElement = remoteVideosRef.current[user.uid];
        if (videoElement) {
          videoElement.remove();
          delete remoteVideosRef.current[user.uid];
        }
      }
      
      setParticipants(prev => 
        prev.map(p => 
          p.uid === user.uid 
            ? { ...p, audio: mediaType === 'audio' ? false : p.audio, video: mediaType === 'video' ? false : p.video }
            : p
        ).filter(p => p.audio || p.video)
      );
    });

    // User left channel
    client.on('user-left', (user) => {
      console.log('User left:', user);
      
      const videoElement = remoteVideosRef.current[user.uid];
      if (videoElement) {
        videoElement.remove();
        delete remoteVideosRef.current[user.uid];
      }
      
      setParticipants(prev => prev.filter(p => p.uid !== user.uid));
    });

    // Network quality
    client.on('network-quality', (stats) => {
      console.log('Network quality:', stats);
    });
  };

  const joinChannel = async (tokenData) => {
    const client = clientRef.current;
    const AgoraRTC = window.AgoraRTC;

    try {
      // Join the channel
      await client.join(
        tokenData.appId,
        tokenData.channelName,
        tokenData.rtcToken,
        tokenData.uid
      );

      // Create local tracks
      const tracks = await createLocalTracks(true, true);
      localStreamRef.current = tracks;

      // Play local video track
      if (localVideoRef.current && localStreamRef.current.videoTrack) {
        localStreamRef.current.videoTrack.play(localVideoRef.current);
      }

      // Publish local tracks
      const tracksToPublish = [];
      if (localStreamRef.current.audioTrack) tracksToPublish.push(localStreamRef.current.audioTrack);
      if (localStreamRef.current.videoTrack) tracksToPublish.push(localStreamRef.current.videoTrack);
      
      await client.publish(tracksToPublish);

      console.log('Successfully joined channel');
    } catch (error) {
      console.error('Failed to join channel:', error);
      throw error;
    }
  };

  const toggleVideo = async () => {
    if (!localStreamRef.current) return;

    try {
      if (localStreamRef.current?.videoTrack) {
        if (isVideoEnabled) {
          await localStreamRef.current.videoTrack.setEnabled(false);
          setIsVideoEnabled(false);
        } else {
          await localStreamRef.current.videoTrack.setEnabled(true);
          setIsVideoEnabled(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const toggleAudio = async () => {
    if (!localStreamRef.current) return;

    try {
      if (localStreamRef.current?.audioTrack) {
        if (isAudioEnabled) {
          await localStreamRef.current.audioTrack.setEnabled(false);
          setIsAudioEnabled(false);
        } else {
          await localStreamRef.current.audioTrack.setEnabled(true);
          setIsAudioEnabled(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  };

  const toggleMute = async () => {
    if (!localStreamRef.current) return;

    try {
      if (localStreamRef.current?.audioTrack) {
        if (isMuted) {
          await localStreamRef.current.audioTrack.unmute();
          setIsMuted(false);
        } else {
          await localStreamRef.current.audioTrack.mute();
          setIsMuted(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const toggleScreenShare = async () => {
    try {
      const AgoraRTC = window.AgoraRTC;

      if (!isScreenSharing) {
        // Start screen sharing
        screenStreamRef.current = await createScreenShareTrack();

        // Stop and unpublish local video track
        if (localStreamRef.current?.videoTrack) {
          await clientRef.current.unpublish([localStreamRef.current.videoTrack]);
          await localStreamRef.current.videoTrack.close();
        }

        // Publish screen share
        await clientRef.current.publish(screenStreamRef.current);
        setIsScreenSharing(true);
      } else {
        // Stop screen sharing
        if (screenStreamRef.current) {
          await clientRef.current.unpublish([screenStreamRef.current]);
          await screenStreamRef.current.close();
          screenStreamRef.current = null;
        }

        // Resume local video
        const newVideoTrack = await createLocalTracks(false, true);
        if (newVideoTrack.videoTrack) {
          localStreamRef.current.videoTrack = newVideoTrack.videoTrack;
          await clientRef.current.publish(newVideoTrack.videoTrack);
          
          // Update video element
          if (localVideoRef.current) {
            newVideoTrack.videoTrack.play(localVideoRef.current);
          }
        }

        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  };

  const leaveMeeting = async () => {
    try {
      if (clientRef.current) {
        if (localStreamRef.current) {
          localStreamRef.current.close();
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.close();
        }
        await clientRef.current.leave();
      }
      
      // Notify backend that user left
      await agoraService.joinMeeting(meetingId, user.id, meetingInfo?.courseId);
      
      onLeave();
    } catch (error) {
      console.error('Failed to leave meeting:', error);
      onLeave(); // Still call onLeave even if there's an error
    }
  };

  const cleanup = () => {
    if (localStreamRef.current?.audioTrack) {
      localStreamRef.current.audioTrack.close();
    }
    if (localStreamRef.current?.videoTrack) {
      localStreamRef.current.videoTrack.close();
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.close();
    }
    if (clientRef.current) {
      clientRef.current.leave();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Joining meeting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">Failed to Join Meeting</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={onLeave}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-xl font-semibold">
            {meetingInfo?.title || 'Agora Meeting'}
          </h1>
          <div className="flex items-center space-x-2 text-gray-300">
            <Users className="w-4 h-4" />
            <span>{participants.length + 1} participants</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleScreenShare}
            className={`p-2 rounded-lg transition-colors ${
              isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>
          
          <button
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <div
                ref={localVideoRef}
                className="w-full h-full"
                style={{ minHeight: '200px' }}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {user.firstName} {user.lastName} (You)
                {!isVideoEnabled && <span className="ml-2">📹❌</span>}
                {!isAudioEnabled && <span className="ml-2">🎤❌</span>}
              </div>
            </div>

            {/* Remote Videos */}
            <div id="remote-videos-container" className="contents">
              {participants.map((participant) => (
                <div
                  key={participant.uid}
                  id={`remote-video-${participant.uid}`}
                  className="relative bg-gray-800 rounded-lg overflow-hidden"
                  style={{ minHeight: '200px' }}
                >
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    User {participant.uid}
                    {!participant.video && <span className="ml-2">📹❌</span>}
                    {!participant.audio && <span className="ml-2">🎤❌</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Chat */}
          <div className="flex-1 p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat
            </h3>
            <div className="bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
              <p className="text-gray-400 text-sm text-center">Chat feature coming soon...</p>
            </div>
          </div>

          {/* Participants */}
          <div className="p-4 border-t border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Participants ({participants.length + 1})
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <span>{user.firstName} {user.lastName} (You)</span>
              </div>
              {participants.map((participant) => (
                <div key={participant.uid} className="flex items-center space-x-3 text-gray-300">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm">
                    {participant.uid.slice(-2)}
                  </div>
                  <span>User {participant.uid}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center space-x-4">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full transition-colors ${
            isMuted ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${
            !isVideoEnabled ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={!isVideoEnabled ? 'Turn on camera' : 'Turn off camera'}
        >
          {!isVideoEnabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
        </button>

        <button
          onClick={leaveMeeting}
          className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          title="Leave meeting"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default AgoraMeetingRoom;
