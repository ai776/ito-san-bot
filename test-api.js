// テスト用スクリプト - Vercel環境のAPIをテスト
const axios = require('axios');

const VERCEL_URL = 'https://yamamoto-ai-chatbot-jhk71xb6x-ailaboteam-gmailcoms-projects.vercel.app';

async function testChat() {
  try {
    // 1回目のメッセージ
    console.log('=== 1回目のメッセージ送信 ===');
    const response1 = await axios.post(`${VERCEL_URL}/api/chat`, {
      message: 'こんにちは',
      conversation_id: null
    });

    console.log('Response 1:', {
      answer: response1.data.answer?.substring(0, 50) + '...',
      conversation_id: response1.data.conversation_id
    });

    const conversationId = response1.data.conversation_id;

    // 2秒待つ
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2回目のメッセージ
    console.log('\n=== 2回目のメッセージ送信 ===');
    console.log('Using conversation_id:', conversationId);

    const response2 = await axios.post(`${VERCEL_URL}/api/chat`, {
      message: '外注の使い方を教えて',
      conversation_id: conversationId
    });

    console.log('Response 2:', {
      answer: response2.data.answer?.substring(0, 50) + '...',
      conversation_id: response2.data.conversation_id
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

testChat();
