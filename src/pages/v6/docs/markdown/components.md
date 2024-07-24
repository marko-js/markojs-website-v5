# Components in Marko

Components are the building blocks of Marko applications. They allow you to break down your user interface into independent, reusable pieces, which makes your code more organized, maintainable, and scalable. Think of components like specialized HTML elements that you can define yourself.

## Introduction to Components

In Marko, a component is simply a Marko template file (`.marko`) that represents a self-contained piece of your UI. Components encapsulate their own HTML and JavaScript logic, making them easy to reason about and reuse throughout your project.

### The Benefits of Components

- **Reusability:** Write a component once, and use it anywhere you need that functionality. This saves you time and effort and keeps your code consistent.
- **Maintainability:** Components break down complex UIs and logic into smaller, more manageable chunks. This makes your code easier to understand, debug, and update.
- **Organization:** Components promote a modular architecture, making your project's structure cleaner and more scalable as it grows.

## Creating Your First Component

Let's create a simple "Profile Card" component:

1. **Create a `components` Directory:** Inside your Marko project, create a folder named `components`. This is where we'll place our component files.

2. **Create the Component File:** Inside the `components` directory, create a file named `profile-card.marko`.

3. **Write the Component Code:** Add the following code to `profile-card.marko`:

   ```marko
   <div>
     <h2>Alice</h2>
     <p>Web Developer</p>
   </div>
   ```

Now, let's use this component in another Marko file:

```marko
<profile-card/>
```

This code will render the following HTML:

```html
<div>
  <h2>Alice</h2>
  <p>Web Developer</p>
</div>
```

## Passing Data to Components: The `input` Object

Components can receive data from their parents through attributes. Inside a component, you can access these attributes using the special `input` object.

**Example:**

```marko
// components/profile-card.marko


<div>
  <h2>${input.name}</h2>
  <p>${input.bio}</p>
</div>
```

```marko
// app.marko


<profile-card name="Alice" bio="Web Developer"/>
<profile-card name="Bodhi" bio="Project Manager"/>
```

This will render the following:

```html
<div>
  <h2>Alice</h2>
  <p>Web Developer</p>
</div>
<div>
  <h2>Bodhi</h2>
  <p>Project Manager</p>
</div>
```

## Inline Components: Using `<define>`

You can also define components directly within a Marko file using the `<define>` tag. This is useful for small, context-specific components.

```marko
<define/FancyButton|attrs|>
  <button ...attrs class="fancy-button">
    <${input.renderBody}/>
  </button>
</define>

<FancyButton>Click Me!</FancyButton>
<FancyButton>Or Me!</FancyButton>
```

## Sharing & Using Third-Party Components

Marko has a thriving ecosystem of third-party components that you can easily integrate into your projects. You can find components on the [npm registry]() and install them using npm.

If you want to publish your own components for others to use, check out the [Publishing Guide]().
