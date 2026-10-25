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
     * Lightness-shift operation mode used internally by
     * `lighten` / `darken`. Not part of the public API.
     * @internal
     */
    type _ShiftMode = "lighten" | "darken";

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
    function getColorType(color: any): ColorType | null;

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
     * Computes the relative luminance of a color per WCAG 2.x.
     *
     * Only the RGB channels are used; alpha is ignored. A fully
     * transparent color is treated the same as the same color with
     * full opacity.
     *
     * @param color - Any valid color form.
     * @returns Relative luminance in `[0, 1]` (0 = black, 1 = white).
     * @throws If `color` is not a valid color.
     */
    function getLuminance(color: Color): number;

    /**
     * Checks whether a color is perceptually dark.
     *
     * @param color     - Any valid color form.
     * @param threshold - Luminance threshold in `[0, 1]`.
     *                    Defaults to `0.5` (a natural "closer to black or to white" split).
     *                    Pass `0.179` for a WCAG-consistent contrast cutoff.
     * @returns `true` if `getLuminance(color) < threshold`.
     * @throws If `color` is not a valid color.
     */
    function isDark(color: Color, threshold?: number): boolean;

    /**
     * Checks whether a color is perceptually light.
     * Complement of {@link isDark} for the same threshold.
     *
     * @param color     - Any valid color form.
     * @param threshold - Luminance threshold in `[0, 1]`. Defaults to `0.5`.
     * @returns `true` if `getLuminance(color) >= threshold`.
     * @throws If `color` is not a valid color.
     */
    function isLight(color: Color, threshold?: number): boolean;

    /**
     * Lightens a color by increasing its HSL lightness toward `1`.
     *
     * Output format matches the input format:
     * - `"android"` → Android color int;
     * - `"hex"`     → HEX string with the same alpha presence as the input
     *                 (e.g. `#RRGGBB` stays `#RRGGBB`, `#RRGGBBAA` stays `#RRGGBBAA`);
     * - `"rgb"`     → `[r, g, b]` if the input had no alpha, `[r, g, b, a]` otherwise.
     *
     * Alpha is preserved unchanged. Use `convertColor` afterwards if a
     * different output form is required.
     *
     * @param color  - Any valid color form.
     * @param amount - Shift amount in percent, `[0, 100]`. Values outside
     *                 the range are clamped. `NaN`/non-finite → `0`.
     * @returns Lightened color in the input's format.
     * @throws If `color` is not a valid color.
     */
    function lighten(color: number,  amount: number): number;
    function lighten(color: string,  amount: number): string;
    function lighten(color: RGB,     amount: number): RGB;
    function lighten(color: RGBA,    amount: number): RGBA;

    /**
     * Darkens a color by decreasing its HSL lightness toward `0`.
     *
     * Output format matches the input format:
     * - `"android"` → Android color int;
     * - `"hex"`     → HEX string with the same alpha presence as the input
     *                 (e.g. `#RRGGBB` stays `#RRGGBB`, `#RRGGBBAA` stays `#RRGGBBAA`);
     * - `"rgb"`     → `[r, g, b]` if the input had no alpha, `[r, g, b, a]` otherwise.
     *
     * Alpha is preserved unchanged. Use `convertColor` afterwards if a
     * different output form is required.
     *
     * @param color  - Any valid color form.
     * @param amount - Shift amount in percent, `[0, 100]`. Values outside
     *                 the range are clamped. `NaN`/non-finite → `0`.
     * @returns Darkened color in the input's format.
     * @throws If `color` is not a valid color.
     */
    function darken(color: number,  amount: number): number;
    function darken(color: string,  amount: number): string;
    function darken(color: RGB,     amount: number): RGB;
    function darken(color: RGBA,    amount: number): RGBA;

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

    /**
     * Converts RGB channels to HSL. All inputs and outputs are normalized;
     * `h`, `s`, `l` are in `[0, 1]`.
     * @internal
     */
    function _rgbToHsl(r: number, g: number, b: number): [number, number, number];

    /**
     * Converts HSL (each in `[0, 1]`) to RGB channels in `[0, 255]`.
     * @internal
     */
    function _hslToRgb(h: number, s: number, l: number): RGB;

    /**
     * Shared implementation behind {@link lighten} / {@link darken}.
     * @internal
     */
    function _shiftLightness(color: Color, amount: number, mode: _ShiftMode): Color;

    /**
     * Constructs a signed 32-bit Android integer from 3 or 4 numbers (each in `[0, 255]`).
     */
    function toAndroidInt(red: number, green: number, blue: number, alpha?: number): number;
}