// @ts-check
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
            return Number.isInteger(value) && value >= -2147483648 && value <= 2147483647;
        }
        if (typeof value === "object" && value !== null && value instanceof java.lang.Number) {
            return true;
        }
        return false;
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
                "[ColorHelperLib] convertColor(): invalid color value. " +
                "Allowed values: 'rgb', 'hex', 'android', but got '" +
                typeof color + "' (" + String(color) + ")"
            );
        }
        
        if (typeof finalType === "undefined") {
            throw new Error(
                "[ColorHelperLib] convertColor(): missing required parameter 'finalType'. " +
                "Allowed values: 'rgb', 'hex', 'android'"
            );
        }
        
        if (["rgb", "hex", "android"].indexOf(finalType) === -1) {
            throw new Error(
                "[ColorHelperLib] convertColor(): invalid finalType '" + finalType +
                "'. Allowed values: 'rgb', 'hex', 'android'"
            );
        }
        // Если формат совпадает — возвращаем как есть
        if (colorType === finalType) return color;
        
        switch (colorType) {
            case "android": {
                let androidColor = ColorHelper._javaNumToJs(color);
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
                    return android.graphics.Color.argb(alpha, red, green, blue);
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
                        "[ColorHelperLib] convertColor(): failed to parse HEX color '" + color + "'"
                    );
                }
                let red   = parsed[0];
                let green = parsed[1];
                let blue  = parsed[2];
                let alpha = parsed[3];
                
                if (finalType === "android") {
                    return android.graphics.Color.argb(alpha, red, green, blue);
                }
                if (finalType === "rgb") {
                    if (alpha === 255) return [red, green, blue];
                    return [red, green, blue, alpha];
                }
                break;
            }
        }
        
        return null;
    }
};

EXPORT("ColorHelper", ColorHelper);