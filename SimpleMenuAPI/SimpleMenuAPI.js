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

let _cachedLang = null;
let _cachedText = null;

function getSystemDefaultText() {
    const systemRes = android.content.res.Resources.getSystem();
    const config = systemRes.getConfiguration();
    const currentLocale = (config.locales && config.locales.size() > 0)
        ? config.locales.get(0)
        : (config.locale || java.util.Locale.getDefault());
    const currentLang = currentLocale.getLanguage();
    if (_cachedLang === currentLang && _cachedText !== null) return _cachedText;
    const candidateKeys = [
        "restore_default",
        "reset_to_default",
        "restore_defaults",
        "reset_default",
        "reset",
        "revert",
        "clear"
    ];
    let enRes = null;
    if (currentLang !== "en") {
        try {
            const enConfig = new android.content.res.Configuration(config);
            enConfig.setLocale(java.util.Locale.ENGLISH);
            const enContext = context.createConfigurationContext(enConfig);
            enRes = enContext.getResources();
        } catch (e) {}
    }
    let englishFallback = null;
    let result = null;
    for (const key of candidateKeys) {
        const id = systemRes.getIdentifier(key, "string", "android");
        if (id === 0) continue;
        try {
            const strCurrent = systemRes.getString(id);
            if (!strCurrent || !strCurrent.trim()) continue;
            if (currentLang === "en") {
                result = strCurrent;
                break;
            }
            const strEn = enRes ? enRes.getString(id) : strCurrent;
            if (strCurrent !== strEn) {
                result = strCurrent;
                break;
            }
            if (!englishFallback) englishFallback = strCurrent;
        } catch (e) {}
    }
    if (result === null) result = englishFallback || "By default";
    _cachedLang = currentLang;
    _cachedText = result;
    return result;
}

let SimpleMenu = {
    getColorType: function(color) {
        // Android color int (может быть отрицательным из-за альфы)
        if (typeof color === "number" && !isNaN(color)) {
            return "name";
        }
        // HEX: #RGB или #RRGGBB
        if (typeof color === "string" && /^#([0-9A-F]{3,4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(color)) {
            return "hex";
        }
        // RGB: массив из 3 чисел 0–255
        if (Object.prototype.toString.call(color) === "[object Array]" &&
            color.length === 3 &&
            typeof color[0] === "number" && color[0] >= 0 && color[0] <= 255 &&
            typeof color[1] === "number" && color[1] >= 0 && color[1] <= 255 &&
            typeof color[2] === "number" && color[2] >= 0 && color[2] <= 255) {
            return "rgb";
        }
        return null;
    },

    isColor: function(color) {
        return !!this.getColorType(color);
    },

    ConvertColor: function(color, finalType) {
        var colorType = this.getColorType(color);
        if (colorType === null) {
            Logger.Log("[SimpleMenuAPI] ConvertColor(): invalid color value", "ERROR");
        }
        if (typeof finalType === "undefined") {
            Logger.Log('[SimpleMenuAPI] ConvertColor(): missing required parameter "finalType". Allowed values: "rgb", "hex", "name"', "ERROR");
        }
        if (["rgb", "hex", "name"].indexOf(finalType) === -1) {
            Logger.Log('[SimpleMenuAPI] ConvertColor(): invalid finalType "' + finalType + '". Allowed values: "rgb", "hex", "name"', "ERROR");
        }
        // Тот же формат — возвращаем как есть
        if (colorType === finalType) {
            return color;
        }
        // Конвертация
        switch (colorType) {
            case "name":
                if (finalType === "rgb") {
                    return [
                        android.graphics.Color.red(color),
                        android.graphics.Color.green(color),
                        android.graphics.Color.blue(color)
                    ];
                }
                if (finalType === "hex") {
                    return java.lang.String.format("#%02x%02x%02x",
                        android.graphics.Color.red(color),
                        android.graphics.Color.green(color),
                        android.graphics.Color.blue(color)
                    );
                }
                break;
            case "rgb":
                if (finalType === "name") {
                    return android.graphics.Color.rgb(color[0], color[1], color[2]);
                }
                if (finalType === "hex") {
                    return java.lang.String.format("#%02x%02x%02x", color[0], color[1], color[2]);
                }
                break;
            case "hex":
                var parsed = android.graphics.Color.parseColor(color);
                if (finalType === "name") {
                    return android.graphics.Color.rgb(
                        android.graphics.Color.red(parsed),
                        android.graphics.Color.green(parsed),
                        android.graphics.Color.blue(parsed)
                    );
                }
                if (finalType === "rgb") {
                    return [
                        android.graphics.Color.red(parsed),
                        android.graphics.Color.green(parsed),
                        android.graphics.Color.blue(parsed)
                    ];
                }
                break;
        }
    },

    SCHEMA: {
        // ------------------------------------------------------------------------
        // ГЛОБАЛЬНЫЕ НАСТРОЙКИ
        // ------------------------------------------------------------------------
        menu: {
            title:             { type: "string" },
            // titleSize:      { type: "number or string",  default: 20 },
            // titleColor:     { type: "color",   default: "drawing.nameColor" },
            isReactivePattern: { type: "boolean", default: true },
            positiveButton:    { $ref: "SUB_SCHEMAS.positiveButton", default: null },
            negativeButton:    { $ref: "SUB_SCHEMAS.negativeButton", default: null },
            neutralButton:     { $ref: "SUB_SCHEMAS.neutralButton", default: null }
        },

        drawing: {
            menuStyle:                  { type: "number", default: android.R.style.Theme_Material_Dialog_Alert },
            animation:                  { type: "number", default: android.R.anim.slide_out_right },
            nameSize:                   { type: "number or string", default: 16 },
            nameColor:                  { type: "color",  default: null},
            buttonTextSize:             { type: "number or string", default: 16 },
            buttonTextColor:            { type: "color",  default: null},
            separatorColor:             { type: "color[]",  default: [android.graphics.Color.GRAY] },
            separatorHeight:            { type: "number or string", default: 3 },
            separatorGradientDirection: { type: "number", default: android.graphics.drawable.GradientDrawable.Orientation.LEFT_RIGHT }
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
                    textSize:       { type: "number or string",  default: "drawing.nameSize" },
                    symbol:         { type: "string",  default: "ⓘ" },
                    symbolColor:    { type: "color",   default: "drawing.nameColor" },
                    symbolSize:     { type: "number or string",  default: "drawing.nameSize" },
                }
            },
            positiveButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string", default: android.R.string.ok},
                    onClick: { type: "function" }
                }
            },
            negativeButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string", default: android.R.string.cancel },
                    onClick: { type: "function" }
                }
            },
            neutralButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string", default: getSystemDefaultText()},
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
                    buttonTextSize:  { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor: { type: "color",    default: "drawing.buttonTextColor" },
                    // useMarquee:      { type: "boolean",  default: true },
                    onButtonClick:   { type: "function", default: null },
                    nameSize:        { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:       { type: "color",    default: "drawing.nameColor" },
                    hint:            { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                switch: {
                    type:              { type: "string" },
                    name:              { type: "string" },
                    onSwitch:          { type: "function", default: null },
                    nameSize:          { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:         { type: "color",    default: "drawing.nameColor" },
                    state:             { type: "boolean",  default: false },
                    // useMarquee:        { type: "boolean",  default: true },
                    hint:              { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                checkbox: {
                    type:              { type: "string" },
                    name:              { type: "string" },
                    onCheck:           { type: "function", default: null },
                    nameSize:          { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:         { type: "color",    default: "drawing.nameColor" },
                    state:             { type: "boolean",  default: false },
                    // useMarquee:        { type: "boolean",  default: true },
                    hint:              { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                selection: {
                    type:                     { type: "string" },
                    name:                     { type: "string" },
                    nameSize:                 { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:                { type: "color",    default: "drawing.nameColor" },
                    buttonText:               { type: "string",  default: null },
                    buttonTextSize:           { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:          { type: "color",    default: "drawing.buttonTextColor" },
                    data:                     { type: "string[]" },
                    current:                  { type: "number or string",   default: 0 },
                    useMarquee:               { type: "boolean",  default: true },
                    onButtonClick:            { type: "function", default: null },
                    onSelect:                 { type: "function", default: null },
                    hint:                     { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                multiselection: {
                    type:            { type: "string" },
                    name:            { type: "string" },
                    nameSize:        { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:       { type: "color",    default: "drawing.nameColor" },
                    buttonText:      { type: "string", default: null },
                    buttonTextSize:  { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor: { type: "color",    default: "drawing.buttonTextColor" },
                    // useMarquee:      { type: "boolean",  default: true },
                    selectionDialog: {
                        type: "object",
                        properties: {
                            title:          { type: "string", default: "elements.multiselection.name" },
                            data:           { type: "string[]" },
                            current:        { type: "number[]", default: [] },
                            positiveButton: { $ref: "SUB_SCHEMAS.positiveButton" },
                            neutralButton:  { $ref: "SUB_SCHEMAS.neutralButton", default: null },
                            negativeButton: { $ref: "SUB_SCHEMAS.negativeButton" }
                        }
                    },
                    onButtonClick:   { type: "function", default: null },
                    beforeSelect:    { type: "function", default: null },
                    onSelect:        { type: "function", default: null },
                    afterSelect:     { type: "function", default: null },
                    hint:            { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                edittext: {
                    type:                    { type: "string" },
                    name:                    { type: "string" },
                    nameSize:                { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:               { type: "color",    default: "drawing.nameColor" },
                    buttonText:              { type: "string", default: null },
                    buttonTextSize:          { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:         { type: "color",    default: "drawing.buttonTextColor" },
                    // useMarquee:              { type: "boolean",  default: true },
                    editTextDialog: {
                        type: "object",
                        properties: {
                            title:              { type: "string", default: "elements.edittext.name" },
                            text:               { type: "string", default: "" }, 
                            textSize:           { type: "number or string", default: "drawing.nameSize" }, 
                            textColor:          { type: "color", default: "drawing.nameColor" },
                            placeholder:        { type: "string", default: "" },
                            placeholderOpacity: { type: "number", default: 0.5 },
                            linesCount:         { type: "number or string", default: 1 }, 
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
                    nameSize:                    { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:                   { type: "color",    default: "drawing.nameColor" },
                    buttonText:                  { type: "string", default: null },
                    buttonTextSize:              { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:             { type: "color",    default: "drawing.buttonTextColor" },
                    // useMarquee:                  { type: "boolean",  default: true },
                    seekBarDialog: {
                        type: "object",
                        properties: {
                            min:            { type: "number or string" },
                            max:            { type: "number or string" },
                            step:           { type: "number or string", default: 1 },
                            current:        { type: "number or string", default: 0 },
                            title:          { type: "string", default: "elements.seekbar.name" },
                            prefixText:     { type: "string", default: "" },
                            suffixText:     { type: "string", default: "" },
                            textSize:       { type: "number or string", default: "drawing.nameSize" },
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
                    nameSize:              { type: "number or string", default: "drawing.nameSize" },
                    nameColor:             { type: "color",  default: "drawing.nameColor" },
                    lineGradientDirection: { type: "number", default: "drawing.separatorGradientDirection" },
                    lineColor:             { type: "color[]",  default: "drawing.separatorColor" },
                    lineHeight:            { type: "number or string", default: "drawing.separatorHeight" }
                }
            }
        }
    },

    Create: function(userConfig) {
        userConfig = userConfig || {};

        //Перевод dp в px
        function dpToPx(dp) {
            let dm = ctx.getResources().getDisplayMetrics();
            return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, dm);
        };
        
        // ВАЛИДАЦИЯ
        // Проверка типов
        let errors = [];
        let warnings = [];

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

        function checkType(value, expectedType) {
            if (expectedType === "array") return Array.isArray(value);
            if (expectedType === "color") return SimpleMenu.isColor(value);
            if (expectedType === "function") return typeof value === "function";
            if (expectedType === "number or string") {
                if (typeof value === "number") return Number.isFinite(value);
                if (typeof value === "string") {
                    var t = value.trim();
                    return t !== "" && Number.isFinite(Number(t));
                }
                return false;
            }
            if (expectedType === "color[]") return SimpleMenu.isColor(value) || (Array.isArray(value) && value.every(SimpleMenu.isColor));
            if (expectedType === "string[]") return Array.isArray(value) && value.every(function(item) { return typeof item === "string"; });
            if (expectedType === "number[]") return Array.isArray(value) && value.every(function(item) { return typeof item === "number" && Number.isFinite(item); });
            return typeof value === expectedType;
        }

        // Преобразование и нормализация значений по типу
        function normalizeValue(value, expectedType) {
            if (value === null || value === undefined) return value;
            // Приведение строки/числа к чистому Number
            if (expectedType === "number or string") {
                return Number(value);
            }
            // Нормализация одиночного цвета
            if (expectedType === "color") {
                return SimpleMenu.ConvertColor(value, "name");
            }
            // Одиночный цвет превращаем в массив [color] и конвертируем все цвета в массиве
            if (expectedType === "color[]") {
                var rawArray = Array.isArray(value) ? value : [value];
                var normalizedColors = [];
                for (var i = 0; i < rawArray.length; i++) {
                    normalizedColors.push(SimpleMenu.ConvertColor(rawArray[i], "name"));
                }
                return normalizedColors;
            }

            return value;
        }

        // Логическая валидация элементов (seekbar и др.)
        function sanitizeElementLogic(element, index) {
            if (!element) return element;
            if (element.type === "seekbar") {
                var min = element.min;
                var max = element.max;
                var current = element.current;
                // Если min больше max — меняем их местами
                if (min > max) {
                    warnings.push("[SimpleMenuAPI] Create(): elements[" + index + "] (seekbar) 'min' (" + min + ") > 'max' (" + max + "). Swapping values.");
                    element.min = max;
                    element.max = min;
                    min = element.min;
                    max = element.max;
                }
                // Подгоняем current под границы [min, max]
                if (current < min) {
                    warnings.push("[SimpleMenuAPI] Create(): elements[" + index + "] (seekbar) 'current' (" + current + ") is lower than 'min' (" + min + "). Set to min.");
                    element.current = min;
                } else if (current > max) {
                    warnings.push("[SimpleMenuAPI] Create(): elements[" + index + "] (seekbar) 'current' (" + current + ") is higher than 'max' (" + max + "). Set to max.");
                    element.current = max;
                }
            }
            // Преобразование dp в px
            if(element.type === "separator"){
                element.lineHeight = dpToPx(element.lineHeight);
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
                        errors.push("[SimpleMenuAPI] Create(): Missing required parameter '" + key + "' in '" + sectionName + "'!");
                        rawValue = null;
                    } else {
                        rawValue = resolveDefault(rules.default, parsedConfig);
                    }
                } else {
                    if (rules.type && !checkType(userValue, rules.type)) {                        errors.push("[SimpleMenuAPI] Create(): Parameter '" + key + "' in '" + sectionName + "' expected type '" + rules.type + "', but got '" + typeof userValue + "'");
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
                    warnings.push("[SimpleMenuAPI] Create(): Unknown parameter '" + userKey + "' in '" + sectionName + "'");
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
                    errors.push("[SimpleMenuAPI] Create(): Element at index " + i + " has missing or unknown type '" + itemType + "'");
                    continue;
                }
                
                var validItem = validateSection(
                    "elements[" + i + "] (" + itemType + ")", 
                    item, 
                    elementsSchema[itemType], 
                    parsedConfig, 
                    globalSchema
                );

                // Корректируем логику границ (min/max/current)
                validItem = sanitizeElementLogic(validItem, i);

                validatedList.push(validItem);
            }
            return validatedList;
        }

        let config = {};
        // Сначала валидируем drawing, чтобы заполнить стандартные значения
        config.drawing = validateSection("drawing", userConfig.drawing, this.SCHEMA.drawing, config, this.SCHEMA);
        // Теперь валидируем остальное. Они смогут безопасно ссылаться на готовые значения в config.drawing
        config.menu = validateSection("menu", userConfig.menu, this.SCHEMA.menu, config, this.SCHEMA);
        config.elements = validateElements(userConfig.elements, this.SCHEMA, config);

        reportValidation(errors, warnings);

        // CREATE
        let AlertDialog = android.app.AlertDialog;
        let Button = android.widget.Button;
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
        let ViewGroup = android.view.ViewGroup;
        let TypedValue = android.util.TypedValue;
        let TextUtils = android.text.TextUtils;
        let ctx = UI.getContext();

        // Функция предотвращения ошибок
        function preventSomeErrors(view) {
            if (view.getParent() != null) {
                view.getParent().removeView(view);
            };
        };

        // Установление прокрутки
        // function applyMarquee(button) {
        //     button.setEllipsize(TextUtils.TruncateAt.MARQUEE);
        //     button.setMarqueeRepeatLimit(-1);
        //     button.setSingleLine(true);
        //     button.setSelected(true);
        // };

        // СЕПАРАТОР
        function setSeparator(config, content_container) {
            let textview = new TextView(ctx);
            textview.setPadding(dpToPx(2), 0, dpToPx(2), 0);
            if (config.lineColor.length === 1) {
                textview.setBackground(new android.graphics.drawable.ColorDrawable(config.lineColor[0]));
            } else {
                textview.setBackground(new GradientDrawable(config.lineGradientDirection, config.lineColor));
            }
            if (config.name !== null) {
                textview.setMinimum(dpToPx(4));
                textview.setText("	" + config.name);
                textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, config.nameSize);
                if (config.nameColor !== null) textview.setTextColor(config.nameColor);
                textview.setGravity(Gravity.LEFT | Gravity.CENTER_VERTICAL);
                textview.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT));
            } else {
                textview.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, config.lineHeight, 1));

            };
            content_container.addView(textview);
        };

        // ИМЯ ЭЛЕМЕНТА
        function setName(config, name_container, element_container) {
            let textview = new TextView(ctx);
            textview.setText(config.name); // Установление текста
            textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, config.nameSize); // Установление размера текста
            if (config.nameColor !== null) textview.setTextColor(config.nameColor);
            textview.setLayoutParams(new LinearLayout.LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT
            )); // Установка параметра
            textview.setEllipsize(TextUtils.TruncateAt.END); // Установка отображения
            textview.setMaxLines(2); // Установка количества строк 
            textview.setGravity(Gravity.START | Gravity.CENTER_VERTICAL); // Установка расположения внутри родителя
            if (config.hint !== null) { //Добавление подсказки элементу
                textview.setText(Html.fromHtml(textview.getText().replace("\n", "<br>") + " <font color='" + SimpleMenu.ConvertColor(config.hint.symbolColor, "hex") + "'>" + config.hint.symbol + "</font>")); //не хватает config.hint.symbolSize
                if (typeof config.hint.positiveButton === "object") {
                    textview.setOnClickListener(new OnClickListener({
                        onClick: function() {
                            let hint_dialog = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                            hint_dialog.setMessage(config.hint.text);
                            //hint_dialog.setMessageColor(config.hint.textColor)
                            //hint_dialog.setMessageSize(config.hint.textSize)
                            hint_dialog.setCancelable(true);
                            hint_dialog.setCanceledOnTouchOutside(true);
                            hint_dialog.show();
                        }
                    }));
                }
            }
            name_container.addView(textview); // Добавление текста в контейнер имени
            element_container.addView(name_container);
        }

        // КНОПОКИ ДИАЛОГА
        function setClosable(config, dialog, main, index, positiveFunction) {
            if (typeof config.positiveButton === "object") {
                dialog.setPositiveButton(config.positiveButton.text, new DialogInterface.OnClickListener({
                    onClick: function() {
                        positiveFunction && positiveFunction();
                        config.positiveButton.onClick(dialog, index);
                    }
                }));
            }
            if (typeof config.negativeButton === "object") {
                dialog.setNegativeButton(config.negativeButton.text, new DialogInterface.OnClickListener({
                    onClick: function() {
                        config.negativeButton.onClick(dialog, index);
                    }
                }));
            }
            if (typeof config.neutralButton === "object") {
                dialog.setNeutralButton(config.neutralButton.text, new DialogInterface.OnClickListener({
                    onClick: function() {
                        config.neutralButton.onClick(dialog, index);
                    }
                }));
            }
            dialog.setCancelable(true);
            dialog.setCanceledOnTouchOutside(main && config.isReactivePattern); // меню (если реактивное) - да, диалог или тразакционное - нет
            if (typeof config.negativeButton === "object") { 
                dialog.setOnCancelListener(new DialogInterface.OnCancelListener({
                    onCancel: function(dialog) {
                        config.negativeButton.onClick(dialog, index);
                    }
                }));
            }
        }

        // КНОПКА
        function createButton(config, widget_container, element_container, content_container, index, onClickFunction) {
            const chevronWidth = dpToPx(20);
            // Текст значения
            let button_text = new TextView(ctx);
            if (config.buttonText !== null) button_text.setText(config.buttonText);
            if (config.buttonTextColor !== null) button_text.setTextColor(config.buttonTextColor);
            button_text.setTextSize(TypedValue.COMPLEX_UNIT_SP, config.buttonTextSize);
            button_text.setMaxLines(2);
            button_text.setEllipsize(TextUtils.TruncateAt.END);
            button_text.setMaxWidth(maxTextWidth);
            button_text.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);
            button_text.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1));
            // Слот шеврона
            let chevron = new TextView(ctx);
            chevron.setText(">");
            chevron.setTextSize(TypedValue.COMPLEX_UNIT_SP, config.buttonTextSize);
            if (config.buttonTextColor !== null) chevron.setTextColor(config.buttonTextColor);
            chevron.setGravity(Gravity.CENTER);
            chevron.setLayoutParams(new LinearLayout.LayoutParams(chevronWidth, LayoutParams.WRAP_CONTENT));
            widget_container.addView(button_text);
            widget_container.addView(chevron);
            widget_container.setClickable(true);
            widget_container.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    onClickFunction && onClickFunction(config, button, index);
                    if (config.onButtonClick !== null) config.onButtonClick(button, index);
                }
            }));
            element_container.addView(widget_container);
            content_container.addView(element_container);
        }

        // ФЛАЖОК                                 
        function createCheckBox(config, widget_container, element_container, content_container, index) {
            let checkbox = new CheckBox(ctx);
            checkbox.setChecked(config.state);
            checkbox.setLayoutParams(params.selectable_element);
            if (config.onCheck != null) {
                checkbox.setOnCheckedChangeListener(new OnCheckedChangeListener({
                    onCheckedChanged: function(checkbox, isChecked) {
                        config.state = isChecked;
                        config.onCheck(checkbox, isChecked, index);
                    }
                }));
            }
            widget_container.addView(checkbox);
            element_container.addView(widget_container);
            content_container.addView(element_container);
        }

        // ПЕРЕКЛЮЧАТЕЛЬ
        function createSwitch(config, widget_container, element_container, content_container, index) {
            let switcher = new Switch(ctx);
            switcher.setChecked(config.state);
            switcher.setLayoutParams(params.selectable_element);
            if (config.onSwitch != null) {
                switcher.setOnCheckedChangeListener(new OnCheckedChangeListener({
                    onCheckedChanged: function(switcher, isChecked) {
                        config.state = isChecked;
                        config.onSwitch(switcher, isChecked, index);
                    }
                }));
            }
            widget_container.addView(switcher);
            element_container.addView(widget_container);
            content_container.addView(element_container);
        }

        // СЕЛЕКТОР
        function createSelection(button, element, index) {
            button.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    element.onButtonClick(button, index);
                    let dialog = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                    dialog.setItems(element.data, function(view, pos, i) { //что за i и view и куда их?
                        element.selectionCurrent = pos;
                        element.onSelect(pos, element.data[pos]);
                        button.setText(element.data[element.selectionCurrent]);
                    });
                    // rootd.setPositiveButton("Вернутся", null);
                    rootd.show();
                }
            }));
        }

        // МУЛЬТИСЕЛЕКТОР
        function createMultiSelection(button, element, index) {
            button.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    element.onButtonClick(button, index);
                    let rootd = new AlertDialog.Builder(ctx, config.drawing.menuStyle); //был какой то dialog_config.style
                    //Проверка типа параметра
                    let arr = element.data;
                    let data1 = [];
                    let data2 = [];
                    for (let i = 0; i < arr.length; i++) {
                        data1.push(element.data[i][0]);
                        data2.push(element.data[i][2]); //что значит вторй элемент в массиве? разве в передаваемом двумерном массиве в подмассивах 0 элемент это название а 1 элемент - булеан
                    };
                    rootd.setMultiChoiceItems(data1, data2, function(dialog, index, state) { //зачем тут dialog
                        element.data[index][2] = state; //пересмотреть структуру передваемого объекта для улучшения 
                        element.onSelect(element.data[index][0], index, state);
                        });
                    //rootd.setPositiveButton("Вернутся", null);
                    rootd.show();
                    setClosable(element.selectionDialog, rootd, index, false);
                }
            }));
        }

        // ПОЛЗУНОК
        function createSeekBarDialog(config, button, index) {
            let seekbar = new SeekBar(ctx);
            let layout = new LinearLayout(ctx);
            let textview = new TextView(ctx);
            button.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    config.onButtonClick(button, index);
                    layout.setOrientation(LinearLayout.VERTICAL);
                    layout.setLayoutParams(params.dialog_layout);
                    textview.setText(config.seekBarDialog.prefixText + config.seekBarDialog.current + config.seekBarDialog.suffixText);
                    config.seekBarDialog.textColor !== null && textview.setTextColor(config.seekBarDialog.textColor);
                    textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, config.seekBarDialog.textSize);
                    textview.setTypeface(null, Typeface.BOLD);
                    textview.setGravity(Gravity.LEFT);
                    textview.setPadding(dpToPx(12), dpToPx(7), dpToPx(7), dpToPx(7));
                    textview.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT));
                    seekbar.setProgress(config.seekBarDialog.current);
                    seekbar.setMin(config.seekBarDialog.min);
                    seekbar.setMax(config.seekBarDialog.max);

                    seekbar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener({
                        onProgressChanged: function(sb, progress, fromUser) {
                            textview.setText(config.seekBarDialog.prefixText + sb.getProgress() + config.seekBarDialog.suffixText);
                            if (config.onProgressChange !== null) {
                                config.onProgressChange(sb, progress, fromUser, index);
                            }
                        },
                        onStartTrackingTouch: function(sb) {
                            textview.setText(config.seekBarDialog.prefixText + sb.getProgress() + config.seekBarDialog.suffixText);
                            if (config.onStartTrackingTouch !== null) {
                                config.onStartTrackingTouch(sb, sb.getProgress(), index);
                            }
                        },
                        onStopTrackingTouch: function(sb) {
                            textview.setText(config.seekBarDialog.prefixText + sb.getProgress() + config.seekBarDialog.suffixText);
                            if (config.onStopTrackingTouch !== null) {
                                config.onStopTrackingTouch(sb, sb.getProgress(), index);
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
                        config.seekBarDialog.current = seekbar.getProgress();
                        button.setText(config.seekBarDialog.prefixText + seekbar.getProgress() + config.seekBarDialog.suffixText);
                    }
                    setClosable(config.seekBarDialog, dialog, index, false, updateCurrent);
                    dialog.show();
                }
            }));
        };

        // РЕДАКТИРУЕМЫЙ ТЕКСТ
        function createEditTextDialog(config, button, index) {
            let edittext = new EditText(ctx);
            let layout = new LinearLayout(ctx);
            button.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    config.onButtonClick(button, index);
                    layout.setOrientation(LinearLayout.VERTICAL);
                    layout.setLayoutParams(params.dialog_layout);
                    edittext.setHint(config.editTextDialog.placeholder);
                    // edittext.setHintColor(config.editTextDialog.textColor); нужно адаптировать функция converColor для альфа канало (для config.editTextDialog.placeholderOpacity)
                    // edittext.setHintSize(config.editTextDialog.textSize);
                    edittext.setText(config.editTextDialog.text);
                    edittext.setTextSize(config.editTextDialog.textSize);
                    edittext.setTextColor(config.editTextDialog.textColor);
                    edittext.setMaxLines(config.editTextDialog.linesCount);

                    edittext.addTextChangedListener(new TextWatcher({
                        beforeTextChanged: function(oldText, startPos, beforeCount, afterCount) {
                            (config.beforeTextChange !== null) && config.beforeTextChange(String(oldText), startPos, beforeCount, afterCount, index);
                        },
                        onTextChanged: function(newText, start, beforeCount, afterCount) {
                            (config.onTextChange !== null) && config.onTextChange(String(newText), start, beforeCount, afterCount, index);
                        },
                        afterTextChanged: function(finalText) {
                            (config.afterTextChange !== null) && config.afterTextChange(String(finalText), index);
                        }
                    }));

                    preventSomeErrors(edittext);
                    preventSomeErrors(layout);
                    layout.addView(edittext);
                    let dialog = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                    dialog.setView(layout);
                    function updateCurrent() {
                        config.editTextDialog.text = edittext.getText();
                        button.setText(edittext.getText());
                    }
                    setClosable(config.editTextDialog, dialog, index, false, updateCurrent);
                    dialog.show();
                }
            }));
        };

        // Параметры элементов
        const params = {
            selectable_element: new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT),
            dialog_layout: new LinearLayout.LayoutParams(LinearLayout.LayoutParams.FILL_PARENT, LinearLayout.LayoutParams.FILL_PARENT),
            element: new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        };

        return {
            getContent: function() {
                return config;
            },
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
                                content_container.setLayoutParams(new ScrollView.LayoutParams(
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
                                    name_container.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, 3));
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



                                        case "seekbar":
                                            setName(element_config, name_container, element_container);
                                            button = new Button(ctx);
                                            button.setAllCaps(false);
                                            //Установка кнопки элемента
                                            setButton(element_config, button, index);
                                            //Создания диалога ползунка
                                            createSeekBarDialog(element_config, button, index);
                                            element_container.addView(textview);
                                            element_container.addView(button);
                                            content_container.addView(element_container);
                                            break;
                                        case "edittext":
                                            setName(element_config, name_container, element_container);
                                            // Установка кнопки элемента
                                            setButton(element_config, button, index);
                                            // Создание диалога редактируемого текста
                                            createEditTextDialog(element_config, button, index);
                                            element_container.addView(textview);
                                            element_container.addView(button);
                                            content_container.addView(element_container);
                                            break;
                                        case "selection":
                                            setName(element_config, name_container, element_container);
                                            button = new Button(ctx);
                                            button.setAllCaps(false);
                                            // Установка кнопки элемента
                                            setButton(element_config, button, index);
                                            // Создание диалога селектора
                                            createSelection(button, element_config, index);
                                            element_container.addView(textview);
                                            element_container.addView(button);
                                            content_container.addView(element_container);
                                            break;
                                        case "multiselection":
                                            setName(element_config, name_container, element_container);
                                            button = new Button(ctx);
                                            button.setAllCaps(false);
                                            // Установка кнопки элемента
                                            setButton(element_config, button, index);
                                            // Создание диалога мультиселектора
                                            createMultiSelection(button, element_config, index);
                                            element_container.addView(textview);
                                            element_container.addView(button);
                                            content_container.addView(element_container);
                                            break;
                                        default:
                                            Logger.Log("[SimpleMenuAPI] show(): Unknown element '" + element.type + "'. Expected one of: " + Object.keys(SCHEMA.elements.properties).join(", "), "WARNING");
                                    };
                                };
                                
                                let dialog = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                                dialog.setTitle(config.menu.title);
                                // dialog.setTitleSize(config.menu.titleSize); //пока неизвестно нужно ли это
                                // config.menu.titleColor !== dialog.setTitleColor(config.menu.titleColor);
                                dialog.setView(menu_container);
                                // Установление способов закрытия меню
                                setClosable(config.menu, dialog, -1, true);
                                //Установка анимации и запуск меню
                                dialog.show()
                                    .getWindow()
                                    .getDecorView()
                                    .getChildAt(0)
                                    .startAnimation(android.view.animation.AnimationUtils.loadAnimation(d.getContext(), config.drawing.animation));
                            } catch(err) {
                                throw new Error("[SimpleMenuAPI] show(): Unknown error!\n" + err);
                            };
                        }
                    })
                );
            },
            update: function() {
                try {
                    
                } catch(err) {
                    throw new Error("[SimpleMenuAPI] update(): Unknown error!\n" + err);
                }
            },
            close: function() {
                try {
                    
                } catch(err) {
                    throw new Error("[SimpleMenuAPI] close(): Unknown error!\n" + err);
                }
            }
        };
    }
}