// AI Code Editor: Now in this file your creation of agent, running agent and conditions for the tools.

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import readline from 'readline';
import tools from './tool';

dotenv.config();

const ClaudeClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// So claude is stateless and zero-shot then we have to store all conversation context right now here itself
const ConversationContext = [];

async function runAgent() {

    process.on('SIGINT', () => {
        rl.close();
        process.exit(0);
    });

    while (true) {
        const userInput = await new Promise((resolve) => {
            rl.question('\nYou: ', (input) => {
                resolve(input);
            });
        });

        if(!userInput.trim()) continue;

        ConversationContext.push({
            role: 'user',
            content: userInput,
        });

        const agent = await ClaudeClient.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1000,
            messages: ConversationContext,
      
            tools: tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.input_schema,
            })),
        });

        for (const content of agent.content) {
            if (content.type === 'text') {
                console.log(content.text);
                ConversationContext.push({
                    role: 'assistant',
                    content: content.text,
                });
            }
            else if(content.type === 'tool_use'){
                const tool = tools.find(tool => tool.name ===content.name);
                if(!tool) continue;
                const result = await tool.execute(content.input);
                ConversationContext.push({
                    role: 'user',
                    content: [{
                        type: 'tool_result',
                        tool_use_id: content.id,
                        content: JSON.stringify(result),
                    }]
                })
            }
        }
    }
}

runAgent();