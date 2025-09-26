# 🎥 Agora Video Conferencing Integration

This document explains how to use the Agora video conferencing integration in your educational platform.

## 📋 Prerequisites

### 1. Agora Account Setup
- ✅ Agora App ID: `edcc36aa5c7e4c9a9aa8d59766e51f4d`
- ✅ Agora App Certificate: `92c0a7217ed147ebbdbb30c0c541b65d`
- ⚠️ **Missing**: Agora Customer ID and Certificate (for cloud recording)

### 2. Environment Variables
Add these to your backend `.env` file:
```env
# Agora Configuration (you have these)
AGORA_APP_ID=edcc36aa5c7e4c9a9aa8d59766e51f4d
AGORA_APP_CERTIFICATE=92c0a7217ed147ebbdbb30c0c541b65d

# Add these for cloud recording (get from Agora console)
AGORA_CUSTOMER_ID=your_customer_id_from_console
AGORA_CUSTOMER_CERTIFICATE=your_customer_secret_from_console

# R2 Storage for recordings (if not already configured)
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_ENDPOINT_URL=your_r2_endpoint_url
```

## 🚀 Getting Started

### 1. Test the SDK Integration
Visit: `http://localhost:3000/agora-test`

This will:
- ✅ Initialize the Agora SDK
- ✅ Check browser compatibility
- ✅ Detect available cameras/microphones
- ✅ Verify everything is working

### 2. Create an Agora Meeting
1. Navigate to any course
2. Click on the **"Agora"** tab (new tab alongside Zoom)
3. Click **"Create Meeting"**
4. Fill in meeting details:
   - Title (required)
   - Description (optional)
   - Date (required)
   - Time (required)
   - AM/PM period (required)

### 3. Join a Meeting
1. Find your meeting in the Agora tab
2. Click **"Join"** button
3. Allow camera/microphone permissions
4. You're now in the video meeting!

## 🎯 Features Available

### ✅ Video Conferencing
- **Video/Audio Controls**: Toggle camera and microphone on/off
- **Mute/Unmute**: Quick mute toggle
- **Screen Sharing**: Share your screen with participants
- **Participant Management**: See who's in the meeting

### ✅ Meeting Management
- **Create Meetings**: Teachers/admins can create meetings
- **Start/End Meetings**: Control meeting lifecycle
- **Cancel Meetings**: Cancel upcoming meetings
- **Join Meetings**: Students can join with secure tokens

### ✅ Cloud Recording (When Credentials Added)
- **Automatic Recording**: Starts when meeting starts
- **R2 Storage**: Recordings saved to your R2 bucket
- **Recording URLs**: Access recordings via signed URLs

### ✅ Attendance Integration
- **Automatic Tracking**: Attendance marked when students join
- **Notification System**: Notifications for absent students
- **Parent Notifications**: Parents notified of absences

## 🔧 Technical Details

### SDK Integration Methods

#### Method 1: NPM Package (Currently Used)
```javascript
import AgoraRTC from 'agora-rtc-sdk-ng';
```

#### Method 2: CDN Script (Alternative)
```html
<script src="https://web-cdn.agora.io/agora-rtc-sdk-ng/latest/AgoraRTC_N-4.19.0.js"></script>
```

### Key Components
- `AgoraTab.jsx` - Meeting management interface
- `AgoraMeetingRoom.jsx` - Video conferencing room
- `agoraService.js` - API communication
- `agora.js` - SDK utilities and initialization

### Security Features
- **Token-based Authentication**: Secure meeting access
- **Role-based Permissions**: Host vs attendee controls
- **Encrypted Communication**: All video/audio encrypted

## 🐛 Troubleshooting

### Common Issues

#### 1. "Browser not supported" Error
- **Solution**: Use Chrome 74+, Firefox 60+, Safari 12+, or Edge 79+

#### 2. "Failed to get device capabilities" Error
- **Solution**: Allow camera/microphone permissions

#### 3. "Agora SDK not loaded" Error
- **Solution**: Check that `agora-rtc-sdk-ng` is installed in package.json

#### 4. Recording not working
- **Solution**: Add `AGORA_CUSTOMER_ID` and `AGORA_CUSTOMER_CERTIFICATE` to environment variables

### Debug Steps
1. Check browser console for errors
2. Visit `/agora-test` to verify SDK integration
3. Check network tab for API calls
4. Verify environment variables are set

## 📚 API Endpoints

### Meeting Management
- `POST /api/agora` - Create meeting
- `GET /api/agora` - List meetings
- `GET /api/agora/:id` - Get meeting details
- `PATCH /api/agora/:id` - Update meeting
- `DELETE /api/agora/:id` - Delete meeting

### Meeting Actions
- `POST /api/agora/:id/start` - Start meeting
- `POST /api/agora/:id/end` - End meeting
- `POST /api/agora/:id/join` - Join meeting
- `POST /api/agora/:id/token` - Get meeting token

### Recording
- `GET /api/agora/:id/recording-status` - Get recording status

## 🎉 Success Indicators

When everything is working correctly, you should see:
- ✅ Agora tab appears in course materials
- ✅ Can create meetings successfully
- ✅ Can join meetings with video/audio
- ✅ Screen sharing works
- ✅ Participants can see each other
- ✅ Meeting controls work (mute, camera, etc.)

## 🔗 Useful Links

- [Agora Web SDK Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web)
- [Agora Console](https://console.agora.io/)
- [Browser Compatibility](https://docs.agora.io/en/video-calling/get-started/browser-support)

---

**Note**: The Zoom integration remains fully functional alongside Agora. You can use both systems as needed.
