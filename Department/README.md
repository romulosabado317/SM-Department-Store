# SM Department Store - Full Stack Project

This project includes a modern React frontend and a .NET 8 Web API.

## 🚀 Local Setup Instructions

### 1. Requirements
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) or newer.
- [Node.js](https://nodejs.org/) (v18 or newer).
- [VS Code](https://code.visualstudio.com/) with the **C# Dev Kit** extension.

### 2. VS Code "One-Click" Start
We have configured the project for VS Code. 
1. Open the root folder in VS Code.
2. Open a terminal (Ctrl+`) and run:
   ```bash
   npm install
   ```
3. Press **F5** or go to the "Run and Debug" tab.
4. Select **"Full Stack (API + Frontend)"** and hit the Play button.

### 3. Manual Start
If you prefer the command line:

**Start the API:**
```bash
cd SMDepartmentStore.API
dotnet run
```
*API will be available at http://localhost:5200*

**Start the Frontend:**
```bash
# In the root directory
npm run dev
```
*Vite will be available at http://localhost:3000 (proxied to the API)*

## 📁 Project Structure
- `/src`: Frontend React code.
- `/SMDepartmentStore.API`: Backend .NET source code.
- `.vscode`: Configuration for debugging and tasks.
