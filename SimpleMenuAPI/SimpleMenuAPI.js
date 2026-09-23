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
            Logger.Log("[SimpleMenuAPI] ConvertColor: invalid color value", "ERROR");
        }
        if (typeof finalType === "undefined") {
            Logger.Log('[SimpleMenuAPI] ConvertColor: missing required parameter "finalType". Allowed values: "rgb", "hex", "name"', "ERROR");
        }
        if (["rgb", "hex", "name"].indexOf(finalType) === -1) {
            Logger.Log('[SimpleMenuAPI] ConvertColor: invalid finalType "' + finalType + '". Allowed values: "rgb", "hex", "name"', "ERROR");
        }
        // Тот же формат — возвращаем как есть
        if (colorType === finalType) {
            return color;
        }
        // === Конвертация ===
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
            title:          { type: "string" },
            // titleSize:      { type: "number or string",  default: 20 },
            // titleColor:     { type: "color",   default: "drawing.nameColor" },
            isCancelable:   { type: "boolean", default: true },
            positiveButton: { $ref: "SUB_SCHEMAS.systemButton", default: null },  
            negativeButton: { $ref: "SUB_SCHEMAS.systemButton", default: null },
            neutralButton:  { $ref: "SUB_SCHEMAS.systemButton", default: null }
        },

        drawing: {
            menuStyle:                  { type: "number", default: android.R.style.Theme_Material_Dialog_Alert },
            animation:                  { type: "number", default: android.R.anim.slide_out_right },
            nameSize:                   { type: "number or string", default: 16 },
            nameColor:                  { type: "color",  default: null},
            buttonTextSize:             { type: "number or string", default: 16 },
            buttonTextColor:            { type: "color",  default: null},
            separatorColor:             { type: "color[]",  default: [android.graphics.Color.WHITE] },
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
                    text:        { type: "string" },
                    textColor:   { type: "color",   default: "drawing.nameColor" },
                    textSize:    { type: "number or string",  default: "drawing.nameSize" },
                    positiveButton: { $ref: "SUB_SCHEMAS.systemButton", default: null },  
                    symbol:      { type: "string",  default: "ⓘ" },
                    symbolColor: { type: "color",   default: "drawing.nameColor" },
                    symbolSize:  { type: "number or string",  default: "drawing.nameSize" },
                    isClosable:  { type: "boolean", default: true }
                }
            },
            systemButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string" },
                    onClick: { type: "function" }
                }
            }
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
                    onButtonClick:   { type: "function", default: null },
                    nameSize:        { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:       { type: "color",    default: "drawing.nameColor" },
                    buttonTextSize:  { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor: { type: "color",    default: "drawing.buttonTextColor" },
                    useMarquee:         { type: "boolean",  default: true },
                    hint:            { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                switch: {
                    type:              { type: "string" },
                    name:              { type: "string" },
                    onSwitched:        { type: "function", default: null },
                    nameSize:          { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:         { type: "color",    default: "drawing.nameColor" },
                    state:             { type: "boolean",  default: false },
                    useMarquee: { type: "boolean",  default: true },
                    hint:              { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                checkbox: {
                    type:              { type: "string" },
                    name:              { type: "string" },
                    onChecked:         { type: "function", default: null },
                    nameSize:          { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:         { type: "color",    default: "drawing.nameColor" },
                    state:             { type: "boolean",  default: false },
                    useMarquee: { type: "boolean",  default: true },
                    hint:              { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                edittext: {
                    type:                    { type: "string" },
                    name:                    { type: "string" },
                    nameSize:                { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:               { type: "color",    default: "drawing.nameColor" },
                    buttonText:              { type: "string" },
                    buttonTextSize:          { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:         { type: "color",    default: "drawing.buttonTextColor" },
                    useEditTextAsButtonText: { type: "boolean",  default: true },
                    useMarquee:              { type: "boolean",  default: true },
                    editTextDialog: {
                        type: "object",
                        properties: {
                            text:               { type: "string", default: "" }, 
                            linesCount:         { type: "number or string", default: 1 }, 
                            textSize:           { type: "number or string", default: "drawing.textSize" }, 
                            textColor:          { type: "color", default: "drawing.textColor" },
                            placeholder:        { type: "string", default: "" },
                            placeholderOpacity: { type: "number", default: 0.5 },
                            positiveButton:     { $ref: "SUB_SCHEMAS.systemButton", default: null },
                            neutralButton:      { $ref: "SUB_SCHEMAS.systemButton", default: null },
                            negativeButton:     { $ref: "SUB_SCHEMAS.systemButton", default: null }
                        }
                    },
                    onButtonClick:              { type: "function", default: null },
                    beforeTextChanged:          { type: "function", default: null },
                    onTextChanged:              { type: "function", default: null },
                    afterTextChanged:           { type: "function", default: null },
                    hint:                       { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                seekbar: {
                    type:                        { type: "string" },
                    name:                        { type: "string" },
                    nameSize:                    { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:                   { type: "color",    default: "drawing.nameColor" },
                    buttonText:                  { type: "string" },
                    buttonTextSize:              { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:             { type: "color",    default: "drawing.buttonTextColor" },
                    useSeekBarValueAsButtonText: { type: "boolean",  default: true },
                    useMarquee:                  { type: "boolean",  default: true },
                    seekbarDialog: {
                        type: "object",
                        properties: {
                            min:            { type: "number or string" },
                            max:            { type: "number or string" },
                            step:           { type: "number or string", default: 1 },
                            current:        { type: "number or string", default: 0 },
                            prefixText:     { type: "string", default: "" },
                            suffixText:     { type: "string", default: "" },
                            textSize:       { type: "number or string", default: "drawing.nameSize" },
                            textColor:      { type: "color", default: "drawing.nameColor" },
                            positiveButton: { $ref: "SUB_SCHEMAS.systemButton", default: null },
                            neutralButton:  { $ref: "SUB_SCHEMAS.systemButton", default: null },
                            negativeButton: { $ref: "SUB_SCHEMAS.systemButton", default: null }
                        }
                    },
                    onButtonClick:                  { type: "function", default: null },
                    beforeProgressChanged:          { type: "function", default: null },
                    onProgressChanged:              { type: "function", default: null },
                    afterProgressChanged:           { type: "function", default: null },
                    hint:                           { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                selection: {
                    type:             { type: "string" },
                    name:             { type: "string" },
                    data:             { type: "array" },
                    nameSize:         { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:        { type: "color",    default: "drawing.nameColor" },
                    buttonTextSize:   { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:  { type: "color",    default: "drawing.buttonTextColor" },
                    selectionDefault: { type: "number or string",   default: 0 },
                    selectionCurrent: { type: "number or string",   default: 0 },
                    onButtonClick:    { type: "function", default: null },
                    onSelect:         { type: "function", default: null },
                    hint:             { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                multiselection: {
                    type:            { type: "string" },
                    name:            { type: "string" },
                    buttonText:      { type: "string" },
                    data:            { type: "array[]" },
                    nameSize:        { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:       { type: "color",    default: "drawing.nameColor" },
                    buttonTextSize:  { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor: { type: "color",    default: "drawing.buttonTextColor" },
                    onButtonClick:   { type: "function", default: null },
                    onSelect:        { type: "function", default: null },
                    hint:            { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                separator: {
                    type:                       { type: "string" },
                    name:                       { type: "string", default: null },
                    nameSize:                   { type: "number or string", default: "drawing.nameSize" },
                    nameColor:                  { type: "color",  default: "drawing.nameColor" },
                    separatorGradientDirection: { type: "number", default: "drawing.separatorGradientDirection" },
                    separatorColor:             { type: "color[]",  default: "drawing.separatorColor" },
                    separatorHeight:            { type: "number or string", default: "drawing.separatorHeight" }
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
            if (expectedType === "array[]") return Array.isArray(value) && value.every(Array.isArray);
            if (expectedType === "color[]") {
                // Разрешаем передать как массив цветов, так и одиночный цвет
                return SimpleMenu.isColor(value) || (Array.isArray(value) && value.every(SimpleMenu.isColor));
            }
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
                    Logger.Log("[SimpleMenuAPI] Create: elements[" + index + "] (seekbar) 'min' (" + min + ") > 'max' (" + max + "). Swapping values.", "WARNING");
                    element.min = max;
                    element.max = min;
                    min = element.min;
                    max = element.max;
                }

                // Подгоняем current под границы [min, max]
                if (current < min) {
                    Logger.Log("[SimpleMenuAPI] Create: elements[" + index + "] (seekbar) 'current' (" + current + ") is lower than 'min' (" + min + "). Set to min.", "WARNING");
                    element.current = min;
                } else if (current > max) {
                    Logger.Log("[SimpleMenuAPI] Create: elements[" + index + "] (seekbar) 'current' (" + current + ") is higher than 'max' (" + max + "). Set to max.", "WARNING");
                    element.current = max;
                }
            }

            // Преобразование dp в px
            if(element.type == 'separator'){
                element.separatorHeight = dpToPx(element.separatorHeight);
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
                        Logger.Log("[SimpleMenuAPI] Create: Missing required parameter '" + key + "' in '" + sectionName + "'!", "ERROR");
                        rawValue = null;
                    } else {
                        rawValue = resolveDefault(rules.default, parsedConfig);
                    }
                } else {
                    if (rules.type && !checkType(userValue, rules.type)) {
                        Logger.Log("[SimpleMenuAPI] Create: Parameter '" + key + "' in '" + sectionName + "' expected type '" + rules.type + "', but got '" + typeof userValue + "'", "ERROR");
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
                    Logger.Log("[SimpleMenuAPI] Create: Unknown parameter '" + userKey + "' in '" + sectionName + "'", "WARNING");
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
                    Logger.Log("[SimpleMenuAPI] Create: Element at index " + i + " has missing or unknown type '" + itemType + "'", "ERROR");
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

        //сокращения
        let AlertDialog = android.app.AlertDialog;
        let Button = android.widget.Button;
        let CheckBox = android.widget.CheckBox;
        let Color = android.graphics.Color;
        let ColorDrawable = android.graphics.drawable.ColorDrawable;
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
        function applyMarquee(view) {
            view.setEllipsize(TextUtils.TruncateAt.MARQUEE);
            view.setMarqueeRepeatLimit(-1);
            view.setSingleLine(true);
            view.setSelected(true);
        };

        // Функция добавление подсказки элементу
        function addHint(textview, element) {  
            textview.setText(Html.fromHtml(textview.getText().replace("\n", "<br>") + " <font color='" + SimpleMenu.ConvertColor(element.hint.symbolColor, "hex") + "'>" + element.hint.symbol + "</font>")); //не хватает element.hint.symbolSize
            textview.setOnClickListener(new OnClickListener({
                onClick: function() {
                    let hint_dialog = new AlertDialog.Builder(ctx);
                    hint_dialog.setMessage(element.hint.text);
                    //hint_dialog.setMessageColor(element.hint.textColor)
                    //hint_dialog.setMessageSize(element.hint.textSize)
                    hint_dialog.setPositiveButton(element.hint.buttonText, null);
                    //hint_dialog.setPositiveButtonColor(element.hint.buttonTextColor);
                    //hint_dialog.setPositiveButtonSize(element.hint.buttonTextSize);
                    hint_dialog.setCancelable(element.hint.isClosable);
                    hint_dialog.show();
                }
            }));
        };

        // Функция установления параметров разделителя
        function setSeparator(textview, element) {
            if (typeof element.name !== null) {
                textview.setMinimum(dpToPx(4));
                textview.setText("	" + element.name);
                textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.nameSize);
                element.nameColor !== null && textview.setTextColor(element.nameColor);
                textview.setBackground(new GradientDrawable(element.separatorGradientDirection, element.separatorColor));
                textview.setGravity(Gravity.LEFT | Gravity.CENTER_VERTICAL);
            } else {
                textview.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, element.separatorHeight, 1));
            };
        };

        // Функция установки имени элемента
        function setName(textview, element, params) {
            // Установление имени элемента
            textview.setText(element.name);
            // Установление размера текста имени элемента
            textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.nameSize);
            // Установление цвета текста имени элемента
            element.nameColor !== null && textview.setTextColor(element.nameColor);
            // Установка параметра
            textview.setLayoutParams(params.textview);
            // Установка отображения
            textview.setEllipsize(TextUtils.TruncateAt.END);
        }

        function setButton(button, element) {
            // Установление текста кнопки элемента
            button.setText(element.buttonText);
            // Установление размера текста кнопки элемента
            button.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.buttonTextSize);
            // Установление цвета текста кнопки элемента
            element.buttonTextColor !== null && button.setTextColor(element.buttonTextColor);
            // Установка параметра
            button.setLayoutParams(params.button);
            // Установка цвета фона
            button.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            // Установка прокрутки текста кнопки элемента
            element.useMarquee && applyMarquee(button);

        }
                                           
        // Функция создания функции переключателя
        function setOnSwitched(switch_, element, index) {
            if (typeof element.onSwitched !== null) {
                switch_.setOnCheckedChangeListener(new OnCheckedChangeListener({
                    onCheckedChanged: function(view, isChecked) {
                        element.state = isChecked;
                        element.onSwitched(view, index, isChecked);
                    }
                }));
            }
        };

        // Функция создания функции кнопки
        function setOnClick(button, element, index) {
            if (typeof element.onButtonClick !== null) {
                button.setOnClickListener(new OnClickListener({
                    onClick: function(view) {
                        element.onButtonClick(view, index);
                    }
                }));
            }
        };

        // Функция создания функции флажка
        function setOnChecked(checkbox, element, index) {
            if (typeof element.onChecked !== null) {
                checkbox.setOnCheckedChangeListener(new OnCheckedChangeListener({
                    onCheckedChanged: function(view, isChecked) {
                        element.state = isChecked;
                        element.onChecked(view, index, isChecked);
                    }
                }));
            }
        };

        // ПОЗУНОК   
        //Функция создания первой функции ползунка
        function setOnBeforeSeekbarChange(roott, element, index, rootsb) {
            rootsb.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener({
                onProgressChanged: function() {
                    //Выполнение пользовательского кода
                    element.seekbarDialog.beforeProgressChanged(rootsb.getProgress(), rootsb, index);
                    //Обновление значения параметра current объекта seekbarDialog
                    element.seekbarDialog.current = rootsb.getProgress();
                    //Обновление текста диалога
                    roott.setText(element.seekbarDialog.prefixText + rootsb.getProgress() + element.seekbarDialog.suffixText);
                }
            }))
        };

        //Функция создания второй функции ползунка
        function setOnAfterSeekbarChange(roott, element, index, rootsb) {
            rootsb.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener({
                onProgressChanged: function() {
                    //Обновление значения параметра current объекта seekbarDialog
                    element.seekbarDialog.current = rootsb.getProgress();
                    //Обновление текста диалога
                    roott.setText(element.seekbarDialog.prefixText + rootsb.getProgress() + element.seekbarDialog.suffixText);
                    //Выполнение пользовательского кода
                    element.seekbarDialog.afterProgressChanged(rootsb.getProgress(), rootsb, index);
                }
            }))
        };

        //Функция установления положительной кнопки диалога
        function setDialogPositiveButton(context, dialog, index) {
            context.setPositiveButton(dialog.positiveButton.text, new DialogInterface.OnClickListener({
                onClick: function(view) {
                    object.positiveButton.onClick(view, index);
                }
            }));
        };

        //Функция установления негативной кнопки диалога
        function setDialogNegativeButton(context, dialog, index) {
            context.setNegativeButton(dialog.negativeButton.text, new DialogInterface.OnClickListener({
                onClick: function(view) {
                    object.negativeButton.onClick(view, index);
                }
            }));
        };

        //Функция установления нейтральной кнопки диалога
        function setDialogNeutralButton(context, dialog, index) {
            context.setNeutralButton(dialog.neutralButton.text, new DialogInterface.OnClickListener({
                onClick: function(view) {
                    element.seekbarDialog.neutralButton.onClick(view, index);
                }
            }));
        };

        // ПОЛЗУНОК
        function createSeekbarDialog(button, element, index, rootl, roott, rootsb) {
            button.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    // Создание функции ползунка
                    element.onButtonClick(button, index);
                    rootl.setOrientation(LinearLayout.VERTICAL);
                    rootl.setLayoutParams(params.dialog_layout);
                    // Установление текста диалога
                    roott.setText(element.seekbarDialog.prefixText + element.seekbarDialog.current + element.seekbarDialog.suffixText);
                    // Установления цвета текста диалога
                    element.seekbarDialog.textColor !== null && roott.setTextColor(element.seekbarDialogText.textColor);
                    // Установление размера текста диалога
                    roott.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.seekbarDialog.textSize);
                    roott.setTypeface(null, Typeface.BOLD);
                    roott.setGravity(Gravity.LEFT);
                    roott.setPadding(dpToPx(12), dpToPx(7), dpToPx(7), dpToPx(7));
                    roott.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT));
                    // Установление текущего значения диалога
                    rootsb.setProgress(element.seekbarDialog.current);
                    // Установление минимального значения диалога
                    rootsb.setMin(element.seekbarDialog.min);
                    // Установление максимального значения диалога
                    rootsb.setMax(element.seekbarDialog.max);
                    // Функция создания первой функции ползунка
                    setOnBeforeSeekbarChange(roott, element, index, rootsb);
                    // Функция создания второй функции ползунка
                    setOnAfterSeekbarChange(roott, element, index, rootsb);
                    preventSomeErrors(roott);
                    preventSomeErrors(rootsb);
                    preventSomeErrors(rootl);
                    rootl.addView(roott);
                    rootl.addView(rootsb);
                    // Установление стиля диалога
                    let rootd = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                    rootd.setView(rootl);
                    // Установление положительной кнопки диалога
                    element.seekbarDialog.positiveButton === "object" && setDialogPositiveButton(rootd, element.seekbarDialog, index);
                    // Установление негативной кнопки диалога
                    element.seekbarDialog.neutralButton === "object" && setDialogNegativeButton(rootd, element.seekbarDialog, index);
                    // Установление нейтральной кнопки диалога
                    element.seekbarDialog.negativeButton === "object" && setDialogNeutralButton(rootd, element.seekbarDialog, index);
                    // Запуск диалога
                    rootd.show();
                }
            }));
        };

        // РЕДАКТИРУЕМЫЙ ТЕКСТ
        function createEditTextDialog(button, element, index, rootl, rootet) {
            button.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    element.onButtonClick(button, index);
                    rootl.setOrientation(LinearLayout.VERTICAL);
                    rootl.setLayoutParams(params.dialog_layout);
                    rootet.setHint(element.editTextDialog.placeholder);
                    // rootet.setHintColor(element.editTextDialog.textColor); нужно адаптировать функция converColor для альфа канало (для element.editTextDialog.placeholderOpacity)
                    // rootet.setHintSize(element.editTextDialog.textSize);
                    rootet.setText(element.editTextDialog.text);
                    rootet.setTextSize(element.editTextDialog.textSize);
                    rootet.setTextColor(element.editTextDialog.textColor);
                    rootet.setMaxLines(element.edittextLinesCount);
                    rootet.addTextChangedListener(
                        new TextWatcher({
                            beforeTextChanged: function() {
                                element.beforeTextChanged(rootet.getText(), index);
                            },
                            onTextChanged: function() {
                                element.editTextDialog.text = rootet.getText();
                                button.setText(rootet.getText());
                                element.onTextChanged(rootet.getText(), index);
                            },
                            afterTextChanged: function() {
                                element.afterTextChanged(rootet.getText(), index);
                            }
                        })
                    );
                    preventSomeErrors(rootet);
                    preventSomeErrors(rootl);
                    rootl.addView(rootet);
                    let rootd = new AlertDialog.Builder(ctx, config.drawing.styleMenu); //был какой то dialog_config.style
                    rootd.setView(rootl);
                    // Установление положительной кнопки диалога
                    element.editTextDialog.positiveButton === "object" && setDialogPositiveButton(rootd, element.editTextDialog, index);
                    // Установление негативной кнопки диалога
                    element.editTextDialog.neutralButton === "object" && setDialogNegativeButton(rootd, element.editTextDialog, index);
                    // Установление нейтральной кнопки диалога
                    element.editTextDialog.negativeButton === "object" && setDialogNeutralButton(rootd, element.editTextDialog, index);
                    // Запуск диалога
                    rootd.show();
                }
            }));
        };

        //СЕЛЕКТОР
        function createSelection(button, element, index) {
            button.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    element.onButtonClick(button, index);
                    let rootd = new AlertDialog.Builder(ctx, config.drawing.styleMenu); //был какой то dialog_config.style
                    rootd.setItems(element.data, function(view, pos, i) { //что за i и view и куда их?
                        element.selectionCurrent = pos;
                        element.onSelect(pos, element.data_set[pos]);
                        button.setText(element.data_set[element.selectionCurrent]);
                    });
                    // rootd.setPositiveButton("Вернутся", null);
                    rootd.show();
                }
            }));
        }

        //МУЛЬТИСЕЛЕКТОР
        function createMultiSelection(button, element, index) {
            button.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    element.onButtonClick(button, index);
                    let rootd = new AlertDialog.Builder(ctx, config.drawing.styleMenu); //был какой то dialog_config.style
                        //Проверка типа параметра
                        let arr = element.data;
                        let data1 = [];
                        let data2 = [];
                        let data3 = []; //непонятно зачем тут был и третий массви
                        for (let i = 0; i < arr.length; i++) {
                            // непонятно пока нужна ли до проверка и не перенести ли ее в валидатор
                            // if (typeof element.data_set[i][0] === "undefined") {
                            //     element.data_set[i][0] = undefined_text;
                            // };
                            // if (typeof element.data_set[i][1] === "undefined") {
                            //     element.data_set[i][1] = false;
                            // };
                            // if (typeof element.data_set[i][2] === "undefined") {
                            //     element.data_set[i][2] = element.data_set[i][1];
                            // };
                            data1.push(element.data[i][0]);
                            data2.push(element.data[i][2]); //что значит вторй элемент в массиве? разве в передаваемом двумерном массиве в подмассивах 0 элемент это название а 1 элемент - булеан
                        };
                        rootd.setMultiChoiceItems(data1, data2, function(dialog, index, state) { //зачем тут dialog
                            element.data[index][2] = state; //пересмотреть структуру передваемого объекта для улучшения 
                            element.onSelect(element.data[index][0], index, state);
                        });
                    //rootd.setPositiveButton("Вернутся", null);
                    rootd.show();
                }
            }));
        }

        // Параметры элементов
        const params = {
            layout: new LinearLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT, 1),
            selectable: new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT, 2),
            selectable2: new LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT),
            selectable_element: new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT),
            switch_: new LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT),
            dialog_layout: new LinearLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT),
            button: new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT, 2),
            textview: new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT, 1),
            element: new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
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
                                //Создание корневых элементов
                                let menu_container = new RelativeLayout(ctx);
                                menu_container.setLayoutParams(new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
                                let scrollable_container = new ScrollView(ctx);
                                scrollable_container.setLayoutParams(params.layout);
                                let root = new LinearLayout(ctx);
                                root.setLayoutParams(params.layout);
                                root.setOrientation(LinearLayout.VERTICAL);
                                root.setGravity(Gravity.CENTER | Gravity.CENTER);
                                root.setPadding(dpToPx(6), 0, dpToPx(6), 0);
                                scrollable_container.addView(root);
                                menu_container.addView(scrollable_container);
                                //Создание элементов
                                for (let index = 0; index < config.elements.length(); index++){
                                    let element = config.elements[index];
                                    let textview = new TextView(ctx);
                                    let button = new Button(ctx);
                                    let element_layout = new LinearLayout(ctx);
                                    let rootl = new LinearLayout(ctx);
                                    let roott = new TextView(ctx);
                                    let rootet = new EditText(ctx);
                                    let rootsb = new SeekBar(ctx);
                                    let l1 = new LinearLayout(ctx);
                                    l1.setLayoutParams(params.selectable);
                                    l1.setGravity(Gravity.CENTER);
                                    let l2 = new LinearLayout(ctx);
                                    l2.setLayoutParams(params.selectable2);
                                    l2.setGravity(Gravity.CENTER);
                                    element_layout.setLayoutParams(params.element);
                                    element_layout.setGravity(Gravity.CENTER | Gravity.CENTER);
                                    element_layout.setOrientation(LinearLayout.HORIZONTAL);
                                    element_layout.setMinimumHeight(dpToPx(48));
                                    element_layout.setPadding(dpToPx(6), 0, dpToPx(6), 0);
                                    textview.setMaxLines(2);
                                    button.setAllCaps(false);
                                    textview.setGravity(Gravity.LEFT | Gravity.CENTER);
                                    //Добавление подсказки элементу
                                    element.hint !== null && addHint(textview, element);
                                    switch (element.type) {
                                        case "button":
                                            // Установка имени элемента
                                            setName(textview, element, params);
                                            //Установка кнопки элемента
                                            setButton(button, element);
                                            //Создание функции кнопки
                                            setOnClick(button, element, index)
                                            element_layout.addView(textview);
                                            element_layout.addView(button);
                                            root.addView(element_layout);
                                            break;
                                        case "checkbox":
                                            // Установка имени элемента
                                            setName(textview, element, params);;                                           
                                            let checkbox = new CheckBox(ctx);
                                            //Установление состояния флажка
                                            checkbox.setChecked(element.state);
                                            checkbox.setLayoutParams(params.selectable_element);
                                            checkbox.setGravity(Gravity.CENTER_HORIZONTAL | Gravity.CENTER_VERTICAL);
                                            //Создания функции флажка
                                            setOnChecked(checkbox, element, index);
                                            element_layout.addView(textview);
                                            l1.addView(l2);
                                            l2.addView(checkbox);
                                            element_layout.addView(l1);
                                            root.addView(element_layout);
                                            break;
                                        case "separator":
                                            textview.setPadding(dpToPx(2), 0, dpToPx(2), 0);
                                            setSeparator(textview, element);
                                            root.addView(textview);
                                            break;
                                        case "switch":
                                            // Установка имени элемента
                                            setName(textview, element, params);
                                            let switch_ = new Switch(ctx);
                                            //Установление состояния переключателя
                                            switch_.setChecked(element.state);
                                            switch_.setLayoutParams(params.selectable_element);
                                            //Создание функции переключателя
                                            setOnSwitched(switch_, element, index);
                                            element_layout.addView(textview);
                                            l1.addView(l2);
                                            l2.addView(switch_);
                                            element_layout.addView(l1);
                                            root.addView(element_layout);
                                            break;
                                        case "seekbar":
                                            // Установка имени элемента
                                            setName(textview, element, params);
                                            //Установка кнопки элемента
                                            setButton(button, element);
                                            //Создания диалога ползунка
                                            createSeekbarDialog(button, element, index, rootl, roott, rootsb);
                                            element_layout.addView(textview);
                                            element_layout.addView(button);
                                            root.addView(element_layout);
                                            break;
                                        case "edittext":
                                            // Установка имени элемента
                                            setName(textview, element, params);
                                            // Установка кнопки элемента
                                            setButton(button, element);
                                            // Создание диалога редактируемого текста
                                            createEditTextDialog(button, element, index, rootl, rootet);
                                            element_layout.addView(textview);
                                            element_layout.addView(button);
                                            root.addView(element_layout);
                                            break;
                                        case "selection":
                                            // Установка имени элемента
                                            setName(textview, element, params);
                                            // Установка кнопки элемента
                                            setButton(button, element);
                                            // Создание диалога селектора
                                            createSelection(button, element, index);
                                            element_layout.addView(textview);
                                            element_layout.addView(button);
                                            root.addView(element_layout);
                                            break;
                                        case "multiselection":
                                            // Установка имени элемента
                                            setName(textview, element, params);
                                            // Установка кнопки элемента
                                            setButton(button, element);
                                            // Создание диалога мультиселектора
                                            createMultiSelection(button, element, index);
                                            element_layout.addView(textview);
                                            element_layout.addView(button);
                                            root.addView(element_layout);
                                            break;
                                        default:
                                            Logger.Log("[SimpleMenuAPI] Create: Unknown element '" + element.type + "'. Expected one of: " + Object.keys(SCHEMA.elements.properties).join(", "), "WARNING");
                                    };
                                };
                                
                                let dialog = new AlertDialog.Builder(ctx, config.drawing.menuStyle);
                                dialog.setTitle(config.menu.title);
                                // dialog.setTitleSize(config.menu.titleSize); //пока неизвестно нужно ли это
                                // config.menu.titleColor !== dialog.setTitleColor(config.menu.titleColor);
                                dialog.setView(menu_container);
                                //Установка положительной кнопки
                                element.menu.positiveButton === "object" && setDialogPositiveButton(dialog, config.menu, index);
                                //Установка негативной кнопки
                                element.menu.negativeButton === "object" && setDialogNegativeButton(dialog, config.menu, index);
                                //Установка нейтральной кнопки
                                element.menu.neutralButton === "object" && setDialogNeutralButton(dialog, config.menu, index);
                                //Установка анимации и запуск меню
                                dialog.show()
                                    .getWindow()
                                    .getDecorView()
                                    .getChildAt(0)
                                    .startAnimation(android.view.animation.AnimationUtils.loadAnimation(d.getContext(), config.menu.drawing.animation));
                            } catch(err) {
                                throw new Error("[SimpleMenuAPI] Create: Unknown error!\n" + err);
                            };
                        }
                    })
                );
            },
            update: function() {},
            close: function() {}
        };
    }
}