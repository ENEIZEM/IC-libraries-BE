/// <reference path="../../toolchain/declarations/android.d.ts" />
/// <reference path="../../toolchain/declarations/core-engine.d.ts" />
/*
    ColorHelperLib by ENEIZEM.
    ColorHelperLib provides simple methods for handling color values.
    Library repository on Github - https://github.com/ENEIZEM/IC-libraries-BE
*/

LIBRARY({
    name: "ColorHelperLib",
    version: 1,
    shared: false,
    api: "CoreEngine"
});

let ColorHelper = {
    isAndroidColorInt: function(value) {
        if (typeof value === "number") {
            if (!Number.isInteger(value)) return false;
            // Разрешаем и знаковую, и беззнаковую запись 32-битного int
            return value >= -2147483648 && value <= 4294967295;
        }
        if (typeof value === "object" && value !== null && value instanceof java.lang.Number) {
            return true;
        }
        return false;
    },
    toAndroidInt: function(r, g, b, a) {
        r = Math.round(r) & 0xFF;
        g = Math.round(g) & 0xFF;
        b = Math.round(b) & 0xFF;
        a = (a === undefined || a === null) ? 0xFF : (Math.round(a) & 0xFF);
        
        // Собираем 0xAARRGGBB и приводим к знаковому 32-битному через | 0
        return ((a << 24) | (r << 16) | (g << 8) | b) | 0;
    },
    getColorType: function(color) {
        if (color === null || color === undefined) return null;
        
        // Android color int
        if (ColorHelper.isAndroidColorInt(color)) return "android";
        
        // HEX: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
        if (typeof color === "string" && /^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(color)) {
            return "hex";
        }
        
        // RGB / RGBA: [r, g, b] или [r, g, b, a]
        if (Object.prototype.toString.call(color) === "[object Array]") {
            if (color.length !== 3 && color.length !== 4) return null;
            
            // Используем for вместо every, чтобы проверять "дырки" в массиве
            for (var i = 0; i < color.length; i++) {
                var value = color[i];
                if (value === null || value === undefined) return null;
                
                if (typeof value === "number") {
                    if (!(Number.isInteger(value) && value >= 0 && value <= 255)) return null;
                } else if (typeof value === "object" && value instanceof java.lang.Number) {
                    var n = value.doubleValue();
                    if (!(Number.isInteger(n) && n >= 0 && n <= 255)) return null;
                } else {
                    return null;
                }
            }
            return "rgb";
        }
        return null;
    },
    isColor: function(color) {
        return ColorHelper.getColorType(color) !== null;
    },
    parseHexColor: function(color) {
        var hex = color.substring(1);
        // #RGB -> #RRGGBB
        if (hex.length === 3) {
            return [
                parseInt(hex.charAt(0) + hex.charAt(0), 16),
                parseInt(hex.charAt(1) + hex.charAt(1), 16),
                parseInt(hex.charAt(2) + hex.charAt(2), 16),
                255
            ];
        }
        // #RGBA -> #RRGGBBAA
        if (hex.length === 4) {
            return [
                parseInt(hex.charAt(0) + hex.charAt(0), 16),
                parseInt(hex.charAt(1) + hex.charAt(1), 16),
                parseInt(hex.charAt(2) + hex.charAt(2), 16),
                parseInt(hex.charAt(3) + hex.charAt(3), 16)
            ];
        }
        // #RRGGBB
        if (hex.length === 6) {
            return [
                parseInt(hex.substring(0, 2), 16),
                parseInt(hex.substring(2, 4), 16),
                parseInt(hex.substring(4, 6), 16),
                255
            ];
        }
        // #RRGGBBAA
        if (hex.length === 8) {
            return [
                parseInt(hex.substring(0, 2), 16),
                parseInt(hex.substring(2, 4), 16),
                parseInt(hex.substring(4, 6), 16),
                parseInt(hex.substring(6, 8), 16)
            ];
        }
        return null;
    },
    rgbToHex: function(r, g, b, a) {
        var toHex = function(n) {
            if (typeof n !== "number" || !isFinite(n)) return "00";
            var hex = Math.round(n).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        var hex = "#" + toHex(r) + toHex(g) + toHex(b);
        if (typeof a === "number" && a !== 255) {
            hex += toHex(a);
        }
        return hex;
    },
    _javaNumToJs: function(color) {
        if (color && typeof color.intValue === "function") {
            return color.intValue();
        }
        return color;
    },
    convertColor: function(color, finalType) {
        var colorType = ColorHelper.getColorType(color);
        
        if (colorType === null) {
            throw new Error(
                "\n[ColorHelperLib] convertColor(): invalid color value. " +
                "Allowed values: 'rgb', 'hex', 'android', but got '" +
                typeof color + "' (" + String(color) + ")"
            );
        }
        
        if (typeof finalType === "undefined") {
            throw new Error(
                "\n[ColorHelperLib] convertColor(): missing required parameter 'finalType'. " +
                "Allowed values: 'rgb', 'hex', 'android'"
            );
        }
        
        if (["rgb", "hex", "android"].indexOf(finalType) === -1) {
            throw new Error(
                "\n[ColorHelperLib] convertColor(): invalid finalType '" + finalType +
                "'. Allowed values: 'rgb', 'hex', 'android'"
            );
        }
        // Если формат совпадает
        if (colorType === finalType && finalType === "android") return color | 0; // нормализация к знаковому 32-битному
        if (colorType === finalType) return color;
        
        switch (colorType) {
            case "android": {
                let androidColor = ColorHelper._javaNumToJs(color);
                // нормализуем к знаковому 32-битному — это чинит беззнаковые значения
                androidColor = androidColor | 0;
                let alpha = (androidColor >> 24) & 0xFF;
                let red   = (androidColor >> 16) & 0xFF;
                let green = (androidColor >> 8)  & 0xFF;
                let blue  =  androidColor        & 0xFF;
                if (finalType === "rgb") {
                    if (alpha === 255) return [red, green, blue];
                    return [red, green, blue, alpha];
                }
                if (finalType === "hex") {
                    return ColorHelper.rgbToHex(red, green, blue, alpha).toUpperCase();
                }
                break;
            }
            case "rgb": {
                let red   = ColorHelper._javaNumToJs(color[0]);
                let green = ColorHelper._javaNumToJs(color[1]);
                let blue  = ColorHelper._javaNumToJs(color[2]);
                let alpha = color.length === 4 ? ColorHelper._javaNumToJs(color[3]) : 255;
                
                if (finalType === "android") {
                    return ColorHelper.toAndroidInt(red, green, blue, alpha);
                }
                if (finalType === "hex") {
                    return ColorHelper.rgbToHex(red, green, blue, alpha).toUpperCase();
                }
                break;
            }
            case "hex": {
                var parsed = ColorHelper.parseHexColor(color);
                if (parsed === null) {
                    throw new Error(
                        "\n[ColorHelperLib] convertColor(): failed to parse HEX color '" + color + "'"
                    );
                }
                let red   = parsed[0];
                let green = parsed[1];
                let blue  = parsed[2];
                let alpha = parsed[3];
                
                if (finalType === "android") {
                    return ColorHelper.toAndroidInt(red, green, blue, alpha);
                }
                if (finalType === "rgb") {
                    if (alpha === 255) return [red, green, blue];
                    return [red, green, blue, alpha];
                }
                break;
            }
        }
        
        return null;
    },
    getLuminance: function(color) {
        var rgb = ColorHelper.convertColor(color, "rgb");
        var lin = function(c) {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
    },
    isDark: function(color, threshold) {
        if (threshold === undefined || threshold === null) threshold = 0.5;
        return ColorHelper.getLuminance(color) < threshold;
    },
    isLight: function(color, threshold) {
        if (threshold === undefined || threshold === null) threshold = 0.5;
        return ColorHelper.getLuminance(color) >= threshold;
    },
    _rgbToHsl: function(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    },
    _hslToRgb: function(h, s, l) {
        var r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            var hue2rgb = function(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },
    _shiftLightness: function(color, amount, mode) {
        var colorType = ColorHelper.getColorType(color);
        if (colorType === null) {
            throw new Error(
                "\n[ColorHelperLib] " + mode + "(): invalid color value. " +
                "Allowed values: 'rgb', 'hex', 'android', but got '" +
                typeof color + "' (" + String(color) + ")"
            );
        }

        var t = Number(amount);
        if (!isFinite(t) || t < 0) t = 0;
        if (t > 100) t = 100;
        t /= 100;

        var rgba, keepAlpha;
        if (colorType === "rgb") {
            rgba = [
                ColorHelper._javaNumToJs(color[0]),
                ColorHelper._javaNumToJs(color[1]),
                ColorHelper._javaNumToJs(color[2]),
                color.length === 4 ? ColorHelper._javaNumToJs(color[3]) : 255
            ];
            keepAlpha = (color.length === 4);
        } else if (colorType === "hex") {
            rgba = ColorHelper.parseHexColor(color); // всегда [r,g,b,a]
            keepAlpha = (color.length === 5 || color.length === 9); // #RGBA или #RRGGBBAA
        } else { // android int
            var n = ColorHelper._javaNumToJs(color) | 0;
            rgba = [
                (n >> 16) & 0xFF,
                (n >> 8)  & 0xFF,
                 n        & 0xFF,
                (n >> 24) & 0xFF
            ];
            keepAlpha = true;
        }

        var hsl = ColorHelper._rgbToHsl(rgba[0], rgba[1], rgba[2]);
        hsl[2] = (mode === "lighten")
            ? hsl[2] + (1 - hsl[2]) * t   // тянем к 1
            : hsl[2] * (1 - t);           // тянем к 0
        var rgb = ColorHelper._hslToRgb(hsl[0], hsl[1], hsl[2]);

        if (colorType === "rgb") {
            return keepAlpha ? [rgb[0], rgb[1], rgb[2], rgba[3]] : rgb;
        }
        if (colorType === "hex") {
            var toHex = function(x) {
                x = Math.round(x) & 0xFF;
                return (x < 16 ? "0" : "") + x.toString(16).toUpperCase();
            };
            var s = "#" + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
            if (keepAlpha) s += toHex(rgba[3]);
            return s;
        }
        return ColorHelper.toAndroidInt(rgb[0], rgb[1], rgb[2], rgba[3]);
    },
    lighten: function(color, amount) {
        return ColorHelper._shiftLightness(color, amount, "lighten");
    },
    darken: function(color, amount) {
        return ColorHelper._shiftLightness(color, amount, "darken");
    }
};

EXPORT("ColorHelper", ColorHelper);