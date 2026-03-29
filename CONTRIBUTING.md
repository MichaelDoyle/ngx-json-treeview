# Contributing to ngx-json-treeview

Thank you for considering contributing to `ngx-json-treeview`!

## Code of Conduct

Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (check `package.json` for recommended versions)
- [pnpm](https://pnpm.io/) (the project uses pnpm for package management)

### Setup

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/MichaelDoyle/ngx-json-treeview.git
    cd ngx-json-treeview
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

## Development Workflow

This project is organized as an Angular workspace with two main projects:

- `ngx-json-treeview`: The core library (located in `projects/ngx-json-treeview`).
- `demo`: A sample application used for manual testing and demonstration (located in `projects/demo`).

### Local Development

To start the demo application and see your changes in real-time:

```bash
pnpm start
```

This will serve the demo app at `http://localhost:4200/`. The demo app is configured to use the library from the source, so changes to the library will trigger a reload.

### Running Tests

We use Jasmine and Karma for unit testing. To run the tests for the library:

```bash
pnpm test
```

Please ensure that all tests pass before submitting a pull request. If you are adding a new feature, please include corresponding unit tests.

### Code Formatting

This project uses [Prettier](https://prettier.io/) for code formatting. You can check for formatting issues or fix them automatically:

```bash
# Check for formatting issues
pnpm run format:check

# Fix formatting issues
pnpm run format
```

## Submitting Changes

1.  **Create a Branch**: Create a new branch for your feature or bug fix.

    ```bash
    git checkout -b my-feature-branch
    ```

2.  **Commit Your Changes**: Make your changes and commit them using [Conventional Commits](https://www.conventionalcommits.org/).

    Example: `feat: add support for custom value click handlers`

    Common types include:
    - `feat`: A new feature
    - `fix`: A bug fix
    - `docs`: Documentation only changes
    - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
    - `refactor`: A code change that neither fixes a bug nor adds a feature
    - `perf`: A code change that improves performance
    - `test`: Adding missing tests or correcting existing tests
    - `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

3.  **Push Your Branch**:

    ```bash
    git push origin my-feature-branch
    ```

4.  **Open a Pull Request**: Submit your pull request to the `main` branch. Provide a clear description of the changes and link to any related issues.

## Pull Request Guidelines

- **Keep it Focused**: A pull request should ideally do one thing. If you have multiple unrelated changes, please split them into separate PRs.
- **Update Documentation**: If your changes introduce new features or change existing behavior, please update the `README.md` as necessary.
- **Test Your Changes**: Ensure that your changes are well-tested and don't break existing functionality.

## Questions?

If you have any questions or need further clarification, feel free to open an issue or reach out to the maintainers.
