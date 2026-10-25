/// <reference path="../../toolchain/declarations/android.d.ts" />
/// <reference path="../../toolchain/declarations/core-engine.d.ts" />
/// <reference path="../../toolchain/declarations/ColorHelperLib.d.ts" />

/**
 * SimpleMenuAPI — a small declarative library for building Android-dialog-style
 * menus in the Rhino / Inner Core environment.
 *
 * The library exposes three globals:
 * - {@link SimpleMenu}      — main API (`Create`, geometry helpers, `deepClone`, `deepEqual`);
 * - {@link AttributesReader} — helpers for reading colors/strings from an Android theme
 *                              (also exported, since some mods reuse them);
 * - {@link ValuesCache}     — internal per-context caches (exposed for debugging /
 *                              manual invalidation via {@link ValuesCache.clearCache}).
 *
 * ## Example
 * ```js
 * const menu = SimpleMenu.Create({
 *   menu: { title: "Settings" },
 *   elements: [
 *     { type: "switch", name: "Sound", state: true,
 *       onSwitch: (sw, v) => log("sound = " + v) },
 *     { type: "section", subtitle: "Advanced", elements: [
 *         { type: "button", name: "Restart", buttonText: "Go" }
 *     ]}
 *   ]
 * });
 * menu.show();
 * ```
 *
 * ## Two behaviour models
 * - **Reactive** (`isReactivePattern: true`, default): every interaction
 *   updates the live config immediately.
 * - **Transactional** (`isReactivePattern: false`): interactions mutate a
 *   draft; the live config is only replaced when the positive button is
 *   pressed. In this mode `positiveButton` is **strongly recommended**
 *   (though, due to current schema defaults, the runtime will auto-create
 *   one even if omitted — but you should provide `onClick` for control).
 *
 * @see https://github.com/ENEIZEM/IC-libraries-BE
 */
declare namespace SimpleMenu {

  // =========================================================================
  //  Helper types
  // =========================================================================

  /**
   * A size value. Either a finite number or a string containing a number
   * (e.g. `16` or `"16"`). Interpreted as **dp** (density-independent pixels)
   * and converted to real pixels using the current `DisplayMetrics`.
   */
  type Dimension = number | string;

  /** Non-empty array. Mirrors the runtime checks performed by the library. */
  type NonEmptyArray<T> = [T, ...T[]];

  /**
   * Horizontal alignment keyword. Mapped by the library to Android gravity
   * flags:
   *  - `"LEFT"`   → `Gravity.START | Gravity.CENTER_VERTICAL`
   *  - `"RIGHT"`  → `Gravity.END   | Gravity.CENTER_VERTICAL`
   *  - `"CENTRE"` → `Gravity.CENTER`
   */
  type Alignment = "LEFT" | "RIGHT" | "CENTRE";

  /**
   * Dialog theme preset keyword. Mapped by the library to `android.R.style.*`
   * values:
   *  - `"Default"`        → `Theme_DeviceDefault_Dialog`
   *  - `"Default_Light"`  → `Theme_DeviceDefault_Light_Dialog`
   *  - `"Material"`       → `Theme_Material_Dialog`
   *  - `"Material_Light"` → `Theme_Material_Light_Dialog`
   *
   * @defaultValue `"Default"`
   */
  type MenuStyle = "Default" | "Default_Light" | "Material" | "Material_Light";

  // =========================================================================
  //  Global functions
  // =========================================================================

  /**
   * Creates a menu handle from a user config.
   *
   * The provided `userConfig` is **not** mutated. Internally the config is
   * validated, defaults are resolved, and values are normalized (e.g. `"16"`
   * → `16`, colors → Android int). The normalized result is what
   * {@link CreatedMenu.getContent} later returns.
   *
   * @param userConfig - Full menu schema. `menu` and `elements` are
   *   required; `drawing` is optional.
   * @returns A menu handle. Call `.show()` to display the dialog.
   *
   * @throws If the schema fails validation: unknown element type, wrong value
   *   type, missing required parameter, non-object `elements` inside a
   *   section, nested sections, etc.
   *
   * @example
   * ```js
   * const menu = SimpleMenu.Create({
   *   menu: { title: "Hello" },
   *   elements: [
   *     { type: "button", name: "Greet", buttonText: "Tap" }
   *   ]
   * });
   * menu.show();
   * ```
   */
  function Create(userConfig: MenuSchema): CreatedMenu;

  /**
   * Deep-clones a value.
   *
   * Rules:
   *  - primitives, `null`, `undefined` are returned as-is;
   *  - Java objects (anything with a `getClass` method) are copied by
   *    reference;
   *  - arrays are cloned element-by-element;
   *  - plain objects are cloned key-by-key;
   *  - functions are copied by reference.
   *
   * @typeParam T - Input type.
   * @param obj - Value to clone.
   * @returns A structurally independent copy of `obj`.
   */
  function deepClone<T>(obj: T): T;

  /**
   * Structural equality check.
   *
   *  - primitives compared with `===`;
   *  - `NaN` is considered equal to `NaN`;
   *  - `Date` compared by timestamp, `RegExp` by string representation;
   *  - cyclic references are handled.
   *
   * @param a - First value.
   * @param b - Second value.
   * @returns `true` if `a` and `b` are structurally equal.
   */
  function deepEqual(a: any, b: any): boolean;

  /**
   * Converts **dp** (density-independent pixels) to physical pixels using
   * the density of the given context (or the UI context if omitted).
   *
   * @param dp - Value in dp.
   * @param context - Optional Android `Context`. Defaults to
   *   `UI.getContext()`.
   * @returns Value in physical pixels (rounded).
   */
  function dpToPx(dp: number, context?: any): number;

  /**
   * Converts physical pixels to **dp**.
   *
   * @param px - Value in physical pixels.
   * @param context - Optional Android `Context`. Defaults to
   *   `UI.getContext()`.
   * @returns Value in dp (rounded).
   */
  function pxToDp(px: number, context?: any): number;

  /**
   * Converts physical pixels to **sp** (scale-independent pixels, used for
   * text sizes).
   *
   * @param px - Value in physical pixels.
   * @param context - Optional Android `Context`. Defaults to
   *   `UI.getContext()`.
   * @returns Value in sp (rounded).
   */
  function pxToSp(px: number, context?: any): number;

  /**
   * Returns the raw, internal schema descriptor used by `Create`.
   *
   * @remarks Primarily for debugging. The shape is an implementation detail
   *   and may change between versions.
   * @returns The internal schema object.
   */
  function _SCHEMA(): any;

  // =========================================================================
  //  Menu handle
  // =========================================================================

  /**
   * A handle to a created menu. Returned by {@link Create}.
   */
  interface CreatedMenu {
    /**
     * Shows the menu dialog.
     *
     * No-op if the menu is already visible. In transactional mode
     * (`isReactivePattern: false`) a snapshot of the config is taken at this
     * moment: the user works on a draft, and the draft replaces the live
     * config only when the positive button is pressed.
     */
    show(): void;

    /**
     * Returns the current (normalized) menu config.
     *
     * The object reflects all changes caused by user interactions (reactive
     * mode), or the last committed draft (transactional mode). This is the
     * **same object** the library keeps internally — avoid mutating it
     * unless you know what you are doing.
     *
     * @returns The live menu schema.
     */
    getContent(): MenuSchema;

    /**
     * Replaces the menu content with a new schema.
     *
     * Runs the same validation and normalization as {@link Create}. Does
     * **not** re-render an already-shown dialog — call
     * {@link CreatedMenu.refresh} afterwards.
     *
     * @param userConfig - New menu schema.
     * @throws If the new schema fails validation.
     */
    setContent(userConfig: MenuSchema): void;

    /**
     * Re-renders the menu using the current content.
     *
     * @remarks Currently a stub — does nothing in the current library version.
     */
    refresh(): void;

    /**
     * Hides the menu.
     *
     * @remarks Currently a stub — does nothing in the current library version.
     */
    hide(): void;

    /** @returns `true` if the menu is currently visible. */
    isVisible(): boolean;
  }

  // =========================================================================
  //  Root schema
  // =========================================================================

  /** Root menu schema. */
  interface MenuSchema {
    /** Menu-level settings (title, buttons, flags). Required. */
    menu: MenuConfig;

    /**
     * Global styles / defaults shared by all elements. If omitted, the
     * library's built-in defaults are used.
     */
    drawing?: DrawingConfig;

    /**
     * Menu items, rendered top-to-bottom in the given order.
     * Must be a non-empty array.
     */
    elements: NonEmptyArray<MenuElement>;
  }

  // =========================================================================
  //  `menu` section
  // =========================================================================

  /** Fields shared by both behaviour models. */
  interface MenuConfigCommon {
    /** Menu title text. */
    title: string;

    /** Title layout parameters. If omitted, defaults are used. */
    titleParam?: TitleParams;

    /**
     * Dim the activity behind the dialog.
     * @defaultValue Inherited from {@link DrawingConfig.dimBehind}
     *   (which defaults to `true`).
     */
    dimBehind?: boolean;

    /**
     * Dialog alignment on screen.
     * @defaultValue Inherited from {@link DrawingConfig.dialogAlignment}
     *   (which defaults to `"CENTRE"`).
     */
    dialogAlignment?: Alignment;

    /**
     * Negative ("Cancel"-style) button.
     *
     * @remarks Since schema v2 the runtime **auto-creates** this object if
     *   omitted, so the button is effectively always shown. Pass `null`
     *   explicitly (or an object with `onClick: null`) if you truly want
     *   a no-op cancel, or override `text` / `onClick` as needed.
     */
    negativeButton?: NegativeButton | null;

    /** Neutral button. If `null`/omitted, the button is not shown. */
    neutralButton?: NeutralButton | null;
  }

  /**
   * Reactive model — the default behaviour.
   *
   * Changes are applied to the live config as the user interacts. The
   * positive button is optional (commonly used as a plain "close").
   */
  interface MenuConfigReactive extends MenuConfigCommon {
    /** @defaultValue `true` */
    isReactivePattern?: true;

    /**
     * Positive ("OK"-style) button.
     *
     * @remarks Auto-created by the runtime if omitted. In reactive mode
     *   this button typically just closes the dialog; provide `onClick` if
     *   you need custom logic on top of that.
     */
    positiveButton?: PositiveButton | null;
  }

  /**
   * Transactional model.
   *
   * User interactions mutate a draft; the live config is only replaced when
   * the positive button is pressed. Therefore the positive button is the
   * commit trigger — provide `onClick` if you need any side effects.
   */
  interface MenuConfigTransactional extends MenuConfigCommon {
    isReactivePattern: false;

    /**
     * Commit button. Auto-created if omitted, but you should normally
     * provide it so you can react to the commit.
     */
    positiveButton: PositiveButton;
  }

  type MenuConfig = MenuConfigReactive | MenuConfigTransactional;

  // =========================================================================
  //  `drawing` section (global defaults)
  // =========================================================================

  /**
   * Global style defaults. All fields are optional; if omitted, the
   * library's built-in defaults are used.
   */
  interface DrawingConfig {
    /**
     * Corner radius of the dialog and per-element cards, in dp.
     * @defaultValue `28`
     */
    cornerRadius?: Dimension;

    /**
     * Android theme preset used for the dialog.
     * @defaultValue `"Default"`
     */
    menuStyle?: MenuStyle;

    /**
     * Dim the activity behind the dialog.
     * @defaultValue `true`
     */
    dimBehind?: boolean;

    /**
     * Default dialog alignment on screen.
     * @defaultValue `"CENTRE"`
     */
    dialogAlignment?: Alignment;

    /**
     * Horizontal padding inside the dialog, in dp.
     * @defaultValue `12`
     */
    paddingHorizontal?: Dimension;

    // ---- Title ----

    /**
     * Title text size, in sp.
     * @defaultValue `20`
     */
    titleSize?: Dimension;

    /**
     * Title color.
     * @defaultValue `null` — resolved from the current theme
     *   (`windowTitleStyle` → `textColorPrimary` → `textColor`).
     */
    titleColor?: ColorHelper.Color | null;

    /**
     * Title alignment.
     * @defaultValue `"CENTRE"`
     */
    titleAlignment?: Alignment;

    // ---- Section subtitles ----

    /**
     * Section subtitle text size, in sp.
     * @defaultValue `14`
     */
    subtitleSize?: Dimension;

    /**
     * Section subtitle color.
     * @defaultValue `null` — resolved from the theme's accent color.
     */
    subtitleColor?: ColorHelper.Color | null;

    /**
     * Section subtitle alignment.
     * @defaultValue `"LEFT"`
     */
    subtitleAlignment?: Alignment;

    // ---- Element names ----

    /**
     * Element name text size, in sp.
     * @defaultValue `16`
     */
    nameSize?: Dimension;

    /**
     * Element name color.
     * @defaultValue `null` — resolved from the theme's primary text color.
     */
    nameColor?: ColorHelper.Color | null;

    // ---- Element buttons ----

    /**
     * Element button label text size, in sp.
     * @defaultValue `16`
     */
    buttonTextSize?: Dimension;

    /**
     * Element button label text color.
     * @defaultValue `null` — resolved from the theme's primary text color.
     */
    buttonTextColor?: ColorHelper.Color | null;
  }

  // =========================================================================
  //  Sub-schemas
  // =========================================================================

  /**
   * Hint attached to an element.
   *
   * A symbol (by default `"ⓘ"`) is appended to the element's name. Tapping
   * the name opens a system dialog with the hint text.
   */
  interface Hint {
    /** Hint text shown in the system dialog. */
    text: string;

    /**
     * Hint text color. (In practice, only the symbol color is affected
     * visibly.)
     * @defaultValue Inherited from {@link DrawingConfig.nameColor}.
     */
    textColor?: ColorHelper.Color;

    /**
     * Hint text size, in sp.
     * @defaultValue Inherited from {@link DrawingConfig.nameSize}.
     */
    textSize?: Dimension;

    /**
     * Symbol appended to the element's name.
     * @defaultValue `"ⓘ"`
     */
    symbol?: string;

    /**
     * Symbol color.
     * @defaultValue Inherited from {@link DrawingConfig.nameColor}.
     */
    symbolColor?: ColorHelper.Color;
  }

  /** Title layout parameters. */
  interface TitleParams {
    /**
     * Title text size, in sp.
     * @defaultValue Inherited from {@link DrawingConfig.titleSize}.
     */
    size?: Dimension;

    /**
     * Title color.
     * @defaultValue Inherited from {@link DrawingConfig.titleColor}.
     */
    color?: ColorHelper.Color;

    /**
     * Horizontal padding, in dp.
     * @defaultValue Inherited from {@link DrawingConfig.paddingHorizontal}.
     */
    paddingHorizontal?: Dimension;

    /**
     * Top padding, in dp.
     * @defaultValue `18`
     */
    paddingTop?: Dimension;

    /**
     * Bottom padding, in dp.
     * @defaultValue `10`
     */
    paddingBottom?: Dimension;

    /**
     * Title alignment.
     * @defaultValue Inherited from {@link DrawingConfig.titleAlignment}.
     */
    alignment?: Alignment;
  }

  /** Positive ("OK"-style) button. */
  interface PositiveButton {
    /**
     * Button label.
     * @defaultValue System "OK" string (`android.R.string.ok`).
     */
    text?: string;

    /**
     * Called when the button is pressed.
     *
     * @param builder - The `android.app.AlertDialog.Builder` used to build
     *   the dialog. Note: this is a **builder**, not the built dialog,
     *   despite the historical parameter name.
     * @param elementIndex - Unique numeric identifier of the element that
     *   owns this dialog, or `-1` for the main menu dialog. Do not assume
     *   contiguous numbering (sections consume an index without exposing
     *   a callback of their own).
     * @defaultValue `null`
     */
    onClick?: (builder: any, elementIndex: number) => void;
  }

  /**
   * Negative ("Cancel"-style) button.
   *
   * Besides an explicit press, the callback is also invoked when the dialog
   * is cancelled: via the system back button or a tap outside the dialog.
   */
  interface NegativeButton {
    /**
     * Button label.
     * @defaultValue System "Cancel" string (`android.R.string.cancel`).
     */
    text?: string;

    /**
     * Called when the button is pressed **or** the dialog is cancelled.
     *
     * @param dialogOrBuilder - On button press, the same
     *   `AlertDialog.Builder` as for positive. On cancel, the ready
     *   `android.app.AlertDialog` passed to `OnCancelListener`.
     * @param elementIndex - Unique numeric identifier of the element that
     *   owns this dialog, or `-1` for the main menu dialog.
     * @defaultValue `null`
     */
    onClick?: (dialogOrBuilder: any, elementIndex: number) => void;
  }

  /** Neutral ("Reset"-style) button. */
  interface NeutralButton {
    /**
     * Button label.
     * @defaultValue A localized "reset to default" string resolved via
     *   {@link AttributesReader.getSystemText}; fallback is
     *   `"Reset to default"`.
     */
    text?: string;

    /**
     * Called when the button is pressed.
     *
     * @param builder - The `android.app.AlertDialog.Builder`.
     * @param elementIndex - Unique numeric identifier of the element that
     *   owns this dialog, or `-1` for the main menu dialog.
     * @defaultValue `null`
     */
    onClick?: (builder: any, elementIndex: number) => void;
  }

  // =========================================================================
  //  Elements — shared pieces
  // =========================================================================

  /** Fields shared by all elements that display a name. */
  interface ElementCommon {
    /**
     * Element name size, in sp.
     * @defaultValue Inherited from {@link DrawingConfig.nameSize}.
     */
    nameSize?: Dimension;

    /**
     * Element name color.
     * @defaultValue Inherited from {@link DrawingConfig.nameColor}.
     */
    nameColor?: ColorHelper.Color;

    /**
     * Optional hint shown when the element name is tapped.
     * @defaultValue `null` (no hint)
     */
    hint?: Hint | null;
  }

  /**
   * Fields shared by elements that render a "value button" on the right
   * (button, selection, multiselection, edittext, seekbar).
   */
  interface ButtonLikeElement extends ElementCommon {
    /**
     * Text on the "value button".
     * @defaultValue Depends on the element type:
     *   - `selection`: currently selected option;
     *   - `multiselection`: selected options joined with commas;
     *   - `edittext`: current text;
     *   - `seekbar`: `prefix + current + suffix`.
     */
    buttonText?: string | null;

    /**
     * "Value button" text size, in sp.
     * @defaultValue Inherited from {@link DrawingConfig.buttonTextSize}.
     */
    buttonTextSize?: Dimension;

    /**
     * "Value button" text color.
     * @defaultValue Inherited from {@link DrawingConfig.buttonTextColor}.
     */
    buttonTextColor?: ColorHelper.Color;

    /**
     * Called when the "value button" is tapped.
     *
     * @param button - The tapped View.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onButtonClick?: ((button: any, elementIndex: number) => void) | null;
  }

  // =========================================================================
  //  Elements — concrete types
  // =========================================================================

  /** A simple tappable button element. */
  interface ButtonElement extends ElementCommon {
    type: "button";

    /** Element name. */
    name: string;

    /** Button label text. */
    buttonText: string;

    /**
     * Button label size, in sp.
     * @defaultValue Inherited from {@link DrawingConfig.buttonTextSize}.
     */
    buttonTextSize?: Dimension;

    /**
     * Button label color.
     * @defaultValue Inherited from {@link DrawingConfig.buttonTextColor}.
     */
    buttonTextColor?: ColorHelper.Color;

    /**
     * Called when the button is tapped.
     *
     * @param button - The tapped View.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onButtonClick?: ((button: any, elementIndex: number) => void) | null;
  }

  /** On/off switch. */
  interface SwitchElement extends ElementCommon {
    type: "switch";

    /** Element name. */
    name: string;

    /** Initial state. @defaultValue `false` */
    state?: boolean;

    /**
     * Called when the switch is toggled.
     *
     * @param switcher - The switch View.
     * @param isChecked - New state.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onSwitch?:
      | ((switcher: any, isChecked: boolean, elementIndex: number) => void)
      | null;
  }

  /** Checkbox. */
  interface CheckboxElement extends ElementCommon {
    type: "checkbox";

    /** Element name. */
    name: string;

    /** Initial state. @defaultValue `false` */
    state?: boolean;

    /**
     * Called when the checkbox is toggled.
     *
     * @param checkbox - The checkbox View.
     * @param isChecked - New state.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onCheck?:
      | ((checkbox: any, isChecked: boolean, elementIndex: number) => void)
      | null;
  }

  /**
   * Single-choice selector. Tapping the "value button" opens a dropdown
   * with `options`; picking one writes its index into `selectedIndex`.
   */
  interface SelectionElement extends ButtonLikeElement {
    type: "selection";

    /** Element name. */
    name: string;

    /** Options to choose from. Must be a non-empty array. */
    options: NonEmptyArray<string>;

    /**
     * Initially selected index. Out-of-range values are clamped to
     * `[0, options.length - 1]` at runtime.
     * @defaultValue `0`
     */
    selectedIndex?: Dimension;

    /**
     * Called when an option is picked from the dropdown.
     *
     * @param list - The `AdapterView` containing the options.
     * @param item - The View of the selected option.
     * @param position - Position of the option in the adapter.
     * @param itemId - Adapter item id (usually equals `position`).
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onSelect?:
      | ((
          list: any,
          item: any,
          position: number,
          itemId: number,
          elementIndex: number,
        ) => void)
      | null;
  }

  /**
   * Multi-choice selector. Tapping the "value button" opens a dropdown with
   * checkboxes; each tap toggles the corresponding index in
   * `selectedIndexes`.
   */
  interface MultiselectionElement extends ButtonLikeElement {
    type: "multiselection";

    /** Element name. */
    name: string;

    /** Options to choose from. Must be a non-empty array. */
    options: NonEmptyArray<string>;

    /**
     * Initially selected indexes. Out-of-range values are clamped and
     * duplicates are removed at runtime.
     * @defaultValue `[0]`
     */
    selectedIndexes?: NonEmptyArray<number>;

    /**
     * Called when an option's selection is toggled.
     *
     * @param list - The `AdapterView` containing the options.
     * @param item - The View of the toggled option.
     * @param position - Position of the option in the adapter.
     * @param isChecked - New selection state for this option.
     * @param itemId - Adapter item id (usually equals `position`).
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onItemSelect?:
      | ((
          list: any,
          item: any,
          position: number,
          isChecked: boolean,
          itemId: number,
          elementIndex: number,
        ) => void)
      | null;

    /**
     * Called when the dropdown is dismissed.
     *
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onDismissSpinner?: ((elementIndex: number) => void) | null;
  }

  /**
   * Single- or multi-line text editor. Tapping the "value button" opens a
   * dialog with an `EditText`.
   */
  interface EditTextElement extends ButtonLikeElement {
    type: "edittext";

    /** Element name. */
    name: string;

    /** Dialog configuration. */
    editTextDialog?: EditTextDialog;

    /**
     * Called **before** the text changes.
     *
     * @param oldText - Text before the change.
     * @param startPos - Offset in the old text where replacement begins.
     * @param beforeCount - Number of characters being replaced.
     * @param afterCount - Number of characters replacing them.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    beforeTextChange?:
      | ((
          oldText: string,
          startPos: number,
          beforeCount: number,
          afterCount: number,
          elementIndex: number,
        ) => void)
      | null;

    /**
     * Called **while** the text is changing.
     *
     * @param newText - Text after the change.
     * @param startPos - Offset where the change starts.
     * @param beforeCount - Number of characters replaced.
     * @param afterCount - Number of characters replacing them.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onTextChange?:
      | ((
          newText: string,
          startPos: number,
          beforeCount: number,
          afterCount: number,
          elementIndex: number,
        ) => void)
      | null;

    /**
     * Called **after** the text change is applied.
     *
     * @param finalText - Resulting text.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    afterTextChange?: ((finalText: string, elementIndex: number) => void) | null;
  }

  /** Dialog configuration for {@link EditTextElement}. */
  interface EditTextDialog {
    /** Initial text. @defaultValue `""` */
    text?: string;

    /**
     * Text size, in sp.
     * @defaultValue Inherited from {@link DrawingConfig.nameSize}.
     */
    textSize?: Dimension;

    /**
     * Text color.
     * @defaultValue Inherited from {@link DrawingConfig.nameColor}.
     */
    textColor?: ColorHelper.Color;

    /** Placeholder text shown when the field is empty. @defaultValue `""` */
    placeholder?: string;

    /** Maximum number of visible lines. @defaultValue `1` */
    linesCount?: Dimension;

    /**
     * Dim the activity behind the dialog.
     * @defaultValue Inherited from {@link DrawingConfig.dimBehind}.
     */
    dimBehind?: boolean;

    /**
     * Dialog alignment on screen.
     * @defaultValue Inherited from {@link DrawingConfig.dialogAlignment}.
     */
    dialogAlignment?: Alignment;

    /** Positive button (auto-created if omitted). */
    positiveButton?: PositiveButton | null;

    /** Neutral button (hidden if omitted). */
    neutralButton?: NeutralButton | null;

    /** Negative button (auto-created if omitted). */
    negativeButton?: NegativeButton | null;
  }

  /**
   * Numeric slider. Tapping the "value button" opens a dialog with a
   * `SeekBar` and a live preview of the current value.
   */
  interface SeekBarElement extends ButtonLikeElement {
    type: "seekbar";

    /** Element name. */
    name: string;

    /** Dialog configuration. */
    seekBarDialog?: SeekBarDialog;

    /**
     * Called on every progress change.
     *
     * @param sb - The `SeekBar` View.
     * @param progress - New progress value.
     * @param fromUser - `true` if the change was initiated by the user.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onProgressChange?:
      | ((sb: any, progress: number, fromUser: boolean, elementIndex: number) => void)
      | null;

    /**
     * Called when the user starts dragging the thumb.
     *
     * @param sb - The `SeekBar` View.
     * @param progress - Progress at touch start.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onStartTrackingTouch?:
      | ((sb: any, progress: number, elementIndex: number) => void)
      | null;

    /**
     * Called when the user releases the thumb.
     *
     * @param sb - The `SeekBar` View.
     * @param progress - Progress at release.
     * @param elementIndex - Unique numeric identifier of this element.
     * @defaultValue `null`
     */
    onStopTrackingTouch?:
      | ((sb: any, progress: number, elementIndex: number) => void)
      | null;
  }

  /** Dialog configuration for {@link SeekBarElement}. */
  interface SeekBarDialog {
    /** Minimum value. */
    min: Dimension;

    /** Maximum value. */
    max: Dimension;

    /**
     * Initial value.
     *
     * If `min > max`, they are swapped (a warning is emitted). If `current`
     * falls outside `[min, max]`, it is clamped (a warning is emitted too).
     * @defaultValue `0`
     */
    current?: Dimension;

    /** Text shown before the value. @defaultValue `""` */
    prefixText?: string;

    /** Text shown after the value. @defaultValue `""` */
    suffixText?: string;

    /**
     * Value text size, in sp.
     * @defaultValue Inherited from {@link DrawingConfig.nameSize}.
     */
    textSize?: Dimension;

    /**
     * Value text color.
     * @defaultValue Inherited from {@link DrawingConfig.nameColor}.
     */
    textColor?: ColorHelper.Color;

    /**
     * Dim the activity behind the dialog.
     * @defaultValue Inherited from {@link DrawingConfig.dimBehind}.
     */
    dimBehind?: boolean;

    /**
     * Dialog alignment on screen.
     * @defaultValue Inherited from {@link DrawingConfig.dialogAlignment}.
     */
    dialogAlignment?: Alignment;

    /** Positive button (auto-created if omitted). */
    positiveButton?: PositiveButton | null;

    /** Neutral button (hidden if omitted). */
    neutralButton?: NeutralButton | null;

    /** Negative button (auto-created if omitted). */
    negativeButton?: NegativeButton | null;
  }

  /**
   * Visual grouping of elements under an optional subtitle.
   *
   * A section renders its children as a stack of per-element cards,
   * surrounded by a rounded background. Nesting sections is not allowed —
   * a nested `section` will fail validation with an error.
   */
  interface SectionElement {
    type: "section";

    /**
     * Subtitle shown above the section's children. If `null`/omitted, the
     * section renders without a header.
     * @defaultValue `null`
     */
    subtitle?: string | null;

    /**
     * Subtitle text size, in sp.
     * @defaultValue Inherited from {@link DrawingConfig.subtitleSize}.
     */
    subtitleSize?: Dimension;

    /**
     * Subtitle color.
     * @defaultValue Inherited from {@link DrawingConfig.subtitleColor}.
     */
    subtitleColor?: ColorHelper.Color;

    /**
     * Subtitle alignment.
     * @defaultValue Inherited from {@link DrawingConfig.subtitleAlignment}.
     */
    subtitleAlignment?: Alignment;

    /**
     * Child elements. Sections are not allowed inside (runtime will error
     * out). If omitted or empty, the section renders as an empty card
     * (with just the subtitle, if any) and a warning is emitted.
     */
    elements?: NonEmptyArray<ElementWithoutSection>;
  }

  // =========================================================================
  //  Union
  // =========================================================================

  /** Any non-section element allowed inside `elements` or a section. */
  type ElementWithoutSection =
    | ButtonElement
    | SwitchElement
    | CheckboxElement
    | SelectionElement
    | MultiselectionElement
    | EditTextElement
    | SeekBarElement;

  /** Any element allowed at the root of `MenuSchema.elements`. */
  type MenuElement = ElementWithoutSection | SectionElement;
}

/**
 * Helper namespace for reading localized Android strings and resolving
 * theme attributes (colors, dimensions, drawables) with per-`Context`
 * caching.
 *
 * Mostly useful when you write custom mod UI and want the same look-and-feel
 * as SimpleMenu's built-in widgets.
 *
 * @example
 * ```js
 * const ctx = new android.view.ContextThemeWrapper(
 *     UI.getContext(),
 *     android.R.style.Theme_DeviceDefault_Dialog
 * );
 * const accent = AttributesReader.getAccentColor(ctx, 0xFF00AAFF);
 * ```
 */
declare namespace AttributesReader {

  /**
   * Resolves a theme attribute to a concrete value.
   *
   * @param ctx - Android `Context` (usually a `ContextThemeWrapper`).
   * @param attrId - Attribute id, e.g. `android.R.attr.colorAccent`.
   * @param fallback - Value returned if the attribute cannot be resolved.
   * @param valueType - One of `"color"`, `"dimension"`, `"resourceId"`,
   *   `"drawable"`. Any other value is returned as raw `typedValue.data`.
   * @returns The resolved value (type depends on `valueType`), or
   *   `fallback` if resolution fails.
   */
  function getThemeValue(
    ctx: any,
    attrId: any,
    fallback: any,
    valueType: "color" | "dimension" | "resourceId" | "drawable" | string,
  ): any;

  /**
   * Resolves a theme attribute to an ARGB color int, with per-`Context`
   * caching under `cacheKey`.
   *
   * @param ctx - Android `Context`.
   * @param attrId - Attribute id, e.g. `android.R.attr.colorAccent`.
   * @param fallback - Value returned if the attribute cannot be resolved.
   * @param cacheKey - Cache key (must be unique per attribute within a
   *   context).
   * @returns ARGB color int, or `fallback`.
   */
  function getThemeColor(ctx: any, attrId: any, fallback: any, cacheKey: string): any;

  /**
   * Resolves a color from a *style* resource (not from the theme directly).
   * Used, for example, to read `windowTitleStyle`'s `textColor`.
   *
   * @param ctx - Android `Context`.
   * @param styleAttrId - Attribute that references a style, e.g.
   *   `android.R.attr.windowTitleStyle`.
   * @param styleAttrValue - Attribute *inside* that style to read, e.g.
   *   `android.R.attr.textColor`.
   * @param fallback - Value returned if resolution fails.
   * @param cacheKey - Cache key (may be `null` to disable caching).
   * @returns ARGB color int, or `fallback`.
   */
  function getColorFromStyle(
    ctx: any,
    styleAttrId: any,
    styleAttrValue: any,
    fallback: any,
    cacheKey: string | null,
  ): any;

  /**
   * Resolves the dialog title color using a fallback chain:
   * `windowTitleStyle.textColor` → `textColorPrimary` → `textColor` →
   * `fallback`.
   *
   * @param ctx - Android `Context`.
   * @param fallback - Last-resort value.
   * @returns ARGB color int.
   */
  function getDialogTitleColor(ctx: any, fallback: any): any;

  /**
   * Resolves `android.R.attr.textColorPrimary`.
   *
   * @param ctx - Android `Context`.
   * @param fallback - Value returned if the attribute is missing.
   * @returns ARGB color int.
   */
  function getPrimaryTextColor(ctx: any, fallback: any): any;

  /**
   * Resolves `android.R.attr.textColorSecondary`.
   *
   * @param ctx - Android `Context`.
   * @param fallback - Value returned if the attribute is missing.
   * @returns ARGB color int.
   */
  function getSecondaryTextColor(ctx: any, fallback: any): any;

  /**
   * Resolves `android.R.attr.colorAccent`.
   *
   * @param ctx - Android `Context`.
   * @param fallback - Value returned if the attribute is missing.
   * @returns ARGB color int.
   */
  function getAccentColor(ctx: any, fallback: any): any;

  /**
   * Resolves `android.R.attr.colorPrimary`.
   *
   * @param ctx - Android `Context`.
   * @param fallback - Value returned if the attribute is missing.
   * @returns ARGB color int.
   */
  function getPrimaryColor(ctx: any, fallback: any): any;

  /**
   * Resolves `android.R.attr.colorPrimaryDark`.
   *
   * @param ctx - Android `Context`.
   * @param fallback - Value returned if the attribute is missing.
   * @returns ARGB color int.
   */
  function getPrimaryDarkColor(ctx: any, fallback: any): any;

  /**
   * Best-effort color extraction from a Drawable.
   *
   * Handles `ColorDrawable`, `GradientDrawable`, `InsetDrawable` (recurses),
   * and `LayerDrawable` (returns the topmost non-transparent layer color).
   *
   * @param d - Drawable instance (or `null`/`undefined`).
   * @returns ARGB color int, or `null` if nothing usable was found.
   */
  function extractColorFromDrawable(d: any): number | null;

  /**
   * Resolves `android.R.attr.windowBackground` to a Drawable (cached).
   *
   * @param ctx - Android `Context`.
   * @returns Drawable, or `null` if unresolved.
   */
  function getWindowBackground(ctx: any): any;

  /**
   * Resolves the solid color of `windowBackground`.
   *
   * @param ctx - Android `Context`.
   * @param fallback - Value returned if the background is not a solid color
   *   drawable.
   * @returns ARGB color int, or `fallback`.
   */
  function getWindowBackgroundColor(ctx: any, fallback: any): any;

  /**
   * Resolves the most appropriate localized Android system string.
   *
   * Iterates over `candidateKeys` in order, using the current system locale.
   * If no localized variant matches, an English locale is tried; if that
   * also fails, `defaultText` is returned.
   *
   * Results are cached per "locale + key set" for the lifetime of the script.
   *
   * @param candidateKeys - Non-empty list of keys for the resource being searched in order of priority (e.g. `["reset_default", "reset", "revert", "clear"]`).
   * @param defaultText - Fallback returned if no key resolves.
   * @returns Localized string, English fallback, or `defaultText`.
   *
   * @throws If `candidateKeys` is not a non-empty array of strings, or if
   *   `defaultText` is not a string.
   */
  function getSystemText(candidateKeys: string[], defaultText: string): string;
}

/**
 * Internal cache storage used by {@link AttributesReader} and SimpleMenu.
 *
 * Exposed mainly for debugging or for manually invalidating caches when you
 * change the system configuration at runtime (e.g. switch light/dark theme
 * without recreating the activity).
 */
declare namespace ValuesCache {
  /**
   * Per-`Context` cache of resolved theme colors. Keyed by
   * `System.identityHashCode(ctx)`, then by an internal cache key.
   *
   * @internal
   */
  let themeColor: Record<string, any>;

  /**
   * Per-`Context` cache of resolved style values (e.g. title colors, window
   * background drawables). Keyed by `System.identityHashCode(ctx)`, then by
   * an internal cache key.
   *
   * @internal
   */
  let themeStyle: Record<string, any>;

  /**
   * Cache of resolved localized system strings. Keyed by
   * `"<lang>|<comma-separated keys>"`.
   *
   * @internal
   */
  let defaultText: Record<string, string>;

  /**
   * Last measured width (in pixels) of the main dialog, used to align
   * element dialogs with the main menu. `0` means "not measured yet".
   *
   * @internal
   */
  let mainDialogWight: number;

  /**
   * Clears all caches and resets {@link mainDialogWight} to `0`.
   *
   * Call this if you changed the system theme/locale at runtime and want
   * `AttributesReader` / SimpleMenu to re-resolve theme-dependent values
   * on the next call.
   */
  function clearCache(): void;
}