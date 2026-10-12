/// <reference path="../ColorHelperLib/ColorHelperLib.d.ts" />

/**
 * SimpleMenuAPI — a small declarative library for building Android-dialog-style
 * menus in the Rhino / Inner Core environment.
 *
 * The library exposes a single global `SimpleMenu`. Call
 * {@link SimpleMenu.Create} with a full menu schema to get a
 * {@link SimpleMenu.CreatedMenu} handle, then call `.show()`.
 *
 * ## Example
 * ```js
 * const menu = SimpleMenu.Create({
 *   menu: { title: "Settings" },
 *   elements: [
 *     { type: "switch", name: "Sound", state: true,
 *       onSwitch: (sw, v) => log("sound = " + v) },
 *     { type: "button", name: "Restart", buttonText: "Go" }
 *   ]
 * });
 * menu.show();
 * ```
 *
 * ## Two behaviour models
 * - **Reactive** (`isReactivePattern: true`, default): every interaction
 *   updates the live config immediately. The positive button is optional
 *   (typically used as a plain "close").
 * - **Transactional** (`isReactivePattern: false`): interactions mutate a
 *   draft; the live config is only replaced when the positive button is
 *   pressed. In this mode `positiveButton` is **required**.
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
   * Gradient direction keyword for separator lines. Corresponds to
   * `android.graphics.drawable.GradientDrawable.Orientation.*`.
   */
  type GradientDirection =
    | "TOP_BOTTOM" | "TR_BL"
    | "RIGHT_LEFT" | "BR_TL"
    | "BOTTOM_TOP" | "BL_TR"
    | "LEFT_RIGHT" | "TL_BR";

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
   *   type, missing required parameter, transactional mode without a
   *   positive button, etc.
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
    /** Menu title text.
     * @defaultValue The name of the mod. if it is not known, the mod folder name is used`
     */
    title?: string;

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

    /** Negative button. If `null`/omitted, the button is not shown. */
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

    /** Optional positive button. */
    positiveButton?: PositiveButton | null;
  }

  /**
   * Transactional model.
   *
   * User interactions mutate a draft; the live config is only replaced when
   * the positive button is pressed. Therefore the positive button is
   * **required** in this mode.
   */
  interface MenuConfigTransactional extends MenuConfigCommon {
    isReactivePattern: false;

    /** Required in transactional mode. */
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
     * Android theme resource used for the dialog.
     * @defaultValue `android.R.style.Theme_DeviceDefault_Light_Dialog`
     */
    menuStyle?: number;

    /**
     * Android animation resource applied when the dialog is shown.
     * @defaultValue `android.R.anim.fade_in`
     */
    animation?: number;

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
     * @defaultValue `24`
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
     * @defaultValue `null` — resolved from the theme
     *   (`windowTitleStyle` → `textColorPrimary` → `textColor`).
     */
    titleColor?: ColorHelper.Color | null;

    /**
     * Title alignment.
     * @defaultValue `"CENTRE"`
     */
    titleAlignment?: Alignment;

    // ---- Element names ----

    /**
     * Element name text size, in sp.
     * @defaultValue `16`
     */
    nameSize?: Dimension;

    /**
     * Element name color.
     * @defaultValue `null` — the theme's default text color is used.
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
     * @defaultValue `null`
     */
    buttonTextColor?: ColorHelper.Color | null;

    // ---- Separators ----

    /**
     * Default separator colors. A single color produces a solid line; a
     * non-empty array produces a gradient.
     * @defaultValue `android.graphics.Color.GRAY`
     */
    separatorColor?: ColorHelper.Color | NonEmptyArray<ColorHelper.Color>;

    /**
     * Default separator thickness, in dp.
     * @defaultValue `2`
     */
    separatorHeight?: Dimension;

    /**
     * Default separator gradient direction.
     * @defaultValue `"LEFT_RIGHT"`
     */
    separatorGradientDirection?: GradientDirection;
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
     * Hint text color. (In practice mostly affects the symbol color.)
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
     * @param elementIndex - Index of the element in `elements` for element
     *   dialogs, or `-1` for the main menu dialog.
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
     * @param elementIndex - Index of the element in `elements`, or `-1`
     *   for the main menu dialog.
     */
    onClick?: (dialogOrBuilder: any, elementIndex: number) => void;
  }

  /** Neutral ("Reset"-style) button. */
  interface NeutralButton {
    /**
     * Button label.
     * @defaultValue A localized "reset to default" string resolved via
     *   {@link getSystemText}; fallback is `"Reset to default"`.
     */
    text?: string;

    /**
     * Called when the button is pressed.
     *
     * @param builder - The `android.app.AlertDialog.Builder`.
     * @param elementIndex - Index of the element in `elements`, or `-1`
     *   for the main menu dialog.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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

    /** Positive button. */
    positiveButton?: PositiveButton | null;

    /** Neutral button. */
    neutralButton?: NeutralButton | null;

    /** Negative button. */
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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
     * @param elementIndex - Index of this element in `elements`.
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

    /** Positive button. */
    positiveButton?: PositiveButton | null;

    /** Neutral button. */
    neutralButton?: NeutralButton | null;

    /** Negative button. */
    negativeButton?: NegativeButton | null;
  }

  /**
   * Visual separator. If `name` is set, the line is drawn together with a
   * label; otherwise it is just a full-width line.
   */
  interface SeparatorElement {
    type: "separator";

    /** Separator label. @defaultValue `null` (a plain line, no label) */
    name?: string | null;

    /**
     * Label size, in sp.
     * @defaultValue Inherited from {@link DrawingConfig.nameSize}.
     */
    nameSize?: Dimension;

    /**
     * Label color.
     * @defaultValue Inherited from {@link DrawingConfig.nameColor}.
     */
    nameColor?: ColorHelper.Color;

    /**
     * Line gradient direction.
     * @defaultValue Inherited from {@link DrawingConfig.separatorGradientDirection}.
     */
    lineGradientDirection?: GradientDirection;

    /**
     * Line colors: single color for a solid line, non-empty array for a
     * gradient.
     * @defaultValue Inherited from {@link DrawingConfig.separatorColor}.
     */
    lineColor?: ColorHelper.Color | NonEmptyArray<ColorHelper.Color>;

    /**
     * Line thickness, in dp.
     * @defaultValue Inherited from {@link DrawingConfig.separatorHeight}.
     */
    lineHeight?: Dimension;
  }

  // =========================================================================
  //  Union
  // =========================================================================

  /** Any element allowed in `MenuSchema.elements`. */
  type MenuElement =
    | ButtonElement
    | SwitchElement
    | CheckboxElement
    | SelectionElement
    | MultiselectionElement
    | EditTextElement
    | SeekBarElement
    | SeparatorElement;
}