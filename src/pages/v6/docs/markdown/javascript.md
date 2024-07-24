# JavaScript in Marko

One of Marko's core strengths is its seamless integration with JavaScript. You can directly embed JavaScript expressions, use variables, and call functions within your Marko templates.

## Dynamic Content

Marko makes it easy to inject dynamic values and logic directly into your HTML using embedded JavaScript expressions. Wrap your JavaScript code in `${}` (similar to template literals), and Marko will evaluate it and render the result.

```marko
<p>The current date is: ${new Date().toLocaleDateString()}</p>

<div>${user.isLoggedIn ? "Welcome back, " + user.name : "Please log in."}</div>
```

> [!TIP]
> By default, Marko escapes HTML content within `${}` expressions to prevent Cross-Site Scripting (XSS) vulnerabilities. However, if you need to render unescaped HTML (with extreme caution!), you can use `$!{}`.

> [!IMPORTANT] > **Only use `$!{}` when you are absolutely sure that the HTML content is safe and cannot be manipulated by malicious users.**

## Attributes as JavaScript Expressions

In Marko, you can use JavaScript expressions to dynamically control attribute values. This makes your HTML incredibly flexible and responsive to data changes.

```marko
<img src=getImageUrl(product.id) alt=product.name>

<button disabled=!isValid(form)>
  Submit
</button>
```

## Importing & Exporting Modules

Marko supports JavaScript modules (using `import` and `export`), allowing you to organize your code into reusable components and functions and use modules from `npm`.

**Example (index.marko):**

```marko
import isEven from "is-even";

<div>Two is ${isEven(2) ? "even" : "odd"}</div>
```

## Static JavaScript

The static keyword is used to define JavaScript variables and functions that will only be executed once for each component type. This is useful for tasks like setting default values or defining helper functions that are specific to a component.

```marko
static const asDollars = (num) => "$" + num.toFixed(2);

<div>The price is ${asDollars(100 / 3)}</div>
```

## TypeScript Support: Type Safety in Marko

Marko has excellent TypeScript support, allowing you to add type annotations to your code for better type checking, error prevention, and enhanced developer experience.

You can enable TypeScript in a Marko project by creating a `tsconfig.json` file in your project's root directory. Learn more about Marko's TypeScript support in the [TypeScript documentation](./typescript.md).
