# MoMo Command Center

A personal command center — a locally-run wiki viewer for your Obsidian vault with AI-powered topic organization.

## 🚀 Features

- **Vault Integration**: Connect to your local Obsidian vault.
- **AI-Powered Organization**: Automatically organizes your notes into logical topic groups using GitHub Copilot CLI.
- **Folder View**: Traditional directory-based navigation of your markdown files.
- **Topic View**: AI-generated themes that group related notes regardless of folder structure.
- **Fast Preview**: Seamlessly browse and read your markdown notes in a clean, modern interface.

## 🛠 Prerequisites

- **Node.js**: Version 18 or higher.
- **GitHub Copilot CLI**: This application relies on the `copilot` CLI for AI organization. Ensure it is installed and authenticated.
  - Install via: `npm install -g @githubnext/copilot-cli` (or your preferred method).
  - Authenticate: `copilot auth`

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mukundmurali-mm/command-center.git
   cd command-center
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the installation script** (optional, for environment setup):
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

## 🏃 Running the Application

### Development Mode
Run both the backend server and the Vite frontend:
```bash
npm run dev
```

### Production Build
1. Build the frontend:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   node server/index.js
   ```
The application will be available at `http://localhost:3001`.

## 📖 How to Use

1. **Connect a Vault**:
   - Click on "Browse for Vault" in the sidebar.
   - Select the root directory of your Obsidian vault.

2. **Navigate Your Notes**:
   - **Folders**: Use the "Folders" tab to navigate your notes exactly as they are structured on disk.
   - **Topics**: Use the "Topics" tab to see AI-generated categories. The AI analyzes your file names and groups them into intuitive themes.

3. **Read Notes**:
   - Select any file from the sidebar to view its content in the main viewer.

## ⚙️ How it Works

The **AI Topic Organization** feature works by:
1. Scanning the vault for all `.md` files.
2. Sending a list of file paths to the GitHub Copilot CLI with a specialized prompt.
3. Parsing the JSON response to create a virtual "Smart Tree" of topic groups.
4. Caching the result locally in `~/.command-center/structure-cache.json` to ensure fast loading and reduce API calls.

## 📄 License

This project is licensed under the MIT License.
