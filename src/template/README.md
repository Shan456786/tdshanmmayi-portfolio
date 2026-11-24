# Page templates

The page markup lives here as plain HTML. `build/dc-compiler.js` compiles it to React at build time, so what you write is what renders. Edit a file, and `npm run dev` reloads.

`page.html` is the root. It pulls in the other files with:

```html
<dc-include src="./sections/hero.html"></dc-include>
```

The page needs exactly one root element. Included files are pasted in before parsing, so an included file can be a fragment.

## Syntax

| Write | It means |
| --- | --- |
| `{{ path.to.value }}` | Show a value from the object returned by `renderVals()` in `src/site/methods/view-model.js`. Dotted lookups only, never expressions. Compute anything else in `renderVals()`. |
| `class="a {{ b }}"` | Interpolation inside an attribute becomes a string. |
| `src="{{ asset.mainInk }}"` | A whole-value attribute is passed through as it is (string, number, function, boolean). Images use `{{asset.<name>}}`, see `src/assets/index.js`. |
| `onClick="{{ handler }}"` | Events use React's camelCase names. The handler is a function in the view model. |
| `ref="{{ setEl }}"` | Callback refs. |
| `<sc-if value="{{ x }}">...</sc-if>` | Renders the children when `x` is truthy. |
| `<sc-for list="{{ xs }}" as="x">...</sc-for>` | Repeats the children. `{{ x.y }}` and `{{ $index }}` work inside. |

Everything else is ordinary HTML. `class`, `for` and `tabindex` are renamed for React, and SVG attributes such as `stroke-width` are converted for you.

## Rules that save time

- A `{{ }}` that is not a plain dotted lookup fails the build with the file and the text. That is intended.
- Parts with no `{{ }}` and no `sc-if` or `sc-for` are created once at load and reused, which keeps re-renders cheap. Putting a `{{ }}` in a large block makes that whole block re-render, so keep dynamic holes close to the elements that need them.
- Attribute names for ARIA and `data-*` are kept as written.
- Template text is not escaped HTML by default: it is text. Use real characters (`&` is fine), not entity tricks.

## Folders

- `sections/` the home page, one file per chapter.
- `overlays/` the case study and the archive, which open over the page.
- `chrome.html`, `menu.html`, `toast.html` the navigation pill, the chapter menu and the small "copied" message.
