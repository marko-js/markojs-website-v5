# Conditionals in Marko

Conditionals are essential for building dynamic user interfaces. They allow you to control which parts of your UI are displayed based on data, user interactions, or other conditions. Marko provides powerful and intuitive tags for handling conditional rendering in your templates.

## `<if>`, `<else-if>`, and `<else>`

The `<if>`, `<else-if>`, and `<else>` tags in Marko work similarly to their JavaScript counterparts, allowing you to conditionally render blocks of HTML based on expressions that evaluate to truthy or falsy values.

Here's a basic example:

```marko
<if=user.isLoggedIn>
  <p>Welcome back, ${user.name}!</p>
</if>
<else>
  <p>Please log in to continue.</p>
</else>
```

In this example:

- If `user.isLoggedIn` is truthy (e.g., `true`), the first `<p>` tag will be rendered.
- If `user.isLoggedIn` is falsy (e.g., `false`, `undefined`, `null`), the second `<p>` tag will be rendered.

You can also use `<else-if>` for multiple conditional checks:

```marko
<if=product.quantity > 0>
  <button>Add to Cart</button>
</if>
<else-if=product.backordered>
  <button disabled>Backordered</button>
<else-if>
<else>
  <button disabled>Out of Stock</button>
</else>
```

<!--
### `<show>`: Conditionally Showing or Hiding Elements

While the `<if>` tag controls whether an element is rendered or not, the `<show>` tag provides a way to conditionally **show** or **hide** an element that's always present in the DOM. This is useful for situations where you need to manipulate an element's visibility without completely removing and re-adding it to the DOM.

```marko
<show=showModal>
  <div>
    I'm a modal!
  </div>
</show>
```

In this example, the `div` element will always be rendered, but its visibility will be controlled by the value of the `showModal` variable.
-->

## Conditional Text and Attributes

You can also use JavaScript's ternary operator (`condition ? expressionIfTrue : expressionIfFalse`) within embedded JavaScript expressions (`${}`) and attribute values for more concise conditional logic.

**Conditional Text:**

```marko
<p>
  You have ${messages.length} new message${messages.length === 1 ? "" : "s"}.
</p>
```

**Conditional Attributes:**

```marko
<input type="checkbox" checked=user.rememberMe>
```

In this example, the `checked` attribute will be added to the `<input>` element only if `user.rememberMe` is not "void".

### Understanding Void Values in Marko

In Marko, any of the following values will be considered "void", causing them to not render anything in a `${}` expression and cause an attribute to be omitted:

- `false`
- `undefined`
- `null`

> [!CAUTION]
> Be careful when using numbers on the left side of the `&&` operator in conditional expressions. Since `0` is a falsy value in JavaScript, but not void in Marko you may have potentially unexpected results.
>
> **Example:**
>
> ```marko
> <div>${messages.length && `You have ${messages.length} new messages`}</div>
> -- ${" "}
> ```
>
> If `messages.length` is `0`, it will render `<div>0</div>`, which is probably not what you intended.
