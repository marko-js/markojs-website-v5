# The Marko Language

Marko is a powerful and intuitive language for building dynamic and reactive user interfaces. One of the best things about Marko is that it builds upon the familiar foundations of HTML and JavaScript, making it incredibly easy to learn for web developers.

## Familiar Foundation

If you know HTML, you already have a head start in Marko! A large part of Marko is based directly on HTML. In fact, most valid HTML code can be compiled by Marko without any changes.

Take a look at this simple "Hello World" example in both HTML and Marko:

**HTML (`index.html`)**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Hello World</title>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
```

**Marko (`index.marko`)**

```marko
<!DOCTYPE html>
<html>
  <head>
    <title>Hello World</title>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
```

As you can see, they're practically identical! This makes Marko very approachable for those coming from an HTML background.

> [!CAUTION]
> While _most_ HTML is valid Marko, there are a few exceptions. Learn more about the [differences from HTML]().

## Concise Syntax

Marko offers an optional **Concise Syntax** that allows you to write more compact code. In the indentation-based Concise Syntax, you can omit closing tags and use shorthands for common attributes.

**Example: Regular Mode vs. Concise Mode**

**Regular Mode**

```marko
<div>
  <h1 class="title">
    Hello World!
  </h1>
</div>
```

**Concise Mode**

```marko
div
  h1.title -- Hello World!
```

> [!TIP]
> Concise Mode is entirely optional. You can choose the style that best suits your preferences and project needs. You can toggle between the two syntax modes in this documentation using the switch icon located at the top right corner of all Marko code blocks.

### Supercharging HTML

While Marko embraces HTML, it doesn't stop there. Marko extends HTML with dynamic features that make building modern web applications a breeze. We'll cover these in the upcoming sections.
