
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Assuming the server is already built in dist/index.js
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

serverProcess.stdout.on('data', (data) => {
    const chunks = data.toString().split('\n');

    for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        try {
            const msg = JSON.parse(chunk);
            console.log('Received Message ID:', msg.id, 'Method:', msg.method || 'Response');

            if (msg.id === 1) {
                // Initialized response received
                console.log('Initialization successful');

                // Send initialized notification
                serverProcess.stdin.write(JSON.stringify({
                    jsonrpc: "2.0",
                    method: "notifications/initialized"
                }) + '\n');

                // Request tools
                serverProcess.stdin.write(JSON.stringify({
                    jsonrpc: "2.0",
                    id: 2,
                    method: "tools/list"
                }) + '\n');
            } else if (msg.id === 2) {
                if (msg.error) {
                    console.error('Error fetching tools:', msg.error);
                } else {
                    console.log('Tools list received. Tool count:', msg.result.tools.length);
                    console.log('First tool:', msg.result.tools[0].name);
                }
                process.exit(0);
            }
        } catch (e) {
            // Ignore non-JSON lines (like logs)
        }
    }
});

serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
});

// Start the handshake
serverProcess.stdin.write(JSON.stringify(initMsg) + '\n');
