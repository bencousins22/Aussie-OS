
import { FunctionDeclaration, Type } from "@google/genai";

export const AUSSIE_SYSTEM_INSTRUCTION = `
You are **Aussie**, the intelligent operating system kernel of **Aussie OS**.

<intro>
You exist in a persistent split-view environment. 
On the LEFT is your Chat Interface (always visible).
On the RIGHT is the Main Workspace (Browser, Code Editor, Dashboard).
You can see and control everything.
</intro>

<capabilities>
- **FileSystem**: You can Read/Write files persistently.
- **Shell**: You can run \`git\`, \`node\`, \`apm\`, and \`gemini-flow\` commands.
- **Browser**: You can control the built-in browser to navigate, click, and extract info.
- **Automation**: You can spawn Agent Swarms, create Visual Flows, and Schedule Tasks.
</capabilities>

<guided_experience>
- If you write code, tell the user "I've opened the file in the Code Workspace on the right."
- If you generate a website, tell them "Opening the Browser View now." and use the \`browser_navigate\` tool.
- **Be Friendly & Professional**: You are a high-tech OS, but approachable.
</guided_experience>

<agent_loop>
1. **Analyze**: What does the user really want?
2. **Plan**: Do I need to install packages? Do I need to clone a repo?
3. **Execute**: Use your tools.
4. **Verify**: Did the command exit with code 0?
5. **Notify**: Tell the user when you are done.
</agent_loop>
`;

export const TOOLS: FunctionDeclaration[] = [
  {
    name: "message_notify_user",
    description: "Send a notification to the user UI.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "Message text" },
      },
      required: ["text"]
    }
  },
  {
    name: "file_read",
    description: "Read file content from the persistent OS filesystem.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        file: { type: Type.STRING, description: "Absolute path (e.g., /workspace/src/index.js)" },
      },
      required: ["file"]
    }
  },
  {
    name: "file_write",
    description: "Write content to a file in the persistent OS filesystem.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        file: { type: Type.STRING, description: "Absolute path" },
        content: { type: Type.STRING, description: "Content to write" },
        append: { type: Type.BOOLEAN, description: "Append instead of overwrite" }
      },
      required: ["file", "content"]
    }
  },
  {
    name: "file_list",
    description: "List files in a directory.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            path: { type: Type.STRING, description: "Absolute path of directory" }
        },
        required: ["path"]
    }
  },
  {
    name: "shell_exec",
    description: "Execute a shell command (ls, node, apm, git, etc).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: "Command to run" },
      },
      required: ["command"]
    }
  },
  {
    name: "apm_install",
    description: "Install a package from NPM (via esm.sh) for use in node runtime.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            package: { type: Type.STRING, description: "Package name (e.g. lodash, axios)" }
        },
        required: ["package"]
    }
  },
  {
    name: "github_ops",
    description: "Perform GitHub A2A operations (PRs, Issues, Sync).",
    parameters: {
        type: Type.OBJECT,
        properties: {
            operation: { type: Type.STRING, enum: ["pr_create", "pr_review", "issue_create", "repo_sync"], description: "Operation type" },
            data: { type: Type.STRING, description: "JSON string of operation data" }
        },
        required: ["operation", "data"]
    }
  },
  {
    name: "media_gen",
    description: "Generate media using Google AI Orchestrator (Veo, Imagen, Lyria).",
    parameters: {
        type: Type.OBJECT,
        properties: {
            service: { type: Type.STRING, enum: ["veo3", "imagen4", "lyria", "chirp"], description: "Service to use" },
            prompt: { type: Type.STRING, description: "Prompt for generation" },
            params: { type: Type.STRING, description: "JSON string of additional parameters (resolution, duration, etc)" }
        },
        required: ["service", "prompt"]
    }
  },
  {
    name: "browser_navigate",
    description: "Navigate the internal browser to a URL.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            url: { type: Type.STRING, description: "URL to visit" }
        },
        required: ["url"]
    }
  },
  {
    name: "browser_click",
    description: "Click an element in the browser (Automation).",
    parameters: {
        type: Type.OBJECT,
        properties: {
            selector: { type: Type.STRING, description: "CSS Selector or Text to click" }
        },
        required: ["selector"]
    }
  },
  {
    name: "browser_scrape",
    description: "Get the text content of the current browser page.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
    }
  },
  {
    name: "browser_screenshot",
    description: "Take a screenshot of the current browser page.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
    }
  },
  {
    name: "schedule_task",
    description: "Schedule an automated task to run in the background.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Name of task" },
            action: { type: Type.STRING, description: "Shell command or Swarm objective" },
            type: { type: Type.STRING, enum: ["command", "swarm"], description: "Type of task" },
            interval: { type: Type.NUMBER, description: "Interval in seconds (if recurring)" }
        },
        required: ["name", "action", "type"]
    }
  },
  {
    name: "idle",
    description: "Call this when the assigned task is fully completed and verified.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  }
];
