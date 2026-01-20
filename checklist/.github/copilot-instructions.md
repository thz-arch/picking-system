# PWA Gerador de Checklist CTRC - Copilot Instructions

## Project Overview
Progressive Web App for generating CTRC checklist PDFs. Built with React, Vite, Tailwind CSS, and jsPDF.

## Tech Stack
- React 18+ with Vite
- Tailwind CSS for styling
- jsPDF for PDF generation
- Lucide React for icons
- PWA (Progressive Web App) capabilities

## Development Guidelines
- Use functional components with React hooks
- Keep components modular and reusable
- Implement proper error handling and loading states
- Follow Tailwind CSS utility-first approach
- Use environment variables for sensitive data (webhook URL, API tokens)

## Code Style
- Use ES6+ syntax
- Prefer const/let over var
- Use arrow functions
- Implement async/await for asynchronous operations
- Add JSDoc comments for complex functions

## Security
- Never hardcode API tokens in source code
- Use .env files for configuration
- Validate all user inputs
- Implement proper error boundaries

## Project Structure
```
/src
  /components - React components
  /services - API and external services
  /utils - Helper functions and utilities
  /public - Static assets, PWA files
```

## Setup Status
- [x] Created copilot instructions file
- [x] Scaffolded React + Vite project
- [ ] Installed dependencies (requires Node.js - see INSTALL.md)
- [x] Configured Tailwind CSS
- [x] Created project structure
- [x] Created core components
- [x] Created webhook service
- [x] Created PDF template
- [x] Configured PWA
- [x] Setup environment variables
- [x] Built main App component
- [ ] Tested and compiled project (requires npm install)
- [x] Created documentation
