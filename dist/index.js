import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListResourcesRequestSchema, ListToolsRequestSchema, McpError, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";
// 加载环境变量
dotenv.config();
// 滴答清单API基础配置
const DIDA365_BASE_URL = process.env.DIDA365_API_URL || "https://api.dida365.com/open/v1";
const DIDA365_TOKEN = process.env.DIDA365_TOKEN;
const DIDA365_COOKIE = process.env.COOKIE; // v2 API Cookie 认证
const DIDA365_V2_BASE_URL = "https://api.ticktick.com/api/v2";
if (!DIDA365_TOKEN) {
    console.error("Error: DIDA365_TOKEN not found in environment variables");
    process.exit(1);
}
// 创建 v2 API axios 实例 (Cookie 认证)
const dida365ApiV2 = axios.create({
    baseURL: DIDA365_V2_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "Cookie": `t=${DIDA365_COOKIE}`,
    },
});
// 创建axios实例
const dida365Api = axios.create({
    baseURL: DIDA365_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Authorization: DIDA365_TOKEN,
    },
});
// 创建服务器实例
const server = new Server({
    name: "dida365-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
// 工具列表
// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "create_task",
                description: "Create a new task in Dida365 with specified details including title, project ID, content, due date and priority. The task will be created under the specified project. Requires at least title and projectId. Returns the created task details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "The title/name of the task (required)",
                        },
                        projectId: {
                            type: "string",
                            description: "The ID of the project where this task belongs (required)",
                        },
                        content: {
                            type: "string",
                            description: "Detailed description/content of the task",
                        },
                        dueDate: {
                            type: "string",
                            description: "Due date in ISO 8601 format (e.g., 2023-12-31T23:59:59Z)",
                        },
                        priority: {
                            type: "number",
                            description: "Priority level from 0 (none) to 5 (highest)",
                        },
                    },
                    required: ["title", "projectId"],
                },
            },
            {
                name: "get_task_by_projectId_and_taskId",
                description: "Retrieve a specific task's details by providing both the project ID and task ID. Returns complete task information including title, content, status, due date, priority, and subtasks if any.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "The ID of the project containing the task (required)"
                        },
                        taskId: {
                            type: "string",
                            description: "The ID of the task to retrieve (required)"
                        }
                    },
                    required: ["projectId", "taskId"]
                }
            },
            {
                name: "get_tasks_by_projectId",
                description: "Get all tasks belonging to a specific project by project ID. Returns a list of tasks with their basic information. Useful for viewing all tasks in a project.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "The ID of the project whose tasks you want to list (required)",
                        },
                    },
                    required: ["projectId"],
                },
            },
            {
                name: "update_task",
                description: "Modify an existing task's properties. Can update title, content, due date, priority or status. At least taskId is required. Returns the updated task details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "The ID of the task to update (required)",
                        },
                        title: {
                            type: "string",
                            description: "New title for the task",
                        },
                        content: {
                            type: "string",
                            description: "New content/description for the task",
                        },
                        dueDate: {
                            type: "string",
                            description: "New due date in ISO 8601 format",
                        },
                        priority: {
                            type: "number",
                            description: "Updated priority level (0-5)",
                        },
                        status: {
                            type: "number",
                            description: "Task completion status (0: incomplete, 1: complete)",
                        },
                    },
                    required: ["taskId"],
                },
            },
            {
                name: "delete_task",
                description: "Permanently delete a task from a project. Requires both task ID and project ID for confirmation. Returns success message upon deletion.",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "The ID of the task to delete (required)",
                        },
                        projectId: {
                            type: "string",
                            description: "The ID of the project containing the task (required)"
                        }
                    },
                    required: ["taskId", "projectId"],
                },
            },
            {
                name: "complete_task",
                description: "Mark a task as completed. Requires both task ID and project ID. Updates the task's status to completed and sets completion timestamp.",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "The ID of the task to mark as complete (required)",
                        },
                        projectId: {
                            type: "string",
                            description: "The ID of the project containing the task (required)"
                        }
                    },
                    required: ["taskId", "projectId"],
                },
            },
            {
                name: "get_projects",
                description: "Retrieve a list of all projects in the Dida365 account. Returns project details including ID, name, color, view mode and sort order. No parameters required.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
                required: [],
            },
            {
                name: "get_project_by_projectId",
                description: "Get detailed information about a specific project by its ID. Returns project metadata including name, color, view mode, kind and sort order.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "The ID of the project to retrieve (required)"
                        }
                    },
                    required: ["projectId"]
                }
            },
            {
                name: "create_project",
                description: "Create a new project in Dida365. Requires at least a project name. Can specify color, view mode, kind and sort order. Returns the created project details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the new project (required)",
                        },
                        color: {
                            type: "string",
                            description: 'Hex color code for the project (e.g., "#F18181")',
                        },
                        sortOrder: {
                            type: "integer",
                            description: "Numerical sort order value (default 0)"
                        },
                        viewMode: {
                            type: "string",
                            description: 'View mode: "list", "kanban", or "timeline"'
                        },
                        kind: {
                            type: "string",
                            description: 'Project type: "TASK" or "NOTE"'
                        }
                    },
                    required: ["name"],
                },
            },
            {
                name: "update_project_by_projectID",
                description: "Update an existing project's properties. Requires project ID. Can modify name, color, view mode, kind and sort order. Returns updated project details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "The ID of the project to update (required)"
                        },
                        name: {
                            type: "string",
                            description: "New name for the project"
                        },
                        color: {
                            type: "string",
                            description: "New hex color code for the project",
                        },
                        sortOrder: {
                            type: "integer",
                            description: "Updated sort order value"
                        },
                        viewMode: {
                            type: "string",
                            description: 'Updated view mode: "list", "kanban", or "timeline"'
                        },
                        kind: {
                            type: "string",
                            description: 'Updated project kind: "TASK" or "NOTE"'
                        }
                    },
                    required: ["projectId"],
                },
            },
            {
                name: "delete_project_by_projectID",
                description: "Permanently delete a project by its ID. This will also delete all tasks within the project. Returns success message upon deletion.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "The ID of the project to delete (required)"
                        }
                    },
                    required: ["projectId"],
                },
            },
            {
                name: "get_tasks_by_date",
                description: "Get tasks for a specific date from ALL projects (including Inbox). Useful for checking 'What is my plan for today'.",
                inputSchema: {
                    type: "object",
                    properties: {
                        date: {
                            type: "string",
                            description: "Target date in YYYY-MM-DD format (e.g. 2025-12-31). Matches tasks with this Due Date.",
                        },
                    },
                    required: ["date"],
                },
            },
            {
                name: "get_focus_statistics",
                description: "Analyze time spent and productivity. Use when user asks: '这周花费时间怎么样', '时间都花在哪了', 'where did my time go', 'how can I improve efficiency'. Returns focus time breakdown by projects, tags and tasks.",
                inputSchema: {
                    type: "object",
                    properties: {
                        startDate: {
                            type: "string",
                            description: "Start date in YYYYMMDD format (e.g. 20260201)",
                        },
                        endDate: {
                            type: "string",
                            description: "End date in YYYYMMDD format (e.g. 20260208)",
                        },
                    },
                    required: ["startDate", "endDate"],
                },
            },
            {
                name: "record_focus",
                description: "Record a completed focus/pomodoro session. Use when user says: '记录一下刚才的专注', 'log my focus time', '我刚专注了xx分钟'. Creates a focus record with task, duration and timestamps.",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "ID of the task this focus session was for (optional)",
                        },
                        taskTitle: {
                            type: "string",
                            description: "Title of the task (required if taskId not provided)",
                        },
                        projectName: {
                            type: "string",
                            description: "Project name for the task (optional)",
                        },
                        tags: {
                            type: "array",
                            items: { type: "string" },
                            description: "Tags for the focus session (optional)",
                        },
                        durationMinutes: {
                            type: "number",
                            description: "Duration of focus in minutes (required)",
                        },
                        endTime: {
                            type: "string",
                            description: "End time in ISO 8601 format. Defaults to now if not provided.",
                        },
                        note: {
                            type: "string",
                            description: "Optional note for the focus session",
                        },
                    },
                    required: ["durationMinutes"],
                },
            }
        ],
    };
});
// 工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        throw new McpError(ErrorCode.InvalidRequest, "参数不能为空");
    }
    try {
        switch (name) {
            case "create_task": {
                const task = {
                    title: args.title,
                    projectId: args.projectId,
                };
                if (args.content)
                    task.content = args.content;
                if (args.dueDate)
                    task.dueDate = args.dueDate;
                if (args.priority !== undefined)
                    task.priority = args.priority;
                const response = await dida365Api.post("/task", task);
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务创建成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "get_task_by_projectId_and_taskId": {
                const params = {};
                if (!args.projectId || !args.taskId)
                    throw new McpError(ErrorCode.InvalidRequest, "项目ID或任务ID为空");
                if (args.projectId)
                    params.projectId = args.projectId;
                if (args.taskId)
                    params.taskId = args.taskId;
                const response = await dida365Api.get(`/project/${params.projectId}/task/${params.taskId}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "get_tasks_by_projectId": {
                const params = {};
                if (args.projectId)
                    params.projectId = args.projectId;
                else
                    throw new McpError(ErrorCode.InvalidRequest, "项目名称为空");
                const response = await dida365Api.get(`/project/${params.projectId}/data`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务列表: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "update_task": {
                const taskId = args.taskId;
                const updateData = {};
                if (args.title)
                    updateData.title = args.title;
                if (args.content)
                    updateData.content = args.content;
                if (args.dueDate)
                    updateData.dueDate = args.dueDate;
                if (args.priority !== undefined)
                    updateData.priority = args.priority;
                if (args.status !== undefined)
                    updateData.status = args.status;
                const response = await dida365Api.put(`/task/${taskId}`, updateData);
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务更新成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "delete_task": {
                const taskId = args.taskId;
                const projectId = args.projectId;
                throwValidError(projectId, taskId);
                await dida365Api.delete(`/project/${projectId}/task/${taskId}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务 ${taskId} 删除成功`,
                        },
                    ],
                };
            }
            case "get_projects": {
                const response = await dida365Api.get("/project");
                return {
                    content: [
                        {
                            type: "text",
                            text: `项目列表: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "create_project": {
                const project = {
                    name: args.name,
                    ...(args.color ? { color: args.color } : {}),
                    ...(args.sortOrder ? { sortOrder: args.sortOrder } : 0),
                    ...(args.viewMode ? { viewMode: args.viewMode } : {}),
                    ...(args.kind ? { kind: args.kind } : {}),
                };
                const response = await dida365Api.post("/project", project);
                return {
                    content: [
                        {
                            type: "text",
                            text: `项目创建成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "update_project_by_projectID": {
                const project = {
                    id: args.projectId,
                    name: args.name,
                    ...(args.color ? { color: args.color } : {}),
                    ...(args.sortOrder ? { sortOrder: args.sortOrder } : 0),
                    ...(args.viewMode ? { viewMode: args.viewMode } : {}),
                    ...(args.kind ? { kind: args.kind } : {})
                };
                throwValidError(args.projectId, "1");
                const response = await dida365Api.post("/project", project);
                return {
                    content: [
                        {
                            type: "text",
                            text: `项目创建成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "delete_project_by_projectID": {
                const projectId = args.projectId;
                throwValidError(projectId, "1");
                const response = await dida365Api.delete(`/project/${projectId}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `删除项目成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "complete_task": {
                const taskId = args.taskId;
                const projectId = args.projectId;
                throwValidError(projectId, taskId);
                const response = await dida365Api.post(`/project/${projectId}/task/${taskId}/complete`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务更新: ${JSON.stringify(response.data, null, 2)}`
                        }
                    ]
                };
            }
            case "get_project_by_projectId": {
                const projectId = args.projectId;
                throwValidError(projectId, "1");
                const response = await dida365Api.get(`project/${projectId}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `获取project成功: ${JSON.stringify(response.data, null, 2)}`
                        }
                    ]
                };
            }
            case "get_tasks_by_date": {
                const targetDate = args.date; // YYYY-MM-DD
                if (!targetDate)
                    throw new McpError(ErrorCode.InvalidRequest, "Date is required");
                // 1. Get all projects
                const projectsRes = await dida365Api.get("/project");
                const projects = projectsRes.data.projects || [];
                // 2. Add 'inbox' explicitly
                const projectIds = projects.map((p) => p.id);
                projectIds.push("inbox");
                // 3. Fetch tasks for all projects concurrently
                // Note: might need concurrency limit if projects are many, but usually fine for <20.
                const tasksPromises = projectIds.map(async (pid) => {
                    try {
                        const res = await dida365Api.get(`/project/${pid}/data`);
                        return res.data.tasks || [];
                    }
                    catch (e) {
                        console.error(`Failed to fetch tasks for project ${pid}: ${e}`);
                        return [];
                    }
                });
                const results = await Promise.all(tasksPromises);
                const allTasks = results.flat();
                // 4. Filter by date
                // TickTick dueDate is usually ISO string e.g., "2023-11-20T00:00:00.000+0000"
                // We will do a simple comparison: check if the task's local time (or just the string) matches.
                // Assuming targetDate is YYYY-MM-DD.
                // 4. Filter by date logic
                // We need to match tasks that:
                // a) Have a specific dueDate that falls on targetDate (in local time)
                // b) Have a startDate and dueDate, and targetDate is within [startDate, dueDate]
                // Helper to normalize a date string to YYYY-MM-DD in local time
                const toLocalYMD = (dateStr) => {
                    try {
                        const d = new Date(dateStr);
                        if (isNaN(d.getTime()))
                            return null;
                        // Get local ISO date part: YYYY-MM-DD
                        // Note: formatting to YYYY-MM-DD based on local system time
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                    catch {
                        return null;
                    }
                };
                const filteredTasks = allTasks.filter((t) => {
                    // Normalize targetDate just in case, though we expect YYYY-MM-DD
                    const target = targetDate;
                    let startYMD = null;
                    let dueYMD = null;
                    if (t.startDate)
                        startYMD = toLocalYMD(t.startDate);
                    if (t.dueDate)
                        dueYMD = toLocalYMD(t.dueDate);
                    // Case 1: Simple Due Date Match
                    // If no startDate, just check if dueDate matches target
                    if (!startYMD && dueYMD === target)
                        return true;
                    // Case 2: Range Match
                    // If both exist, check if target is between start and due (inclusive)
                    if (startYMD && dueYMD) {
                        return target >= startYMD && target <= dueYMD;
                    }
                    // Case 3: Start Date Match (Open ended? usually handled as just a start point)
                    // If only startDate exists (rare for TickTick tasks to have start but no due, but possible)
                    // We'll treat it as "starts on this day or active since then"? 
                    // Usually TickTick shows it in "Today" if startDate <= Today.
                    // But to be safe and specific to "Plan for Today", let's include it if it starts today 
                    // OR if it started before and hasn't finished? 
                    // Let's stick to: It appears on the calendar for Today.
                    // If simple start date:
                    if (startYMD === target)
                        return true;
                    // Case 4: Only Due Date match (covered by Case 1 logic but let's be explicit)
                    if (!startYMD && dueYMD) {
                        return dueYMD === target;
                    }
                    return false;
                });
                // Add sorting by priority (desc) and order
                filteredTasks.sort((a, b) => {
                    const pA = a.priority || 0;
                    const pB = b.priority || 0;
                    return pB - pA;
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: `Found ${filteredTasks.length} tasks for date ${targetDate}:\n${JSON.stringify(filteredTasks, null, 2)}`
                        }
                    ]
                };
            }
            case "get_focus_statistics": {
                const startDate = args.startDate;
                const endDate = args.endDate;
                if (!startDate || !endDate) {
                    throw new McpError(ErrorCode.InvalidRequest, "startDate and endDate are required (YYYYMMDD format)");
                }
                if (!DIDA365_COOKIE) {
                    throw new McpError(ErrorCode.InvalidRequest, "COOKIE environment variable is required for focus statistics (v2 API)");
                }
                const response = await dida365ApiV2.get(`/pomodoros/statistics/dist/${startDate}/${endDate}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Focus statistics from ${startDate} to ${endDate}:\n${JSON.stringify(response.data, null, 2)}`
                        }
                    ]
                };
            }
            case "record_focus": {
                if (!DIDA365_COOKIE) {
                    throw new McpError(ErrorCode.InvalidRequest, "COOKIE environment variable is required for recording focus (v2 API)");
                }
                const durationMinutes = args.durationMinutes;
                if (!durationMinutes || durationMinutes <= 0) {
                    throw new McpError(ErrorCode.InvalidRequest, "durationMinutes is required and must be positive");
                }
                // Calculate start and end times
                const endTimeStr = args.endTime;
                const endTime = endTimeStr ? new Date(endTimeStr) : new Date();
                const startTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);
                // Format times for API
                const formatTime = (d) => d.toISOString().replace('Z', '+0000');
                // Generate a unique ID
                const generateId = () => {
                    const hex = () => Math.floor(Math.random() * 16).toString(16);
                    return Array.from({ length: 24 }, hex).join('');
                };
                const focusId = generateId();
                const taskTitle = args.taskTitle || "Focus Session";
                const tags = args.tags || [];
                const projectName = args.projectName || "";
                const note = args.note || "";
                const taskId = args.taskId || "";
                const payload = {
                    add: [{
                            startTime: formatTime(startTime),
                            pauseDuration: 0,
                            endTime: formatTime(endTime),
                            status: 1,
                            id: focusId,
                            tasks: [{
                                    taskId: taskId,
                                    title: taskTitle,
                                    tags: tags,
                                    projectName: projectName,
                                    startTime: formatTime(startTime),
                                    endTime: formatTime(endTime)
                                }],
                            added: true,
                            note: note
                        }],
                    update: [],
                    delete: []
                };
                const response = await dida365ApiV2.post('/batch/pomodoro', payload);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Focus session recorded!\nTask: ${taskTitle}\nDuration: ${durationMinutes} minutes\nStart: ${startTime.toLocaleString()}\nEnd: ${endTime.toLocaleString()}\n\nResponse: ${JSON.stringify(response.data, null, 2)}`
                        }
                    ]
                };
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${name}`);
        }
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            throw new McpError(ErrorCode.InternalError, `滴答清单API调用失败 (${status}): ${message}`);
        }
        throw new McpError(ErrorCode.InternalError, `工具执行失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// 资源列表处理器
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "dida365://tasks",
                mimeType: "application/json",
                name: "滴答清单任务",
                description: "获取所有任务的概览",
            },
            {
                uri: "dida365://projects",
                mimeType: "application/json",
                name: "滴答清单项目",
                description: "获取所有项目的概览",
            },
        ],
    };
});
// 资源读取处理器
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    try {
        switch (uri) {
            case "dida365://tasks": {
                const response = await dida365Api.get("/task");
                return {
                    contents: [
                        {
                            uri,
                            mimeType: "application/json",
                            text: JSON.stringify(response.data, null, 2),
                        },
                    ],
                };
            }
            case "dida365://projects": {
                const response = await dida365Api.get("/project");
                return {
                    contents: [
                        {
                            uri,
                            mimeType: "application/json",
                            text: JSON.stringify(response.data, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new McpError(ErrorCode.InvalidRequest, `未知资源URI: ${uri}`);
        }
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            throw new McpError(ErrorCode.InternalError, `滴答清单API调用失败 (${status}): ${message}`);
        }
        throw new McpError(ErrorCode.InternalError, `资源获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});
function throwValidError(projectId, taskId) {
    if (!projectId && !taskId)
        throw new McpError(ErrorCode.InvalidRequest, "projectId 和 taskId 为空");
    if (!projectId)
        throw new McpError(ErrorCode.InvalidRequest, "projectId 为空");
    if (!taskId)
        throw new McpError(ErrorCode.InvalidRequest, "taskId 为空");
}
// 启动服务器
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("滴答清单 MCP 服务已启动");
}
main().catch((error) => {
    console.error("服务启动失败:", error);
    process.exit(1);
});
