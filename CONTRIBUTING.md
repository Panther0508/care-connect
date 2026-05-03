# Contributing to VitaChain

## Welcome

We welcome contributions from the community! Whether you're fixing a bug, adding a feature, or improving documentation, your help is appreciated.

## Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/vitachain.git
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Download required data:
   ```bash
   node scripts/download-all-data.mjs
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Pull Request Process

1. Open an issue first to discuss the change you wish to make (unless it's a trivial fix).
2. Create a feature branch off `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes, ensuring you follow the code style guidelines.
4. If applicable, write tests for your changes.
5. Ensure the build passes:
   ```bash
   npm run build
   ```
6. Commit your changes with a clear and descriptive message.
7. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. Open a pull request against the `main` branch of the original repository.
9. Please include a clear description of the changes and reference any related issues.

## AI Usage Disclosure

Any contribution that was generated or assisted by a Large Language Model (LLM) must be clearly disclosed in the pull request description. This helps maintain transparency and allows reviewers to provide appropriate feedback.

## Code Style

Please follow the existing ESLint and Prettier configuration in the project. Key points:

- Use functional React components with hooks
- All text should be in Plus Jakarta Sans (handled by the Tailwind theme)
- Follow the existing code formatting and conventions
- Run `npm run lint` and `npm run format` before submitting your PR

Thank you for contributing to VitaChain!

## Contact

For questions about contributing, reach out to **Nmesirionye Ngbaronye** at nmesirionyengbaronye@gmail.com.