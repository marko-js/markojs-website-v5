## State & Derived State

Marko's reactive system makes it easy to manage your application's data and keep your user interface in sync with any changes. The key to this reactivity is how Marko tracks state.

### State with `<let>`

In Marko, the `<let>` tag is used to declare state variables. These variables represent the data that can change over time, affecting how your components render and behave.

```marko
<let/count=0/>
```

This line of code declares a state variable named `count` and initializes it to `0`.

> [!NOTE]
> The variable name is defined after the `/` in the tag. This is known as a [Tag Variable]() and is a way for a tag to provide data to the rest of the template. Any tag can declare Tag Variables using this syntax.

You can access the value of a state variable just like any other variable in your template.

```marko
<div>The current count is: ${count}</div>
```

### Updating State

To update a state variable, you reassign a new value to the tag variable. When you do, Marko will automatically re-render the component and any other parts of the UI that depend on the state that changed.

```marko
<button onClick() { count = count + 1; }>
  Increment
</button>
```

> [!IMPORTANT]
> State variables are immutable by default, which means you can't mutate their values. For example if you need to add an item to an array, prefer `array = array.concat(newItem)` (which updates the state to a _new_ array containing the additional item) to `array.push(newItem)` (which mutates the array).

### Derived State with `<const>`

The `<const>` tag is used to create derived state. It works similarly to `<let>` in that it defines a Tag Variable after the `/`, but the value is computed from other values. Marko automatically re-computes the value whenever any of its dependencies change.

```marko
<let/firstName="Luke"/>
<let/lastName="Edwards"/>

<const/fullName=`${firstName} ${lastName}`/>

<div>Hello, ${fullName}!</div>
```

In this example, `fullName` is derived from the values of `firstName` and `lastName`. Whenever either `firstName` or `lastName` changes, Marko automatically updates `fullName`, ensuring the UI is always consistent with the latest state.
