# Contributing to Rever

Thank you for your interest in contributing to Rever! We're excited to have you join our community. This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand the expectations we have for everyone who contributes to this project.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.12+
- Node.js 18+

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/reverfin/rever.git
   cd rever
   ```

2. Create environment files:

   ```bash
   cp api/.env.example .env
   ```

3. Update the environment variables in the `.env` files with your configuration.

4. Start the development server:

   ```bash
   docker compose -f docker-compose-local.yaml up -d
   ```

5. Set up Git hooks for code quality:

   ```bash
   # Run the setup script
   ./setup-git-hooks.sh
   ```

   This will configure Git to use our custom hooks directory. The pre-commit hook will:

   - Run `ruff format` and `ruff check --fix` on Python files in the `api` directory
   - Run `yarn format` on TypeScript, TSX, and Markdown files

6. Run the migrations
   ```bash 
   docker exec -it <api-container-name> python manage.py migrate
   ```
   Get api-container-name by running `docker ps`

7. Access the application at http://localhost:3000

## Project Structure

```
rever/
├── api/                  # Django backend
│   ├── rever/            # Main Django app
│   │   ├── app/          # API endpoints and business logic
│   │   ├── bgtasks/      # Background tasks (Celery)
│   │   ├── db/           # Database models
│   │   └── utils/        # Utility functions
├── web/                  # Next.js frontend
│   ├── public/           # Static assets
│   └── src/              # Source code
│       ├── app/          # Next.js app router
│       ├── components/   # React components
│       ├── services/     # API services
│       └── stores/       # State management
├── nginx/                # Nginx configuration
└── packages/             # Shared packages
```

## Pull Request Guidelines

- Fill in the required pull request template
- Include screenshots or animated GIFs in your pull request whenever possible
- Follow our code style and ensure all linting checks pass
- Write or update tests for the changes you make
- Make sure your code passes all tests
- Keep your pull request focused on a single topic
- Reference any relevant issues in your PR description using GitHub's keyword references

## Coding Standards

### Python (Backend)

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use type hints where appropriate
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility

### TypeScript/JavaScript (Frontend)

- Follow the ESLint configuration provided in the project
- Use TypeScript types/interfaces for all components and functions
- Use functional components with hooks instead of class components
- Follow the file and folder structure of the project

## Documentation

- Update documentation for any new features or changes to existing functionality
- Document API endpoints using docstrings that can be picked up by automated tools
- Keep the README and other documentation up to date

## Reporting Bugs

- Use the bug report template when creating a new issue
- Include detailed steps to reproduce the bug
- Include information about your environment (OS, browser, etc.)
- Include screenshots or videos if applicable

## Suggesting Features

- Use the feature request template when creating a new issue
- Clearly describe the problem your feature would solve
- Suggest an implementation approach if possible
- Discuss the feature with the community before starting work

## Communication

- Join our [community discussions](https://community.reverfin.ai/)
- Ask questions in the appropriate channels
- Be respectful and considerate in all communications

## License

By contributing to Rever, you agree that your contributions will be licensed under the project's [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

Thank you for contributing to Rever!
