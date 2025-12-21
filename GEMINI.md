# Project Overview

This project is a full-stack, real-time, multi-user drawing and guessing game called "Drawski".

**Key Technologies:**

*   **Frontend (client/):**
    *   **Framework:** React v19 with Vite
    *   **Language:** TypeScript
    *   **Styling:** Tailwind CSS
    *   **Real-time Communication:** `socket.io-client`
    *   **Routing:** `react-router-dom`

*   **Backend (server/):**
    *   **Framework:** Node.js with Express
    *   **Language:** TypeScript
    *   **Real-time Communication:** `socket.io`
    *   **Database:** (Not explicitly defined, likely in-memory)

*   **Shared (shared/):**
    *   Contains shared code between the client and server, such as `eventNames.ts` for socket.io events.

**Architecture:**

The application follows a classic client-server architecture. The backend server manages game state, user authentication (implicitly through socket IDs), and real-time communication. The frontend provides the user interface for joining rooms, drawing, guessing, and interacting with the game.

Communication between the client and server is primarily handled through socket.io events, with a comprehensive set of events defined in `shared/eventNames.ts`.

# Building and Running

## Frontend (Client)

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The client will be available at `http://localhost:5173`.

4.  **Build for production:**
    ```bash
    npm run build
    ```

5.  **Lint the code:**
    ```bash
    npm run lint
    ```

## Backend (Server)

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The server will be running on port 3001.

4.  **Build for production:**
    ```bash
    npm run build
    ```

5.  **Start the production server:**
    ```bash
    npm run start
    ```

# Development Conventions

*   **Code Style:** The project uses ESLint for linting. The configuration can be found in `client/eslint.config.js` and `server/.eslintrc.js`.
*   **Testing:** There are no explicit test configurations or test files in the project.
*   **Commits:** There is no `CONTRIBUTING.md` or other guidelines for commit messages.
*   **Branching:** There is no `CONTRIBUTING.md` or other guidelines for branching.
