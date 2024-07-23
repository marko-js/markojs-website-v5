# Lists in Marko

## `<for of>`: Iterating Over Arrays

The most common use case for `<for>` is iterating over arrays. The `of` attribute specifies the array you want to loop through.

```marko
<ul>
  <for|item, index| of=items by="id">
    <li>(${index}) Item ID: ${item.id}, Name: ${item.name}</li>
  </for>
</ul>
```

In this example:

- `items` is the array we're iterating over.
- The syntax `|item, index|` introduces [Tag Parameters]() available to the body of the `<for>` tag.
  - the `item` parameter is the current item from the `items` array
  - the `index` parameter is the current index of the `items` array
- `by="id"` specifies that the `id` property of each `item` should be used as the key.

## Importance of Keys

Keys play a crucial role in efficiently updating the DOM when the data in a list changes. They help Marko identify:

- Which items have been added to the list.
- Which items have been removed from the list.
- Which items have changed their position or content.

Using unique and stable keys ensures that Marko can make precise updates to the DOM, improving performance and preventing unexpected behavior.

- **`by` as a String:** When iterating over arrays, you often want to use a unique identifier from your data as the key. You can do this by providing a string to the `by` attribute, like `by="id"` in the example above. Marko will then use the value of the `id` property on each item as the key.

- **`by` as a Function:** For more complex scenarios, you can provide a function to the `by` attribute. This function will be called for each item in the array, and it should return a unique key for that item. The function receives the iterated item as the first parameter, and the index as the second.

> [!CAUTION]
> `<for of>` defaults to using the **array index** as the key if you don't specify the `by` attribute. While this might seem convenient, it can lead to problems:
>
> - **Reordering Issues:** If the order of items in the array changes, Marko might incorrectly reuse DOM elements based on their index, leading to unexpected behavior and potentially losing any component state associated with the reused element.
> - **Performance Degradation:** Inserting or deleting items at the beginning of a list can cause every subsequent item to be re-rendered, even if they haven't changed.

## Other `<for>` types

### `<for in>`

You can also use `<for in>` to iterate over the properties of an object:

```marko
<ul>
  <for|key, value| in=myObject>
    <li>${key}: ${value}</li>
  </for>
</ul>
```

In this case:

- `myObject` is the object whose properties we're iterating over.
- `key` will hold the name of each property.
- `value` will hold the value of each property.

> [!NOTE] > `<for in>` will default the key to the property name, which is often what you want, so it may not be necessary to specify a `by` attribute for the `<for in>` usage.

### `<for from to>`: Iterating Over Number Ranges

The `<for>` tag can also generate number sequences, which is useful for creating things like numbered lists or grids:

```marko
<ul>
  <for|num| from=1 to=5 step=1>
    <li>Item ${num}</li>
  </for>
</ul>
```

- `from=1`, `to=5`, and `step=1` define the starting number, ending number (inclusive), and increment, respectively.
