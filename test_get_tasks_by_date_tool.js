
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'dist', 'index.js');

if (!fs.existsSync(serverPath)) {
    console.error(`Server executable not found at ${serverPath}`);
    process.exit(1);
}

const serverProcess = spawn('node', [serverPath], {
    env: process.env,
    stdio: ['pipe', 'pipe', 'inherit']
});

const sendJsonRpc = (method, params, id) => {
    const msg = {
        jsonrpc: "2.0",
        id,
        method,
        params
    };
    serverProcess.stdin.write(JSON.stringify(msg) + '\n');
};

let step = 0;
// Steps:
// 0: initialize
// 1: initialized notification
// 2: call tool get_tasks_by_date
// 3: exit

serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const msg = JSON.parse(line);
            // console.log("Received:", JSON.stringify(msg).substring(0, 100));

            if (step === 0 && msg.id === 1) {
                console.log("Initialized.");
                step = 1;
                // Send initialized
                sendJsonRpc("notifications/initialized", {}, null);

                // Call the tool
                console.log("Invoking get_tasks_by_date for 2025-12-30...");
                step = 2;
                sendJsonRpc("tools/call", {
                    name: "get_tasks_by_date",
                    arguments: {
                        date: "2025-12-30"
                    }
                }, 2);
            } else if (step === 2 && msg.id === 2) {
                if (msg.error) {
                    console.error("Tool execution failed:", msg.error);
                } else {
                    const content = msg.result.content[0].text;
                    console.log("Tool execution success!");
                    console.log("Result content length:", content.length);
                    console.log("Result snippet:", content.substring(0, 500));
                }
                process.exit(0);
            }

        } catch (e) {
            // console.log("Non-JSON output:", line);
        }
    }
});

// Start handshake
sendJsonRpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0" }
}, 1);

setTimeout(() => {
    console.log("Timeout waiting for response.");
    process.exit(1);
}, 10000);
