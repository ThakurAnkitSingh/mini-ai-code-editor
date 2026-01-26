// AI Code Editor: Now in this file your creation of agent, running agent and conditions for the tools.

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const ClaudeClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// So claude is stateless and zero-shot then we have to store all conversation context right now here itself
const ConversationContext = [];

ConversationContext.push({
    role: 'user',
    content: 'Hey Claude, what is the currency of India and America? Also tell me the exchange rate of USD to INR.'
})

const agent = await ClaudeClient.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    messages: ConversationContext,
    max_tokens: 1000,
});
console.log('Claude Response:', agent.content[0].text);
