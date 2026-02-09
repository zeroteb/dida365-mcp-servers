
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serverProcess = spawn('node', ['dist/index.js'], {
    env: process.env,
    stdio: ['pipe', 'pipe', 'inherit']
});

const initMsg = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0" }
    }
};

const callToolMsg = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
        name: "get_projects",
        arguments: {}
    }
};

serverProcess.stdout.on('data', (data) => {
    const chunks = data.toString().split('\n');

    for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        try {
            const msg = JSON.parse(chunk);
            // console.log('DEBUG: Received:', JSON.stringify(msg).slice(0, 100) + '...');

            if (msg.id === 1) {
                console.log('✅ Initialization successful');

                // Send initialized notification
                serverProcess.stdin.write(JSON.stringify({
                    jsonrpc: "2.0",
                    method: "notifications/initialized"
                }) + '\n');

                console.log('⏳ Calling tool: get_projects...');
                // Call the tool
                serverProcess.stdin.write(JSON.stringify(callToolMsg) + '\n');
            } else if (msg.id === 2) {
                if (msg.error) {
                    console.error('❌ Tool call failed:', JSON.stringify(msg.error, null, 2));
                } else {
                    console.log('✅ Tool call successful!');
                    console.log('--- Result ---');
                    // The result content is usually a stringified JSON inside a text block, let's try to parse it specifically for this tool
                    try {
                        const contentText = msg.result.content[0].text;
                        // The tool implementation returns "项目列表: [...]"
                        console.log(contentText);
                    } catch (err) {
                        console.log(JSON.stringify(msg.result, null, 2));
                    }
                    console.log('--------------');
                }
                process.exit(0);
            }
        } catch (e) {
            // Ignore non-JSON lines
        }
    }
});

serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
});

// Start the handshake
serverProcess.stdin.write(JSON.stringify(initMsg) + '\n');
