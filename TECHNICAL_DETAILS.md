# Open Jules: Technical Details

## Prerequisites and Configuration

Before you begin, ensure you have the following prerequisites installed and configured:

1.  **Node.js:**
    *   The latest Long-Term Support (LTS) version is recommended. You can download it from [nodejs.org](https://nodejs.org/).
    *   `npm` (Node Package Manager) is included with Node.js.

2.  **Ollama:**
    *   Ollama must be installed and actively running on your local machine. You can download it from [ollama.com](https://ollama.com/).
    *   **Pull Necessary Language Models:** The application relies on language models hosted by your Ollama instance. You will need to pull the models you intend to use for the different AI agents. This is done via the Ollama CLI. For example, to pull the `llama3` model:
        ```bash
        ollama pull llama3
        ```
        Repeat this for any other models you plan to assign to agents in the application's settings (e.g., `codellama`, `mistral`, etc.). Ensure these models are available locally before attempting to use them in the application.

3.  **Git:**
    *   The application uses Git for repository operations (cloning, branching, committing, pushing). Ensure Git is installed and accessible in your system's PATH. You can download it from [git-scm.com](https://git-scm.com/).

### Application Configuration Steps

After installing the prerequisites, you'll need to configure the application itself:

1.  **GitHub Personal Access Token (PAT):**
    *   To interact with your GitHub repositories (both private and public), the application requires a GitHub PAT.
    *   You can generate a PAT from your GitHub account: Go to `Settings` > `Developer settings` > `Personal access tokens`.
    *   **Recommended Scopes:**
        *   For **Tokens (classic):** Select the `repo` scope. This provides comprehensive access to manage your repositories.
        *   For **Fine-grained tokens:** Grant `Read and Write` permissions for `Contents` and `Pull requests`. You might also need `Metadata` (read-only) for repository discovery. Assign to specific repositories or all repositories as you see fit.
    *   This token will be entered directly into the application's UI when you first use it or via the main configuration panel. It is stored in your browser's `localStorage` for convenience.

2.  **Agent Model Selection (In-App Settings):**
    *   Once the application is running (see "Installation and Running" below), click on the "Settings" button in the UI.
    *   A modal will appear where you must specify which Ollama model each AI agent (e.g., Planner, Developer, Reviewer, Branch Namer, PR Writer, Embedder) should utilize.
    *   **Crucial:** The model names you enter here (e.g., `llama3`, `codellama:7b`) must exactly match the names of models you have successfully pulled and are available in your local Ollama instance. If a specified model is not found by Ollama, the corresponding agent will fail.
    *   The `generator` model listed in settings is a general-purpose model that can be used by agents like the Embedder for auxiliary generation tasks.

## Installation and Running

Follow these steps to get the Open Jules up and running on your machine:

1.  **Clone the Repository:**
    Open your terminal and run:
    ```bash
    git clone https://github.com/open-jules/open-jules.git
    cd open-jules
    ```

2.  **Install Dependencies:**
    This project uses `npm` for managing dependencies. Install them by running:
    ```bash
    npm install
    ```

3.  **Ensure Prerequisites are Met:**
    *   Verify your Ollama instance is running (see "Prerequisites and Configuration").
    *   Have your GitHub Personal Access Token ready to be entered into the application.

4.  **Start the Development Servers:**
    To start both the frontend (Vite) and backend (Express) servers concurrently, use:
    ```bash
    npm run dev
    ```
    *   The frontend application will typically be available at `http://localhost:5173` (this is the default port for Vite, check your terminal output for the exact URL).
    *   The backend server will listen on `http://localhost:3001` (as defined in `backend/server.js`).

5.  **Access the Application:**
    Once the servers are running, open your web browser and navigate to the frontend URL (usually `http://localhost:5173`). You can then proceed with the in-app configuration (GitHub token, agent models).

### Other Available Scripts

For more granular control over the development process, you can use these scripts:

*   `npm run frontend`: Starts only the Vite development server for the frontend.
*   `npm run server`: Starts only the Node.js/Express backend server.
*   `npm run build`: Compiles and bundles the React frontend for production. The output is typically placed in a `dist` folder.
*   `npm run preview`: Serves the production build locally, allowing you to test the optimized version before deployment.
*   `npm run lint`: Runs ESLint across the project to check for code style issues and potential errors.

## Architecture Overview

The Open Jules operates with a client-server architecture, integrating with Ollama for AI capabilities and GitHub for repository management.

*   **Frontend:** A React/TypeScript single-page application (SPA) built with Vite. It provides the user interface for:
    *   GitHub authentication (via Personal Access Token).
    *   Repository and branch selection.
    *   Task description input.
    *   Configuration of Ollama models for different AI agents (via Settings).
    *   Displaying real-time progress updates streamed from the backend.

*   **Backend:** An Express.js server (in `backend/server.js`) that:
    *   Exposes APIs for the frontend.
    *   Orchestrates the AI-driven tasks.
    *   Manages interactions with `simple-git` (for local Git operations) and `octokit` (for GitHub API communication).
    *   Coordinates a sequence of operations performed by specialized AI agents.

*   **Ollama Integration:**
    *   The backend communicates with a locally running Ollama instance (via `backend/services/ollama.js`).
    *   This allows the application to utilize various open-source language models for different agent functionalities, ensuring data privacy and model customization.

*   **AI Agents (located in `backend/agents/`):** The core logic of task automation is distributed among several agents, each powered by an Ollama model and with a specific role:
    *   **PlannerAgent:** Deconstructs the user's high-level task into a structured, step-by-step plan.
    *   **BranchNamingAgent:** Generates a concise and descriptive Git branch name based on the task.
    *   **EmbedderAgent:** (If applicable for the task) Analyzes the existing codebase to create a contextual understanding for the DeveloperAgent.
    *   **DeveloperAgent:** Implements the required code changes based on the plan and the codebase context provided by the EmbedderAgent.
    *   **ReviewerAgent:** Reviews the code generated by the DeveloperAgent for quality, correctness, and potential improvements, suggesting changes if necessary.
    *   **PRWriterAgent:** Drafts a comprehensive title and body for the pull request, summarizing the changes made.

*   **Typical Workflow:**
    1.  User configures settings (GitHub token, agent models) and submits a task through the frontend.
    2.  The backend receives the task and initiates the multi-agent workflow.
    3.  Agents, using models served by your local Ollama instance, perform their specialized functions sequentially:
        *   Task Planning
        *   Branch Naming
        *   Repository Cloning & Branch Creation
        *   Codebase Analysis (Embedding)
        *   Code Implementation
        *   Code Review & Refinement
        *   Committing & Pushing Changes
        *   Pull Request Content Generation
        *   Pull Request Creation on GitHub
    4.  Throughout this process, the backend streams status updates (using Server-Sent Events - SSE) to the frontend's console.
    5.  The final output is a new branch with the implemented changes and an open pull request in the selected GitHub repository.

## Project Structure

Here's a brief overview of the key directories and files within the Open Jules project:

```
open-jules/
├── backend/                # Contains all backend Node.js/Express server code
│   ├── agents/             # Logic for the specialized AI agents (Planner, Developer, Reviewer, etc.)
│   │   ├── planner.js
│   │   ├── developer.js
│   │   └── ... (other agent files)
│   ├── git/                # `GitManager` class for abstracting `simple-git` operations
│   │   └── git-manager.js
│   ├── github/             # `GitHubManager` class for `octokit` interactions with the GitHub API
│   │   └── github-manager.js
│   ├── services/           # External service integrations, primarily Ollama
│   │   └── ollama.js
│   └── server.js           # Main entry point for the Express backend server, defines API routes.
│
├── public/                 # Static assets served directly (e.g., favicon, initial `index.html` for Vite)
│
├── src/                    # Frontend React/TypeScript application source code (managed by Vite)
│   ├── components/         # Reusable UI components (e.g., RepoSelector, SettingsModal, StatusConsole)
│   │   ├── RepoSelector.tsx
│   │   └── ... (other component files)
│   ├── App.tsx             # The main root component of the React application.
│   ├── main.tsx            # The entry point for the React application, renders App.tsx.
│   ├── index.css           # Global styles and TailwindCSS base directives.
│   └── vite-env.d.ts       # TypeScript definitions for Vite environment variables.
│
├── .gitignore              # Specifies intentionally untracked files that Git should ignore.
├── CONTRIBUTING.md         # Guidelines for contributing to the project.
├── eslint.config.js        # ESLint configuration file.
├── LICENSE                 # Contains the MIT License text.
├── package.json            # Lists project dependencies, scripts (npm run dev, etc.), and metadata.
├── package-lock.json       # Records exact versions of dependencies.
├── postcss.config.js       # Configuration for PostCSS (used with TailwindCSS).
├── README.md               # This file: project documentation.
├── tailwind.config.js      # Configuration for TailwindCSS.
├── tsconfig.json           # TypeScript compiler options for the project.
├── tsconfig.app.json       # TypeScript compiler options specific to the frontend app.
├── tsconfig.node.json      # TypeScript compiler options specific to the backend (if it were TS).
└── vite.config.ts          # Configuration file for Vite (frontend build tool).
```

This structure clearly separates the backend logic (handling AI, Git, GitHub operations) from the frontend user interface. The AI agent implementations are modular within the `backend/agents/` directory.
