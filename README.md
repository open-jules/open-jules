[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

![Cover Image](public/cover.png)

# Open Jules: Your AI Coding Co-pilot 🚀

**Tired of the coding grind? Open Jules is here to help!**

Open Jules is a powerful multi-agent automation platform that uses AI agents to automate coding tasks, from planning to pull request creation. Built with React, Node.js, and Ollama.

## 🚀 New Features - Task Queue System

Open Jules now features a robust task queue system that allows you to:

- **Queue Multiple Tasks**: Add multiple tasks to a queue and execute them sequentially
- **Individual Task Control**: Pause, resume, cancel, or remove individual tasks
- **Real-time Monitoring**: View detailed logs and progress for each task in real-time
- **Task Persistence**: Tasks persist across application restarts
- **Queue Management**: Start, pause, and clear completed tasks from the queue
- **Individual Console Viewing**: Open detailed console views for each task with export functionality

### Task States

Tasks can be in the following states:
- **Pending**: Waiting to be executed
- **Running**: Currently being executed
- **Paused**: Temporarily paused (can be resumed)
- **Completed**: Successfully finished
- **Failed**: Encountered an error
- **Cancelled**: Manually cancelled

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **TaskQueue.tsx**: Main queue management interface
- **TaskItem.tsx**: Individual task display with controls
- **TaskConsoleModal.tsx**: Detailed task console/logs viewer
- **AddTaskModal.tsx**: Form for adding new tasks to queue
- **SettingsModal.tsx**: Agent model configuration
- **RepoSelector.tsx**: GitHub repository and branch selection

### Backend (Node.js + Express)
- **TaskQueueService**: Manages task queue with persistent storage
- **TaskExecutor**: Handles individual task execution with state management
- **Agents**: 6 specialized AI agents (Planner, BranchNamer, Embedder, Developer, Reviewer, PRWriter)
- **Services**: Ollama integration for AI model communication
- **Managers**: Git and GitHub operations

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/open-jules/open-jules
   cd open-jules
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   > **Note:** You must run `npm install` before starting the server. This will install all required dependencies, including `express`. If you see errors like `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'`, it means you need to run this step.

3. **Set up Ollama**
   - Install [Ollama](https://ollama.ai/)
   - Pull required models (e.g., `ollama pull llama3`)
   - Ensure Ollama is running on `localhost:11434`

4. **Configure GitHub Token**
   - Create a GitHub Personal Access Token with `repo` scope
   - Add it in the application settings

5. **Start the application**
   ```bash
   npm run dev
   ```

### Troubleshooting

- **ERR_MODULE_NOT_FOUND**: If you see an error like `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'`, make sure you have run `npm install` in the project directory.

## 🎯 Usage

### Adding Tasks to Queue

1. **Configure Settings**: Set up your GitHub token and agent models
2. **Add Task**: Click "Add Task" button in the queue interface
3. **Select Repository**: Choose the target repository and branch
4. **Describe Task**: Enter a detailed description of what you want to automate
5. **Queue Task**: The task will be added to the queue

### Managing Tasks

- **Start Queue**: Begin processing pending tasks
- **Pause Queue**: Temporarily stop all task processing
- **Individual Controls**: 
  - Pause/Resume running tasks
  - Cancel pending or running tasks
  - Remove completed/failed tasks
  - View detailed console logs

### Task Console

Each task has its own console view that shows:
- Real-time execution logs
- Progress updates
- Error messages
- Task status and timing
- Export functionality for logs

## 🔧 Configuration

### Agent Models

Configure different Ollama models for each agent:
- **Planner**: Decomposes tasks into implementation steps
- **Branch Namer**: Generates descriptive Git branch names
- **Embedder**: Analyzes codebase structure and context
- **Developer**: Implements code changes
- **Reviewer**: Reviews code quality and suggests improvements
- **PR Writer**: Creates professional pull request descriptions
- **Generator**: General text generation (analysis, summaries)

### GitHub Integration

- Requires GitHub Personal Access Token with `repo` scope
- Supports private and public repositories
- Automatic branch creation and pull request generation

## 📁 Project Structure

```
open-jules/
├── backend/
│   ├── agents/           # AI agent implementations
│   ├── git/             # Git operations
│   ├── github/          # GitHub API integration
│   ├── services/        # Core services (Ollama, TaskQueue, TaskExecutor)
│   └── server.js        # Express server with API endpoints
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── hooks/          # Custom React hooks
│   └── App.tsx         # Main application component
└── public/             # Static assets
```

## 🔌 API Endpoints

### Task Queue Endpoints
- `POST /api/tasks` - Add task to queue
- `GET /api/tasks` - Get all tasks and queue status
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id/pause` - Pause task
- `PUT /api/tasks/:id/resume` - Resume task
- `PUT /api/tasks/:id/cancel` - Cancel task
- `DELETE /api/tasks/:id` - Remove task from queue
- `GET /api/tasks/:id/logs` - Get task logs (SSE stream)

### Queue Management Endpoints
- `GET /api/queue/status` - Get queue status
- `POST /api/queue/start` - Start queue processing
- `POST /api/queue/pause` - Pause all tasks
- `POST /api/queue/clear` - Clear completed tasks

### Legacy Endpoints (Backward Compatibility)
- `POST /api/run-task` - Single task execution (legacy)

## 🧪 Testing

```bash
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation
- Review the technical details in [TECHNICAL_DETAILS.md](TECHNICAL_DETAILS.md)

## Key Features - What Open Jules Does For You

*   **Automated Coding from A to Z:** Describe your task, and Open Jules plans, codes, reviews, and prepares a GitHub Pull Request for you.
*   **Your AI, Your Rules:** Runs with your local Ollama setup, giving you full control over your data and AI models.
*   **Effortless GitHub Workflow:** From creating branches to crafting PR descriptions, Open Jules handles the Git gymnastics.
*   **See the Magic Happen:** Watch the AI work its magic with a real-time progress log.
*   **Tailor Your AI Team:** Easily assign different AI models (from your Ollama) to various tasks like planning or coding, optimizing for the best results.
*   **Focus on What Matters:** Spend less time on routine coding and more on building great software.

## Who is Open Jules For?

Open Jules is a great fit for:

*   **Developers** looking to automate routine coding tasks and speed up their workflow.
*   **Teams** wanting to streamline their development process and integrate AI assistance.
*   **Open-source enthusiasts** eager to experiment with local AI models for code generation.
*   **Anyone curious about AI-powered development** who wants a hands-on tool to explore.

If you're comfortable with GitHub and running local applications, Open Jules can be a powerful addition to your toolkit!

## 🚀 Quick Start Guide

Get Open Jules up and running in a few steps:

1.  **Prerequisites:**
    *   **Node.js:** Latest LTS version.
    *   **Ollama:** Installed and running ([ollama.com](https://ollama.com/)). Make sure you've pulled some models (e.g., `ollama pull llama3`).
    *   **Git:** Installed and in your PATH.

2.  **Installation:**
    ```bash
    git clone https://github.com/open-jules/open-jules.git
    cd open-jules
    npm install
    ```

3.  **Configuration:**
    *   Launch the app (see step 4).
    *   In the UI, go to **Settings**:
        *   Enter your **GitHub Personal Access Token**.
        *   Assign the **Ollama models** you've pulled to the different AI agents (Planner, Developer, etc.).

4.  **Run Open Jules:**
    ```bash
    npm run dev
    ```
    *   Access the app in your browser (usually `http://localhost:5173`).

For more detailed setup, troubleshooting, and advanced usage, please see our [Technical Details Guide](TECHNICAL_DETAILS.md).

## How to Use Open Jules

Once you've followed the Quick Start Guide and have Open Jules running:

1.  **Select Your Repository & Branch:**
    *   Choose the GitHub repository you want to work on.
    *   Pick the base branch for your changes.

2.  **Describe Your Task:**
    *   In the "Task Description" area, clearly explain what you want Open Jules to do.
    *   *Be specific!* For example, instead of "fix bug," try "Refactor `src/utils.js` to use arrow functions and add a unit test for the `calculateTotal` function."

3.  **Run the Task:**
    *   Click "Run Task."

4.  **Monitor Progress:**
    *   Watch the live status console to see the AI agents (Planner, Developer, etc.) at work.

5.  **Review Your PR:**
    *   Once complete, Open Jules will provide a link to the pull request on GitHub.
    *   Review the AI-generated code, test it, and merge if satisfied!

**Tips for Best Results:**

*   **Clear Instructions:** The more detailed your task description, the better the outcome.
*   **Model Choice:** Experiment with different Ollama models for agents (in Settings) to find what works best.
*   **Complex Tasks:** Break down large tasks into smaller, manageable steps for Open Jules.
*   Need more details on setup or advanced options? Check the [Technical Details Guide](TECHNICAL_DETAILS.md).

## Diving Deeper

Want to understand the nuts and bolts of Open Jules? For detailed information on:

*   Advanced configuration options
*   The system architecture
*   Project structure and codebase layout
*   Troubleshooting tips

Please refer to our [Technical Details Guide](TECHNICAL_DETAILS.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
