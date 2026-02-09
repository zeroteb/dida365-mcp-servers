
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DIDA365_TOKEN = process.env.DIDA365_TOKEN;
const DIDA365_BASE_URL = process.env.DIDA365_API_URL || "https://api.dida365.com/open/v1";

const api = axios.create({
    baseURL: DIDA365_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Authorization: DIDA365_TOKEN,
    },
});

async function main() {
    try {
        console.log("Testing GET /project/inbox/data ...");
        try {
            const inboxRes = await api.get('/project/inbox/data');
            console.log("Inbox tasks count:", inboxRes.data.tasks ? inboxRes.data.tasks.length : 0);
            if (inboxRes.data.tasks && inboxRes.data.tasks.length > 0) {
                console.log("First inbox task:", JSON.stringify(inboxRes.data.tasks[0], null, 2));
            }
        } catch (e) {
            console.log("GET /project/inbox/data failed:", e.response ? e.response.status : e.message);
        }

        console.log("\nTesting GET /task (if exists) ...");
        try {
            const allTaskRes = await api.get('/task');
            // Check if this endpoint works and what it returns (Array? Object with tasks?)
            console.log("GET /task status:", allTaskRes.status);
            console.log("GET /task data type:", typeof allTaskRes.data);
            if (Array.isArray(allTaskRes.data)) {
                console.log("GET /task is array, length:", allTaskRes.data.length);
            } else if (allTaskRes.data.tasks) {
                console.log("GET /task has .tasks, length:", allTaskRes.data.tasks.length);
            } else {
                console.log("GET /task data sample:", JSON.stringify(allTaskRes.data).substring(0, 200));
            }
        } catch (e) {
            console.log("GET /task failed:", e.response ? e.response.status : e.message);
        }

    } catch (e) {
        console.error("Global Error:", e);
    }
}

main();
