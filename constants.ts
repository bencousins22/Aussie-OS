
import { FunctionDeclaration, Type } from "@google/genai";

export const AUSSIE_SYSTEM_INSTRUCTION = `
You are **Aussie**, the intelligent operating system kernel of **Aussie OS**.

<intro>
You exist in a persistent split-view environment. 
On the LEFT is your Chat Interface (always visible).
On the RIGHT is the Main Workspace (Browser, Code Editor, Deploy, etc.).
You can see and control everything.
</intro>

<capabilities>
- **FileSystem**: Read/Write files, manage projects.
- **Shell**: Run \`git\`, \`node\`, \`apm\`, and \`gemini-flow\` commands.
- **Browser**: Control the built-in browser to navigate, click, and extract info.
- **Automation**: Spawn Agent Swarms, create Visual Flows, and Schedule Tasks.
- **Deployment**: Deploy repositories to **Render, Vercel, Replit, or Netlify**.
- **UI Control**: Switch views (Browser, Code, Dashboard) using \`switch_view\`.
</capabilities>

<guided_experience>
- If a user asks to "Open Browser", use \`switch_view\` with view='browser'.
- If a user asks to deploy, use the \`deploy_app\` tool. If they don't specify a provider, ask or default to Render.
- Be Friendly & Professional: You are a high-tech OS, but approachable.
</guided_experience>

<agent_loop>
1. **Analyze**: Understand the user's goal.
2. **Plan**: Sequence the necessary steps (e.g., clone repo, then deploy).
3. **Execute**: Use your tools to perform each step.
4. **Verify**: Check tool outputs for success or failure.
5. **Notify**: Inform the user of the outcome.
</agent_loop>
`;

export const TOOLS: FunctionDeclaration[] = [
  {
    name: "message_notify_user",
    description: "Send a notification to the user UI.",
    parameters: {
      type: Type.OBJECT,
      properties: { text: { type: Type.STRING } },
      required: ["text"]
    }
  },
  {
    name: "switch_view",
    description: "Switch the main workspace view.",
    parameters: {
        type: Type.OBJECT,
        properties: { 
            view: { 
                type: Type.STRING, 
                enum: ["dashboard", "code", "flow", "browser", "scheduler", "github", "settings", "deploy"] 
            } 
        },
        required: ["view"]
    }
  },
  {
    name: "file_read",
    description: "Read file content.",
    parameters: {
      type: Type.OBJECT,
      properties: { file: { type: Type.STRING } },
      required: ["file"]
    }
  },
  {
    name: "file_write",
    description: "Write content to a file.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        file: { type: Type.STRING },
        content: { type: Type.STRING },
        append: { type: Type.BOOLEAN }
      },
      required: ["file", "content"]
    }
  },
  {
    name: "file_list",
    description: "List files in a directory.",
    parameters: {
        type: Type.OBJECT,
        properties: { path: { type: Type.STRING } },
        required: ["path"]
    }
  },
  {
    name: "shell_exec",
    description: "Execute a shell command.",
    parameters: {
      type: Type.OBJECT,
      properties: { command: { type: Type.STRING } },
      required: ["command"]
    }
  },
  {
    name: "deploy_app",
    description: "Deploy a GitHub repository to a cloud provider.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            repoUrl: { type: Type.STRING, description: "The full URL of the GitHub repository to deploy." },
            provider: { type: Type.STRING, enum: ["render", "vercel", "replit", "netlify"], description: "Cloud provider to deploy to." }
        },
        required: ["repoUrl"]
    }
  },
  {
    name: "apm_install",
    description: "Install a package.",
    parameters: {
        type: Type.OBJECT,
        properties: { package: { type: Type.STRING } },
        required: ["package"]
    }
  },
  {
    name: "github_ops",
    description: "Perform GitHub operations.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            operation: { type: Type.STRING, enum: ["pr_create", "issue_create"] },
            data: { type: Type.STRING }
        },
        required: ["operation", "data"]
    }
  },
  {
    name: "media_gen",
    description: "Generate media.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            service: { type: Type.STRING, enum: ["veo3", "imagen4"] },
            prompt: { type: Type.STRING },
            params: { type: Type.STRING }
        },
        required: ["service", "prompt"]
    }
  },
  {
    name: "browser_navigate",
    description: "Navigate the internal browser.",
    parameters: {
        type: Type.OBJECT,
        properties: { url: { type: Type.STRING } },
        required: ["url"]
    }
  },
  {
    name: "browser_click",
    description: "Click an element in the browser.",
    parameters: {
        type: Type.OBJECT,
        properties: { selector: { type: Type.STRING } },
        required: ["selector"]
    }
  },
  {
    name: "browser_scrape",
    description: "Get text content of browser page.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "browser_screenshot",
    description: "Take a screenshot of the browser.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "schedule_task",
    description: "Schedule an automated task.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            action: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["command", "swarm"] },
            interval: { type: Type.NUMBER }
        },
        required: ["name", "action", "type"]
    }
  },
  {
    name: "idle",
    description: "Call when task is complete.",
    parameters: { type: Type.OBJECT, properties: {} }
  }
];
