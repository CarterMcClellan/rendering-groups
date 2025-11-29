# ResizableCanvas - Rendering Groups

Simple repo for implementing a draggable, resizable, and flippable group of shapes with comprehensive E2E testing.

## Features

- **Multi-polygon selection** - Select individual polygons or use marquee selection
- **Translation** - Drag selected polygons to move them
- **Resize & Flip** - Resize from 8 handles (4 edges + 4 corners)
- **Axis inversion** - Flip polygons along X and Y axes by dragging handles past opposite edges
- **Visual feedback** - Real-time bounding box and handle indicators

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Testing

This project includes comprehensive E2E tests using Playwright that automate the manual testing workflow.

### Test Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests in UI mode (interactive, best for development)
npm run test:e2e:ui

# Run tests with visible browser
npm run test:e2e:headed

# Debug tests step-by-step
npm run test:e2e:debug

# View test report (after running tests)
npm run test:e2e:report
```

### Test Coverage

The E2E test suite includes 12 test cases covering:

1. **Selection Tests (TC-1 to TC-3)**
   - Marquee selection of multiple polygons
   - Single polygon selection via click
   - Clear selection by clicking empty space

2. **Translation Tests (TC-4 to TC-5)**
   - Translate selected polygons by dragging
   - Multiple translations accumulate correctly

3. **Inversion Tests (TC-6 to TC-9)**
   - X-axis inversion (drag right/left handle past opposite edge)
   - Y-axis inversion (drag top/bottom handle past opposite edge)
   - Dual-axis inversion (drag corner handle diagonally)
   - Multiple inversions toggle flip state correctly

4. **Complete Workflow (TC-10)**
   - Full user workflow: select → translate → invert X → invert Y → invert both

5. **Edge Cases (TC-11 to TC-12)**
   - Minimum size constraint enforcement (10px)
   - Reset button restores initial state

### Test Architecture

```
e2e/
├── resizable-canvas.spec.ts       # Main test suite (12 test cases)
├── helpers/
│   ├── canvas-helpers.ts          # SVG interaction utilities
│   ├── polygon-helpers.ts         # Polygon calculations
│   └── assertions.ts              # Custom assertions
└── fixtures/
    └── expected-states.ts         # Known good states
```

### For AI/LLM Developers

When making changes to the ResizableCanvas component, follow this workflow:

#### 1. Run Tests Before Changes
```bash
npm run test:e2e
```
This establishes a baseline and ensures all tests pass before modifications.

#### 2. Make Your Changes
Edit the ResizableCanvas component at `src/components/ResizableCanvas/index.tsx`

#### 3. Verify Behavior Visually
```bash
npm run test:e2e:ui
```
This opens an interactive UI where you can:
- Watch tests execute in real-time
- See exactly what the browser is doing
- Pause and inspect at any step
- Verify the component behaves correctly

#### 4. Analyze Test Output
When tests fail, they provide rich debugging information:

**Assertion Failures Show:**
- Expected vs actual values
- Component state at failure point (selection IDs, flip states, dimensions)
- File and line number where assertion failed

**Screenshots:**
- Automatically captured on failure
- Saved to `test-results/` directory
- Show visual state when test failed

**Videos:**
- Full recording of test execution
- Saved to `test-results/` directory
- Shows all mouse movements and interactions

**Error Context:**
- Step-by-step action log
- Timing information
- Network requests (if any)

#### 5. Check the HTML Report
```bash
npm run test:e2e:report
```
The report provides:
- Visual timeline of all test steps
- Screenshots at each action
- Detailed error messages with stack traces
- Filterable test list

### Key Test Files for Debugging

**`e2e/helpers/assertions.ts`**
Contains all assertion logic with expected values:
- `assertSelectionState(page, [0, 1, 2])` - Verifies selectedIds
- `assertFlipState(page, true, false)` - Checks flip.x and flip.y
- `assertBoundingBox(selectionBox, {x, y, width, height})` - Validates dimensions

**`e2e/fixtures/expected-states.ts`**
Defines known good states:
- `INITIAL_POLYGONS` - Expected starting coordinates for 3 polygons
- `INITIAL_BOUNDING_BOX` - Expected selection box: {x: 230, y: 220, width: 70, height: 80}

**`e2e/helpers/canvas-helpers.ts`**
SVG interaction utilities:
- `drawSelectionRectangle(page, x1, y1, x2, y2)` - Simulates marquee selection
- `dragHandle(page, handleType, deltaX, deltaY)` - Drags resize handles
- `dragFromTo(page, fromX, fromY, toX, toY)` - Low-level drag operation

### Common Debugging Scenarios

**Selection tests fail:**
- Check if polygon coordinates changed in `src/components/ResizableCanvas/index.tsx:65-68`
- Verify `INITIAL_POLYGONS` matches component's `INITIAL_POLYGONS`
- Look for changes in `calculateBoundingBox()` function

**Translation tests fail:**
- Verify bounding box position calculations in component
- Check `fixedAnchor` state updates correctly
- Ensure `translation` state accumulates properly

**Inversion tests fail:**
- Confirm flip logic triggers when dimensions go negative
- Verify `flipped.x` and `flipped.y` state updates
- Check handle remapping in `getEffectiveHandle()` function
- Ensure drag distances are sufficient (must exceed bounding box size)

**Edge case tests fail:**
- Check `MIN_SIZE` constant (should be 10)
- Verify `resetToInitial()` function restores all state
- Ensure `INITIAL_STATE` constant matches expected values

### Test Output Examples

**Successful Test:**
```
✓ TC-1: Select all 3 polygons via marquee selection (1.2s)
  → Drawing selection rectangle
  → Verifying selectedIds: [0, 1, 2]
  → Checking bounding box: x=230, y=220, width=70, height=80
```

**Failed Test:**
```
✗ TC-6: Invert along X axis by dragging right handle left (0.8s)
  → Drawing selection rectangle
  → Dragging right handle -150px
  ✗ Expected flip.x to be true, but got false

  Expected: "X: Yes"
  Received: "X: No"

  File: e2e/helpers/assertions.ts:21
  Screenshot: test-results/.../test-failed-1.png
  Video: test-results/.../video.webm
```

### Manual Testing Workflow (Automated by Tests)

The automated tests replicate this manual workflow:

1. Draw a selection rectangle around the 3 preset polygons (coords: 220,210 → 310,310)
2. Translate them by dragging the selection box
3. Invert along X axis - drag right handle left (past left edge)
4. Invert along Y axis - drag bottom handle up (past top edge)
5. Invert along both axes - drag corner handle diagonally
6. Click Reset to restore initial state

## Tech Stack

- **React 18** - UI framework
- **TypeScript 5.6** - Type safety
- **Vite 6** - Build tool
- **TailwindCSS 3.4** - Styling
- **Playwright 1.57** - E2E testing framework
- **Radix UI** - Accessible components

## Project Structure

```
src/
├── components/
│   └── ResizableCanvas/
│       └── index.tsx              # Main component (605 lines)
├── App.tsx                         # Application entry
└── main.tsx                        # React entry point

e2e/                                # E2E tests
├── resizable-canvas.spec.ts        # 12 test cases
├── helpers/
│   ├── canvas-helpers.ts           # SVG interactions
│   ├── polygon-helpers.ts          # Point/bbox calculations
│   └── assertions.ts               # Custom assertions
└── fixtures/
    └── expected-states.ts          # Known good values

playwright.config.ts                # Playwright configuration
```

## Component Architecture

The `ResizableCanvas` component (`src/components/ResizableCanvas/index.tsx`) manages:

**State:**
- `selectedIds: number[]` - Indices of selected polygons
- `polygons: Polygon[]` - All polygon data
- `fixedAnchor: Point` - Top-left corner of bounding box
- `dimensions: Dimensions` - Current width/height (can be negative)
- `flipped: {x: boolean, y: boolean}` - Flip state for each axis
- `translation: Point` - Current drag offset

**Key Functions:**
- `setSelectionFromIds(ids)` - Updates selection and bounding box
- `commitSelectionTransform()` - Applies current transform to polygon points
- `handleResize(e)` - Updates dimensions during resize
- `getEffectiveHandle(handle, flipped)` - Remaps handles when flipped

**Transformations:**
```typescript
scaleX = (flipped.x ? -1 : 1) * Math.abs(dimensions.width) / baseDimensions.width
scaleY = (flipped.y ? -1 : 1) * Math.abs(dimensions.height) / baseDimensions.height

transformedX = fixedAnchor.x + translation.x + (originalX - origin.x) * scaleX
transformedY = fixedAnchor.y + translation.y + (originalY - origin.y) * scaleY
```

## License

Private project
