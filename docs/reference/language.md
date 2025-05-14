# Language Reference

Marko is a superset of [well-formed](https://en.wikipedia.org/wiki/Well-formed_document) HTML.

The language makes HTML more strict while extending it with control flow and reactive data bindings. It does this by meshing JavaScript syntax features with HTML and introducing a few new syntaxes of its own. Most HTML is valid Marko but there are some important deviations.

## Syntax Legend

<div class="code-block-mode-toggle">
<pre class="html">
<a href="#statements">import "...";</a>
&lt;<a href="#tags">tag-name</a>|<a href="#tag-parameters">tag, parameters</a>|/<a href="#tag-variables">tagVariable</a> ...<a href="#attributes">attributes</a>&gt;
  <a href="#tag-content">content</a> with <a href="#dynamic-text">&#36;{dynamic text}</a>
  &lt;<a href="#attribute-tags">@attribute-tags</a>/&gt;
&lt;/&gt;
</pre>
<pre class="concise">
<a href="#statements">import "...";</a>
<a href="#tags">tag-name</a>|<a href="#tag-parameters">tag, parameters</a>|/<a href="#tag-variables">tagVariable</a> ...<a href="#attributes">attributes</a>
  -- <a href="#tag-content">content</a> with <a href="#dynamic-text">&#36;{dynamic text}</a>
  <a href="#attribute-tags">@attribute-tags</a>
</pre>
</div>

> [!TIP]
> Jump to the section for a syntax by clicking on it.

<!--  -->

> [!NOTE]
> The legend above is not comprehensive. See also:
>
> - [`<${dynamic}/>` tag](#dynamic-tags)
> - [Attributes](#attributes) for various attribute shorthands
> - [Tag Arguments](#tag-arguments) as an alternative to attributes
> - [Concise Mode](./concise-syntax.md)

## Template Variables

Within Marko templates a few variables are automatically made available.

### `input`

A JavaScript object globally available in every template that gives access to the [attributes](#attributes) it was provided from a [custom tag](./custom-tag.md) or the data passed in through the [top level api](./template.md).

### `$signal`

An [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) available in all JavaScript statements and expressions.

It is aborted when

1. The expression is invalidated
2. The template or [tag content](#tag-content) is removed from the DOM

This is primarily to handle cleaning up side effects.

> [!TIP]
> Many built-in APIs like [`addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#signal) include the option to pass a signal for cleanup.
>
> ```marko
> <script>
>   document.addEventListener("resize", () => {
>     // this function will be automatically cleaned up
>   }, { signal: $signal })
> </script>
> ```

### `$global`

Gives access the ["render globals"](./template.md#inputglobal) provided through the [top level api](./template.md).

## Statements

Marko supports a few module scoped top level statements.

### `import`

JavaScript [`import`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) statements are allowed at the root of the template.

```marko
import sum from "sum"

<div data-number=sum(1, 2)></div>
```

> [!NOTE]
> This syntax is a shorthand for [`static import`](#static). For server and client specific imports, you can use [`server` and `client`](#server-and-client) statements.

#### Tag `import` shorthand

[Custom tags](./custom-tag.md) may be referenced using angle brackets in the `from` of the import, which will use Marko's [custom tag discovery logic](./custom-tag.md).

```marko
import MyTag from "<my-tag>"

<MyTag/>
```

### `export`

JavaScript [`export`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export) statements are allowed at the root of the template.

```marko
export function getAnswer() {
  return 42
}

<div>${getAnswer()}</div>
```

### `static`

Statements prefixed with `static` allow running JavaScript expressions in module scope. The statements will run when the template loaded on the server and in the browser.

```marko
static const answer = 41
static function getAnswer() { return answer + 1 }

<div data-answer=getAnswer()></div>
```

All valid javascript statements are allowed, including functions, declarations, conditions, and blocks.

```marko
static {
  console.log("this will be logged only ONE time");
  console.log("no matter how often the component is used")
}
```

### `server` and `client`

As an alternative to [`static`](#static), statements prefixed with `server` or `client` allow arbitrary module scoped JavaScript expressions that are exclusively executed when the template is loaded in a specific environment (the server or the browser).

```marko
server console.log("on the server")

client console.log("in the browser")
```

All valid javascript statements are allowed, including functions, declarations, conditions, and blocks.

```marko
server {
  import { connectToDatabase } from './database';
  const db = connectToDatabase();

  console.log('Database connection established on server');

  // Only happens ONCE, when the application loads
  // and this component is used for the first time
  const users = await db.query('SELECT * FROM users');
  console.log(`Found ${users.length} users in the database`);
}
```

> [!TIP]
> The [`import`](#import) statement is really a shortcut for `static import`. This can be leveraged with `server` and `client` if you want a module to only be imported on one platform
>
> ```marko
> server import "./init-db"
> client import "bootstrap"
> ```

## Tags

Marko supports all native HTML/SVG/whatever tags and attributes. In addition to these, a set of useful [core tags](./core-tags.md) are provided. Each project may have its own [custom tags](./custom-tag.md), and third-party tags may be included through `node_modules`.

All of these types of tags use the same syntax:

```marko
<my-tag/>
```

`.marko` files are [automatically discovered](./custom-tag.md#custom-tag-discovery) as [custom tags](./custom-tag.md) (no need for `import`).

All tags can be [self closed](https://developer.mozilla.org/en-US/docs/Glossary/Void_element#self-closing_tags) when there is no [content](#tag-content). This means `<div/>` is valid, unlike in HTML. Additionally [`void` tags](https://developer.mozilla.org/en-US/docs/Glossary/Void_element) like `<input>` and `<br>` can be [self closed](https://developer.mozilla.org/en-US/docs/Glossary/Void_element#self-closing_tags).

In all closing tags, the tag name may be omitted.

```marko
<div>Hello World</>
```

## Attributes

Attribute values are JavaScript expressions:

```marko
<my-tag str="Hello"></my-tag>
<my-tag str=`Hello ${name}`></my-tag>
<my-tag num=1 + 1></my-tag>
<my-tag date=new Date()></my-tag>
<my-tag fn=function myFn(param1) { console.log("hi") }></my-tag>
```

Almost all valid JavaScript expressions can be written as the attribute value.
Even with `<my-tag str="Hello">` the `"Hello"` string is a JavaScript string literal and not an html attribute string.

Attributes can be thought of as JavaScript objects in Marko which are passed to a tag.

> [!CAUTION]
> Values cannot contain an unenclosed `>` since it is ambiguous. These expressions must use parentheses:
>
> ```marko
> <my-tag value=(1 > 2)></my-tag>
> ```

### Skipped Attributes

If an attribute value is `null`, `undefined` or `false` it will not be written to the html.

> [!NOTE]
> Not _all_ [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) values are skipped. `0`, `NaN`, and `""` will still be written.

### Boolean Attributes

[HTML boolean attributes](https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML) become JavaScript booleans.

```marko
<input type="checkbox" checked>
<input type="checkbox" checked=true>
```

> [!IMPORTANT]
>
> [ARIA enumerated attributes](https://developer.mozilla.org/en-US/docs/Glossary/Enumerated#aria_enumerated_attributes) use strings instead of booleans, so make sure to pass a string.
>
> ```marko
> // ❌ WRONG: Don't do this
> <button aria-pressed=isPressed />
> // outputs <button aria-pressed=""/>
> ```
>
> ```marko
> // 👍 Correct use of aria attributes
> <button aria-pressed=isPressed && "true" />
> // outputs <button aria-pressed="true"/>
> ```

### Spread Attributes

Attributes may be dynamically included with the [spread](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals) syntax.

```marko
<my-tag ...input foo="bar"/>
```

In this case `<my-tag>` would receive the attributes as an object like `{ ...input, foo: "bar" }`.

Attributes are merged from left to right, with later spreads overriding earlier ones if there are conflicts.

> [!NOTE]
> The value after the `...` (like [in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals)) can be any valid JavaScript expression.

### Shorthand Methods

[Method definitions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow for a concise way to pass functions as attributes, such as event handlers.

```marko
<button onClick(ev) { console.log(ev.target) }>Click Me</button>
```

### Shorthand Change Handlers (Two-Way Binding)

The change handler shorthand (`:=`) provides both a value for an attribute and a change handler with the attribute's name suffixed by "Change".

The value must be an [Identifier](https://developer.mozilla.org/en-US/docs/Glossary/Identifier) or a [Property Accessor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors).

For [Identifiers](https://developer.mozilla.org/en-US/docs/Glossary/Identifier), the change handler desugars to a function with an assignment.

```marko
<counter value:=count/>

// desugars to

<counter value=count valueChange(newCount) { count = newCount }/>
```

For [Property Accessors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors), the change handler desugars to a member expression with a `Change` suffix.

```marko
<counter value:=input.count/>

// desugars to

<counter value=input.count valueChange=input.countChange/>
```

### Shorthand `class` and `id`

[Emmet style](https://docs.emmet.io/abbreviations/syntax/#id-and-class) `class` and `id` attribute shorthands are supported.

```marko
<div#foo.bar.baz/>

// same as
<div id="foo" class="bar baz"/>
```

> [!TIP]
> Interpolations are supported within a dynamic class/id.
>
> ```marko
> <div.icon-${iconName}/>
> ```

### Shorthand `value`

It is common for a tag to use a single input property; therefore Marko allows a shorthand for passing an attribute named `value`. If the attribute name is omitted at the beginning of a tag, it will be passed as `value`.

```marko
<my-tag=1/>

// desugars to

<my-tag value=1/>
```

The [method shorthand](#shorthand-methods) can be combined with the value attribute to give us the _value method shorthand_.

```marko
<my-tag() {
  console.log("Hello JavaScript!");
}/>

// desugars to

<my-tag value=function () {
  console.log("Hello JavaScript!");
}/>

// Received by the child as { value() { ... } }
```

### Attribute Termination

Attributes can be terminated with a comma. This is useful in [concise mode](./concise-syntax.md#attributes-on-multiple-lines).

```marko
<my-tag a=1, b=2/>
```

> [!CAUTION] > [Comma operators / sequence expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comma_operator) must be wrapped in parentheses
>
> ```marko
> <my-tag a=(console.log(foo), foo)/>
> ```

## Tag Content

Markup within a tag is made available as the `content` property of its [`input`](#input).

```marko
<my-tag>Content</my-tag>
```

The implementation of `<my-tag>` above can write out the content by passing its `input.content` to a [dynamic tag](#dynamic-tags):

```marko
<div>
  <${input.content}/>
</div>
```

### Dynamic Text

Dynamic text content can be `${interpolated}` in the tag content.
This uses the same syntax as [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) in JavaScript.

```marko
<div>
  Hello ${input.name}
</div>
```

> [!NOTE]
> The interpolated value is automatically escaped to avoid XSS.

## Attribute Tags

Tags prefixed with an `@` are not rendered, but instead passed alongside attributes in [`input`](./language.md#input). Attribute tags allow for passing named or repeated [content](#tag-content) as additional attributes.

```marko
<my-layout title="Welcome">
  <@header class="foo">
    <h1>Big things are coming!</h1>
  </@header>

  <p>Lorem ipsum...</p>
</my-layout>
```

Here, `@header` is available to `<my-layout>` as `input.header`. The `class` attribute from `@header` is in `input.header.class` and its content is in `input.header.content`.

> [!NOTE]
> Control flow tags ([`<if>`](./core-tag.md#if--else) and [`<for>`](./core-tag.md#for)) cannot contain attribute tags themselves, and instead are used for [dynamically creating attribute tags](#conditional-attribute-tags).

The full [input](./language.md#input) object provided to `<my-tag>` in this example would look like:

```js
// a representation of `input` received by `my-layout.marko` (from the previous code snippet)
{
  title: "Welcome",
  header: {
    class: "foo",
    content: /* <h1>Big things are coming!</h1> */,
  },
  content: /* <p>Lorem ipsum...</p> */,
}
```

The implementation of `my-layout.marko` might look like

```marko
<!doctype html>
<html>
  <head>
    <title>${input.title}</title>
  </head>
  <body>
    <header
      // use the class from `@header`
      class=input.header.class
    >
      <img src="./logo.svg" alt="...">
      // render the content of `@header`
      <${input.header.content}/>
    </header>

    <main>
      // render the main tag content
      <${input.content}/>
    </main>

    <footer>
      Copyright ♾️
    </footer>
  </body>
</html>
```

### Nested Attribute tags

Attribute tags may be nested in other attribute tags.

```marko
<my-tag>
  <@a value=1>
    <@b value=2/>
  </>
</>
```

Would provide the following as input

```js
{
  a: {
    value: 2,
    b: { value: 2 }
  }
}
```

### Repeated Attribute Tags

When multiple attribute tags share a name, all instances may be consumed using the [iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol).

```marko
<my-menu>
  <@item value="foo">
    Foo Item
  </@item>

  <@item value="bar">
    Bar Item
  </@item>
</my-menu>
```

This example uses two `<@item>` tags, but `<my-menu>` receives only a single `item` attribute.

```js
{
  item: {
    value: "foo",
    content: /* Foo Item */,
    [Symbol.iterator]() {
      // Not the exact implementation, but essentially this is what the function contains
      yield* [
        { value: "foo", content: /* Foo Item */ },
        { value: "bar", content: /* Bar Item */ }
      ];
    }
  }
}
```

The other `<@item>` tags are reached through the iterator. The most common way to do so is with a [for tag](./core-tag.md#for) or one of JavaScript's [syntaxes for iterables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#syntaxes_expecting_iterables).

```marko
<for|item| of=input.item>
  Value: ${item.value}
  <${item.content}/>
</for>
```

> [!TIP]
> If you need repeated attribute tags as a list, it is a common pattern to spread into an array with a [`<const>` tag](./core-tag.md#const)
>
> ```marko
> <const/items=[...input.item || []]>
>
> <div>${items.length}</div>
> ```

### Conditional Attribute Tags

Attribute tags are generally provided directly to their immediate parent. The exception to this is control flow tags ([`<if>`](./core-tag.md#if--else) and [`<for>`](./core-tag.md#for)), which are used to dynamically apply attribute tags.

```marko
<my-message>
  <if=welcome>
    <@title>Hello</>
  </if>
  <else>
    <@title>Good Bye</>
  </else>
</my-message>
```

In this case, the `@title` received by `<my-message>` depends on `welcome`.

```marko
<my-select>
  <@option>None</@option>

  <for|opt| of=["a", "b", "c"]>
    <@option>${opt}</>
  </for>
</my-select>
```

Here, `<my-select>` unconditionally receives the first `@option`, and also all of the `@option` tags applied by the `<for>` loop.

> [!NOTE]
> You can't mix [attribute tags](#attribute-tags) with default [content](#tag-content) while inside a [control flow tag](./core-tag.md#if--else).

## Tag Variables

Tag variables expose a value from a tag to be used within a template (from a custom tag, the variable is taken from its [`<return>`](./core-tag.md#return)). These variables are not _quite_ like JavaScript variables, as they are used to power [Marko's compiled reactivity](./reactivity.md).

Tag Variables use a `/` followed by a valid JavaScript [identifier](https://developer.mozilla.org/en-US/docs/Glossary/Identifier) or [destructure assignment pattern](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) after the tag name.

```marko
<my-tag/foo/>
<my-other-tag/{ bar, baz }/>

<div>`my-tag` returned ${foo}</div>
<div>`my-other-tag` returned an object containing ${bar} and ${baz}</div>
```

Native tags have an implicitly returned tag variable that contains a reference to the element.

```marko
<div/myDiv/>

<script>
  myDiv().innerHTML = "Hello";
</script>
```

In this case `myDiv` will be a variable which can be called to get the `myDiv` element in the browser.

Using the [core `<return>` tag](./core-tag.md#return), any custom tag can return a value into it's parents scope as a tag variable.

### Scope

Tag variables are automatically [hoisted](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting) and can be accessed anywhere in the template except for in [module statements](#statements). This means that it is possible to read tag variables from anywhere in the tree.

```marko
<form>
  <input/myInput/>
</form>

<script>
  // still available even though it's nested in another tag.
  console.log(myInput())
</script>
```

## Tag Parameters

While rendering [content](#tag-content), child may pass information _back_ to its parent using tag parameters.

```marko
/* child.marko */
<div>
  <${input.content} number=1337 />
</div>
```

```marko
/* parent.marko */
<child|params|>
  Rendered with ${params.number} as the `number=` attribute.
</child>
```

This example results in the following HTML:

```html
<div>Rendered with 1337 as the `number=` attribute</div>
```

The `|parameters|` are enclosed in pipes after a tag name, and act functionally like [JavaScript function parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions#function_parameters) within which the first parameter is an object containing all attributes passed from the child component.

> [!TIP]
> Parameters include all features of the [JavaScript function parameters syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions#function_parameters), so feel free to destructure.
>
> ```marko
> <child|{ number }|>
>   Rendered with ${number} as the `number=` attribute.
> </child>
> ```

### Tag Arguments

Multiple [tag parameters](#tag-parameters) may be provided to the content by using the Tag Arguments syntax, which uses the JavaScript `(...args)` syntax after the tag name.

```marko
<${input.content}(1, 2, 3)/>
```

This example passes three arguments back to its parent.

```marko
<my-tag|a, b, c|>
  Sum ${a + b + c}
</my-tag>

// spreads work also!
<my-tag|...all|>
  Sum ${all.reduce((a, b) => a + b, 0)}
</my-tag>
```

> [!WARNING]
> Tag content may use attributes _or_ arguments, but not both at once.
>
> ```marko
> <my-tag a=1 b=2 c=3 />
> // identical to
> <my-tag({ a: 1, b: 2, c: 3 })/>
> ```

### Scope

Tag parameters are scoped to the [tag content](#tag-content) only.
This means you cannot access the tag parameters outside the body of the tag.

> [!CAUTION] > [Attribute tags](#attribute-tags) cannot access the tag parameters of their parent since they are evaluated as attributes.

## Comments

Both [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Comments) and [JavaScript](https://developer.mozilla.org/en-US/docs/Web/API/Comment) comments are supported.

```marko
<div>
  <!-- html comments -->
  // JavaScript line comments
  /** JavaScript block comments */
</div>
```

> [!NOTE]
> Comments are ignored completely. To include a literal HTML comment in the output, use the [`<html-comment>` core tag](./core-tag.md#html-comment).

## Dynamic Tags

In place of the tag name, an `${interpolation}` may be used to dynamically output a [native tag](./native-tag.md), [custom tag](./custom-tag.md), or [tag content](#tag-content).

With a dynamic tag the closing tag should be `</>`, or if there is no [content](#tag-content) the tag may be self-closed.

### Dynamic Native Tags

When the value of the dynamic tag name is a string,

```marko
// Dynamically output a native tag.
<${"h" + input.headingSize}>Hello!</>
```

### Dynamic Custom Tags

```marko
// Dynamically output a custom tag.
import MyTagA from "<my-tag-a>"
import MyTagB from "<my-tag-b>"
<${Math.random() > 0.5 ? MyTagA : MyTagB}/>
```

> [!CAUTION]
> When rendering a custom tag, you must have a reference to it, the following is _not_ equivalent to the above example. In this case, Marko will output a native HTML element (as if you called `document.createElement("my-tag-a")`).
>
> ```marko
> <${Math.random() > 0.5 ? "my-tag-a" : "my-tag-b"}/>
> ```

<!--  -->

> [!NOTE]
> If an object is provided with a `content` property, the `content` value will become the dynamic tag name. This is how the [define](./core-tag.md#define) tag works under the hood 🤯.
>
> ```marko
> <define/Message>
>   Hello World
> </define>
> <${Message}/>
> ```
>
> Although in this case you should prefer a [PascalCase](#pascalcase-variables) `<Message>` tag instead.

### Conditional Parent Tags

When a dynamic tag name is [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) it will output the tag's [content](#tag-content) only. This is useful for conditional parenting and fallback content.

```marko
// Only wrap the text with an anchor when we have an `input.href`.
<${input.href && "a"} href=input.href>Hello World</>
```

### PascalCase Variables

Local variable names that start with an upper case letter (`PascalCase`) can also be used as tag names without the explicit dynamic tag syntax. This is useful for referencing an imported custom tag or with the [`<define>` tag](./core-tag.md#define).

```marko
import MyTag from "./my-tag.marko"

<MyTag/>
```

This is equivalent to

```marko
import MyTag from "./my-tag.marko"

<${MyTag}/>
```
