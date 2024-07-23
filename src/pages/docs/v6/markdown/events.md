# Events in Marko

Events are essential for building interactive user interfaces. They allow your Marko components to react to user actions, like clicks, form submissions, mouse movements, and more. Marko provides a simple and intuitive way to handle events, making it easy to create dynamic and responsive web applications.

## DOM Events

Marko components can directly listen to native DOM events on HTML elements. To attach an event listener, you pass functions directly as the values of special event handler attributes that start with `on`.

```marko
<button onClick() { alert("Button Clicked!"); }>
  Click Me!
</button>
```

### The `event` Object

When an event handler function is called, it automatically receives the native DOM `event` object as an argument. The `event` object contains information about the event, such as the type of event, the target element, and more.

You can access properties of the `event` object within your handler function. For example, to get the value of an input field, you could use `event.target.value`.

## Child Components

### Passing Event Handlers as Props

Parent components can pass functions as props (attributes) to child components.

```marko
// parent.marko


<child-component onSubmit=handleSubmit/>
```

### Calling the Event Handler from the Child

The child component can then call the passed function to trigger an event in the parent component.

```marko
// child-component.marko


<button onClick=input.onSubmit>
  Submit
</button>
```

### Passing Data with the Event

Child components can pass data to the parent component's event handler by providing arguments when calling the function.

```marko
// child-component.marko


<button onClick() {
  const formData = {
    /* ... get form data */
  };
  input.onSubmit(formData); // Pass data to the event handler
}>
  Submit
</button>
```

In the parent component, the `handleSubmit` function would then receive the `formData` as an argument.
