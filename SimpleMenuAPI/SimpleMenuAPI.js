/*
    SimpleMenuAPI by ENEIZEM and UhmDenis.
    SimpleMenuAPI provides simple methods for creating Android dialog menus.
    ENEIZEM in icmods - https://inner-core.org/user/ENEIZEM
    UhmDenis in icmods - https://inner-core.org/user/UhmDenis
    library development community in Vkontakte - https://vk.com/modsandperiod
    Library repository on Github - https://github.com/ENEIZEM/IC-libraries-BE
    Attention!
    Code change or clearing up the code is prohibited.
    By using the library you automatically agree to these rules.
    Внимание!
    Явное копирование или изменение кода запрещено.
    Используя библиотеку вы автоматически соглашаетесь с этими правилами.
*/

LIBRARY({
    name: "SimpleMenuAPI",
    version: 1,
    shared: false,
    api: "CoreEngine"
});

// let _cachedLang = null;
// let _cachedText = null;

// function getSystemDefaultText() {
//     const systemRes = android.content.res.Resources.getSystem();
//     const config = systemRes.getConfiguration();
//     const currentLocale = (config.locales && config.locales.size() > 0)
//         ? config.locales.get(0)
//         : (config.locale || java.util.Locale.getDefault());
//     const currentLang = currentLocale.getLanguage();
//     if (_cachedLang === currentLang && _cachedText !== null) return _cachedText;
//     const candidateKeys = [
//         "restore_default",
//         "reset_to_default",
//         "restore_defaults",
//         "reset_default",
//         "reset",
//         "revert",
//         "clear"
//     ];
//     let enRes = null;
//     if (currentLang !== "en") {
//         try {
//             const enConfig = new android.content.res.Configuration(config);
//             enConfig.setLocale(java.util.Locale.ENGLISH);
//             const enContext = context.createConfigurationContext(enConfig);
//             enRes = enContext.getResources();
//         } catch (e) {}
//     }
//     let englishFallback = null;
//     let result = null;
//     for (var i = 0; i < candidateKeys.length; i++) {
//         var key = candidateKeys[i];
//         var id = systemRes.getIdentifier(key, "string", "android");
//         if (id === 0) continue;
//         try {
//             var strCurrent = systemRes.getString(id);
//             if (!strCurrent || !strCurrent.trim()) continue;
//             if (currentLang === "en") {
//                 result = strCurrent;
//                 break;
//             }
//             var strEn = enRes ? enRes.getString(id) : strCurrent;
//             if (strCurrent !== strEn) {
//                 result = strCurrent;
//                 break;
//             }
//             if (!englishFallback) englishFallback = strCurrent;
//         } catch (e) {}
//     }
//     if (result === null) result = englishFallback || "By default";
//     _cachedLang = currentLang;
//     _cachedText = result;
//     return result;
// }

let SimpleMenu = {
    getColorType: function(color) {
        if (color === null || color === undefined) return null;
        // Android color int: 0xAARRGGBB. Из-за знакового int значение может быть отрицательным
        if (typeof color === "number" && isFinite(color))  return "android";
        if (typeof color === "object" && color instanceof java.lang.Number) return "android";
        // HEX: #RGB #RGBA #RRGGBB #RRGGBBAA
        if (typeof color === "string" &&
            /^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(color)
        ) {
            return "hex";
        }
        // RGB / RGBA: [r, g, b] [r, g, b, a]
        if (Object.prototype.toString.call(color) === "[object Array]") {
            if ((color.length === 3 || color.length === 4) &&
                color.every(function(value) {
                    if (value === null || value === undefined) return false;
                    if (typeof value === "number" && isFinite(value)) return value >= 0 && value <= 255;
                    if (typeof value === "object" && value instanceof java.lang.Number) {
                        var number = value.intValue();
                        return number >= 0 && number <= 255;
                    }
                    return false;
                })) {
                return "rgb";
            }
        }
        return null;
    },

    isColor: function(color) {
        return SimpleMenu.getColorType(color) !== null;
    },

    _parseHexColor: function(color) {
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

    _rgbToHex: function(r, g, b, a) {
        var hex = java.lang.String.format("#%02x%02x%02x", r, g, b);
        // Альфа необязательная
        if (typeof a === "number" && a !== 255) {
            hex += java.lang.String.format("%02x", a);
        }
        return hex;
    },

    _javaNumToJs: function(color) {
        if (color === null || color === undefined) return color;
        if (typeof color === "number") return color;
        if (typeof color === "object" && color instanceof java.lang.Number) return color.intValue();
        return color;
    },

    convertColor: function(color, finalType) {
        var colorType = SimpleMenu.getColorType(color);
        if (colorType === null) {
            throw new Error("[SimpleMenuAPI] ConvertColor(): invalid color value. Allowed values: 'rgb', 'hex', 'android', but got '" + typeof color + "' (" + String(color) + ")", "ERROR");
            return null;
        }
        if (typeof finalType === "undefined") {
            throw new Error("[SimpleMenuAPI] ConvertColor(): missing required parameter 'finalType'. Allowed values: 'rgb', 'hex', 'android'", "ERROR");
            return null;
        }
        if (["rgb", "hex", "android"].indexOf(finalType) === -1) {
            throw new Error("[SimpleMenuAPI] ConvertColor(): invalid finalType '" + finalType + "'. Allowed values: 'rgb', 'hex', 'android'", "ERROR");
            return null;
        }
        // Тот же формат — возвращаем как есть
        if (colorType === finalType) return color;
        switch (colorType) {
            // Android color int
            case "android": {
                let androidColor = SimpleMenu._javaNumToJs(color);
                let alpha = android.graphics.Color.alpha(androidColor);
                let red = android.graphics.Color.red(androidColor);
                let green = android.graphics.Color.green(androidColor);
                let blue = android.graphics.Color.blue(androidColor);
                if (finalType === "rgb") {
                    // Сохраняем старый формат RGB,
                    // но добавляем alpha если она не 255.
                    if (alpha === 255) return [red, green, blue];
                    return [red, green, blue, alpha];
                }
                if (finalType === "hex") return SimpleMenu._rgbToHex(red, green, blue, alpha);
                break;
            }
            // RGB / RGBA
            case "rgb": {
                let red = SimpleMenu._javaNumToJs(color[0]);
                let green = SimpleMenu._javaNumToJs(color[1]);
                let blue = SimpleMenu._javaNumToJs(color[2]);
                // Если альфа не указан — 255
                let alpha = color.length === 4 ? color[3] : 255;
                if (finalType === "android") return android.graphics.Color.argb(alpha, red, green, blue);
                if (finalType === "hex")  return SimpleMenu._rgbToHex(red, green, blue, alpha);
                break;
            }
            // HEX
            case "hex": {
                var parsed = SimpleMenu._parseHexColor(color);
                if (parsed === null) {
                    Logger.Log("[SimpleMenuAPI] ConvertColor(): failed to parse HEX color '" + color + "'", "ERROR" );
                    return null;
                }
                let red = parsed[0];
                let green = parsed[1];
                let blue = parsed[2];
                let alpha = parsed[3];
                if (finalType === "android") return android.graphics.Color.argb(alpha, red, green, blue);
                if (finalType === "rgb") {
                    if (alpha === 255) return [red, green, blue];
                    return [red, green, blue, alpha];
                }
                break;
            }
        }
        return null;
    },

    deepClone: function(obj) {
        if (obj === null || typeof obj !== "object") {
            return obj;
        }
        if (Object.prototype.toString.call(obj) === "[object Array]") {
            var arr = [];
            for (var i = 0; i < obj.length; i++) {
                arr[i] = SimpleMenu.deepClone(obj[i]);
            }
            return arr;
        }
        var clone = {};
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clone[key] = SimpleMenu.deepClone(obj[key]);
            }
        }
        return clone;
    },

    _SCHEMA: {
        // ------------------------------------------------------------------------
        // ГЛОБАЛЬНЫЕ НАСТРОЙКИ
        // ------------------------------------------------------------------------
        menu: {
            title:             { type: "string" },
            // titleSize:      { type: "number or numeric string",  default: 20 },
            // titleColor:     { type: "color",   default: "drawing.nameColor" },
            isReactivePattern: { type: "boolean", default: true },
            positiveButton:    { $ref: "SUB_SCHEMAS.positiveButton", default: null },
            negativeButton:    { $ref: "SUB_SCHEMAS.negativeButton", default: null },
            neutralButton:     { $ref: "SUB_SCHEMAS.neutralButton", default: null }
        },

        drawing: {
            menuStyle:                  { type: "number", default: android.R.style.Theme_Material_Dialog_Alert },
            animation:                  { type: "number", default: android.R.anim.slide_out_right },
            nameSize:                   { type: "number or numeric string", default: 16 },
            nameColor:                  { type: "color",  default: null},
            buttonTextSize:             { type: "number or numeric string", default: 16 },
            buttonTextColor:            { type: "color",  default: null},
            separatorColor:             { type: "color or color[]",  default: [android.graphics.Color.GRAY] },
            separatorHeight:            { type: "number or numeric string", default: 3 },
            separatorGradientDirection: { type: "orientation object", default: android.graphics.drawable.GradientDrawable.Orientation.LEFT_RIGHT }
        },
        
        // ------------------------------------------------------------------------
        // ВЛОЖЕННЫЕ ПОДОБЪЕКТЫ
        // ------------------------------------------------------------------------
        SUB_SCHEMAS: {
            hint: {
                type: "object",
                default: null,
                properties: {
                    text:           { type: "string" },
                    textColor:      { type: "color",   default: "drawing.nameColor" },
                    textSize:       { type: "number or numeric string",  default: "drawing.nameSize" },
                    symbol:         { type: "string",  default: "ⓘ" },
                    symbolColor:    { type: "color",   default: "drawing.nameColor" },
                    // symbolSize:     { type: "number or numeric string",  default: "drawing.nameSize" },
                }
            },
            positiveButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string", default: "ok"}, //context.getString(android.R.string.ok)},
                    onClick: { type: "function" }
                }
            },
            negativeButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string", default: "cancel"}, //context.getString(android.R.string.cancel) },
                    onClick: { type: "function" }
                }
            },
            neutralButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string", default: "By default"}, //context.getString(android.R.string.more) //getSystemDefaultText()
                    onClick: { type: "function" }
                }
            },
        },
        

        // ------------------------------------------------------------------------
        // ЭЛЕМЕНТЫ МЕНЮ
        // ------------------------------------------------------------------------
        elements: {
            type: "array",
            default: null,
            properties: {
                button: {
                    type:            { type: "string" },
                    name:            { type: "string" },
                    buttonText:      { type: "string" },
                    buttonTextSize:  { type: "number or numeric string",   default: "drawing.buttonTextSize" },
                    buttonTextColor: { type: "color",    default: "drawing.buttonTextColor" },
                    // useMarquee:      { type: "boolean",  default: true },
                    onButtonClick:   { type: "function", default: null },
                    nameSize:        { type: "number or numeric string",   default: "drawing.nameSize" },
                    nameColor:       { type: "color",    default: "drawing.nameColor" },
                    hint:            { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                switch: {
                    type:              { type: "string" },
                    name:              { type: "string" },
                    onSwitch:          { type: "function", default: null },
                    nameSize:          { type: "number or numeric string",   default: "drawing.nameSize" },
                    nameColor:         { type: "color",    default: "drawing.nameColor" },
                    state:             { type: "boolean",  default: false },
                    // useMarquee:        { type: "boolean",  default: true },
                    hint:              { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                checkbox: {
                    type:              { type: "string" },
                    name:              { type: "string" },
                    onCheck:           { type: "function", default: null },
                    nameSize:          { type: "number or numeric string",   default: "drawing.nameSize" },
                    nameColor:         { type: "color",    default: "drawing.nameColor" },
                    state:             { type: "boolean",  default: false },
                    // useMarquee:        { type: "boolean",  default: true },
                    hint:              { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                selection: {
                    type:                     { type: "string" },
                    name:                     { type: "string" },
                    nameSize:                 { type: "number or numeric string",   default: "drawing.nameSize" },
                    nameColor:                { type: "color",    default: "drawing.nameColor" },
                    buttonText:               { type: "string",  default: null },
                    buttonTextSize:           { type: "number or numeric string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:          { type: "color",    default: "drawing.buttonTextColor" },
                    options:                  { type: "string[]" },
                    selectedIndex:            { type: "number or numeric string",   default: 0 },
                    // useMarquee:               { type: "boolean",  default: true },
                    onButtonClick:            { type: "function", default: null },
                    onSelect:                 { type: "function", default: null },
                    hint:                     { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                multiselection: {
                    type:             { type: "string" },
                    name:             { type: "string" },
                    nameSize:         { type: "number or numeric string",   default: "drawing.nameSize" },
                    nameColor:        { type: "color",    default: "drawing.nameColor" },
                    buttonText:       { type: "string", default: null },
                    buttonTextSize:   { type: "number or numeric string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:  { type: "color",    default: "drawing.buttonTextColor" },
                    options:          { type: "string[]" },
                    selectedIndexes:  { type: "number[]", default: [0] },
                    // useMarquee:       { type: "boolean",  default: true },
                    onButtonClick:    { type: "function", default: null },
                    onItemSelect:     { type: "function", default: null },
                    onDismissSpinner: { type: "function", default: null },
                    hint:             { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                edittext: {
                    type:                    { type: "string" },
                    name:                    { type: "string" },
                    nameSize:                { type: "number or numeric string",   default: "drawing.nameSize" },
                    nameColor:               { type: "color",    default: "drawing.nameColor" },
                    buttonText:              { type: "string", default: null },
                    buttonTextSize:          { type: "number or numeric string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:         { type: "color",    default: "drawing.buttonTextColor" },
                    // useMarquee:              { type: "boolean",  default: true },
                    editTextDialog: {
                        type: "object",
                        properties: {
                            // title:              { type: "string", default: "elements.edittext.name" },
                            text:               { type: "string", default: "" }, 
                            textSize:           { type: "number or numeric string", default: "drawing.nameSize" }, 
                            textColor:          { type: "color", default: "drawing.nameColor" },
                            placeholder:        { type: "string", default: "" },
                            // placeholderOpacity: { type: "number", default: 0.5 },
                            linesCount:         { type: "number or numeric string", default: 1 }, 
                            positiveButton:     { $ref: "SUB_SCHEMAS.positiveButton" },
                            neutralButton:      { $ref: "SUB_SCHEMAS.neutralButton", default: null },
                            negativeButton:     { $ref: "SUB_SCHEMAS.negativeButton" }
                        }
                    },
                    onButtonClick:              { type: "function", default: null },
                    beforeTextChange:          { type: "function", default: null },
                    onTextChange:              { type: "function", default: null },
                    afterTextChange:           { type: "function", default: null },
                    hint:                       { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                seekbar: {
                    type:                        { type: "string" },
                    name:                        { type: "string" },
                    nameSize:                    { type: "number or numeric string",   default: "drawing.nameSize" },
                    nameColor:                   { type: "color",    default: "drawing.nameColor" },
                    buttonText:                  { type: "string", default: null },
                    buttonTextSize:              { type: "number or numeric string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:             { type: "color",    default: "drawing.buttonTextColor" },
                    // useMarquee:                  { type: "boolean",  default: true },
                    seekBarDialog: {
                        type: "object",
                        properties: {
                            // title:          { type: "string", default: "elements.seekbar.name" },
                            min:            { type: "number or numeric string" },
                            max:            { type: "number or numeric string" },
                            // step:           { type: "number or numeric string", default: 1 },
                            current:        { type: "number or numeric string", default: 0 },
                            prefixText:     { type: "string", default: "" },
                            suffixText:     { type: "string", default: "" },
                            textSize:       { type: "number or numeric string", default: "drawing.nameSize" },
                            textColor:      { type: "color", default: "drawing.nameColor" },
                            positiveButton: { $ref: "SUB_SCHEMAS.positiveButton" },
                            neutralButton:  { $ref: "SUB_SCHEMAS.neutralButton", default: null },
                            negativeButton: { $ref: "SUB_SCHEMAS.negativeButton" }
                        }
                    },
                    onButtonClick:                  { type: "function", default: null },
                    onProgressChange:              { type: "function", default: null },
                    onStartTrackingTouch:          { type: "function", default: null },
                    onStopTrackingTouch:           { type: "function", default: null },
                    hint:                           { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                separator: {
                    type:                  { type: "string" },
                    name:                  { type: "string", default: null },
                    nameSize:              { type: "number or numeric string", default: "drawing.nameSize" },
                    nameColor:             { type: "color",  default: "drawing.nameColor" },
                    lineGradientDirection: { type: "orientation object", default: "drawing.separatorGradientDirection" },
                    lineColor:             { type: "color or color[]",  default: "drawing.separatorColor" },
                    lineHeight:            { type: "number or numeric string", default: "drawing.separatorHeight" }
                }
            }
        }
    },

    Create: function(userConfig) {
        let ctx = UI.getContext();
        userConfig = userConfig || {};

        //Перевод dp в px
        function dpToPx(dp) {
            let dm = ctx.getResources().getDisplayMetrics();
            return android.util.TypedValue.applyDimension(android.util.TypedValue.COMPLEX_UNIT_DIP, dp, dm);
        };
        
        // ВАЛИДАЦИЯ
        let errors = [];
        let warnings = [];

        // Окно ошибок
        function reportValidation(errors, warnings) {
            if (errors.length === 0 && warnings.length === 0) return;
            if (errors.length > 0) {
                var msg = "[SimpleMenuAPI] Create():\n  - " + errors.join("\n  - ");
                if (warnings.length > 0) msg += "\n\nWarnings:\n  - " + warnings.join("\n  - ");
                throw new Error(msg);
            }
            Logger.Log("[SimpleMenuAPI] Create():\n  - " + warnings.join("\n  - "), "WARNING"
            );
        }

        // Проверка типов
        function checkType(value, expectedType) {
            if (expectedType === "array") return Array.isArray(value);
            if (expectedType === "color") return SimpleMenu.isColor(value);
            if (expectedType === "function") return typeof value === "function";
            if (expectedType === "number or numeric string") {
                if (typeof value === "number") return Number.isFinite(value);
                if (typeof value === "string") {
                    var t = value.trim();
                    return t !== "" && Number.isFinite(Number(t));
                }
                return false;
            }
            // if (expectedType === "color[]"){
            //     return SimpleMenu.isColor(value) ||
            //         (Array.isArray(value) && value.length > 0 && value.every(SimpleMenu.isColor));
            // }
            if (expectedType === "string[]"){
                return Array.isArray(value) && value.length > 0 &&
                    value.every(function (item) { return typeof item === "string"; });
            }
            if (expectedType === "number[]"){
                return Array.isArray(value) && value.length > 0 &&
                    value.every(function (item) {
                        return typeof item === "number" && Number.isFinite(item);
                    });
            }
            if (expectedType === "color or color[]") {
                return SimpleMenu.isColor(value) ||
                    (Array.isArray(value) && value.length > 0 && 
                    value.every(SimpleMenu.isColor));
            }
            if (expectedType === "orientation object") {
                if (value == null) return false;
                if (typeof value !== "object") return false;
                return String(value.getClass().getName()) ===
                    "android.graphics.drawable.GradientDrawable$Orientation";
            }
            return typeof value === expectedType;
        }

        // Преобразование и нормализация значений по типу
        function normalizeValue(value, expectedType) {
            if (value === null || value === undefined) return value;
            // Приведение строки/числа к чистому Number
            if (expectedType === "number or numeric string") {
                return Number(value);
            }
            // Нормализация одиночного цвета
            if (expectedType === "color") {
                return SimpleMenu.convertColor(value, "android");
            }
            // Одиночный цвет превращаем в массив [color] и конвертируем все цвета в массиве
            if (expectedType === "color or color[]") {
                var rawArray = Array.isArray(value) ? value : [value];
                var normalizedColors = [];
                for (var i = 0; i < rawArray.length; i++) {
                    normalizedColors.push(SimpleMenu.convertColor(rawArray[i], "android"));
                }
                return normalizedColors;
            }

            return value;
        }

        // Логическая валидация элементов
        function sanitizeElementLogic(element, index) {
            if (!element) return element;

            if (element.type === "seekbar") {
                var min = element.seekBarDialog.min;
                var max = element.seekBarDialog.max;
                var current = element.seekBarDialog.current;
                // Если min больше max — меняем их местами
                if (min > max) {
                    warnings.push("elements[" + index + "] (seekbar) 'min' (" + min + ") > 'max' (" + max + "). Swapping values.");
                    element.seekBarDialog.min = max;
                    element.seekBarDialog.max = min;
                    min = element.seekBarDialog.min;
                    max = element.seekBarDialog.max;
                }
                // Подгоняем current под границы [min, max]
                if (current < min) {
                    warnings.push("elements[" + index + "] (seekbar) 'current' (" + current + ") is lower than 'min' (" + min + "). Set to min.");
                    element.seekBarDialog.current = min;
                } else if (current > max) {
                    warnings.push("elements[" + index + "] (seekbar) 'current' (" + current + ") is higher than 'max' (" + max + "). Set to max.");
                    element.seekBarDialog.current = max;
                }
            }

            // Преобразование dp в px
            if (element.type === "separator") {
                element.lineHeight = dpToPx(element.lineHeight);
            }

            // Предотвращение выхода за пределы массива
            if (element.type === "selection") {
                if (element.selectedIndex < 0) {
                    warnings.push("elements[" + index + "] (selection) 'selectedIndex' (" + element.selectedIndex + ") is lower than 0. Set to 0.");
                    element.selectedIndex = 0;
                } else if (element.selectedIndex >= element.options.length) {
                    warnings.push("elements[" + index + "] (selection) 'selectedIndex' (" + element.selectedIndex + ") is higher than or equal to 'options.length' (" + element.options.length + "). Set to " + (element.options.length - 1) + ".");
                    element.selectedIndex = element.options.length - 1;
                }
            }

            if (element.type === "multiselection") {
                for (var i = 0; i < element.selectedIndexes.length; i++) {
                    if (element.selectedIndexes[i] < 0) {
                        warnings.push("elements[" + index + "] (multiselection) 'selectedIndexes[" + i + "]' (" + element.selectedIndexes[i] + ") is lower than 0. Set to 0.");
                        element.selectedIndexes[i] = 0;
                    } else if (element.selectedIndexes[i] >= element.options.length) {
                        warnings.push("elements[" + index + "] (multiselection) 'selectedIndexes[" + i + "]' (" + element.selectedIndexes[i] + ") is higher than or equal to 'options.length' (" + element.options.length + "). Set to " + (element.options.length - 1) + ".");
                        element.selectedIndexes[i] = element.options.length - 1;
                    }
                }

                // Удаляем дубликаты, сохраняя порядок первого вхождения
                var seen = Object.create(null);
                var unique = [];
                for (var j = 0; j < element.selectedIndexes.length; j++) {
                    var val = element.selectedIndexes[j];
                    if (!seen[val]) {
                        seen[val] = true;
                        unique.push(val);
                    }
                }
                if (unique.length !== element.selectedIndexes.length) {
                    warnings.push("elements[" + index + "] (multiselection) 'selectedIndexes' contained duplicate values. Deduplicated from " + element.selectedIndexes.length + " to " + unique.length + " item(s).");
                    element.selectedIndexes = unique;
                }
            }

            return element;
        }

        function resolveRef(globalSchema, refPath) {
            if (!refPath || typeof refPath !== "string") return null;
            var parts = refPath.split(".");
            var current = globalSchema;
            for (var i = 0; i < parts.length; i++) {
                if (current && current[parts[i]] !== undefined) {
                    current = current[parts[i]];
                } else return null;
            }
            return current;
        }

        function resolveDefault(defaultValue, parsedConfig) {
            if (typeof defaultValue === "string" && defaultValue.indexOf("drawing.") === 0) {
                var propName = defaultValue.split(".")[1];
                var drawing = parsedConfig.drawing || {};
                return (drawing[propName] !== undefined) ? drawing[propName] : null;
            }
            return defaultValue;
        }

        function validateSection(sectionName, userSection, schemaSection, parsedConfig, globalSchema) {
            userSection = userSection || {};
            var result = {};
            
            if (schemaSection && schemaSection.$ref) {
                schemaSection = resolveRef(globalSchema, schemaSection.$ref);
            }
            
            var properties = (schemaSection && schemaSection.properties) ? schemaSection.properties : schemaSection;
            
            for (var key in properties) {
                var rules = properties[key];
                if (rules && rules.$ref) {
                    var refRules = resolveRef(globalSchema, rules.$ref);
                    if (refRules) rules = refRules;
                }
                
                var userValue = userSection[key];

                if (rules.type === "object" && (rules.properties || rules.$ref)) {
                    if ((userValue === undefined || userValue === null) && rules.default === null) {
                        result[key] = null;
                    } else {
                        result[key] = validateSection(sectionName + "." + key, userValue, rules, parsedConfig, globalSchema);
                    }
                    continue;
                }

                var rawValue;
                if (userValue === undefined || userValue === null) {
                    if (rules.default === undefined) {
                        errors.push("Missing required parameter '" + key + "' in '" + sectionName + "'!");
                        rawValue = null;
                    } else {
                        rawValue = resolveDefault(rules.default, parsedConfig);
                    }
                } else {
                    if (rules.type && !checkType(userValue, rules.type)) {                        
                        errors.push("Parameter '" + key + "' in '" + sectionName + "' expected type '" + rules.type + "', but got '" + typeof userValue + "'");
                        rawValue = resolveDefault(rules.default, parsedConfig);
                    } else {
                        rawValue = userValue;
                    }
                }

                // Прогоняем значение через функцию нормализации
                result[key] = normalizeValue(rawValue, rules.type);
            }

            for (var userKey in userSection) {
                if (!properties[userKey]) {
                    warnings.push("Unknown parameter '" + userKey + "' in '" + sectionName + "'");
                }
            }
            return result;
        }

        function validateElements(userElements, globalSchema, parsedConfig) {
            if (!userElements || !Array.isArray(userElements)) return [];
            var validatedList = [];
            var elementsSchema = globalSchema.elements.properties;
            
            for (var i = 0; i < userElements.length; i++) {
                var item = userElements[i];
                var itemType = item.type;
                if (!itemType || !elementsSchema[itemType]) {
                    errors.push("Element at index " + i + " has missing or unknown type '" + itemType + "'");
                    continue;
                }
                
                var validItem = validateSection(
                    "elements[" + i + "] (" + itemType + ")", 
                    item, 
                    elementsSchema[itemType], 
                    parsedConfig, 
                    globalSchema
                );

                // Корректируем логику границ
                validItem = sanitizeElementLogic(validItem, i);

                validatedList.push(validItem);
            }
            return validatedList;
        }

        let config = {};
        // Сначала валидируем drawing, чтобы заполнить стандартные значения
        config.drawing = validateSection("drawing", userConfig.drawing, SimpleMenu._SCHEMA.drawing, config, SimpleMenu._SCHEMA);
        config.menu = validateSection("menu", userConfig.menu, SimpleMenu._SCHEMA.menu, config, SimpleMenu._SCHEMA);
        config.elements = validateElements(userConfig.elements, SimpleMenu._SCHEMA, config);

        // Проверка наличия положительной кнопки при транзакционной модели поведения меню
        if (!config.menu.isReactivePattern && typeof config.menu.positiveButton !== "object") {
            errors.push("Positive menu button is not set in menu object. This element is required for the transactional menu behavior model (the 'isReactivePattern' parameter is set to false).");
        }

        reportValidation(errors, warnings);

        var draft_config;
        if(!config.menu.isReactivePattern){
            draft_config = SimpleMenu.deepClone(config);
        }

        // CREATE
        let AlertDialog = android.app.AlertDialog;
        let CheckBox = android.widget.CheckBox;
        let DialogInterface = android.content.DialogInterface;
        let EditText = android.widget.EditText;
        let GradientDrawable = android.graphics.drawable.GradientDrawable;
        let Gravity = android.view.Gravity;
        let Html = android.text.Html;
        let LayoutParams = android.view.ViewGroup.LayoutParams;
        let LinearLayout = android.widget.LinearLayout;
        let OnCheckedChangeListener = android.widget.CompoundButton.OnCheckedChangeListener;
        let OnClickListener = android.view.View.OnClickListener;
        let RelativeLayout = android.widget.RelativeLayout;
        let Runnable = java.lang.Runnable;
        let ScrollView = android.widget.ScrollView;
        let SeekBar = android.widget.SeekBar;
        let Switch = android.widget.Switch;
        let TextView = android.widget.TextView;
        let TextWatcher = android.text.TextWatcher;
        let Typeface = android.graphics.Typeface;
        let TypedValue = android.util.TypedValue;
        let TextUtils = android.text.TextUtils;
        let FrameLayout = android.widget.FrameLayout;

        // Функция предотвращения ошибок
        function preventSomeErrors(view) {
            if (view.getParent() != null) {
                view.getParent().removeView(view);
            };
        };

        function getStyledOptions(options, textSize, textColor) {
            if (!options) return [];
            let result = [];
            
            // Переводим SP в пиксели для AbsoluteSizeSpan
            let pxSize = null;
            pxSize = Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_SP,
                textSize,
                ctx.getResources().getDisplayMetrics()
            ));

            for (let i = 0; i < options.length; i++) {
                let text = String(options[i]);
                let spannable = new android.text.SpannableString(text);

                // Цвет текста
                if (textColor !== null) {
                    spannable.setSpan(
                        new android.text.style.ForegroundColorSpan(textColor), 0,
                        text.length,
                        android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                    );
                }

                // Размер текста
                if (pxSize !== null) {
                    spannable.setSpan(
                        new android.text.style.AbsoluteSizeSpan(pxSize),
                        0,
                        text.length,
                        android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                    );
                }

                result.push(spannable);
            }
            return result;
        }

        // Установление прокрутки
        // function applyMarquee(button) {
        //     button.setEllipsize(TextUtils.TruncateAt.MARQUEE);
        //     button.setMarqueeRepeatLimit(-1);
        //     button.setSingleLine(true);
        //     button.setSelected(true);
        // };

        // СЕПАРАТОР
        function setSeparator(element_config, content_container) {
            let textview = new TextView(ctx);
            textview.setPadding(dpToPx(2), 0, dpToPx(2), 0);
            if (element_config.lineColor.length === 1) {
                textview.setBackground(new android.graphics.drawable.ColorDrawable(element_config.lineColor[0]));
            } else {
                textview.setBackground(new GradientDrawable(element_config.lineGradientDirection, element_config.lineColor));
            }
            if (element_config.name !== null) {
                textview.setMinHeight(dpToPx(4));
                textview.setText("	" + element_config.name);
                textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.nameSize);
                if (element_config.nameColor !== null) textview.setTextColor(element_config.nameColor);
                textview.setGravity(Gravity.LEFT | Gravity.CENTER_VERTICAL);
                textview.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT));
            } else {
                textview.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, element_config.lineHeight, 1));

            };
            content_container.addView(textview);
        };

        // ИМЯ ЭЛЕМЕНТА
        function setName(element_config, name_container, element_container) {
            let textview = new TextView(ctx);
            textview.setText(element_config.name); // Установление текста
            textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.nameSize); // Установление размера текста
            if (element_config.nameColor !== null) textview.setTextColor(element_config.nameColor);
            textview.setLayoutParams(new LinearLayout.LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT
            )); // Установка параметра
            textview.setEllipsize(TextUtils.TruncateAt.END); // Установка отображения
            textview.setMaxLines(2); // Установка количества строк 
            textview.setGravity(Gravity.START | Gravity.CENTER_VERTICAL); // Установка расположения внутри родителя
            if (typeof element_config.hint === "object" && element_config.hint !== null) { //Добавление подсказки элементу
                /** @type {any} */
                if(element_config.hint.symbolColor !== null){
                    (textview).setText(Html.fromHtml(textview.getText().replace("\n", "<br>") + " <font color='" + SimpleMenu.convertColor(element_config.hint.symbolColor, "hex") + "'>" + element_config.hint.symbol + "</font>")); //не хватает element_config.hint.symbolSize
                } else {
                    (textview).setText(Html.fromHtml(textview.getText().replace("\n", "<br>") + element_config.hint.symbol)); //не хватает element_config.hint.symbolSize
                }
                textview.setOnClickListener(new OnClickListener({
                    onClick: function() {
                        let builder = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                        builder.setMessage(element_config.hint.text);
                        //builder.setMessageColor(element_config.hint.textColor)
                        //builder.setMessageSize(element_config.hint.textSize)
                        let hint_dialog = builder.create();
                        hint_dialog.setCancelable(true);
                        hint_dialog.setCanceledOnTouchOutside(true);
                        hint_dialog.show();
                    }
                }));
            }
            name_container.addView(textview); // Добавление текста в контейнер имени
            element_container.addView(name_container);
        }

        // КНОПКИ ДИАЛОГА
        function createAndShowDialog(element_config, builder, isMainMenu, index, positiveFunction) {
            if (typeof element_config.positiveButton === "object" && element_config.positiveButton !== null) {
                builder.setPositiveButton(element_config.positiveButton.text, new DialogInterface.OnClickListener({
                    onClick: function() {
                        positiveFunction && positiveFunction();
                        element_config.positiveButton.onClick(builder, index);
                    }
                }));
            }
            if (typeof element_config.negativeButton === "object" && element_config.negativeButton !== null) {
                builder.setNegativeButton(element_config.negativeButton.text, new DialogInterface.OnClickListener({
                    onClick: function() {
                        element_config.negativeButton.onClick(builder, index);
                    }
                }));
            }
            if (typeof element_config.neutralButton === "object" && element_config.neutralButton !== null) {
                builder.setNeutralButton(element_config.neutralButton.text, new DialogInterface.OnClickListener({
                    onClick: function() {
                        element_config.neutralButton.onClick(builder, index);
                    }
                }));
            }
            var dialog = builder.create();
            dialog.setCancelable(true);
            dialog.setCanceledOnTouchOutside(isMainMenu && config.menu.isReactivePattern); // меню (если реактивное) - да, диалог или тразакционное - нет
            if (typeof element_config.negativeButton === "object" && element_config.negativeButton !== null) { 
                dialog.setOnCancelListener(new DialogInterface.OnCancelListener({
                    onCancel: function(dialog) {
                        element_config.negativeButton.onClick(dialog, index);
                    }
                }));
            }
            dialog.show()
            //Установка анимации и запуск меню
            var decorView = dialog.getWindow().getDecorView();
            if (decorView instanceof android.view.ViewGroup) {
                decorView.getChildAt(0).startAnimation(
                    android.view.animation.AnimationUtils.loadAnimation(ctx, config.drawing.animation)
                );
            }
        }

        // КНОПКА
        function createButton(element_config, widget_container, element_container, content_container, index, onClickFunction) {
            const chevronWidth = dpToPx(20);
            // Текст кнопки
            let button_text = new TextView(ctx);
            button_text.setText(element_config.buttonText);
            if (element_config.buttonTextColor !== null) button_text.setTextColor(element_config.buttonTextColor);
            button_text.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.buttonTextSize);
            button_text.setMaxLines(2);
            button_text.setEllipsize(TextUtils.TruncateAt.END);
            button_text.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);
            button_text.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1));
            // Слот шеврона
            let chevron = new TextView(ctx);
            chevron.setText(">");
            chevron.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.buttonTextSize);
            if (element_config.buttonTextColor !== null) chevron.setTextColor(element_config.buttonTextColor);
            chevron.setGravity(Gravity.CENTER);
            chevron.setLayoutParams(new LinearLayout.LayoutParams(chevronWidth, LayoutParams.WRAP_CONTENT));
            widget_container.addView(button_text);
            widget_container.addView(chevron);
            widget_container.setClickable(true);
            widget_container.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    onClickFunction && onClickFunction(element_config, button, index);
                    if (element_config.onButtonClick !== null) element_config.onButtonClick(button, index);
                }
            }));
            element_container.addView(widget_container);
            content_container.addView(element_container);
        }

        // ЧЕКБОКС                               
        function createCheckBox(element_config, widget_container, element_container, content_container, index) {
            let checkbox = new CheckBox(ctx);
            checkbox.setChecked(element_config.state);
            checkbox.setLayoutParams(params.selectable_element);
            if (element_config.onCheck != null) {
                checkbox.setOnCheckedChangeListener(new OnCheckedChangeListener({
                    onCheckedChanged: function(checkbox, isChecked) {
                        if(config.menu.isReactivePattern) {
                            element_config.state = isChecked;
                        } else {
                            draft_config.elements[index].state = isChecked;
                        }
                        element_config.onCheck(checkbox, isChecked, index);
                    }
                }));
            }
            widget_container.addView(checkbox);
            element_container.addView(widget_container);
            content_container.addView(element_container);
        }

        // ПЕРЕКЛЮЧАТЕЛЬ
        function createSwitch(element_config, widget_container, element_container, content_container, index) {
            let switcher = new Switch(ctx);
            switcher.setChecked(element_config.state);
            switcher.setLayoutParams(params.selectable_element);
            if (element_config.onSwitch !== null) {
                switcher.setOnCheckedChangeListener(new OnCheckedChangeListener({
                    onCheckedChanged: function(switcher, isChecked) {
                        if(config.menu.isReactivePattern) {
                            element_config.state = isChecked;
                        } else {
                            draft_config.elements[index].state = isChecked;
                        }
                        element_config.onSwitch(switcher, isChecked, index);
                    }
                }));
            }
            widget_container.addView(switcher);
            element_container.addView(widget_container);
            content_container.addView(element_container);
        }

        // СЕЛЕКТОР
        function createSelection(element_config, widget_container, element_container, content_container, index) {
            if (element_config.buttonText === null) {
                element_config.buttonText = element_config.options[element_config.selectedIndex];
            }

            let openSpinner = function(element_config, button, elementIndex) {
                let themedCtx = new android.view.ContextThemeWrapper(ctx, config.drawing.menuStyle);
                let listPopup = new android.widget.ListPopupWindow(themedCtx);

                // Формируем стилизованные элементы списка без JavaAdapter
                let styledOptions = getStyledOptions(
                    element_config.options,
                    element_config.buttonTextSize,
                    element_config.buttonTextColor
                );

                let adapter = new android.widget.ArrayAdapter(
                    themedCtx,
                    android.R.layout.simple_list_item_1,
                    styledOptions
                );

                listPopup.setAdapter(adapter);
                listPopup.setAnchorView(button);
                listPopup.setModal(true);

                // Ограничение высоты + нативный скролл
                let maxHeight = Math.floor(ctx.getResources().getDisplayMetrics().heightPixels * 0.40);
                let estimatedHeight = (element_config.options ? element_config.options.length : 0) * dpToPx(48);
                if (estimatedHeight > maxHeight) listPopup.setHeight(maxHeight);

                listPopup.setOnItemClickListener(new android.widget.AdapterView.OnItemClickListener({
                    onItemClick: function(list, item, position, itemIndex) {
                        if (element_config.onSelect !== null) {
                            element_config.onSelect(list, item, position, itemIndex, elementIndex);
                        }
                        listPopup.dismiss();
                    }
                }));

                listPopup.show();
            };

            createButton(element_config, widget_container, element_container, content_container, index, openSpinner);
        }

        // МУЛЬТИСЕЛЕКТОР
        function createMultiSelection(element_config, widget_container, element_container, content_container, index) {
            if (element_config.buttonText === null) {
                element_config.buttonText = element_config.selectedIndexes
                    .map(function (i) { return element_config.options[i]; })
                    .join(", ");
            }

            let openMultiSpinner = function(element_config, button, elementIndex) {
                let themedCtx = new android.view.ContextThemeWrapper(ctx, config.drawing.menuStyle);
                let listPopup = new android.widget.ListPopupWindow(themedCtx);

                // Стилизованные элементы списка с чекбоксами
                let styledOptions = getStyledOptions(
                    element_config.options,
                    element_config.buttonTextSize,
                    element_config.buttonTextColor
                );

                let adapter = new android.widget.ArrayAdapter(
                    themedCtx,
                    android.R.layout.simple_list_item_multiple_choice,
                    styledOptions
                );

                listPopup.setAdapter(adapter);
                listPopup.setAnchorView(button);
                listPopup.setModal(true);

                let maxHeight = Math.floor(ctx.getResources().getDisplayMetrics().heightPixels * 0.40);
                let estimatedHeight = (element_config.options ? element_config.options.length : 0) * dpToPx(48);
                if (estimatedHeight > maxHeight) listPopup.setHeight(maxHeight);

                listPopup.show();

                let listView = listPopup.getListView();
                if (listView !== null) {
                    listView.setChoiceMode(android.widget.ListView.CHOICE_MODE_MULTIPLE);
                    
                    if (Array.isArray(element_config.selectedIndexes)) {
                        for (let i = 0; i < element_config.selectedIndexes.length; i++) {
                            listView.setItemChecked(element_config.selectedIndexes[i], true);
                        }
                    }

                    listView.setOnItemClickListener(new android.widget.AdapterView.OnItemClickListener({
                        onItemClick: function(list, item, position, itemIndex) {
                            let isChecked = listView.isItemChecked(position);
                            if (element_config.onItemSelect !== null) {
                                element_config.onItemSelect(list, item, position, isChecked, itemIndex, elementIndex);
                            }
                        }
                    }));
                }

                // Колбэк закрытия
                let dismissCallback = element_config.afterSelect || element_config.onDismissSpinner;
                if (dismissCallback) {
                    listPopup.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                        onDismiss: function() {
                            if (element_config.onDismissSpinner !== null){
                                element_config.onDismissSpinner(elementIndex);
                            }
                        }
                    }));
                }
            };

            createButton(element_config, widget_container, element_container, content_container, index, openMultiSpinner);
        }

        // ПОЛЗУНОК
        function createSeekBar(element_config, widget_container, element_container, content_container, index){
            if (element_config.buttonText === null){
                element_config.buttonText = element_config.seekBarDialog.prefixText + element_config.seekBarDialog.current + element_config.seekBarDialog.suffixText
            }
            let openSeekBarDialog = function(element_config, button, elementIndex){
                let seekbar = new SeekBar(ctx);
                let layout = new LinearLayout(ctx);
                let textview = new TextView(ctx);
                layout.setOrientation(LinearLayout.VERTICAL);
                layout.setLayoutParams(params.dialog_layout);
                textview.setText(element_config.seekBarDialog.prefixText + element_config.seekBarDialog.current + element_config.seekBarDialog.suffixText);
                element_config.seekBarDialog.textColor !== null && textview.setTextColor(element_config.seekBarDialog.textColor);
                textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.seekBarDialog.textSize);
                textview.setTypeface(null, Typeface.BOLD);
                textview.setGravity(Gravity.LEFT);
                textview.setPadding(dpToPx(12), dpToPx(7), dpToPx(7), dpToPx(7));
                textview.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT));
                seekbar.setProgress(element_config.seekBarDialog.current);
                seekbar.setMin(element_config.seekBarDialog.min);
                seekbar.setMax(element_config.seekBarDialog.max);

                seekbar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener({
                    onProgressChanged: function(sb, progress, fromUser) {
                        textview.setText(element_config.seekBarDialog.prefixText + sb.getProgress() + element_config.seekBarDialog.suffixText);
                        if (element_config.onProgressChange !== null) {
                            element_config.onProgressChange(sb, progress, fromUser, elementIndex);
                        }
                    },
                onStartTrackingTouch: function(sb) {
                    textview.setText(element_config.seekBarDialog.prefixText + sb.getProgress() + element_config.seekBarDialog.suffixText);
                        if (element_config.onStartTrackingTouch !== null) {
                            element_config.onStartTrackingTouch(sb, sb.getProgress(), elementIndex);
                        }
                    },
                onStopTrackingTouch: function(sb) {
                    textview.setText(element_config.seekBarDialog.prefixText + sb.getProgress() + element_config.seekBarDialog.suffixText);
                        if (element_config.onStopTrackingTouch !== null) {
                            element_config.onStopTrackingTouch(sb, sb.getProgress(), elementIndex);
                        }
                     }
                }));

                preventSomeErrors(textview);
                preventSomeErrors(seekbar);
                preventSomeErrors(layout);

                layout.addView(textview);
                layout.addView(seekbar);
                let dialog = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                dialog.setView(layout);
                function updateCurrent() {
                    // config.seekBarDialog.current = seekbar.getProgress();
                    // button.setText(config.seekBarDialog.prefixText + seekbar.getProgress() + config.seekBarDialog.suffixText);
                }
                createAndShowDialog(element_config.seekBarDialog, dialog, false, elementIndex, updateCurrent);
            }

            createButton(element_config, widget_container, element_container, content_container, index, openSeekBarDialog);
        }

        // РЕДАКТИРУЕМЫЙ ТЕКСТ
        function createEditText(element_config, widget_container, element_container, content_container, index) {
            if (element_config.buttonText === null){
                element_config.buttonText = element_config.editTextDialog.text;
            }
            let openEditTextDialog = function(element_config, button, elementIndex){
                let edittext = new EditText(ctx);
                let layout = new LinearLayout(ctx);
                layout.setOrientation(LinearLayout.VERTICAL);
                layout.setLayoutParams(params.dialog_layout);
                edittext.setHint(element_config.editTextDialog.placeholder);
                // edittext.setHintTextColor(...)(element_config.editTextDialog.textColor); нужно адаптировать функция converColor для альфа канало (для config.editTextDialog.placeholderOpacity)
                // edittext.setHintSize(element_config.editTextDialog.textSize);
                edittext.setText(element_config.editTextDialog.text);
                edittext.setTextSize(element_config.editTextDialog.textSize);
                if (element_config.editTextDialog.textColor !== null) edittext.setTextColor(element_config.editTextDialog.textColor);
                edittext.setMaxLines(element_config.editTextDialog.linesCount);

                edittext.addTextChangedListener(new TextWatcher({
                    beforeTextChanged: function(oldText, startPos, beforeCount, afterCount) {
                        if (element_config.beforeTextChange !== null){
                            element_config.beforeTextChange(String(oldText), startPos, beforeCount, afterCount, elementIndex);
                        }
                    },
                    onTextChanged: function(newText, startPos, beforeCount, afterCount) {
                        if (element_config.onTextChange !== null){
                            element_config.onTextChange(String(newText), startPos, beforeCount, afterCount, elementIndex);
                        }
                    },
                    afterTextChanged: function(finalText) {
                        if (element_config.afterTextChange !== null){
                            element_config.afterTextChange(String(finalText), elementIndex);
                        }
                    }
                }));

                preventSomeErrors(edittext);
                preventSomeErrors(layout);
                layout.addView(edittext);
                let dialog = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                dialog.setView(layout);
                function updateCurrent() {
                    // element_config.editTextDialog.text = edittext.getText();
                    // button.setText(edittext.getText());
                }
                createAndShowDialog(element_config.editTextDialog, dialog, false, elementIndex, updateCurrent);
            }

            createButton(element_config, widget_container, element_container, content_container, index, openEditTextDialog);
        };

        // Параметры элементов
        const params = {
            selectable_element: new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT),
            dialog_layout: new LinearLayout.LayoutParams(LinearLayout.LayoutParams.FILL_PARENT, LinearLayout.LayoutParams.FILL_PARENT),
            element: new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        };

        return {
            show: function() {
                ctx.runOnUiThread(
                    new Runnable({
                        run: function() {
                            try {
                                // Корень меню
                                let menu_container = new RelativeLayout(ctx);
                                menu_container.setLayoutParams(new RelativeLayout.LayoutParams(
                                    LayoutParams.MATCH_PARENT,
                                    LayoutParams.MATCH_PARENT
                                ));

                                // Скролл
                                let scrollable_container = new ScrollView(ctx);
                                scrollable_container.setLayoutParams(new RelativeLayout.LayoutParams(
                                    LayoutParams.MATCH_PARENT,
                                    LayoutParams.MATCH_PARENT
                                ));

                                // Внутренний вертикальный контейнер
                                let content_container = new LinearLayout(ctx);
                                content_container.setLayoutParams(new FrameLayout.LayoutParams(
                                    LayoutParams.MATCH_PARENT,
                                    LayoutParams.WRAP_CONTENT
                                ));
                                content_container.setOrientation(LinearLayout.VERTICAL);
                                content_container.setGravity(Gravity.CENTER);
                                content_container.setPadding(dpToPx(6), 0, dpToPx(6), 0);

                                scrollable_container.addView(content_container);
                                menu_container.addView(scrollable_container);

                                // Создание элементов
                                for (let index = 0; index < config.elements.length; index++){
                                    let element_config = config.elements[index];

                                    // Контейнер элемента
                                    let element_container = new LinearLayout(ctx);
                                    element_container.setLayoutParams(new LinearLayout.LayoutParams(
                                        LayoutParams.MATCH_PARENT,
                                        LayoutParams.WRAP_CONTENT
                                    ));
                                    element_container.setGravity(Gravity.CENTER_VERTICAL);
                                    element_container.setOrientation(LinearLayout.HORIZONTAL);
                                    element_container.setMinimumHeight(dpToPx(48));
                                    element_container.setPadding(dpToPx(6), 0, dpToPx(6), 0);

                                    // Контейнер имени элемента
                                    let name_container = new LinearLayout(ctx);
                                    name_container.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, 2));
                                    name_container.setGravity(Gravity.CENTER_VERTICAL);

                                    // Контейнер интерактивного элемента
                                    let widget_container = new LinearLayout(ctx);
                                    widget_container.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, 1));
                                    widget_container.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);

                                    switch (element_config.type) {
                                        case "separator":
                                            setSeparator(element_config, content_container);
                                            break;
                                        case "button":
                                            setName(element_config, name_container, element_container);
                                            createButton(element_config, widget_container, element_container, content_container, index);
                                            break;
                                        case "checkbox":
                                            setName(element_config, name_container, element_container);
                                            createCheckBox(element_config, widget_container, element_container, content_container, index);
                                            break;
                                        case "switch":
                                            setName(element_config, name_container, element_container);
                                            createSwitch(element_config, widget_container, element_container, content_container, index);
                                            break;
                                        case "selection":
                                            setName(element_config, name_container, element_container);
                                            createSelection(element_config, widget_container, element_container, content_container, index);
                                            break;
                                        case "multiselection":
                                            setName(element_config, name_container, element_container);
                                            createMultiSelection(element_config, widget_container, element_container, content_container, index);
                                            break;
                                        case "seekbar":
                                            setName(element_config, name_container, element_container);
                                            createSeekBar(element_config, widget_container, element_container, content_container, index)
                                            break;
                                        case "edittext":
                                            setName(element_config, name_container, element_container);
                                            createEditText(element_config, widget_container, element_container, content_container, index);
                                            break;
                                        default:
                                            Logger.Log("[SimpleMenuAPI] show(): Unknown element '" + element_config.type + "'. Expected one of: " + Object.keys(SimpleMenu._SCHEMA.elements.properties).join(", "), "WARNING");
                                    };
                                };
                                
                                let builder = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                                builder.setTitle(config.menu.title);
                                // dialog.setTitleSize(config.menu.titleSize); //пока неизвестно нужно ли это
                                // config.menu.titleColor !== dialog.setTitleColor(config.menu.titleColor);
                                builder.setView(menu_container);
                                // Установление способов закрытия меню
                                let applyChanges = function(){
                                    if (!config.menu.isReactivePattern) config = SimpleMenu.deepClone(draft_config);
                                }
                                createAndShowDialog(config.menu, builder, true, -1, applyChanges);

                            } catch(err) {
                                Logger.Log("\n[SimpleMenuAPI] show(): Unknown error!\n" + err, "ERROR");
                                throw new Error("\n[SimpleMenuAPI] show(): Unknown error!\n" + err);
                            };
                        }
                    })
                );
            },
            getContent: function() {
                return config;
            },
            setContent: function(newConfig) {
                try {
                    let errors = [];
                    let warnings = [];
                    let config = {};
                    // Сначала валидируем drawing, чтобы заполнить стандартные значения
                    config.drawing = validateSection("drawing", newConfig.drawing, SimpleMenu._SCHEMA.drawing, config, SimpleMenu._SCHEMA);
                    config.menu = validateSection("menu", newConfig.menu, SimpleMenu._SCHEMA.menu, config, SimpleMenu._SCHEMA);
                    config.elements = validateElements(newConfig.elements, SimpleMenu._SCHEMA, config);
                    // Проверка наличия положительной кнопки при транзакционной модели поведения меню
                    if (!config.menu.isReactivePattern && typeof config.menu.positiveButton !== "object") {
                        errors.push("Positive menu button is not set in menu object. This element is required for the transactional menu behavior model (the 'isReactivePattern' parameter is set to false).");
                    }
                    reportValidation(errors, warnings);
                    if(!config.menu.isReactivePattern){
                        draft_config = SimpleMenu.deepClone(config);
                    }
                } catch(err) {
                    Logger.Log("\n[SimpleMenuAPI] setContent(): Unknown error!\n" + err, "ERROR");
                    throw new Error("\n[SimpleMenuAPI] setContent(): Unknown error!\n" + err);
                }
            },
            refresh: function() {
                try {
                    
                } catch(err) {
                    Logger.Log("\n[SimpleMenuAPI] refresh(): Unknown error!\n" + err, "ERROR");
                    throw new Error("\n[SimpleMenuAPI] refresh(): Unknown error!\n" + err);
                }
            },
            hide: function() {
                try {
                    
                } catch(err) {
                    Logger.Log("\n[SimpleMenuAPI] hide(): Unknown error!\n" + err, "ERROR");
                    throw new Error("\n[SimpleMenuAPI] hide(): Unknown error!\n" + err);
                }
            },
            isVisible: function() {
                try {
                    
                } catch(err) {
                    Logger.Log("\n[SimpleMenuAPI] isVisible(): Unknown error!\n" + err, "ERROR");
                    throw new Error("\n[SimpleMenuAPI] isVisible(): Unknown error!\n" + err);
                }
            }
        };
    }
}

EXPORT("SimpleMenu", SimpleMenu);