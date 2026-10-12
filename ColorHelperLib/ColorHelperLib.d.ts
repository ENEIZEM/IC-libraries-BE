/**
 * ColorHelper — small utility library for working with Android colors
 * in Rhino / Inner Core environments.
 *
 * Supported color forms:
 * - Android color int: `0xAARRGGBB` / `0xRRGGBB` (may be negative due to signed int);
 * - HEX string: `#RGB` / `#RGBA` / `#RRGGBB` / `#RRGGBBAA`;
 * - RGB array: `[r, g, b]` or `[r, g, b, a]`, each channel in `[0, 255]`.
 *
 * Rhino wraps Java `static final int` fields in `java.lang.Number`
 * (e.g. `android.graphics.Color.RED`); ColorHelper transparently unwraps
 * such values where needed.
 */
declare namespace ColorHelper {
    /** Color representation tag returned by `getColorType`. */
    type ColorType = "android" | "hex" | "rgb";

    /** RGB tuple: `[r, g, b]`, each channel in `[0, 255]`. */
    type RGB = [number, number, number];

    /** RGBA tuple: `[r, g, b, a]`, each channel in `[0, 255]`. */
    type RGBA = [number, number, number, number];

    /**
     * Any value accepted as a color input.
     * Covers Android color int (including `java.lang.Number` wrappers),
     * HEX strings, and RGB(A) arrays.
     */
    type Color = number | string | RGB | RGBA;

    /**
     * Checks whether a value is a valid Android color int.
     *
     * Accepts:
     * - JS numbers within the signed 32-bit integer range
     *   (`-2147483648 … 2147483647`), including negative values
     *   produced by `0xFF______` literals;
     * - Rhino wrappers of `java.lang.Number` (e.g.
     *   `android.graphics.Color.RED` when accessed from JS).
     *
     * @param value - Any value to inspect.
     * @returns `true` if `value` can be used as an Android color int.
     */
    function isAndroidColorInt(value: any): boolean;

    /**
     * Classifies a color value.
     *
     * @param color - Any value to inspect.
     * @returns
     *   - `"android"` — Android color int (`0xAARRGGBB` / `0xRRGGBB`, may be negative);
     *   - `"hex"`     — `#RGB` / `#RGBA` / `#RRGGBB` / `#RRGGBBAA`;
     *   - `"rgb"`     — `[r, g, b]` or `[r, g, b, a]`, each channel in `[0, 255]`;
     *   - `null`      — value is not a valid color.
     */
    function getColorType(color: any): "android" | "hex" | "rgb" | null

    /**
     * Checks whether a value is a valid color.
     *
     * @param color - Any value.
     * @returns `true` if `getColorType(color) !== null`.
     */
    function isColor(color: any): boolean;

    /**
     * Converts a color value to the requested representation.
     *
     * @param color     - Source color (any form accepted by `getColorType`).
     * @param finalType - Target representation (`"android"` | `"hex"` | `"rgb"`).
     * @returns The color in the requested form.
     * @throws If `color` is not a valid color, `finalType` is missing,
     *         or `finalType` is not one of the allowed values.
     */
    function convertColor(color: any, finalType: "android"): number;
    function convertColor(color: any, finalType: "hex"): string;
    function convertColor(color: any, finalType: "rgb"): RGB | RGBA;
    function convertColor(color: any, finalType: ColorType): Color;


    /**
     * Parses a HEX color string into RGBA channels.
     *
     * Assumes the input is a valid HEX string; does not validate length,
     * characters, or the leading `#`. Malformed input may produce
     * `NaN` channels.
     *
     * @param color - HEX string (`#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`).
     * @returns `[r, g, b, a]`, each channel in `[0, 255]`.
     */
    function parseHexColor(color: string): RGBA;

    /**
     * Converts RGB(A) channels to a HEX string.
     *
     * @param r - Red, `[0, 255]`.
     * @param g - Green, `[0, 255]`.
     * @param b - Blue, `[0, 255]`.
     * @param a - Alpha, `[0, 255]`. If omitted or equal to `255`, the output has no alpha channel.
     * @returns HEX string (`#RRGGBB` or `#RRGGBBAA`).
     */
    function rgbToHex(r: number, g: number, b: number, a?: number): string;

    /**
     * Unwraps a Rhino wrapper for `java.lang.Number` (a Java `int`
     * wrapped when accessing a `static final int` from a Java class)
     * into a standard JS number.
     *
     * `null`, `undefined`, JS numbers, and all other values are returned as-is.
     *
     * @param value - Color value or arbitrary value.
     * @returns JS number for numeric input; otherwise, the same value.
     * @internal
     */
    function _javaNumToJs(value: any): any;
    function _javaNumToJs(value: null | undefined): null | undefined;
    function _javaNumToJs(value: number): number;

}
