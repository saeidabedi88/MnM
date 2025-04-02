# AI Project Assistant Brand Guidelines

## Color Palette

Our application follows a monochromatic gray color scheme with carefully selected shades to create visual hierarchy and enhance usability.

### Primary Colors

| Color Name    | Hex Code  | RGB             | Usage                                   |
|---------------|-----------|-----------------|----------------------------------------|
| Raisin Black  | `#272727` | `rgb(39,39,39)` | Main backgrounds, primary content areas |
| Gray          | `#7B7C7B` | `rgb(123,124,123)` | Secondary elements, message bubbles, cards |
| Davys Gray    | `#4B4B4B` | `rgb(75,75,75)` | Interactive elements, form controls    |

### Extended Shades

| Color Name    | Hex Code  | RGB             | Usage                                   |
|---------------|-----------|-----------------|----------------------------------------|
| Darker Black  | `#1D1D1D` | `rgb(29,29,29)` | Headers, footers, hover states for dark elements |
| Middle Gray   | `#5B5C5B` | `rgb(91,92,91)` | Hover states for medium elements       |
| White         | `#FFFFFF` | `rgb(255,255,255)` | Text color on dark backgrounds     |

## Implementation Guidelines

### Tailwind CSS Classes

Our application uses Tailwind CSS with custom colors. Use these exact color references in all components:

```tsx
// Background colors
<div className="bg-[#272727]">Raisin Black background</div>
<div className="bg-[#1D1D1D]">Darker Black background</div>
<div className="bg-[#4B4B4B]">Davys Gray background</div>
<div className="bg-[#7B7C7B]">Gray background</div>
<div className="bg-[#5B5C5B]">Middle Gray background</div>

// Text colors
<p className="text-white">Primary text</p>
<p className="text-white opacity-70">Secondary text</p>

// Borders
<div className="border border-[#7B7C7B]">Standard border</div>
<div className="border-l-4 border-[#272727]">Left accent border</div>
<div className="border-r-2 border-[#272727]">Right accent border</div>

// Button examples
<button className="bg-[#272727] hover:bg-[#1D1D1D] text-white">Primary Button</button>
<button className="bg-[#7B7C7B] hover:bg-[#5B5C5B] text-white">Secondary Button</button>
<button className="bg-[#4B4B4B] hover:bg-[#5B5C5B] text-white">Tertiary Button</button>

// Form element examples
<input className="bg-[#4B4B4B] border border-[#7B7C7B] text-white focus:ring-2 focus:ring-[#1D1D1D]" />
<select className="bg-[#4B4B4B] border border-[#7B7C7B] text-white focus:ring-2 focus:ring-[#1D1D1D]" />
```

### Usage Rules

1. **Backgrounds**
   - Use `#272727` (Raisin Black) for main content backgrounds
   - Use `#1D1D1D` (Darker Black) for headers and footers
   - Use `#4B4B4B` (Davys Gray) for interactive elements like inputs and selects
   - Use `#7B7C7B` (Gray) for cards, message bubbles, and secondary elements

2. **Text**
   - Always use white text (`#FFFFFF`) on dark backgrounds
   - Use opacity for less important text: 70% opacity for dates and secondary information
   - Never use pure black text on dark backgrounds

3. **Borders & Accents**
   - Use `#7B7C7B` (Gray) for borders between major sections
   - Add `border-l-4` or `border-r-2` accents with `#272727` to distinguish content types
   - Use subtle shadows to create depth between elements

4. **Interactive Elements**
   - Primary buttons: `#272727` base with `#1D1D1D` hover state
   - Form elements: `#4B4B4B` base with `#1D1D1D` focus rings
   - Secondary buttons: `#7B7C7B` base with `#5B5C5B` hover state

5. **States**
   - Selected/active: `#272727` with border accent
   - Hover: Lighter or darker variant of the base color
   - Disabled: 50% opacity of the base color

6. **Visual Hierarchy**
   - Most important elements: Raisin Black (`#272727`)
   - Secondary elements: Gray (`#7B7C7B`)
   - Interactive elements: Davys Gray (`#4B4B4B`)
   - Background elements: Hierarchy of grays from darkest to lightest

## Components

### Project Cards

```tsx
<div className={`p-4 rounded-lg transition-colors ${
  isSelected
    ? 'bg-[#272727] text-white border border-[#7B7C7B]'
    : 'bg-[#7B7C7B] hover:bg-[#5B5C5B] text-white'
}`}>
  <h3 className="font-medium">Project Title</h3>
  <p className="text-sm mt-1 text-white">Description text</p>
  <div className="text-xs mt-2 text-white opacity-70">Created: 01/01/2023</div>
</div>
```

### Task Items

```tsx
<div className="bg-[#7B7C7B] rounded-lg shadow p-4 border-l-4 border-[#272727]">
  <div className="flex items-center justify-between">
    <h3 className="font-medium text-white">Task Title</h3>
    <select className="text-sm rounded-lg border border-[#272727] p-1 bg-[#4B4B4B] text-white">
      <option>To Do</option>
    </select>
  </div>
  <p className="text-sm text-white mt-2">Task description text</p>
  <div className="text-xs text-white opacity-70 mt-2">Created: 01/01/2023</div>
</div>
```

### Message Bubbles

```tsx
<!-- User message -->
<div className="flex justify-end">
  <div className="rounded-lg px-4 py-2 max-w-[80%] shadow-md bg-[#4B4B4B] text-white border-r-2 border-[#272727]">
    <div className="whitespace-pre-wrap">Message text</div>
  </div>
</div>

<!-- Assistant message -->
<div className="flex justify-start">
  <div className="rounded-lg px-4 py-2 max-w-[80%] shadow-md bg-[#7B7C7B] text-white border-l-2 border-[#272727]">
    <div className="whitespace-pre-wrap">Message text</div>
  </div>
</div>
```

## Accessibility Guidelines

- Ensure text has sufficient contrast with backgrounds:
  - Text should be white on all dark backgrounds
  - Maintain WCAG AA contrast ratio or better (4.5:1)
- Use visual indicators beyond color for state changes:
  - Add borders, shadows, or other visual cues
  - Never rely solely on color to convey information
- Interactive elements must have clear focus states:
  - Use `focus:ring-2 focus:ring-[#1D1D1D]` for focus indication
  - Ensure tab navigation works logically

## CSS Variables

If using CSS variables, define colors as follows:

```css
:root {
  --color-raisin-black: #272727;
  --color-gray: #7B7C7B;
  --color-davys-gray: #4B4B4B;
  --color-darker-black: #1D1D1D;
  --color-middle-gray: #5B5C5B;
  --color-white: #FFFFFF;
}
``` 