
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'dist', 'index.js');

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
const TODAY = "2025-12-30"; // Based on user metadata

serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const msg = JSON.parse(line);
            if (step === 0 && msg.id === 1) {
                step = 1;
                sendJsonRpc("notifications/initialized", {}, null);
                sendJsonRpc("tools/call", {
                    name: "get_tasks_by_date",
                    arguments: { date: TODAY }
                }, 2);
            } else if (step === 1 && msg.id === 2) {
                if (msg.error) {
                    console.error("Error:", msg.error);
                } else {
                    const text = msg.result.content[0].text;
                    // Extract JSON
                    const jsonStr = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
                    try {
                        const tasks = JSON.parse(jsonStr);
                        console.log(`Found ${tasks.length} tasks:`);
                        tasks.forEach(t => console.log(`- [${t.dueDate}] ${t.title}`));
                    } catch (e) {
                        console.log("Raw output:", text);
                    }
                }
                process.exit(0);
            }
        } catch (e) { }
    }
});

sendJsonRpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0" }
}, 1);
