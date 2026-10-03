declare const SimpleMenu: SimpleMenu.API;

declare namespace SimpleMenu {
  /**
  * Static API of the SimpleMenu library.
  *
  * This is the global object exposed at runtime. All methods are safe to call
  * without instantiation.
  */
  interface API {

      /**
       * Classifies a color value.
       *
       * @param color - Any value to inspect.
       * @returns
       *   - `"android"` — Android color int (`0xAARRGGBB`/`0xRRGGBB`, may be negative);
       *   - `"hex"`  — `#RGB` / `#RGBA` / `#RRGGBB` / `#RRGGBBAA`;
       *   - `"rgb"`  — `[r, g, b]` or `[r, g, b, a]`, each channel in `[0, 255]`;
       *   - `null`   — value is not a valid color.
       */
      getColorType(color: any): SimpleMenu.ColorType;

      /**
       * Checks whether a value is a valid color.
       *
       * @param color - Any value.
       * @returns `true` if `getColorType(color) !== null`.
       */
      isColor(color: any): boolean;

      /**
       * Converts a color value to the requested representation.
       *
       * @param color     - Source color (any form accepted by `getColorType`).
       * @param finalType - Target representation (`"android"` | `"hex"` | `"rgb"`).
       * @returns The color in the requested form.
       */
      convertColor(color: any, finalType: SimpleMenu.ColorType): any;

      /**
       * Parses a HEX color string into RGBA channels.
       *
       * @param color - HEX string (`#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`).
       * @returns `[r, g, b, a]`, each channel in `[0, 255]`.
       * @internal
       */
      _parseHexColor(color: string): [number, number, number, number];

      /**
       * Converts RGB(A) channels to a HEX string.
       *
       * @param r - Red, `[0, 255]`.
       * @param g - Green, `[0, 255]`.
       * @param b - Blue, `[0, 255]`.
       * @param a - Alpha, `[0, 255]`. If omitted, output has no alpha channel.
       * @returns HEX string.
       * @internal
       */
      _rgbToHex(r: number, g: number, b: number, a?: number): string;

      /**
       * Unwraps a Rhino wrapper for `java.lang.Number` (a Java `int` wrapped when
       * accessing a `static final int` from a Java class) into a standard JS number. 
       * `null`, `undefined`, JS numbers, and all other values ​​are returned as-is.
       *
       * @param color - Color value or arbitrary value.
       * @returns JS number for numeric input; otherwise, the same value.
       * @internal
       */
      _javaNumToJs(color: null | undefined): null | undefined;
      _javaNumToJs(color: number): number;
      _javaNumToJs(color: Color): Color;
      _javaNumToJs(color: any): any;

      /** @internal Runtime schema. */
      _SCHEMA: any;

      /**
       * Recursively clones an object, including all nested objects and arrays.
       * Functions and Android objects are copied by reference.
       *
       * @param obj - Any object.
       * @returns A deep copy of `obj`.
       */
      deepClone<T>(obj: T): T;

      /**
       * Creates a menu instance from a user config.
       *
       * @param userConfig - Full menu schema. `menu` and `elements` are required,
       *   `drawing` is optional. May be modified in-place during normalization
       *   (see `getContent`).
       * @returns Menu instance handle.
       */
      Create(userConfig: SimpleMenu.MenuSchema): SimpleMenu.Instance;
  }
  /**
   * Android color value. Accepts any of:
   *   - Android color int (0xAARRGGBB, 0xRRGGBB may be negative)
   *   - HEX string: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
   *   - RGB array:  [r, g, b]
   *   - RGBA array: [r, g, b, a]
   * 
   * Each channel must be a finite number in [0, 255].
   */
  type Color =
    | number
    | string
    | [number, number, number]
    | [number, number, number, number];

  /** Result of {@link SimpleMenu.getColorType}. */
  type ColorType = "android" | "hex" | "rgb" | null;
  /**
   * Dimension value. Either a finite number or a numeric string.
   * Interpreted as dp and automatically converted to px.
   */
  type Dimension = number | string;

  /** Non-empty array (mirrors the library's runtime checks). */
  type NonEmptyArray<T> = [T, ...T[]];

  // ----------------------------------------------------------------------------
  // Android placeholders
  // ----------------------------------------------------------------------------

  /** Placeholder for android.content.DialogInterface. */
  type DialogInterface = any;
  /** Placeholder for android.view.View. */
  type View = any;
  /** Placeholder for android.widget.CompoundButton. */
  type CompoundButton = any;
  /** Placeholder for android.widget.SeekBar. */
  type SeekBar = any;
  /** Placeholder for android.widget.AdapterView<T>. */
  type AdapterView<T = any> = any;

  // ----------------------------------------------------------------------------
  // Root schema
  // ----------------------------------------------------------------------------

  interface MenuSchema {
    /** Menu-level settings (title, buttons, style flags). Required. */
    menu: MenuConfig;

    /**
     * Global drawing/style defaults shared by all elements.
     * Optional, but if present must be an object (not null).
     */
    drawing?: DrawingConfig;

    /** Menu items. 
     * Required. The elements and their controls will be arranged one after another from top to bottom.
     **/
    elements: NonEmptyArray<MenuElement>;
  }

  // ----------------------------------------------------------------------------
  // menu
  // ----------------------------------------------------------------------------

  interface MenuConfigCommon {
    /** Menu title text. */
    title: string;

    /* Menu title font size. @default 20 */
    // titleSize?: Dimension;

    /* Menu title color. @default "drawing.nameColor" */
    // titleColor?: Color;

    /** Negative (cancel) button. @default null */
    negativeButton?: NegativeButton | null;

    /** Neutral button. @default null */
    neutralButton?: NeutralButton | null;
  }

  /**
   * Reactive model: changes are applied live, no confirmation button is needed.
   * Default behaviour when `isReactivePattern` is omitted or `true`.
   */
  interface MenuConfigReactive extends MenuConfigCommon {
    /** @default true */
    isReactivePattern?: true;

    /** Optional positive button. @default null */
    positiveButton?: PositiveButton | null;
  }

  /**
   * Transactional model: changes are only committed when the positive button
   * is pressed. Requires `positiveButton` to be provided.
   */
  interface MenuConfigTransactional extends MenuConfigCommon {
    isReactivePattern: false;

    /** Required in transactional mode. */
    positiveButton: PositiveButton;
  }

  type MenuConfig = MenuConfigReactive | MenuConfigTransactional;

  // ----------------------------------------------------------------------------
  // drawing (global style defaults)
  // ----------------------------------------------------------------------------

  interface DrawingConfig {
    /** Android theme resource for the dialog.
     *  @default android.R.style.Theme_Material_Dialog_Alert */
    menuStyle?: number;

    /** Android animation resource for the dialog.
     *  @default android.R.anim.slide_out_right */
    animation?: number;

    /** Default font size for element names. @default 16 */
    nameSize?: Dimension;

    /** Default color for element names. @default null */
    nameColor?: Color | null;

    /** Default font size for button labels. @default 16 */
    buttonTextSize?: Dimension;

    /** Default color for button labels. @default null */
    buttonTextColor?: Color | null;

    /** Default colors for separators (single color or gradient stops).
     *  @default [android.graphics.Color.GRAY] */
    separatorColor?: Color | NonEmptyArray<Color>;

    /** Default separator thickness. @default 3 */
    separatorHeight?: Dimension;

    /** Default separator gradient orientation.
     *  @default android.graphics.drawable.GradientDrawable.Orientation.LEFT_RIGHT */
    separatorGradientDirection?: number;
  }

  interface Hint {
    /** Hint text. */
    text: string;

    /** Hint text color. @default "drawing.nameColor" */
    textColor?: Color;

    /** Hint text size. @default "drawing.nameSize" */
    textSize?: Dimension;

    /** Hint icon/symbol. @default "ⓘ" */
    symbol?: string;

    /** Hint icon color. @default "drawing.nameColor" */
    symbolColor?: Color;

    /* Hint icon size. @default "drawing.nameSize" */
    // symbolSize?: Dimension;
  }

  interface PositiveButton {
    /** Button label.
     *  @default context.getString(android.R.string.ok) */
    text?: string;

    /** Called when the button is pressed. */
    onClick: (dialog: DialogInterface, elementIndex: number) => void;
  }

  interface NegativeButton {
    /** Button label.
     *  @default context.getString(android.R.string.ok) */
    text?: string;

    /** Called when the button is pressed. */
    onClick: (dialog: DialogInterface, elementIndex: number) => void;
  }

  interface NeutralButton {
    /** Button label.
     *  @default getSystemDefaultText() */
    text?: string;

    /** Called when the button is pressed. */
    onClick: (dialog: DialogInterface, elementIndex: number) => void;
  }

  interface EditTextDialog {
    /* Dialog title. @default "elements.edittext.name" */
    // title?: string;

    /** Initial text. @default "" */
    text?: string;

    /** Text size. @default "drawing.nameSize" */
    textSize?: Dimension;

    /** Text color. @default "drawing.nameColor" */
    textColor?: Color;

    /** Placeholder text. @default "" */
    placeholder?: string;

    /* Placeholder opacity. @default 0.5 */
    // placeholderOpacity?: number;

    /** Number of visible lines. @default 1 */
    linesCount?: Dimension;

    /** Positive button. @default null */
    positiveButton?: PositiveButton | null;

    /** Neutral button. @default null */
    neutralButton?: NeutralButton | null;

    /** Negative button. @default null */
    negativeButton?: NegativeButton | null;
  }

  interface SeekBarDialog {
    /* Dialog title. @default "elements.seekbar.name" */
    // title?: string;

    /** Minimum value. */
    min: Dimension;

    /** Maximum value. */
    max: Dimension;

    /* Step. @default 1 */
    // step?: Dimension;

    /** 
     * Current value. 
     * @remarks
     * If `min > max`, they are swapped at runtime and a warning is emitted.
     * If `current < min` or `current > max`, it is clamped into `[min, max]`
     * and a warning is emitted.
     * @default 0 */
    current?: Dimension;

    /** Text shown before the value. @default "" */
    prefixText?: string;

    /** Text shown after the value. @default "" */
    suffixText?: string;

    /** Value text size. @default "drawing.nameSize" */
    textSize?: Dimension;

    /** Value text color. @default "drawing.nameColor" */
    textColor?: Color;

    /** Positive button. @default null */
    positiveButton?: PositiveButton | null;

    /** Neutral button. @default null */
    neutralButton?: NeutralButton | null;

    /** Negative button. @default null */
    negativeButton?: NegativeButton | null;
  }


  interface ElementCommon {
    /** Name font size. @default "drawing.nameSize" */
    nameSize?: Dimension;

    /** Name color. @default "drawing.nameColor" */
    nameColor?: Color;

    /** Optional hint attached to the element. @default null */
    hint?: Hint | null;
  }

  interface ButtonElement extends ElementCommon {
    /** Discriminator. */
    type: 'button';

    /** Element name. */
    name: string;

    /** Button label text. */
    buttonText: string;

    /** Button label size. @default "drawing.buttonTextSize" */
    buttonTextSize?: Dimension;

    /** Button label color. @default "drawing.buttonTextColor" */
    buttonTextColor?: Color;

    /* Use marquee (scrolling) for long text. @default true */
    // useMarquee?: boolean;

    /** Called when the button is pressed. @default null */
    onButtonClick?: ((button: View, elementIndex: number) => void) | null;
  }

  interface SwitchElement extends ElementCommon {
    type: 'switch';

    /** Element name. */
    name: string;

    /** Called when the switch is toggled. @default null */
    onSwitch?:
      | ((switcher: CompoundButton, isChecked: boolean, elementIndex: number) => void)
      | null;

    /** Initial state. @default false */
    state?: boolean;

    /* Use marquee for long text. @default true */
    // useMarquee?: boolean;
  }

  interface CheckboxElement extends ElementCommon {
    type: 'checkbox';

    /** Element name. */
    name: string;

    /** Called when the checkbox is toggled. @default null */
    onCheck?:
      | ((checkbox: CompoundButton, isChecked: boolean, elementIndex: number) => void)
      | null;

    /** Initial checked state. @default false */
    state?: boolean;

    /* Use marquee for long text. @default true */
    // useMarquee?: boolean;
  }

  interface SelectionElement extends ElementCommon {
    type: 'selection';

    /** Element name. */
    name: string;

    /** Button label. @default null */
    buttonText?: string | null;

    /** Button label size. @default "drawing.buttonTextSize" */
    buttonTextSize?: Dimension;

    /** Button label color. @default "drawing.buttonTextColor" */
    buttonTextColor?: Color;

    /** Options to choose from. Must be a non-empty array. */
    options: NonEmptyArray<string>;

    /** Initially selected index (clamped at runtime). @default 0 */
    selectedIndex?: Dimension;

    /* Use marquee for long text. @default true */
    // useMarquee?: boolean;

    /** Called when the picker button is pressed. @default null */
    onButtonClick?: ((button: View, elementIndex: number) => void) | null;

    /**
     * Called when an option is selected.
     * @default null
     */
    onSelect?:
      | ((
          list: AdapterView,
          item: View,
          position: number,
          itemIndex: number,
          elementIndex: number,
        ) => void)
      | null;
  }

  interface MultiselectionElement extends ElementCommon {
    type: 'multiselection';

    /** Element name. */
    name: string;

    /** Button label. @default null */
    buttonText?: string | null;

    /** Button label size. @default "drawing.buttonTextSize" */
    buttonTextSize?: Dimension;

    /** Button label color. @default "drawing.buttonTextColor" */
    buttonTextColor?: Color;

    /** Options to choose from. Must be a non-empty array. */
    options: NonEmptyArray<string>;

    /** Initially selected indexes (bounds-checked & deduplicated at runtime).
     *  @default [0] */
    selectedIndexes?: NonEmptyArray<number>;

    /* Use marquee for long text. @default true */
    // useMarquee?: boolean;

    /** Called when the picker button is pressed. @default null */
    onButtonClick?: ((button: View, elementIndex: number) => void) | null;

    /** Called when an item's selection is toggled. @default null */
    onItemSelect?:
      | ((
          list: AdapterView,
          item: View,
          position: number,
          isChecked: boolean,
          itemIndex: number,
          elementIndex: number,
        ) => void)
      | null;

    /** Called when the spinner dialog is dismissed. @default null */
    onDismissSpinner?: ((elementIndex: number) => void) | null;
  }

  interface EditTextElement extends ElementCommon {
    type: 'edittext';

    /** Element name. */
    name: string;

    /** Button label. @default null */
    buttonText?: string | null;

    /** Button label size. @default "drawing.buttonTextSize" */
    buttonTextSize?: Dimension;

    /** Button label color. @default "drawing.buttonTextColor" */
    buttonTextColor?: Color;

    /* Use marquee for long text. @default true */
    // useMarquee?: boolean;

    /** Dialog configuration. */
    editTextDialog?: EditTextDialog;

    /** Called when the button is pressed. @default null */
    onButtonClick?: ((button: View, elementIndex: number) => void) | null;

    /** Called before text changes (may be used to veto). @default null */
    beforeTextChange?:
      | ((
          oldText: string,
          startPos: number,
          beforeCount: number,
          afterCount: number,
          elementIndex: number,
        ) => void)
      | null;

    /** Called on every text change. @default null */
    onTextChange?:
      | ((
          newText: string,
          startPos: number,
          beforeCount: number,
          afterCount: number,
          elementIndex: number,
        ) => void)
      | null;

    /** Called after text has changed. @default null */
    afterTextChange?: ((finalText: string, elementIndex: number) => void) | null;
  }

  interface SeekBarElement extends ElementCommon {
    type: 'seekbar';

    /** Element name. */
    name: string;

    /** Button label. @default null */
    buttonText?: string | null;

    /** Button label size. @default "drawing.buttonTextSize" */
    buttonTextSize?: Dimension;

    /** Button label color. @default "drawing.buttonTextColor" */
    buttonTextColor?: Color;

    /* Use marquee for long text. @default true */
    // useMarquee?: boolean;

    /** Dialog configuration. */
    seekBarDialog?: SeekBarDialog;

    /** Called when the button is pressed. @default null */
    onButtonClick?: ((button: View, elementIndex: number) => void) | null;

    /** Called on every progress change. @default null */
    onProgressChange?:
      | ((sb: SeekBar, progress: number, fromUser: boolean, elementIndex: number) => void)
      | null;

    /** Called when the user starts dragging. @default null */
    onStartTrackingTouch?:
      | ((sb: SeekBar, progress: number, elementIndex: number) => void)
      | null;

    /** Called when the user stops dragging. @default null */
    onStopTrackingTouch?:
      | ((sb: SeekBar, progress: number, elementIndex: number) => void)
      | null;
  }

  interface SeparatorElement {
    type: 'separator';

    /** Separator name. @default null */
    name?: string | null;

    /** Name size. @default "drawing.nameSize" */
    nameSize?: Dimension;

    /** Name color. @default "drawing.nameColor" */
    nameColor?: Color;

    /** Line gradient orientation. @default "drawing.separatorGradientDirection" */
    lineGradientDirection?: number;

    /** Line colors (single color or gradient stops).
     *  @default "drawing.separatorColor" */
    lineColor?: Color | NonEmptyArray<Color>;

    /** Line thickness in dp. @default "drawing.separatorHeight" */
    lineHeight?: Dimension;
  }

  type MenuElement =
    | ButtonElement
    | SwitchElement
    | CheckboxElement
    | SelectionElement
    | MultiselectionElement
    | EditTextElement
    | SeekBarElement
    | SeparatorElement;

  /**
   * A live menu instance returned by {@link SimpleMenu.Create}.
   */
  interface Instance {
    /**
     * Returns the current (normalized) content of the menu.
     * The returned object reflects all runtime changes applied by user
     * interactions and sanitization.
     */
    getContent(): MenuSchema;

    /**
     * Replaces the menu content with a new schema.
     * Does **not** re-render — call {@link refresh} afterwards.
     *
     * @param userConfig - New menu schema.
     */
    setContent(userConfig: MenuSchema): void;

    /** Re-renders the menu using the current content. */
    refresh(): void;

    /** Shows the menu. No-op if already visible. */
    show(): void;

    /** Hides the menu. No-op if already hidden. */
    hide(): void;

    /** @returns `true` if the menu is currently visible. */
    isVisible(): boolean;
  }
}