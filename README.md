# InfinIA: The Intelligent Chatbot

#chatbot

## Project Description

**InfinIA** is an advanced conversational AI application designed to provide intelligent, context-aware interactions. It features a robust Python (FastAPI) backend for sophisticated natural language understanding and intent processing, paired with a modern React and TypeScript frontend for a seamless, responsive chat experience. InfinIA excels with its dynamic persona adaptation, domain-specific knowledge capabilities, and rich multimedia integration.

---

## Core Functionality

InfinIA is designed to be a versatile and engaging conversational AI, offering a range of features to enhance user interaction and provide tailored assistance:

*   **Advanced Conversational AI:** Engages users with intelligent, context-aware dialogue.
*   **Intent Classification:** Accurately understands user queries and requests by identifying their underlying intent using semantic search and machine learning models.
*   **Dynamic Persona Adaptation:** Offers multiple AI personas (e.g., Detective, Teacher, Psychologist) each with unique conversational styles, knowledge bases, and emotional tones.
*   **Age-Group Specific Interactions:** Tailors responses and vocabulary for different age groups (Kids, Teens, Adults, Seniors), ensuring appropriate and effective communication.
*   **Domain-Specific Knowledge:** Allows users to select a domain of interest (e.g., Deep Research, Finance, Health, Fun/Creative), focusing the AI's expertise and responses.
*   **Customizable Intent Filters:** Users can apply and even define custom filters (e.g., “2 Mark Answers,” “Exam Prep,” “Creative Writing Prompts”) to refine the AI's focus.
*   **Text-to-Speech (TTS) with Character Voices:** Each AI persona can vocalize responses with a unique voice, adding a layer of personality and immersion. This leverages advanced TTS capabilities.
*   **Image Library Integration:** Provides access to a library of images that can be used within conversations, aiding in storytelling, learning, and creative tasks.
*   **External AI Model Integration:** Connects with powerful external models like Perplexity Sonar to augment its knowledge base and provide comprehensive answers.
*   **User-Friendly Interface:** Features a modern, responsive interface with features like dark/light theme support for user comfort.

## Newly Added Features

1. 🎯 **Immersive Domain Selector UI:** Visually select from domains like Deep Research, Finance, Health, and Fun/Creative through an interactive node-style selector. *This offers a unique, immersive navigation experience not commonly found in AI tools.*

2. 🧠 **Smart Filters by Intention:** Utilize custom intent filters such as “2 Mark Answers,” “Exam Prep,” “Creative,” and “Code Help.” Users can also dynamically add new filters, a feature not available in tools like Perplexity Sonar, allowing for more refined intent.

3. 🧍‍♂️ **Multiple Personas:** Interact with AI personas including Detective (logic-based help), Teacher (educational support), Funny/Friendly, Motivator, Professional (career-focused), Psychologist, and Poetic. *Each persona boasts a unique style, purpose, and emotional tone, offering a level of customization not found in existing AI assistants.*

4. 👶👦🧑👴 **Personas by Age Group:** Experience conversations tailored for Kids, Teens, Adults, and Seniors. *This first-of-its-kind feature provides age-specific tone, vocabulary, and support based on user maturity.*

5. 🖼️ **Library Modal for Image Access:** Access a built-in modal window to browse images visually, enhancing storytelling, concept learning, and media-rich tasks. *This enriches multimedia learning, a feature often missing in standard chat UIs and tools like Perplexity.*

6. 🔊 **Text-to-Voice with Character Voices:** Hear each persona speak with a unique voice, adding human-like emotion and personality to interactions. *This goes beyond generic TTS, providing emotional, character-driven vocal output.*

7. 🌙🌞 **Dark / Light Theme Support:** Switch between UI themes based on your mood or time of day, improving user comfort and accessibility. *Unlike most AI tools locked into a single theme, this feature adds user control and aesthetic appeal.*

---

## Why These Technologies Were Used

- **Python (Backend):** Chosen for its extensive libraries (e.g., `sentence-transformers` for semantic search) and frameworks ideal for AI and natural language processing, enabling efficient backend API development.
- **FastAPI (Backend):** Used for building the high-performance, asynchronous RESTful API. Its benefits include automatic data validation via Pydantic, built-in support for async operations, and excellent performance.
- **Uvicorn (Backend):** Serves as the lightning-fast ASGI server for the FastAPI application.
- **React + TypeScript (Frontend):** Offers a powerful, type-safe environment to build dynamic, reusable UI components with excellent developer tooling and maintainability.
- **Vite (Frontend):** Selected for its rapid build times and Hot Module Replacement (HMR), significantly improving frontend development speed and experience.
- **Tailwind CSS (Frontend):** Provides utility-first CSS for quick, consistent, and responsive styling, enabling a modern and visually appealing UI.
- **Node.js and npm (Frontend):** Used for managing frontend dependencies, running scripts, and ensuring smooth build and deployment processes.
- **Perplexity Sonar API (External Service):** Integrated for leveraging advanced external AI model capabilities for enhanced responses.
- **Modular Architecture:** Ensures a clear separation of concerns between the backend (FastAPI) and frontend (React), enhancing scalability, maintainability, and collaboration.

## --

## Project Structure

The project is organized as follows:

```
.
├── .env                     # Environment variables (backend and frontend - IMPORTANT: needs to be created by user)
├── .gitignore               # Git ignore rules
├── .venv/                   # Python virtual environment (created locally during setup)
├── backend/                 # Python FastAPI backend
│   ├── .dockerignore        # Docker ignore rules for backend
│   ├── .gitignore           # Git ignore rules for backend files
│   ├── Dockerfile           # Dockerfile for building backend container
│   ├── Dockerfile.azure     # Specific Dockerfile for Azure deployment
│   ├── api/                 # Core API logic and modules
│   │   ├── intent_api.py    # Main FastAPI application, intent classification, TTS endpoints
│   │   └── intention_data.py # Data and definitions for intent recognition
│   ├── azure-deploy.yaml    # Azure deployment configuration file
│   ├── intention_embeddings.pkl # Pre-computed sentence embeddings for intentions
│   ├── render.yaml          # Configuration for deployment on Render
│   ├── requirements.txt     # Python dependencies for the backend
│   ├── vercel.json          # Vercel deployment configuration (note: in backend/, may relate to serverless functions)
│   └── wsgi.py              # WSGI entry point using Uvicorn to serve the FastAPI app
│
├── bun.lockb                # Exact versions for 'bun' package manager (alternative to npm)
├── components.json          # Configuration for UI components (likely for shadcn/ui)
├── eslint.config.js         # ESLint configuration file
├── index.html               # Main HTML entry point for the Vite frontend
├── package-lock.json        # Exact versions for 'npm' package manager dependencies
├── package.json             # Frontend dependencies and scripts (Node.js project)
├── postcss.config.js        # PostCSS configuration for CSS processing
├── public/                  # Static assets served by the frontend
│   ├── favicon.ico          # Favicon for the application
│   ├── images/              # Contains character images and other visual assets
│   │   ├── Alexa-Adult.jpg
│   │   ├── ... (many other character/persona images)
│   ├── placeholder.svg      # A placeholder image
│   └── robots.txt           # Instructions for web crawlers
│
├── src/                     # Frontend React + TypeScript source code (managed by Vite)
│   ├── App.css             # Specific styles for the main App component
│   ├── App.tsx             # Main React application component (root component)
│   ├── components/         # Reusable UI components
│   │   ├── AppHeader.tsx   # Application header component
│   │   ├── ChatArea.tsx    # Component for the chat interaction area
│   │   ├── auth/           # Authentication related components
│   │   │   ├── LoginForm.tsx
│   │   │   └── ... (other auth components like SignupForm, ProtectedRoute)
│   │   └── ui/             # Base UI elements, often from a library like shadcn/ui
│   │       ├── button.tsx
│   │       └── ... (many other UI components like dialog, card, input, etc.)
│   ├── config/             # Frontend configuration files
│   │   └── superbase.ts    # Supabase client initialization (if Supabase is used for BaaS)
│   ├── contexts/           # React context providers (e.g., AuthContext, ThemeContext)
│   ├── hooks/              # Custom React hooks for reusable logic
│   ├── lib/                # Utility functions and libraries
│   │   └── utils.ts        # General utility functions for the frontend
│   ├── main.tsx            # Frontend entry point where React app is mounted to the DOM
│   ├── pages/              # Page-level components corresponding to different routes
│   │   ├── ChatPage.tsx
│   │   └── ... (AuthPage, DomainSelector, etc.)
│   ├── services/           # Modules for interacting with APIs and other services
│   │   └── apiService.ts   # Service for backend API calls (intent, TTS, Sonar)
│   ├── types/              # TypeScript type definitions and interfaces
│   ├── index.css           # Global styles and Tailwind CSS imports
│   └── vite-env.d.ts       # TypeScript definitions for Vite environment variables
│
├── tailwind.config.ts       # Tailwind CSS configuration file
├── test_intent_api.py       # Python script for testing the backend intent API
├── tsconfig.app.json        # TypeScript compiler options specific to the application
├── tsconfig.json            # Base TypeScript compiler options for the project
├── tsconfig.node.json       # TypeScript compiler options for Node.js environment (e.g., Vite config)
├── vite.config.ts           # Vite build and development server configuration
└── README.md                # This file: Project documentation and setup guide
```

---

## Installation and Running the Project

### Prerequisites

- **Node.js:** v18 or higher recommended (or Bun v1.0 or higher as an alternative package manager).
- **npm:** v9 or higher (comes with Node.js) or **Bun**.
- **Python:** v3.9 or higher recommended.
- **pip:** (Python package manager, typically comes with Python).
- **Uvicorn:** `pip install uvicorn` (needed to run the backend).
- **Virtual Environment Tool (optional but recommended):** `venv` (built-in) or `conda`.

---

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a virtual environment (recommended):**
    *   Using `venv`:
        ```bash
        python -m venv .venv
        source .venv/bin/activate  # On macOS/Linux
        # .venv\Scripts\activate    # On Windows
        ```
    *   Ensure your terminal is using the virtual environment for subsequent commands.
3.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Create Environment File:**
    *   Create a file named `.env` in the `backend` directory (`backend/.env`).
    *   This file is used for environment-specific variables. At a minimum, it might be used for API keys if your application integrates with third-party services directly from the backend. For now, it can be left empty or with placeholder values if no immediate backend-specific keys are required for basic local operation.
    *   Example `backend/.env` (if needed in future):
        ```env
        # EXAMPLE_BACKEND_API_KEY="your_key_here"
        ```
5.  **Run the backend development server:**
    *   The backend is a FastAPI application run with Uvicorn. The `wsgi.py` script is preconfigured to run it on port 8000.
    ```bash
    python wsgi.py
    ```
    *   Alternatively, for development with auto-reload when code changes:
    ```bash
    uvicorn api.intent_api:app --reload --host 0.0.0.0 --port 8000
    ```
    *   The backend API will typically be available at `http://localhost:8000`.

---

### Frontend Setup

1.  **Navigate to the project root directory** (if you were in the `backend` directory, use `cd ..`).
2.  **Install frontend dependencies:**
    *   Using `npm`:
        ```bash
        npm install
        ```
    *   Or using `bun` (if you prefer, as `bun.lockb` is present):
        ```bash
        bun install
        ```
3.  **Create Environment File for Frontend:**
    *   The frontend service `src/services/apiService.ts` connects to a backend API (defaulting to an Azure URL) and the Perplexity Sonar API. You'll need to configure these, especially for local development.
    *   Create a file named `.env` in the **project root directory** (not the `backend` directory).
    *   Add the following environment variables:
        ```env
        # URL for your local backend API
        VITE_INTENT_API_URL=http://localhost:8000 
        
        # API Key for Perplexity Sonar (if you intend to use this feature)
        # Obtain this key from your Perplexity AI account.
        VITE_SONAR_API_TOKEN="your_perplexity_sonar_api_key_here" 

        # Example for Supabase (if used, based on src/config/superbase.ts)
        # VITE_SUPABASE_URL="your_supabase_url"
        # VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
        ```
    *   **Important:** Vite requires environment variables exposed to the client-side code to be prefixed with `VITE_`.
4.  **Start the frontend development server:**
    *   Using `npm`:
        ```bash
        npm run dev
        ```
    *   Or using `bun`:
        ```bash
        bun run dev
        ```
    *   The frontend application will typically be available at `http://localhost:5173` (Vite's default) or another port if specified in `vite.config.ts`. Check your terminal output.

---

### Accessing the Application

Once both the backend and frontend servers are running:

1.  Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173` or as indicated in your terminal).
2.  Ensure your local backend is running and accessible at the URL you configured for `VITE_INTENT_API_URL` (e.g., `http://localhost:8000`).

---

## Deployment

This project is configured for deployment on various platforms. Here’s an overview of the available deployment options:

### Docker

The project includes Dockerfiles for containerizing both the frontend and backend, facilitating consistent deployments across different environments.

*   **Backend (`backend/Dockerfile`):** This Dockerfile sets up the Python FastAPI backend environment. You can build and run it using standard Docker commands:
    ```bash
    # Navigate to the backend directory
    cd backend

    # Build the Docker image
    docker build -t infinia-backend .

    # Run the Docker container (example)
    # Make sure to pass necessary environment variables, e.g., via a .env file or -e flags
    docker run -d -p 8000:8000 --env-file .env infinia-backend
    ```
*   **Backend for Azure (`backend/Dockerfile.azure`):** A specific Dockerfile optimized or configured for Azure deployments.

*   **Frontend:** While a specific Dockerfile for the frontend isn't explicitly listed in the root, the frontend (built using `npm run build`) produces static assets that can be served by any static web server (like Nginx) or a platform that supports Node.js hosting. You can create a simple Dockerfile for this if needed:
    1.  Build the frontend: `npm run build` (creates a `dist` folder).
    2.  Create a Dockerfile that uses a lightweight HTTP server (e.g., Nginx) to serve the contents of the `dist` folder.

### Vercel

*   The `vercel.json` file in the `backend` directory suggests configurations for deploying on Vercel. Vercel is well-suited for frontend projects and can also handle serverless functions (which might be how the Python backend is intended to be deployed there, or it might be for a Node.js backend if the project had one).
*   Typically, you would connect your Git repository to Vercel and configure the build settings (e.g., Vite for frontend, and potentially custom commands for any backend/serverless functions).

### Microsoft Azure

*   **`backend/Dockerfile.azure`**: This Dockerfile is tailored for deploying the backend to Azure services like Azure App Service or Azure Kubernetes Service (AKS).
*   **`backend/azure-deploy.yaml`**: This YAML file likely contains deployment configurations for Azure, possibly for CI/CD pipelines (e.g., Azure DevOps) or Infrastructure as Code (e.g., ARM templates or Bicep, though the name is generic).

### Render

*   **`backend/render.yaml`**: This file defines the services for deploying the application (likely the backend) to Render. Render can auto-deploy from your Git repository and supports web services, background workers, and databases.

### General Notes for Deployment:

*   **Environment Variables:** Ensure all necessary environment variables (API keys, database URLs, `VITE_INTENT_API_URL` for the frontend to point to the deployed backend, etc.) are correctly configured in your chosen hosting platform's settings.
*   **Frontend Build:** For production, build the frontend using `npm run build`. The output in the `dist/` directory should be deployed.
*   **Backend URL:** The frontend needs to know the URL of the deployed backend. This is typically set via an environment variable like `VITE_INTENT_API_URL` during the frontend build process or at runtime if using SSR/ISR.

## Configuration (Environment Variables)

The application uses `.env` files to manage environment-specific configurations for both the backend and frontend. These files are not committed to version control (and should be listed in `.gitignore`).

### Backend Configuration

*   **File:** `backend/.env`
*   **Purpose:** Stores configuration for the Python FastAPI backend.
*   **Variables:** While the current backend doesn't heavily rely on many environment variables for basic local operation out-of-the-box, it's good practice to use it for any sensitive information or settings that might change between environments (development, staging, production).
    ```env
    # Example: If you add integrations that require backend API keys
    # SOME_BACKEND_SERVICE_API_KEY="your_key_here"
    ```
    *   Refer to the "Backend Setup" section for initial creation.

### Frontend Configuration

*   **File:** `.env` (in the project root directory)
*   **Purpose:** Stores configuration for the React frontend, primarily API endpoints and keys for third-party services. Vite requires these variables to be prefixed with `VITE_`.
*   **Key Variables:**
    ```env
    # Required: URL for your backend API. 
    # For local development, this should point to your local backend server.
    # For production, this should point to your deployed backend URL.
    VITE_INTENT_API_URL=http://localhost:8000 
    
    # Required: API Key for Perplexity Sonar AI.
    # Obtain this key from your Perplexity AI account to use Sonar integration.
    VITE_SONAR_API_TOKEN="your_perplexity_sonar_api_key_here" 

    # Optional: If using Supabase for backend-as-a-service features (e.g., auth, database)
    # VITE_SUPABASE_URL="your_supabase_url"
    # VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
    ```
    *   Refer to the "Frontend Setup" section for initial creation. Make sure to replace placeholder values with your actual keys and URLs.

**Important:**
*   Always create these `.env` files as they are not included in the repository.
*   Never commit your actual `.env` files containing sensitive keys to version control. Ensure `.env` is listed in your `.gitignore` file.

## Additional Notes

- For production deployment, consider building the frontend with:

```bash
npm run build
```

- Then serve the static files with a web server or integrate with the backend.

- Tailwind CSS is configured for utility-first styling; customize `tailwind.config.ts` as needed.

- The project uses TypeScript for type safety and better developer experience.
--



---
