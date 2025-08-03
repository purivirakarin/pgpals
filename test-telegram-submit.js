// Test script to simulate a Telegram photo submission
const fetch = require('node-fetch');

// Simulate a Telegram webhook message with photo and caption
const testMessage = {
  message: {
    message_id: 123,
    from: {
      id: 5554295689, // Use the telegram ID from the log
      username: "purivirakarin"
    },
    chat: {
      id: 5554295689
    },
    date: Math.floor(Date.now() / 1000),
    caption: "/submit test-quest-id-123", // Simulate quest submission
    photo: [
      {
        file_id: "test_file_id_1",
        file_unique_id: "test_unique_1",
        width: 320,
        height: 240,
        file_size: 12345
      },
      {
        file_id: "test_file_id_2",
        file_unique_id: "test_unique_2", 
        width: 640,
        height: 480,
        file_size: 23456
      }
    ]
  }
};

async function testSubmission() {
  try {
    console.log('Sending test photo submission...');
    
    const response = await fetch('http://localhost:3001/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ Test submission sent successfully');
    } else {
      console.log('❌ Test submission failed');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSubmission();
