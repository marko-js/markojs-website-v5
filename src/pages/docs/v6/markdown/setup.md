# Setup

## Marko Playground

The fastest way to try out Marko without installing anything is with the [**Marko Playground**](https://markojs.com/playground/v6/). It's an online interactive environment where you can write Marko code and see the results in real-time.

In the Playground, you'll find a simple counter example. Go ahead and edit the code, and watch the output update instantly!

## Local Development with Marko Run

To set up a local development environment, Marko Run is recommended as it makes this process quick and easy.

**Prerequisites**

- **Node.js:** Marko requires Node.js to be installed on your system. Download the latest LTS version from the official website: [https://nodejs.org/](https://nodejs.org/)
- **npm (or yarn):** Node.js comes bundled with npm (Node Package Manager), but you can also use yarn if you prefer.

### 1. Creating a new Project

Once you have Node.js and npm (or yarn) installed, open your terminal (command prompt or PowerShell) and run the following command:

```bash
npm init marko
```

This cli will guide you through creating a new project.

### 2. Basic Marko Run Commands

After creating a Marko Run project, navigate to your project directory and use the following commands:

- `marko-run dev`: Start a development server with live reload (your changes will automatically appear in the browser).
- `marko-run build`: Build a production-ready version of your app.
- `marko-run preview`: Preview a production build locally.

### 3. Enhancing Your Workflow with Editor Plugins (Optional)

Editor plugins can significantly improve your development experience by providing features like:

- **Syntax highlighting:** Makes your Marko code more readable.
- **Code completion (IntelliSense):** Helps you write code faster with suggestions and autocompletion.
- **Error checking (linting):** Catches potential errors in your code early on.

**Recommended Plugins**

- [**VS Code**](https://marketplace.visualstudio.com/items?itemName=Marko-JS.marko-vscode): the official editor plugin from the marketplace
- [**Other Editors**](https://github.com/marko-js/language-server): setup instructions to use the Marko language server in various other editors
