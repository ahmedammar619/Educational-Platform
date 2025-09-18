#!/usr/bin/env node

/**
 * Get Zoom cloud recordings for September 18, 2025
 */

const http = require('http');

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getZoomRecordings() {
  try {
    console.log('🔍 Getting Zoom cloud recordings for September 18, 2025...');
    console.log('='.repeat(60));
    
    // Get recordings from Zoom cloud for today (2025-09-18)
    const response = await makeRequest('http://localhost:3000/api/zoom/recording-test/get-all-zoom-recordings');
    
    if (response.status === 200 && response.data.success) {
      const recordings = response.data.data.meetings || [];
      
      // Filter recordings for September 18, 2025
      const todayRecordings = recordings.filter(meeting => {
        const meetingDate = new Date(meeting.start_time).toISOString().split('T')[0];
        return meetingDate === '2025-09-18';
      });
      
      console.log(`📊 Total recordings in Zoom cloud: ${recordings.length}`);
      console.log(`📅 Recordings from September 18, 2025: ${todayRecordings.length}`);
      console.log('');
      
      if (todayRecordings.length > 0) {
        console.log('📋 Meetings from September 18, 2025:');
        console.log('='.repeat(60));
        
        todayRecordings.forEach((meeting, index) => {
          const startTime = new Date(meeting.start_time);
          const duration = meeting.duration || 0;
          const recordingCount = meeting.recording_files ? meeting.recording_files.length : 0;
          
          console.log(`${index + 1}. 📹 ${meeting.topic}`);
          console.log(`   🆔 Meeting ID: ${meeting.id}`);
          console.log(`   🕐 Start Time: ${startTime.toLocaleString()}`);
          console.log(`   ⏱️  Duration: ${duration} minutes`);
          console.log(`   🎬 Recording Files: ${recordingCount}`);
          console.log(`   👤 Host ID: ${meeting.host_id}`);
          
          if (meeting.recording_files && meeting.recording_files.length > 0) {
            console.log('   📁 Recording Files:');
            meeting.recording_files.forEach(file => {
              const sizeInMB = Math.round(file.file_size / 1024 / 1024);
              console.log(`      - ${file.recording_type} (${file.file_type}) - ${sizeInMB}MB`);
              console.log(`        Status: ${file.status}`);
              console.log(`        Download Available: ${file.download_url ? '✅ Yes' : '❌ No'}`);
            });
          }
          console.log('');
        });
        
        // Summary
        console.log('📊 Summary:');
        console.log('='.repeat(40));
        const totalDuration = todayRecordings.reduce((sum, meeting) => sum + (meeting.duration || 0), 0);
        const totalFiles = todayRecordings.reduce((sum, meeting) => sum + (meeting.recording_files ? meeting.recording_files.length : 0), 0);
        
        console.log(`📅 Date: September 18, 2025`);
        console.log(`🎯 Total Meetings: ${todayRecordings.length}`);
        console.log(`⏱️  Total Duration: ${totalDuration} minutes (${Math.round(totalDuration / 60 * 10) / 10} hours)`);
        console.log(`📁 Total Recording Files: ${totalFiles}`);
        
      } else {
        console.log('📅 No recordings found for September 18, 2025');
        console.log('');
        console.log('🔍 Recent recordings available:');
        console.log('='.repeat(40));
        recordings.slice(0, 10).forEach((meeting, index) => {
          const startTime = new Date(meeting.start_time);
          console.log(`${index + 1}. ${meeting.topic} - ${startTime.toDateString()}`);
        });
      }
    } else {
      console.log('❌ Failed to get Zoom recordings:', response.data);
    }
  } catch (error) {
    console.log('❌ Error getting Zoom recordings:', error.message);
  }
}

async function main() {
  await getZoomRecordings();
}

if (require.main === module) {
  main().catch(console.error);
}
