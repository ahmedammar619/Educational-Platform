#!/usr/bin/env node

/**
 * Script to check what meetings exist in the database
 * This will help us understand why webhook processing fails
 */

const { createConnection } = require('typeorm');
const path = require('path');

// Import the ZoomMeeting entity
const ZoomMeeting = require('../dist/modules/zoom/entities/zoom-meeting.entity.js').ZoomMeeting;

async function checkDatabaseMeetings() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    
    // Create database connection
    connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'education_dev_db',
      entities: [ZoomMeeting],
      synchronize: false,
      logging: false,
    });
    
    console.log('✅ Connected to database');
    
    // Get all meetings
    const meetings = await connection.getRepository(ZoomMeeting).find({
      relations: ['course', 'createdBy']
    });
    
    console.log(`\n📊 Database Meetings Summary:`);
    console.log(`   Total meetings: ${meetings.length}`);
    
    if (meetings.length === 0) {
      console.log('\n❌ NO MEETINGS FOUND IN DATABASE!');
      console.log('   This explains why webhook processing fails.');
      console.log('   The webhook looks for meeting ID "88982449475" but it doesn\'t exist.');
      return;
    }
    
    console.log('\n📋 All Meetings in Database:');
    console.log('='.repeat(80));
    
    meetings.forEach((meeting, index) => {
      console.log(`\n${index + 1}. Meeting: ${meeting.title}`);
      console.log(`   ID: ${meeting.id}`);
      console.log(`   Zoom Meeting ID: ${meeting.zoomMeetingId}`);
      console.log(`   Status: ${meeting.status}`);
      console.log(`   Recording Status: ${meeting.recordingStatus || 'Not set'}`);
      console.log(`   Created: ${meeting.createdAt}`);
      console.log(`   Start Time: ${meeting.startTime}`);
      console.log(`   Duration: ${meeting.duration} minutes`);
      
      if (meeting.course) {
        console.log(`   Course: ${meeting.course.name}`);
      }
      
      if (meeting.createdBy) {
        console.log(`   Created By: ${meeting.createdBy.firstName} ${meeting.createdBy.lastName}`);
      }
      
      // Check if this is our target meeting
      if (meeting.zoomMeetingId === '88982449475') {
        console.log(`   🎯 THIS IS OUR TARGET MEETING!`);
      }
    });
    
    // Check specifically for our target meeting
    const targetMeeting = meetings.find(m => m.zoomMeetingId === '88982449475');
    
    if (targetMeeting) {
      console.log('\n✅ TARGET MEETING FOUND IN DATABASE!');
      console.log(`   Meeting ID: ${targetMeeting.id}`);
      console.log(`   Title: ${targetMeeting.title}`);
      console.log(`   Status: ${targetMeeting.status}`);
      console.log(`   Recording Status: ${targetMeeting.recordingStatus || 'Not set'}`);
    } else {
      console.log('\n❌ TARGET MEETING NOT FOUND IN DATABASE!');
      console.log('   Meeting ID "88982449475" does not exist in database.');
      console.log('   This is why webhook processing fails.');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
if (require.main === module) {
  checkDatabaseMeetings().catch(console.error);
}

module.exports = { checkDatabaseMeetings };
