# Getting started

The easiest way to get started with Marko is to use the [Try Online](https://markojs.com/try-online) feature. You can just open it in another tab and follow along. If you'd rather develop locally, check out the [Installation](./installing.md) page.

## Hello world

Marko makes it easy to represent your UI using a [syntax](./syntax.md) that is like HTML:

_hello.marko_

```marko
<h1>Hello World</h1>
```

In fact, Marko is so much like HTML, that you can use it as a replacement for a templating language like handlebars, mustache, or pug:

_template.marko_

```marko
<!doctype html>
<html>
<head>
    <title>Hello World</title>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>
```

However, Marko is much more than a templating language. It's a language that allows you to declaratively build an application by describing how the application view changes over time and in response to user actions.

In the browser, when the data representing your UI changes, Marko will automatically and efficiently update the DOM to reflect the changes.

## A simple component

Let's say we want to perform an action once a `<button>` is clicked:

_button.marko_

```marko
<button>Click me!</button>
```

Marko makes this really easy, allowing you to define a `class` for a component right in the `.marko` view and call methods of that class with `on-` attributes:

_button.marko_

```marko
class {
    sayHi() {
        alert("Hi!");
    }
}

<button on-click("sayHi")>Click me!</button>
```

### Adding state

Alerting when a button is clicked is great, but what about updating your UI in response to an action? Marko's stateful components make this easy. All you need to do is set `this.state` from inside your component's class. This makes a new `state` variable available to your view. When a value in `this.state` is changed, the view will automatically re-render and only update the part of the DOM that changed.

_counter.marko_

```marko
class {
    onCreate() {
        this.state = {
            count: 0
        };
    }
    increment() {
        this.state.count++;
    }
}

<div>The current count is ${state.count}</div>
<button on-click("increment")>Click me!</button>
```


# Conditionals and Lists

While HTML itself does not support conditionally displaying elements or repeating elements, it is a critical part of building any web application. In Marko, this functionality is provided by the `<if>` and `<for>` tags.

## Conditionals

The `<if>` tag receives an [argument](./syntax.md#arguments) which is used to determine if its body content should be present.

```marko
<if(user.loggedOut)>
    <a href="/login">Log in</a>
</if>
```

As you might expect, there are also `<else>` and `<else-if>` tags as well:

```marko
<if(user.loggedOut)>
    <a href="/login">Log in</a>
</if>
<else-if(!user.trappedForever)>
    <a href="/logout">Log out</a>
</else-if>
<else>
    Hey ${user.name}!
</else>
```

## Lists

If you have a list of data and need to represent it in the UI, the `<for>` tag is probably what you're looking for. The `<for>` tag passes each item and its index to its body as [parameters](./syntax.md#parameters).

```marko
<ul>
    <for|color, index| of=colors>
        <li>${index}: ${color}</li>
    </for>
</ul>
```

The `<for>` tag actually support 3 different flavors:

- [`<for|item, index, array| of=array>`](./core-tags.md#iterating-over-a-list) renders its body for each item of an array. It's similar to the JavaScript [`for...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) loop.
- [`<for|key, value| in=object>`](./core-tags.md#iterating-over-an-objects-properties) renders its body for each property in an object. It's similar to the JavaScript [`for...in`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in) loop.
- [`<for|value| from=first to=last step=increment>`](./core-tags.md#iterating-between-a-range-of-numbers) renders its body for each value in between and including `from` and `to`.

### Always set a `key`

Marko automatically keeps your UI in sync with the state behind it, but one place where it needs a little extra help is repeated content. Specifying keys gives Marko a way to identify items in a list and keep track of which items have been changed, added, or removed.

A key should be a string or number that uniquely identifies an item in the list and differentiates it from its siblings. The same key value should never be used twice! Often, you will use something like an `id` property.

```marko
<for|user| of=users>
    <user-card key=user.id data=user/>
</for>
```

> **ProTip:** If you have multiple tags underneath `<for>`, you can key only the first tag and that is enough to properly identify its siblings as well
>
> ```marko
> <dl>
>     <for|entry| of=entries>
>         <!-- only the first tag needs a key -->
>         <dt key=entry.id>${entry.word}</dt>
>         <!-- This key can be omitted -->
>         <dd>${entry.definition}</dd>
>     </for>
> </dl>
> ```

> **Note:** If a key is not set, Marko will use the index of an item as its key. However this only works perfectly if items are only ever added or removed at the end of a list. Here's an example where things break down: if we have a list of `["A", "B", "C"]` and reverse the order, index keys would cause "A" to be transformed into "C" (and "C" into "A"), rather than just swapping them. Additionally if these components contained state, the new "C" would contain the state from the old "A" (and vice-versa). Be aware, stateful components include tags like the native `<input>` element. For this reason **it is always recommended to set a `key` on tags in a `<for>`.**


# Custom tags

Custom tags allow you to break up your application UI into encapsulated, reusable components.

## Your first custom tag

Let's say we have a page with the following content:

_page.marko_

```marko
<!doctype html>
<html>
<body>
    <h1>Hello World!</h1>
</body>
</html>
```

However, this page is getting pretty complex and unmaintainable. Let's split out the content into a separate component. To do this, we'll create a `components/` folder and inside it a `hello.marko` file:

_components/hello.marko_

```marko
<h1>Hello World!</h1>
```

Marko [automatically discovers](#how-tags-are-discovered) `.marko` files under a `components/` directory, so we can now use the `<hello>` tag in our page:

_page.marko_

```marko
<!doctype html>
<html>
<body>
    <hello/>
</body>
</html>
```

Now this `<hello>` tag can be used multiple times, and even on multiple pages. But what if we don't only want to say hello to the world? Let's pass some attributes.

_page.marko_

```marko
<!doctype html>
<html>
<body>
    <hello name="World"/>
</body>
</html>
```

The component will receive these attributes as `input`:

_components/hello.marko_

```marko
<h1>Hello ${input.name}!</h1>
```

Nice.

## How tags are discovered

Marko discovers components relative to the `.marko` file where a custom tag is used. From this file, Marko walks up directories until it finds a `components/` folder which contains a component matching the name of the custom tag. If it reaches the project root without finding anything, it will then check installed packages for the component.

Let's take a look at an example directory structure to better understand this:

```dir
components/
    app-header.marko
    app-footer.marko
pages/
    about/
        components/
            team-members.marko
        page.marko
    home/
        components/
            home-banner.marko
        page.marko
```

The file `pages/home/page.marko` can use the following tags:

- `<app-header>`
- `<app-footer>`
- `<home-banner>`

And the file `pages/about/page.marko` can use the following tags:

- `<app-header>`
- `<app-footer>`
- `<team-members>`

The home page can't see `<team-members>` and the about page can't see `<home-banner>`. By using nested `component/` directories, we've scoped our page-specific components to their respective pages.

## Tag directories

In addition to a Marko template, the children of `components/` can be a directory with an `index.marko` template:

```dir
components/
    app-header/
        index.marko
        logo.png
        style.css
    app-footer/
        index.marko
```

Or a directory with a template whose name matches its parent directory:

```dir
components/
    app-header/
        app-header.marko
        app-header.style.css
        logo.png
    app-footer/
        app-footer.marko
```

This allows you to create components that have other files associated with them and keep those files together in the directory structure.

> **ProTip:**
> You can take advantage of nested `components/` directories to create "subcomponents" that are only available to the component that contains them.
>
> ```dir
> components/
>     app-header/
>         components/
>             navigation.marko
>             user-info.marko
>         app-header.marko
>     app-footer/
>         app-footer.marko
> ```

## Using tags from npm

To use [tags from npm](https://www.npmjs.com/search?q=keywords%3Amarko%20components), ensure that the package is installed and listed in your `package.json` dependencies:

```
npm install --save @marko-tags/match-media
```

Marko discover tags from packages defined in your `package.json`, so you can start using them right away:

```marko
<div>
    <match-media|{ mobile }| mobile="max-width:30em">
        <!-- nice -->
    </match-media>
</div>
```

## Publishing tags to npm

We saw above that tags from npm are automatically discovered. In order to make this work, your package must include a [`marko.json`](./marko-json.md) at the root.

_marko.json_

```json
{
  "tags-dir": "./dist/components"
}
```

This example file tells Marko to expose all components directly under the `dist/components/` directory to the application using your package.

We recommend adding the `marko` and `components` keywords to your `package.json` so others can find your components. Then `npm publish`!

# Macros

The [`<macro>`](./core-tags.md#macro) tag allows you to create custom tags in the same file that they are used in.

```marko
<macro|{ name }| name="welcome-message">
    <h1>Hello ${name}!</h1>
</macro>

<welcome-message name="Patrick"/>
<welcome-message name="Austin"/>
```

# From Variables

If no other tag would be discovered Marko will check for an in scope variable that matches the tag name.

```marko
import SomeTag from "./somewhere.marko"

$ const { renderBody } = input;
$ const MyTag = input.href ? "a" : "button";

<SomeTag/>
<MyTag/>
<renderBody/>
```


# State

The output of a component is based on input properties passed from its parent as attributes. However, a component may also maintain internal state that it uses to control its view. If Marko detects a change to either input or to the internal state, the view will automatically be updated.

> **ProTip:**
> Only data that is owned and modified by the component should go into its `state`. State should be exclusively used for data that triggers rerenders. Parents control `input`, and the component controls its own `state`.

## Initializing state

To use `state` in Marko, you must first create a [class component](./class-components.md) and initialize the state within the [`onCreate`](./class-components.md#oncreateinput-out) method. In class methods, `this.state` may be used and within the template section, a `state` variable is available.

```marko
class {
    onCreate() {
        this.state = { count: 0 };
    }
}

<div>The count is ${state.count}</div>
```

> **Note:** Only properties that exist when `this.state` is first defined will be watched for changes. If you don't need a property initially, you can set it to `null`.

## Updating state

You can update `state` in response to DOM events, browser events, ajax calls, etc. When a property on the state changes, the view will be updated to match.

```marko
class {
    onCreate() {
        this.state = { count: 0 };
    }
    increment() {
        this.state.count++;
    }
}

<div>The count is ${state.count}</div>
<button on-click('increment')>Increment</button>
```

We've extended our example above to add a button with an [event handler](./events.md), so that, when clicked, the `state.count` value is incremented.

> **Note:**
> When browsing existing code, you may see `this.setState('name', value)` being used. This is equivalent to `this.state.name = value`.

### How updates work

When a property on `state` is set, the component will be scheduled for an update if the property has changed. All updates are batched together for performance. This means you can update multiple state properties at the same time without causing multiple updates.

> **ProTip:** If you need to know when the update has been applied, you can use `this.once('update', fn)` within a component method.

> **Note:** The state object only watches its properties one level deep. This means updates to nested properties on the state (e.g. `this.state.object.something = newValue`) will not be detected.
>
> Using [immutable](https://wecodetheweb.com/2016/02/12/immutable-javascript-using-es6-and-beyond/) data structures is recommended, but if you want to mutate a state property (perhaps push a new item into an array) you can let Marko know it changed using `setStateDirty`.
>
> ```js
> this.state.numbers.push(num);
>
> // mark numbers as dirty, because a `push`
> // won't be automatically detected by Marko
> this.setStateDirty("numbers");
> ```

## Cross component state management

There are various tools available to manage state outside of a single component. Here are some basic guidelines.

Typically we recommend using `attributes` to pass data in to a child component, and children can [emit events](./events.md#emitting-custom-events) to communicate back up to their parents. In some cases this can become cumbersome with deeply nested data dependencies or global state.

### Global/Subtree

For passing state throughout a component tree without explicit attribute setting throughout the entire app, you can leverage the [`<context>`](https://github.com/marko-js/tags/tree/master/tags/context) tag. This tag can be [installed from npm](./custom-tags.md#using-tags-from-npm).

This tag allows you to pull state from any level above in the tree and can also be used to pass global state throughout your app.
Context providers can register event handlers that any child in the tree can trigger similar to the [events API](./events.md).

_fancy-form.marko_

```marko
<context coupon=input.coupon on-buy(handleBuy)>
    <!-- Somewhere nested in the container will be the buy button -->
    <fancy-container/>
</context>
```

_fancy-save-button.marko_

```marko
<context|{ coupon }, emit| from="fancy-form">
    Coupon: ${coupon}.
    <button on-click(emit, "buy")>Buy</button>
</context>
```

> **Note:** Context _couples_ tags together and can limit reuse of components.

### When to use a Redux like pattern

Often the above two approaches are enough, and many people [jump to this part far too quickly](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367). Like `<context>`, often anything stored in redux is `global`. This means that it can (if abused) create components that are hard to reuse, reason about and test. However it is important to understand when a tool like `redux` is useful in any UI library.

Redux provides indirection to updating any state that it controls. This is useful if you need the following:

- Single state update, multiple actions (eg: logging, computed data, etc).
- Time travel debugging and other [redux-specific tooling](https://redux.js.org/introduction/ecosystem).


# Styles

Both HTML and Marko provide support for `<style>` tags. However, Marko also provides a special syntax (called a style _block_) which adds support for CSS preprocessors and acts as a hint to bundlers to extract this static css from your templates into a common bundle.

```marko
style {
    div {
        color: green;
    }
}

<div>Hello World</div>
```

These blocks add global css to the page. The above example will not style just the `<div>` in the component, but all divs on the page. Because of this we recommend following a naming convention such as [BEM](https://getbem.com/introduction/). Marko will likely provide a way to automatically scope these styles to the current component [in the future](https://github.com/marko-js/marko/issues/666).

> **Note:** Style blocks (unlike `<style>` tags) do not support `${placeholders}` and must be static.

## Preprocessors

If you use a css preprocessor, you can add the extension right on `style`. This will cause your bundler of choice to run the contents of the style block through the appropriate processor.

```marko
style.less {
    button.primary {
        background-color: @primaryColor;
    }
}
```


# Events

Marko’s event API supports:

- [Browser events](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events) on native tags
- Custom events from [custom tags](./custom-tags.md)

Note that **you can’t mix event targets and event types**: custom tags can only listen for custom events, and native tags can only listen for native events.

## Listening to events

Both kinds of events are received with an `on-*` attribute and the [attribute arguments syntax](./syntax.md#arguments):

```marko
<input type="checkbox"
  on-change(event => console.info(`Checked? ${event.target.checked}`))
/>
```

The [first argument for the attribute can be a function](#function-handler), or [a string matching a method name](#method-handler) on the [component’s `class` declaration](./class-components.md).

### Function handler

If you provide a function as the first argument of the `on-*` attribute, the function is called whenever the event fires, like standard event listeners.

Below we use the [`static` prefix](./syntax.md#static-javascript) to define a function, then use it as a `click` handler:

```marko
static function handleClick(event) {
  event.preventDefault();
  console.log("Clicked!");
}

<button on-click(handleClick)>
  Log click
</button>
```

In the above example, any time the `<button>` is clicked the `handleClick` function is called.

You can also use an inline arrow function:

```marko
<button on-click(() => alert("Clicked! 🎉"))>
  Celebrate click
</button>
```

…or anything that evaluates to a function:

```marko
$ const handler = (
  input.dontBreakMyApp ?
    () => console.error("Clicked!") :
    () => { throw Error("Clicked!") }
);

<button on-click(handler)>
  Do not click
</button>
```

### Method handler

When a string is the first argument, Marko calls a matching method on the component's `class`.

```marko
class {
  logChange(newTab) {
    console.log(`changed to: ${newTab}`);
  }
}

<my-tabs on-switch-tab("logChange")>
  …
</my-tabs>
```

When `<my-tabs>` emits the `switch-tab` event, it will call its `logChange` method.

Within the handler you can access the current component instance, read data, emit events, update state, etc.

### Binding additional arguments

Arguments after the handler are prepended when the handler is called:

```marko
static function removeFriend(friendId, event) {
  event.preventDefault();
  window.myAPI.unfriend(friendId);
}

<for|friend| of=input.friends>
  <button on-click(removeFriend, friend.id)>
    Unfriend ${friend.name}
  </button>
</for>
```

Here we share the logic for `removeFriend()` with each `friend` in the `friends` array. When the `<button>` is clicked, the `id` of the removed `friend` is passed to the `removeFriend()`, handler followed by the DOM `click` event.

## Emitting custom events

The recommended way for a [custom tag](./custom-tags.md) to communicate with its parent is through **custom events**.

All components implement a [Node.js-style event emitter](https://nodejs.org/api/events.html#events_class_eventemitter) to send events to parent components.

_email-input.marko_

```marko
class {
  handleChange(event) {
    if (event.target.validity.valid) {
      // Only emit email-changes if they are valid.
      this.emit("email-change", { email: event.target.value });
    }
  }
}

<input type="email" name=input.name on-change("handleChange")/>
```

The above code listens to native `change` events from the `<input>` element, and then emits its own `email-change` event if the change was valid.

```marko
<form>
  <email-input name="email" on-email-change("...")/>
</form>
```

> **Note:** Events are not received as `input`; you cannot access `input.onEmailChange`. Instead, they set up subscriptions.


# Body content

We're used to passing body content to HTML tags. When you do this, the tag has control over where and when this content is rendered. A good example of this is the [HTML `<details>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details):

```html
<details>
  <summary>Hello <strong>World</strong></summary>
  This is some <em>content</em> that can be toggled.
</details>
```

This is what it renders (try clicking it):

---

<details>
    <summary>Hello <strong>World</strong></summary>
    This is some <em>content</em> that can be toggled.
</details>

---

Custom tags can also receive content in the same way. This allows a component to give its user full control over _how_ some section of the content is rendered, but control _where_, _when_, and with _what_ data it is rendered. This feature is necessary to build composable components like overlays, layouts, dropdowns, etc. Imagine a `<table>` that didn't give you control over how its cells were rendered. That would be pretty limited!

## Rendering body content

When a custom tag is passed body content, it is received as a special `renderBody` property on the component's `input`. You can include this content anywhere in your component by using the [`<${dynamic}>` syntax](./syntax.md#dynamic-tagname).

_components/fancy-container.marko:_

```marko
<div class="container fancy">
    <${input.renderBody}/>
</div>
```

If we were to use this tag like this:

_Marko Source:_

```marko
<fancy-container>
    <p>Content goes here...</p>
</fancy-container>
```

The rendered output would be:

_HTML Output:_

```html
<div class="container fancy"><p>Content goes here...</p></div>
```

This is a pretty basic example, but you can imagine how this could be incorporated into a more advanced component to render passed content where/when needed.

> **ProTip:**
> Body content can be rendered multiple times. Or not at all.

## Passing attributes to body content

When rendering body content with `<${dynamic}>`, attributes may also be passed:

_components/random-value.marko:_

```marko
<!-- heh, it's not actually random -->
<${input.renderBody} number=1337 />
```

These attribute values can be received as a [tag parameter](./syntax.md#parameters):

```marko
<random-value|{ number }|>
    The number is ${number}
</random-value>
```

> **ProTip:**
> Some tags (like the above tag) may not render anything except their body content with some data. This can be quite useful, just look at the `<for>` and `<await>` tags!

## Named body content

You can also pass named content sections to a tag using [attribute tags](./syntax.md#attribute-tag) which are denoted by the `@` prefix.

```marko
<layout>
    <@heading>
        <h1>Hello Marko</h1>
    </@heading>
    <@content>
        <p>...</p>
    </@content>
</layout>
```

Like attributes, these attribute tags are received as `input.heading` and `input.content`, but they each have a `renderBody` property which we can now use:

_components/layout.marko_

```marko
<!doctype html>
<html>
    <body>
        <${input.heading.renderBody}/>
        <hr/>
        <${input.content.renderBody}/>
    </body>
</html>
```

> **ProTip:** The `renderBody` property can be omitted. You could use `<${input.heading}/>`, for example.

### Repeatable attribute tags

Attribute tags can be repeated. Rendering the same attribute tag name multiple times will cause the input value for that attribute to become an array instead of an single object.

This allows us to, for example, build a custom table component which allows its user to specify any number of columns, while still giving the user control over how each column is rendered.

_Marko Source:_

```marko
<fancy-table data=people>
    <@column|person|>
        Name: ${person.name}
    </@column>
    <@column|person|>
        Age: ${person.age}
    </@column>
</fancy-table>
```

> _Note_
> Attribute tags are _repeatable_.
>
> - Zero: if you don't pass any `@column` tags, the `fancy-table` receives `undefined`.
> - One: if you pass a single `@column` tag, the `fancy-table` receives a single attribute tag object. (For convenience this object is [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol) meaning it can be directly passed to the `<for>` tag.)
> - Many: if you pass multiple `@column` tags, the `fancy-table` receives an array of attribute tags.
>   For TypeScript the [`Marko.AttrTag` or `Marko.RepeatableAttrTag` helpers](./typescript.md#built-in-marko-types) should be used here.

> _Protip_
> To `.map`, `.filter` or otherwise work with attribute tags as an array:
>
> ```marko
> $ const columns = [...input.column || []];
> ```

We can then use the `<for>` tag to render the body content into table, passing the row data to each column's body.

_components/fancy-table/index.marko:_

```marko {4-8}
<table class="fancy">
    <for|row| of=input.data>
        <tr>
            <for|column| of=input.column>
                <td>
                    <${column.renderBody} ...row/>
                </td>
            </for>
        </tr>
    </for>
</table>
```

We now have a working `<fancy-table>`. Let's see what it renders:

_Example Data:_

```js
[
  {
    name: "Patrick",
    age: 63,
  },
  {
    name: "Austin",
    age: 12,
  },
];
```

_HTML Output:_

```html
<table class="fancy">
  <tr>
    <td>Name: Patrick</td>
    <td>Age: 63</td>
  </tr>
  <tr>
    <td>Name: Austin</td>
    <td>Age: 12</td>
  </tr>
</table>
```

### Attributes on attribute tags

If you look at our previous example, we had to prefix each cell with the column label. It would be better if we could give a name to each column instead and only render that once.

_Marko Source:_

```marko
<fancy-table>
    <@column|person| heading="Name">
        ${person.name}
    </@column>
    <@column|person| heading="Age">
        ${person.age}
    </@column>
</fancy-table>
```

Now, each object in the `input.column` array will contain a `heading` property in addition to its `renderBody`. We can use another `<for>` and render the headings in `<th>` tags:

_components/fancy-table/index.marko:_

```marko {3-5}
<table class="fancy">
    <tr>
        <for|column| of=input.column>
            <th>${column.heading}</th>
        </for>
    </tr>
    <for|row| of=input.data>
        <tr>
            <for|column| of=input.column>
                <td>
                    <${column.renderBody} ...row/>
                </td>
            </for>
        </tr>
    </for>
</table>
```

We'll now get a row of headings when we render our `<fancy-table>`

_HTML Output:_

```html
<table class="fancy">
  <tr>
    <th>Name</th>
    <th>Age</th>
  </tr>
  <tr>
    <td>Patrick</td>
    <td>63</td>
  </tr>
  <tr>
    <td>Austin</td>
    <td>12</td>
  </tr>
</table>
```

> _Note_
> You may also specify that the attribute tag can be repeated in a [`marko-tag.json`](./marko-json.md#single-component-definition) file.
> This will cause an array to _always_ be passed if there are any items, rather than working up from `undefined`, single object and then an array.
>
> _components/fancy-table/marko-tag.json:_
>
> ```js
> {
>     "@data": "array",
>     "<column>": {
>         "is-repeated": true
>     }
> }
> ```

### Nested attribute tags

Continuing to build on our example, what if we want to add some custom content or even components into the column headings? In this case, we can extend our `<fancy-table>` to use nested attribute tags. We'll now have `<@heading>` and `<@cell>` tags nested under `<@column>`. This gives users of our tag full control over how to render both column headings and the cells within the column!

_Marko Source:_

```marko {3-8}
<fancy-table>
    <@column>
        <@heading>
            <app-icon type="profile"/> Name
        </@heading>
        <@cell|person|>
            ${person.name}
        </@cell>
    </@column>
    <@column>
        <@heading>
            <app-icon type="calendar"/> Age
        </@heading>
        <@cell|person|>
            ${person.age}
        </@cell>
    </@column>
</fancy-table>
```

Now instead of rendering the heading as text, we'll render the heading's body content.

_components/fancy-table/index.marko:_

```marko {5}
<table class="fancy">
    <tr>
        <for|column| of=input.column>
            <th>
                <${column.heading.renderBody}/>
            </th>
        </for>
    </tr>
    <for|row| of=input.data>
        <tr>
            <for|column| of=input.column>
                <td>
                    <${column.cell.renderBody} ...row/>
                </td>
            </for>
        </tr>
    </for>
</table>
```

Our headings can now include icons (and anything else)!

_HTML Output:_

```html
<table class="fancy">
  <tr>
    <th><img class="icon" src="profile.svg" /> Name</th>
    <th><img class="icon" src="calendar.svg" /> Age</th>
  </tr>
  <tr>
    <td>Patrick</td>
    <td>63</td>
  </tr>
  <tr>
    <td>Austin</td>
    <td>12</td>
  </tr>
</table>
```

### Dynamic attribute tags

The flexibility of the `<fancy-table>` is great if you want to render columns differently or have columns that display the data in a special way (such as displaying an age derived from a date of birth). However, if all columns are basically the same, the user might feel they're repeating themselves. As you might expect, you can use `<for>` (and `<if>`) to dynamically render attribute tags.

```marko
$ const columns = [{
    property: "name",
    title: "Name",
    icon: "profile"
}, {
    property: "age",
    title: "Age",
    icon: "calendar"
}]

<fancy-table>
    <for|{ property, title, icon }|>
        <@column>
            <@heading>
                <app-icon type=icon/> ${title}
            </@heading>
            <@cell|person|>
                ${person[property]}
            </@cell>
        </@column>
    </for>
</fancy-table>
```


# TypeScript in Marko

> **Note:** Types are supported in Marko v5.22.7+ and Marko v4.24.6+

Marko’s TypeScript support offers in-editor error checking, makes refactoring less scary, verifies that data matches expectations, and even helps with API design.

Or maybe you just want more autocomplete in VSCode. That works too.

## Enabling TypeScript in your Marko project

There are two (non-exclusive) ways to add TypeScript to a Marko project:

- **For sites and web apps**, you can place [a `tsconfig.json` file](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) at the project root:
  <pre>
  📁 components/
  📁 node_modules/
  <img src="./icons/marko.svg" width=16> index.marko
  📦 package.json
  <mark><img src="./icons/ts.svg" width=16> tsconfig.json</mark>
  </pre>
- **If you’re [publishing packages of Marko tags](https://markojs.com/docs/custom-tags/#publishing-tags-to-npm)**, add the following to [your `marko.json`](./marko-json.md):
  ```json
  "script-lang": "ts"
  ```
  This will automatically expose type-checking and autocomplete for the published tags.

> **ProTip**: You can also use the `script-lang` method for sites and apps.

## Typing a tag's `input`

A `.marko` file will use any exported `Input` type for [that file’s `input` object](./class-components.md#input).

This can be `export type Input` or `export interface Input`.

### Example

_PriceField.marko_

```marko
export interface Input {
  currency: string;
  amount: number;
}

<label>
  Price in ${input.currency}:
  <input type="number" value=input.amount min=0 step=0.01>
</label>
```

You can also import, reuse, and extend `Input` interfaces from other `.marko` or `.ts` files:

```marko
import { Input as PriceInput } from "<PriceField>";
import { ExtraTypes } from "lib/utils.ts";
export type Input = PriceInput & ExtraTypes;
```

```marko
import { Input as PriceInput } from "<PriceField>";
export interface Input extends PriceInput {
  discounted: boolean;
  expiresAt: Date;
};
```

### Generic `Input`s

[Generic Types and Type Parameters](https://www.typescriptlang.org/docs/handbook/2/generics.html) on `Input` are recognized throughout the entire `.marko` template (excluding [static statements](./syntax.md#static-javascript)).

For example, if you set up a component like this:

_components/my-select.marko_

```marko
export interface Input<T> {
  options: T[];
  onSelect: (newVal: T) => unknown;
}

static function staticFn() {
  // can NOT use `T` here
}

$ const instanceFn = (val: T) => {
  // can use `T` here
}

// can use `as T` here
<select on-input(evt => input.onSelect(options[evt.target.value] as T))>
  <for|value, i| of=input.options>
    <option value=i>${value}</option>
  </for>
</select>
```

…then your editor will figure out the types of inputs to that component:

```marko
<my-select options=[1,2,3] onSelect=val => {}/>
                                 // ^^^ number

<my-select options=["M","K","O"] onSelect=val => {}/>
                                       // ^^^ string
```

## Built-in Marko Types

Marko exposes [type definitions](https://github.com/marko-js/marko/blob/main/packages/marko/index.d.ts) you can reuse in [a TypeScript namespace](https://www.typescriptlang.org/docs/handbook/namespaces.html) called `Marko`:

- **`Marko.Template<Input, Return>`**
  - The type of a `.marko` file
  - `typeof import("./template.marko")`
- **`Marko.TemplateInput<Input>`**
  - The object accepted by the render methods of a template. It includes the template's `Input` as well as `$global` values.
- **`Marko.Body<Params, Return>`**
  - The type of the [body content](./body-content.md) of a tag (`renderBody`)
- **`Marko.Component<Input, State>`**
  - The base class for a [class component](./class-components.md)
- **`Marko.Renderable`**
  - Values accepted by the [`<${dynamic}/>` tag](./syntax.md#dynamic-tagname)
  - `string | Marko.Template | Marko.Body | { renderBody: Marko.Body}`
- **`Marko.Out`**
  - The render context with methods like `write`, `beginAsync`, etc.
  - `ReturnType<template.render>`
- **`Marko.Global`**
  - The type of the object in `$global` and `out.global` that can be passed to a template's render methods as the `$global` property.
- **`Marko.RenderResult`**
  - The [result](./rendering.md#renderresult) of rendering a Marko template
  - `ReturnType<template.renderSync>`
  - `Awaited<ReturnType<template.render>>`
- **`Marko.Emitter`**
  - `EventEmitter` from `@types/node`
- **`Marko.NativeTags`**
  - `Marko.NativeTags`: An object containing all native tags and their types
- **`Marko.Input<TagName>`** and **`Marko.Return<TagName>`**
  - Helpers to extract the input and return types native tags (when a string is passed) or a custom tag.
- **`Marko.BodyParameters<Body>`** and **`Marko.BodyReturnType<Body>`**
  - Helpers to extract the parameters and return types from the specified `Marko.Body`
- **`Marko.AttrTag<T>`** and **`Marko.RepeatableAttrTag<T>`**
  - Used to represent types for [attributes tags](./body-content.md#named-body-content)
  - `Marko.AttrTag<T>`: A single attribute tag
  - `Marko.RepeatableAttrTag<T>`: One or more attribute tags

### Typing `renderBody`

The most commonly used type from the `Marko` namespace is `Marko.Body` which can be used to type `input.renderBody`:

_child.marko_

```marko
export interface Input {
  renderBody?: Marko.Body;
}
```

Here, the following will be acceptable values:

_index.marko_

```marko
<child/>
<child>Text in render body</child>
<child>
  <div>Any combination of components</div>
</child>
```

Passing other values (including components) will cause a type error:

_index.marko_

```marko
import OtherTag from "<other-tag>";
<child renderBody=OtherTag/>
```

### Typing Tag Parameters

Tag parameters are passed to the `renderBody` by the child tag. For this reason, `Marko.Body` also allows typing of its parameters:

_for-by-two.marko_

```marko
export interface Input {
  to: number;
  renderBody: Marko.Body<[number]>
}

<for|i| from=0 to=input.to by=2>
  <${input.renderBody}(i)/>
</for>
```

_index.marko_

```marko
<for-by-two|i| to=10>
  <div>${i}</div>
</for-by-two>
```

### Extending native tag types within a Marko tag

The types for native tags are accessed via the global `Marko.Input` type. Here's an example of a component that extends the `button` html tag:

_color-button.marko_

```marko
export interface Input extends Marko.Input<"button"> {
  color: string;
  renderBody?: Marko.Body;
}

$ const { color, renderBody, ...restOfInput } = input;

<button style=`color: ${color}` ...restOfInput>
  <${renderBody}/>
</button>
```

### Registering a new native tag (eg for custom elements).

```ts
interface MyCustomElementAttributes {
  // ...
}

declare global {
  namespace Marko {
    namespace NativeTags {
      // By adding this entry, you can now use `my-custom-element` as a native html tag.
      "my-custom-element": MyCustomElementAttributes
    }
  }
}
```

### Registering new "global" HTML Attributes

```ts
declare global {
  namespace Marko {
    interface HTMLAttributes {
      "my-non-standard-attribute"?: string; // Adds this attribute as available on all HTML tags.
    }
  }
}
```

### Registering CSS Properties (eg for custom properties)

```ts
declare global {
  namespace Marko {
    namespace CSS {
      interface Properties {
        "--foo"?: string; // adds a support for a custom `--foo` css property.
      }
    }
  }
}
```

## TypeScript Syntax in `.marko`

Any [JavaScript expression in Marko](./syntax.md#inline-javascript) can also be written as a TypeScript expression.

### Tag Type Parameters

```marko
<child <T>|value: T|>
  ...
</child>
```

### Tag Type Arguments

_components/child.marko_

```marko
export interface Input<T> {
  value: T;
}
```

_index.marko_

```marko
// number would be inferred in this case, but we can be explicit
<child<number> value=1 />
```

### Method Shorthand Type Parameters

```marko
<child process<T>() { /* ... */ } />
```

### Attribute Type Assertions

The types of attribute values can _usually_ be inferred. When needed, you can assert values to be more specific with [TypeScript’s `as` keyword](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions):

```marko
<some-component
  number=1 as const
  names=[] as string[]
/>
```

# JSDoc Support

For existing projects that want to incrementally add type safety, adding full TypeScript support is a big leap. This is why Marko also includes full support for [incremental typing via JSDoc](https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html).

## Setup

You can enable type checking in an existing `.marko` file by adding a `// @ts-check` comment at the top:

```js
// @ts-check
```

If you want to enable type checking for all Marko & JavaScript files in a JavaScript project, you can switch to using a [`jsconfig.json`](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#using-tsconfigjson-or-jsconfigjson). You can skip checking some files by adding a `// @ts-nocheck` comment to files.

Once that has been enabled, you can start by typing the input with JSDoc. Here's an example component with typed `input`:

```marko
// @ts-check

/**
 * @typedef {{
 *   firstName: string,
 *   lastName: string,
 * }} Input
 */

<div>${firstName} ${lastName}</div>
```

## With a separate `component.js` file

Many components in existing projects adhere to the following structure:

<pre>
📁 components/
  📁 color-rotate-button/
    <img src="./icons/marko.svg" width=16> index.marko
    <img src="./icons/js.svg" width=16> component.js
</pre>

The `color-rotate-button` takes a list of colors and moves to the next one each time the button is clicked:

```marko
<color-rotate-button colors=["red", "blue", "yellow"]>
  Next Color
</color-rotate-button>
```

Here is an example of how this `color-rotate-button` component could be typed:

_components/color-rotate-button/component.js_

```js
// @ts-check

/**
 * @typedef {{
 *   colors: string[],
 *   renderBody: Marko.Renderable
 * }} Input
 * @typedef {{
 *   colorIndex: number
 * }} State
 * @extends {Marko.Component<Input, State>}
 */
export default class extends Marko.Component {
  onCreate() {
    this.state = {
      colorIndex: 0,
    };
  }

  rotateColor() {
    this.state.colorIndex =
      (this.state.colorIndex + 1) % this.input.colors.length;
  }
}
```

_components/color-rotate-button/index.marko_

```marko
// @ts-check

/* Input will be automatically imported from `component.js`! */

<button
  onClick('rotateColor')
  style=`color: ${input.colors[state.colorIndex]}`>
  <${input.renderBody}/>
</button>
```

# CI Type Checking

For type checking Marko files outside of your editor there is the ["@marko/type-check" cli](https://github.com/marko-js/language-server/tree/main/packages/type-check).
Check out the CLI documentation for more information.


# Troubleshooting HTTP Streams

[The way Marko streams HTML](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding) is old and well-supported, but default configurations and assumptions by other software can foil it. This page describes some known culprits that may buffer your Node server’s output HTTP streams.

## Reverse proxies/load balancers

- Turn off proxy buffering, or if you can’t, set the proxy buffer sizes to be reasonably small.

- Make sure the “upstream” HTTP version is 1.1 or higher; HTTP/1.0 and lower do not support streaming.

- Some software doesn’t support HTTP/2 or higher “upstream” connections at all or very well — if your Node server uses HTTP/2, you may need to downgrade.

- Check if “upstream” connections are `keep-alive`: overhead from closing and reopening connections may delay responses.

- For typical modern webpage filesizes, the following bullet points probably won’t matter. But if you want to stream **small chunks of data with the lowest latency**, investigate these sources of buffering:

  - Automatic gzip/brotli compression may have their buffer sizes set too high; you can tune their buffers to be smaller for faster streaming in exchange for slightly worse compression.

  - You can [tune HTTPS record sizes for lower latency, as described in High Performance Browser Networking](https://hpbn.co/transport-layer-security-tls/#optimize-tls-record-size).

  - Turning off MIME sniffing with [the `X-Content-Type-Options`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options) header eliminates browser buffering at the very beginning of HTTP responses

### NGiNX

Most of NGiNX’s relevant parameters are inside [its builtin `http_proxy` module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering):

```nginx
proxy_http_version 1.1; # 1.0 by default
proxy_buffering off; # on by default
```

### Apache

Apache’s default configuration works fine with streaming, but your host may have it configured differently. The relevant Apache configuration is inside [its `mod_proxy` and `mod_proxy_*` modules](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html) and their [associated environment variables](https://httpd.apache.org/docs/2.4/env.html).

## CDNs

Content Delivery Networks (CDNs) consider efficient streaming one of their best features, but it may be off by default or if certain features are enabled.

- For Fastly or another provider that uses VCL configuration, check [if backend responses have `beresp.do_stream = true` set](https://developer.fastly.com/reference/vcl/variables/backend-response/beresp-do-stream/).

- Some [Akamai features designed to mitigate slow backends can ironically slow down fast chunked responses](https://community.akamai.com/customers/s/question/0D50f00006n975d/enabling-chunked-transfer-encoding-responses). Try toggling off Adaptive Acceleration, Ion, mPulse, Prefetch, and/or similar performance features. Also check for the following in the configuration:

  ```xml
  <network:http.buffer-response-v2>off</network:http.buffer-response-v2>
  ```

## Node.js itself

For extreme cases where [Node streams very small HTML chunks with its built-in compression modules](https://github.com/marko-js/marko/pull/1641), you may need to tweak the compressor stream settings. Here’s an example with `createGzip` and its `Z_PARTIAL_FLUSH` flag:

```js
import http from "http";
import zlib from "zlib";

import MarkoTemplate from "./something.marko";

http
  .createServer(function (request, response) {
    response.writeHead(200, { "content-type": "text/html;charset=utf-8" });
    const templateStream = MarkoTemplate.stream({});
    const gzipStream = zlib.createGzip({
      flush: zlib.constants.Z_PARTIAL_FLUSH,
    });
    templateStream.pipe(outputStream).pipe(response);
  })
  .listen(80);
```
