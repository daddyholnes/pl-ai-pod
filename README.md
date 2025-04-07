# PodPlay Pen
GITHUB REPO https://github.com/daddyholnes/pl-ai-pod
An AI development sandbox powered by Google's Gemini models that provides an interactive environment for code generation, chat, and AI experimentation.

## 🌟 Features

- **Multiple AI Model Support**: Integration with Google's Gemini models (2.5 Pro, 2.0 Flash, 1.5 Pro, etc.)
- **Persistent Chat History**: PostgreSQL database integration for saving conversations
- **Code Generation**: AI-powered code creation with syntax highlighting
- **Project Management**: Save and organize multiple AI-assisted coding projects
- **Enhanced Error Handling**: Robust retry logic for API calls
- **User Authentication**: Secure login and registration system
- **Personalized AI Characters**: Create custom AI assistants with specific personas
- **Interactive Model Playground**: Tune AI parameters like temperature and tokens in real-time

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Google Generative AI SDK (@google/generative-ai)
- **Authentication**: Passport.js with session-based auth
- **State Management**: React Query (TanStack Query)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google AI API key (for Gemini models)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/podplay

# API Keys
GOOGLE_API_KEY=your_google_ai_key_here

# Session
SESSION_SECRET=your_random_session_secret
```

### Installation

1. Clone the repository
2. Install dependencies (`npm install`)
3. Set up the database (`npm run db:push`)
4. Start the development server (`npm run dev`)
5. Open your browser and navigate to `http://localhost:5000`

## 📋 Usage Guide

### Chat Interface

- Select an AI model from the dropdown
- Adjust parameters like temperature and max tokens
- Type your message and press Enter to send
- View the AI's response in the chat window

### Code Generation

- Describe the code you want to generate
- Choose the programming language
- Adjust parameters for different creativity levels
- View and edit the generated code

### Project Management

- Save code snippets as projects
- Organize projects into folders
- Edit and update projects as needed
- Share projects with others

## 🏗️ Project Structure

```
podplay-pen/
├── client/               # Frontend code
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── ...
├── server/               # Backend code
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage interface
│   └── ...
├── shared/               # Shared code
│   └── schema.ts         # Database schema
└── ...
```

## 🧠 AI Model Capabilities

The sandbox integrates with Google's Gemini models, providing various capabilities:

- **Gemini 2.5 Pro**: Advanced reasoning, complex instructions, multimodal capabilities
- **Gemini 2.0 Flash**: Fast responses, good balance of speed and quality
- **Gemini 1.5 Pro**: Strong general performance, good for code generation
- **Gemini 1.5 Flash**: Optimized for quick responses and chat

---

This project is for personal use and experimentation with AI technologies, specifically designed to support neurological needs through AI interactions.


# Current status and outstanding developments
Here's what you need to know about the current state of the project:

What's Working Now
✓ Fixed placeholder pages for Settings and Code to prevent 404 errors
✓ Database connection is working in the Replit environment
✓ All navigation links function properly
✓ Authentication is working with the database

What's Left for Development
Code Generation/Execution: The code editor page is just a placeholder. This will need implementation to:

Allow writing code
Executing code samples
Getting AI suggestions for code
Settings Page: Currently just a placeholder. Need to add:

User account settings
API configuration
UI theme customization
Enhanced Chat Features:

Support for multiple chat threads
Model parameter customization
Better chat history management
File Browser Improvements:

There's a React warning about invalid props in the file browser component
Need to improve file upload/download functionality
