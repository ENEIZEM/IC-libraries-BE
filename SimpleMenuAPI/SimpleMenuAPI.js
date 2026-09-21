/*
    SimpleMenuAPI by Maksim Pomazuev and UhmDenis.
    SimpleMenuAPI provides simple methods for creating Android dialog menus.
    Maksim Pomazuev in Vkontakte - vk.com/pomazuevmaksim
    Maksim Pomazuev in icmods - https://icmods.mineprogramming.org/search?author=4208
    Maksim Pomazuev on GitHub - https://github.com/pomazuevmaksim
    UhmDenis in icmods - https://icmods.mineprogramming.org/search?author=4036
    library development community in Vkontakte - https://vk.com/modsandperiod
    Library repository on Github -
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
            titleSize:      { type: "number or string",  default: 20 },
            titleColor:     { type: "color",   default: "drawing.nameColor" },
            isCancelable:   { type: "boolean", default: true },
            
            positiveButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string" },
                    onClick: { type: "function", default: null }
                }
            },
            negativeButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string" },
                    onClick: { type: "function", default: null }
                }
            },
            neutralButton: {
                type: "object",
                default: null,
                properties: {
                    text:    { type: "string" },
                    onClick: { type: "function", default: null }
                }
            }
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
                    buttonText:  { type: "string",  default: "OK" },
                    buttonTextColor: { type: "color",   default: "drawing.buttonTextColor" },
                    buttonTextSize:  { type: "number or string",  default: "drawing.buttonTextSize" },
                    symbol:      { type: "string",  default: "ⓘ" },
                    symbolColor: { type: "color",   default: "drawing.nameColor" },
                    symbolSize:  { type: "number or string",  default: "drawing.nameSize" },
                    isClosable:  { type: "boolean", default: true }
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
                    enableScrolling: { type: "boolean",  default: true },
                    hint:            { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                switch: {
                    type:       { type: "string" },
                    name:       { type: "string" },
                    onSwitched: { type: "function", default: null },
                    nameSize:   { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:  { type: "color",    default: "drawing.nameColor" },
                    state:      { type: "boolean",  default: false },
                    hint:       { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                checkbox: {
                    type:      { type: "string" },
                    name:      { type: "string" },
                    onChecked: { type: "function", default: null },
                    nameSize:  { type: "number or string",   default: "drawing.nameSize" },
                    nameColor: { type: "color",    default: "drawing.nameColor" },
                    state:     { type: "boolean",  default: false },
                    hint:      { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                edittext: {
                    type:                       { type: "string" },
                    name:                       { type: "string" },
                    buttonText:                 { type: "string" },
                    nameSize:                   { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:                  { type: "color",    default: "drawing.nameColor" },
                    buttonTextSize:             { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:            { type: "color",    default: "drawing.buttonTextColor" },
                    buttonTextChangeToEditText: { type: "boolean",  default: true },
                    edittextHint:               { type: "string",   default: "" },
                    edittextCurrent:            { type: "string",   default: "" },
                    edittextLinesCount:         { type: "number or string",   default: 1 },
                    onButtonClick:              { type: "function", default: null },
                    beforeTextChanged:          { type: "function", default: null },
                    onTextChanged:              { type: "function", default: null },
                    afterTextChanged:           { type: "function", default: null },
                    hint:                       { $ref: "SUB_SCHEMAS.hint", default: null }
                },

                seekbar: {
                    type:       { type: "string" },
                    name:       { type: "string" },
                    buttonText: { type: "string" },
                    seekbarDialog: {
                        type: "object",
                        properties: {
                            min:            { type: "number or string" },
                            max:            { type: "number or string" },
                            step:           { type: "number or string", default: 1 },
                            current:        { type: "number or string", default: 0 },
                            positiveButton: { type: "string", default: "OK" },
                            negativeButton: { type: "string", default: "Cancel" }
                        }
                    },
                    nameSize:                       { type: "number or string",   default: "drawing.nameSize" },
                    nameColor:                      { type: "color",    default: "drawing.nameColor" },
                    buttonTextSize:                 { type: "number or string",   default: "drawing.buttonTextSize" },
                    buttonTextColor:                { type: "color",    default: "drawing.buttonTextColor" },
                    buttonTextChangeToSeekBarState: { type: "boolean",  default: true },
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

                divider: {
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

        //Валдация
        // 1. Проверка типов
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

        // 2. Преобразование и нормализация значений по типу
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

        // 3. Логическая валидация элементов (seekbar и др.)
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
            if(element.type == 'divider'){
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
        // Передаем собираемый config, а не userConfig
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
        let ctx = UI.getContext(); //Контекст интерфейса



        //функция предотвращения ошибок
        function preventSomeErrors(view) {
            if (view.getParent() != null) {
                view.getParent().removeView(view);
            };
        };

        //Установление прокрутки (Напрямую, без проверки параметра)
        function setAutoScrolling(view) {
            view.setEllipsize(TextUtils.TruncateAt.MARQUEE);
            view.setMarqueeRepeatLimit(-1);
            view.setSingleLine(true);
            view.setSelected(true);
        };

        //Функция добавление подсказки элементу
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
        };;

        //Функция установления имени, размера текста и цвета текста имени разделителя
        function setNameAndNameSizeAndNameColor(textview, element) {
            if (typeof element.name !== null) {
                textview.setMinimum(dpToPx(4));
                textview.setText("	" + element.name);
                textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.nameSize);
                textview.setGravity(Gravity.LEFT | Gravity.CENTER_VERTICAL);
            } else {
                textview.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, element.separatorHeight, 1));
            };
        };

        //Функция установления состояния
        function setState(widget, element) {
            if (typeof element.state === "boolean") {
                widget.setChecked(element.state);
            } else {
                widget.setChecked(true)
            }
        };

        //Функция создания переключателя
        function setOnSwitched(switch_, element, key, counter) {
            if (typeof element.onSwitched === "function") {
                switch_.setOnCheckedChangeListener(new OnCheckedChangeListener({
                    onCheckedChanged: function(view, isChecked) {
                        element.state = isChecked;
                        element.onSwitched(view, counter, isChecked);
                    }
                }));
            } else {
                throw new Error("Error!\nUnable to create «OnSwitched» function for the «" + key +"» element for your menu, check that the value type of the «OnSwitched» property is «function»")
            }
        };

        //Функция создания кнопки
        function setOnClick(button, element, key, counter) {
            if (typeof element.onButtonClick === "function") {
                button.setOnClickListener(new OnClickListener({
                    onClick: function(view) {
                        element.onClick(view, counter);
                    }
                }));
            } else {
                throw new Error("Error!\nUnable to create «OnClick» function for the «" + key +"» element for your menu, check that the value type of the «OnClick» property is «function»")
            };
        };

        //Функция создания флажка
        function setOnChecked(checkbox, element, key, counter) {
            if (typeof element.onChecked === "function") {
                checkbox.setOnCheckedChangeListener(new OnCheckedChangeListener({
                    onCheckedChanged: function(view, isChecked) {
                        element.state = isChecked;
                        element.onChecked(view, counter, isChecked);
                    }
                }));
            } else {
                throw new Error("Error!\nUnable to create «OnChecked» function for the «" + key +"» element for your menu, check that the value type of the «OnChecked» property is «function»")
            }
        };


        //ПОЗУНОК
        //Функция установления текста кнопки
        function setButtonTextAtSeekbarState(button, element, key, seekbarState) {
            if (typeof element.editTextDialog.text === "string") {
                button.setText(seekbarState)
            } else {
                throw new Error ("Error!\nUnable to set seekbar state to «" + key + "» element, check that the data type of the «state» property value of the «seekbarDialog» object is «number»")
            }
        };
        
        //Функция установления состояния ползунка тексту кнопки, если это разрешено
        function setSeekbarStateToButtonTextIfAllowed(button, element, key) {
            //Если состояние ползунка не указано, то ошибка
            let editText = element.editTextDialog.text
            if (typeof editText !== "string") {
                throw new Error ("Error!\n")
            };
            //если земена текста кнопки на состоянияе ползунка разрешена
            if (typeof element.buttonTextChangeToSeekBarState === "boolean") {
                if (element.buttonTextChangeToSeekbarState) {
                    setButtonTextAtSeekbarState(button, element, key, seekbarState)
                }
            } else {
                setButtonTextAtSeekbarState(button, element, key, seekbarState)
            }
        };

        //Функция установления текста диалога
        function setDialogText(roott, element, key) {
            let seekbarDialogText = element.seekbarDialog.text
            if (typeof seekbarDialogText !== "undefined") {
                //Если текст диалога ползунка не массив, то переменная помещается в массив
                if (typeof seekbarDialogText !== "object") {
                    seekbarDialogText = [seekbarDialogText]
                };
                //Если одно или два элемента массива текста диалога не являются строчкой
                for (let i = 0; i < seekbarDialogText.length; i++) {
                    if (typeof seekbarDialogText[i] !== "string") {
                        throw new Error ("Error!\nUnable to set seekbar text on «" + key + "» element, check that the value of the «text» property of the «seekbarDialog» object is an array containing one or two elements with a «string» data type")
                    }
                };
                //Установление текста диалога
                roott.setText(seekbarDialogText[0] + element.seekbarDialog.state + !!seekbarDialogText[1] ? seekbarDialogText[1]: "")
            } else {
                throw new Error ("Error!\nUnable to set seekbar text on «" + key + "» element, check that the value of the «text» property of the «seekbarDialog» object is an array containing one or two elements with a «string» data type")
            }
        };

        //Функция установления цвета текста диалога
        function setDialogTextColor(roott, element) {
            if (SimpleMenu.ConvertColor(element.seekbarDialog.textColor, "boolean")) {
                roott.setTextColor(SimpleMenu.ConvertColor(element.seekbarDialogText.textColor, "name"))
            } else {
                roott.setTextColor(Color.WHITE)
            }
        };

        //Функция установления размера текста диалога
        function setDialogTextSize(roott, element) {
            if (!isNaN(element.seekbarDialog.textSize)) {
                roott.setTextSize(TypedValue.COMPLEX_UNIT_SP, Number(element.seekbarDialog.textSize));
            } else {
                roott.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
            }
        };

        //Функция установления текущего значения диалога
        function setDialogState(rootsb, element, key) {
            if (typeof element.seekbarDialog.state === "number") {
                rootsb.setProgress(element.seekbarDialog.state);
            } else {
                throw new Error ("Error!\nUnable to set the current state of the seekbar on the «" + key + "» element, check that the data type of the value of the «state» property of the «seekbarDialog» object is «number»")
            }
        };

        //Функция установления минимального значения диалога
        function setDialogMin(rootsb, element, key) {
            if (!isNaN(element.seekbarDialog.min)) {
                rootsb.setMin(element.seekbarDialog.min);
            } else {
                throw new Error ("Error!\nUnable to set the minimum seekbar state on the «" + key + "» element, check that the data type of the «min» property value of the «seekbarDialog» object is «number»")
            }
        };

        //Функция установления максимального значения диалога
        function setDialogMax(rootsb, element, key) {
            if (!isNaN(element.seekbarDialog.max)) {
                rootsb.setMin(element.seekbarDialog.max);
            } else {
                throw new Error ("Error!\nUnable to set the maximum seekbar state on the «" + key + "» element, check that the data type of the «max» property value of the «seekbarDialog» object is «number»")
            }
        };

        //Функция создания первой функции ползунка
        function setOnBeforeSeekbarChange(roott, element, key, counter, rootsb) {
            if (typeof element.seekbarDialog.onBeforeSeekbarChange === "function") {
                rootsb.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener({
                    onProgressChanged: function() {
                        //Выполнение пользовательского кода
                        element.seekbarDialog.onBeforeSeekbarChange(rootsb.getProgress(), rootsb, counter);
                        //Обновление значения параметра state объекта seekbarDialog
                        element.seekbarDialog.state = rootsb.getProgress();
                        //Обновление текста диалога
                        roott.setText(element.seekbarDialog.text[0] + rootsb.getProgress() + !!element.seekbarDialog.text[1] ? element.seekbarDialog.text[1]: "")
                    }
                }))
            } else {
                throw new Error ("Error!\nUnable to create function «onBeforeSeekbarChange» on the «" + key + "» element for your menu, check that the data type of the «onBeforeSeekbarChange» property value of the «seekbarDialog» object is «function»")
            }
        };

        //Функция создания второй функции ползунка
        function setOnAfterSeekbarChange(roott, element, key, counter, rootsb) {
            if (typeof element.seekbarDialog.onAfterSeekbarChange === "function") {
                rootsb.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener({
                    onProgressChanged: function() {
                        //Обновление значения параметра state объекта seekbarDialog
                        element.seekbarDialog.state = rootsb.getProgress();
                        //Обновление текста диалога
                        roott.setText(element.text[0] + rootsb.getProgress() + !!element.seekbarDialog.text[1] ? element.seekbarDialog.text[1]: "");
                        //Выполнение пользовательского кода
                        element.seekbarDialog.onAfterSeekbarChange(rootsb.getProgress(), rootsb, counter);

                    }
                }))
            } else {
                throw new Error ("Error!\nUnable to create function «onAfterSeekbarChange» on the «" + key + "» element for your menu, check that the data type of the «onAfterSeekbarChange» property value of the «seekbarDialog» object is «function»")
            }
        };

        //Функция установления стиля диалога
        function setDialogStyle(rootl) {
            let rootd;
            if (typeof object.drawing.menuStyle === "number") {
                rootd = new AlertDialog.Builder(ctx, object.drawing.menuStyle);
            } else {
                rootd = new AlertDialog.Builder(ctx, android.R.style.Theme_Material_Dialog_Alert);
            };
            rootd.setView(rootl)
        };

        //Функция установления положительной кнопки диалога
        function setDialogPositiveButton(rootd, element, key, counter) {
            if (typeof element.seekbarDialog.positiveButton === "object") {
                if (typeof element.seekbarDialog.positiveButton.text === "string") {
                    if (typeof element.seekbarDialog.positiveButton.onClick === "function") {
                        rootd.setPositiveButton(element.seekbarDialog.positiveButton.text, new DialogInterface.OnClickListener({
                            onClick: function(view) {
                                element.seekbarDialog.positiveButton.onClick(view, counter);
                            }
                        }));
                    } else {
                        throw new Error("Error!\nUnable to create the «onClick» function of the positive button on the «" + key + "» for your menu, check that the data type of the «onClick» property value of the «positiveButton» object of the «seekbarDialog» object is «function»")
                    }
                } else {
                    throw new Error("Error!\nUnable to set positive button name on the «" + key + "» for your menu, check that the data type of the «text» property value of the «positiveButton» object of the «seekbarDialog» object is «string»")
                }
            } else {
                throw new Error("Error!\nUnable to create a positive button on the «" + key + "» for your menu, check that the data type of the «positiveButton» property value of the «seekbarDialog» object is «object»")
            }
        };

        //Функция установления негативной кнопки диалога
        function setDialogNegativeButton(rootd, element, key, counter) {
            if (typeof element.seekbarDialog.negativeButton === "object") {
                if (typeof element.seekbarDialog.negativeButton.text === "string") {
                    if (typeof element.seekbarDialog.negativeButton.onClick === "function") {
                        rootd.setNegativeButton(element.seekbarDialog.negativeButton.text, new DialogInterface.OnClickListener({
                            onClick: function(view) {
                                element.seekbarDialog.negativeButton.onClick(view, counter);
                            }
                        }));
                    } else {
                        throw new Error("Error!\nUnable to create the «onClick» function of the negative button on the «" + key + "» for your menu, check that the data type of the «onClick» property value of the «negativeButton» object of the «seekbarDialog» object is «function»")
                    }
                } else {
                    throw new Error("Error!\nUnable to set negative button name on the «" + key + "» for your menu, check that the data type of the «text» property value of the «negativeButton» object of the «seekbarDialog» object is «string»")
                }
            }
        };

        //Функция установления нейтральной кнопки диалога
        function setDialogNeutralButton(rootd, element, key, counter) {
            if (typeof element.seekbarDialog.neutralButton === "object") {
                if (typeof element.seekbarDialog.negativeButton.text === "string") {
                    if (typeof element.seekbarDialog.neutralButton.onClick === "function") {
                        rootd.setNeutralButton(element.seekbarDialog.neutralButton.text, new DialogInterface.OnClickListener({
                            onClick: function(view) {
                                element.seekbarDialog.neutralButton.onClick(view, counter);
                            }
                        }));
                    } else {
                        throw new Error("Error!\nUnable to create the «onClick» function of the neutral button on the «" + key + "» for your menu, check that the data type of the «onClick» property value of the «neutralButton» object of the «seekbarDialog» object is «function»")
                    }
                } else {
                    throw new Error("Error!\nUnable to set neutral button name on the «" + key + "» for your menu, check that the data type of the «text» property value of the «neutralButton» object of the «seekbarDialog» object is «string»")
                }
            }
        };

        //Функция создания диалога ползунка
        function createSeekbarDialog(button, element, key, counter, rootl, roott, rootsb) {
            button.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    //Создание функции ползунка
                    if (typeof element.onClick === "function") {
                        element.onClick(button, counter);
                    } else {
                        throw new Error("Error!\nUnable to create «OnClick» function for the «" + key +"» element for your menu, check that the value type of the «OnClick» property is «function»")
                    };
                    if (typeof element.seekbarDialog === "object") {
                        rootl.setOrientation(LinearLayout.VERTICAL);
                        rootl.setLayoutParams(params.dialog_layout);

                        //Установление текста диалога
                        setDialogText(roott, element, key);

                        //Установления цвета текста диалога
                        setDialogTextColor(roott, element);

                        //Установление размера текста диалога
                        setDialogTextSize(roott, element);

                        roott.setTypeface(null, Typeface.BOLD);
                        roott.setGravity(Gravity.LEFT);
                        roott.setPadding(dpToPx(12), dpToPx(7), dpToPx(7), dpToPx(7));
                        roott.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT));

                        //Установление текущего значения диалога
                        setDialogState(rootsb, element);

                        //Установление минимального значения диалога
                        setDialogMin(rootsb, element, key);

                        //Установление максимального значения диалога
                        setDialogMax(rootsb, element, key);

                        //Функция создания первой функции ползунка
                        setOnBeforeSeekbarChange(roott, element, key, counter, rootsb);

                        //Функция создания второй функции ползунка
                        setOnAfterSeekbarChange(roott, element, key, counter, rootsb);

                        preventSomeErrors(roott);
                        preventSomeErrors(rootsb);
                        preventSomeErrors(rootl);
                        rootl.addView(roott);
                        rootl.addView(rootsb);

                        //Установление стиля диалога
                        setDialogStyle(rootl);

                        //Установление положительной кнопки диалога
                        setDialogPositiveButton(rootd, element, key, counter);

                        //Установление негативной кнопки диалога
                        setDialogNegativeButton(rootd, element, key, counter);

                        //Установление нейтральной кнопки диалога
                        setDialogNeutralButton(rootd, element, key, counter);

                        //Запуск диалога
                        rootd.show();
                    } else {
                        throw new Error ("Error!\nUnable to create seekbar dialog on element «" + key + "», check that the data type of the «seekbarDialog» property value is «object»")

                    }
                }
            }));
        };


        //РЕДАКТИРУЕМЫЙ ТЕКСТ
        //Функция установления текста кнопки
        function setButtonTextAtEditText(button, element, key, editText) {
            if (typeof element.buttonText === "string") {
                button.setText(editText)
            } else {
                throw new Error ("Error!\nUnable to set editable text to «" + key + "» element, check that the data type of the «text» property value of the «editTextDialog» object is «string»")
            }
        };

        //Функция установления редактируемого текста тексту кнопки, если это разрешено
        function setEditTextToButtonTextIfAllowed(button, element, key) {
            //Если редактируемый текст не указан, то ставится пустая строка
            let editText = element.editTextDialog.text
            if (typeof editText !== "string") {
                editText = ""
            };
            //если земена текста кнопки на редактируемый текст разрешена
            if (typeof element.buttonTextChangeToEditText === "boolean") {
                if (element.buttonTextChangeToEditText) {
                    setEditTextEdit(button, element, key, editText)
                }
            } else {
                setEditTextEdit(button, element, key, editText)
            }
        };

        //Параметры элементов
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

        this.show = function() {
            ctx.runOnUiThread(//Запуск в потоке интерфейса
                new Runnable({
                    run: function() {
                        try {
                            //Создание корневых элементов
                            let menu_container = new RelativeLayout(ctx);
                            menu_container.setLayoutParams(new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT,
                                LayoutParams.FILL_PARENT));
                            let scrollable_container = new ScrollView(ctx);
                            scrollable_container.setLayoutParams(params.layout);
                            let root = new LinearLayout(ctx);
                            root.setLayoutParams(params.layout);
                            root.setOrientation(LinearLayout.VERTICAL);
                            root.setGravity(Gravity.CENTER | Gravity.CENTER);
                            root.setPadding(dpToPx(6), 0, dpToPx(6), 0);
                            scrollable_container.addView(root);
                            menu_container.addView(scrollable_container);

                            let counter = -1
                            //Создание элементов
                            for (key in object.elements) {
                                let element = object.elements[key]
                                counter++
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

                                switch (element.type) {
                                    case "button":
                                        //Установление имени элемента
                                        textview.setText(element.name);
                                        //Установление размера текста имени элемента
                                        textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.nameSize);
                                        //Установление цвета текста имени элемента
                                        element.nameColor !== null && textview.setTextColor(SimpleMenu.ConvertColor(element.nameColor, "name"))
                                        textview.setLayoutParams(params.textview);
                                        textview.setEllipsize(TextUtils.TruncateAt.END);;
                                        //Установление текста кнопки элемента
                                        button.setText(element.buttonText);
                                        //Установление размера текста кнопки элемента
                                        button.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.buttonTextSize);
                                        //Установление цвета текста кнопки элемента
                                        element.buttonTextColor !== null && button.setTextColor(SimpleMenu.ConvertColor(element.buttonTextColor, "name"));
                                        button.setLayoutParams(params.button);
                                        button.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
                                        //Создание функции кнопки
                                        setOnClick(button, element, key, counter)
                                        element_layout.addView(textview);
                                        element_layout.addView(button);
                                        root.addView(element_layout);
                                        break;
                                    case "checkbox":
                                        //Установление имени элемента
                                        textview.setText(element.name);
                                        //Установление размера текста имени элемента
                                        textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.nameSize);
                                        //Установление цвета текста имени элемента
                                        element.nameColor !== null && textview.setTextColor(SimpleMenu.ConvertColor(element.nameColor, "name"))
                                        textview.setLayoutParams(params.textview);
                                        textview.setEllipsize(TextUtils.TruncateAt.END);
                                        let checkbox = new CheckBox(ctx);
                                        //Установление состояния флажка
                                        setState(checkbox, element);
                                        checkbox.setChecked(element.state);
                                        checkbox.setLayoutParams(params.selectable_element);
                                        checkbox.setGravity(Gravity.CENTER_HORIZONTAL | Gravity.CENTER_VERTICAL);
                                        //Создания функции флажка
                                        setOnChecked(checkbox, element, key, counter);
                                        element_layout.addView(textview);
                                        l1.addView(l2);
                                        l2.addView(checkbox);
                                        element_layout.addView(l1);
                                        root.addView(element_layout);
                                        break;
                                    case "separator":
                                        textview.setPadding(dpToPx(2), 0, dpToPx(2), 0);
                                        //Установление направления градиента и цветов разделителя
                                        textview.setBackground(new GradientDrawable(element.separatorGradientDirection, element.separatorColor));
                                        //Установление имени, размера текста и цвета текста имени разделителя
                                        setNameAndNameSizeAndNameColor(textview, element);
                                        root.addView(textview);
                                        break;
                                    case "switch":
                                        //Установление имени элемента
                                        textview.setText(element.name);
                                        //Установление размера текста имени элемента
                                        textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.nameSize);
                                        //Установление цвета текста имени элемента
                                        element.nameColor !== null && textview.setTextColor(SimpleMenu.ConvertColor(element.nameColor, "name"))
                                        textview.setLayoutParams(params.textview);
                                        textview.setEllipsize(TextUtils.TruncateAt.END);
                                        let switch_ = new Switch(ctx);
                                        //Установление состояния переключателя
                                        setState(switch_, element, key, counter);
                                        switch_.setLayoutParams(params.selectable_element);
                                        //Создание функции переключателя
                                        setOnSwitched(swi)
                                        element_layout.addView(textview);
                                        l1.addView(l2);
                                        l2.addView(switch_);
                                        element_layout.addView(l1);
                                        root.addView(element_layout);
                                        break;
                                    case "seekbar":
                                        //Установление имени элемента
                                        textview.setText(element.name);
                                        //Установление размера текста имени элемента
                                        textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.nameSize);
                                        //Установление цвета текста имени элемента
                                        element.nameColor !== null && textview.setTextColor(SimpleMenu.ConvertColor(element.nameColor, "name"))
                                        //Установление цвета текста имени элемента
                                        textview.setLayoutParams(params.textview);
                                        textview.setEllipsize(TextUtils.TruncateAt.END);
                                        //Установление текста кнопки элемента
                                        button.setText(element.buttonText);
                                        //Установление состояния ползунка тексту кнопки, если это разрешено
                                        setSeekbarStateToButtonTextIfAllowed(button, element, key);
                                        //Установление размера текста кнопки элементам
                                        button.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.buttonTextSize);
                                        //Установление цвета текста кнопки элемента
                                        element.buttonTextColor !== null && button.setTextColor(SimpleMenu.ConvertColor(element.buttonTextColor, "name"));
                                        button.setLayoutParams(params.button);
                                        button.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
                                        //Создания диалога ползунка
                                        createSeekbarDialog(button, element, key, counter, rootl, roott, rootsb);
                                        element_layout.addView(textview);
                                        element_layout.addView(button);
                                        root.addView(element_layout);
                                        break;
                                    case "edittext":
                                        //Установление имени элемента
                                        textview.setText(element.name);
                                        //Установление размера текста имени элемента
                                        textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.nameSize);
                                        //Установление цвета текста имени элемента
                                        element.nameColor !== null && textview.setTextColor(SimpleMenu.ConvertColor(element.nameColor, "name"))
                                        textview.setLayoutParams(params.textview);
                                        textview.setEllipsize(TextUtils.TruncateAt.END);
                                        //Установление текста кнопки элемента
                                        setButtonTextAtEditText(button, element, key, element.buttonText);
                                        //Установление редактируемого текста тексту кнопки, если это разрешено
                                        setEditTextToButtonTextIfAllowed(button, element, key);
                                        //Установление размера текста кнопки элемента
                                        button.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.buttonTextSize);
                                        //Установление цвета текста кнопки элемента
                                        element.buttonTextColor !== null && button.setTextColor(SimpleMenu.ConvertColor(element.buttonTextColor, "name"));
                                        button.setLayoutParams(params.button);
                                        button.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
                                        button.setOnClickListener(new OnClickListener({
                                            onClick: function(button) {
                                                if (typeof element.onButtonClick === "function") {
                                                    //Проверка типа параметра
                                                    element.onButtonClick(button, indx);
                                                };
                                                rootl.setOrientation(LinearLayout.VERTICAL);
                                                rootl.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
                                                if (typeof element.edittextHint === "string") {
                                                    //Проверка типа параметра
                                                    rootet.setHint(element.edittextHint);
                                                };
                                                rootet.setText(element.edittextCurrent.toString());
                                                if (typeof element.edittextLinesCount === "number") {
                                                    //Проверка типа параметра
                                                    rootet.setMaxLines(element.edittextLinesCount);
                                                };
                                                rootet.addTextChangedListener(
                                                    new TextWatcher({
                                                        afterTextChanged: function() {
                                                            if (typeof element.afterTextChanged === "function") {
                                                                //Проверка типа параметра
                                                                element.afterTextChanged(rootet.getText(), indx);
                                                            };
                                                        },
                                                        beforeTextChanged: function() {
                                                            if (typeof element.beforeTextChanged === "function") {
                                                                //Проверка типа параметра
                                                                element.beforeTextChanged(rootet.getText(), indx);
                                                            };
                                                        },
                                                        onTextChanged: function() {
                                                            element.edittextCurrent = rootet.getText();
                                                            if (typeof element.onTextChanged === "function") {
                                                                //Проверка типа параметра
                                                                button.setText(rootet.getText());
                                                                element.onTextChanged(rootet.getText(), indx);
                                                            };
                                                        }
                                                    })
                                                );
                                                preventSomeErrors(rootet);
                                                preventSomeErrors(rootl);
                                                rootl.addView(rootet);
                                                let rootd = new AlertDialog.Builder(ctx, dialog_config.style);
                                                rootd.setView(rootl);
                                                rootd.setPositiveButton("Вернутся", null);
                                                rootd.show();
                                            }
                                        }));
                                        element_layout.addView(textview);
                                        element_layout.addView(button);
                                        root.addView(element_layout);
                                        break;
                                    case "selection": //Если element.type == "selection"
                                        textview.setText(element.name);
                                        textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.textSize);
                                        textview.setLayoutParams(params.textview);
                                        textview.setEllipsize(TextUtils.TruncateAt.END);
                                        if (typeof element.selectionDefault === "undefined") {
                                            //Проверка типа параметра
                                            element.selectionDefault = 0;
                                        };
                                        if (typeof element.selectionDefault != "number") {
                                            //Проверка типа параметра
                                            element.selectionDefault = 0;
                                        };
                                        if (typeof element.selectionCurrent === "undefined") {
                                            //Проверка типа параметра
                                            element.selectionCurrent = element.selectionDefault;
                                        };
                                        button.setText(element.data_set[element.selectionCurrent]);
                                        button.setLayoutParams(params.button);
                                        button.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
                                        button.setOnClickListener(new OnClickListener({
                                            onClick: function(button) {
                                                if (typeof element.onButtonClick === "function") {
                                                    //Проверка типа параметра
                                                    element.onButtonClick(button, indx);
                                                };
                                                let rootd = new AlertDialog.Builder(ctx, dialog_config.style);
                                                if (typeof element.data_set === "object") {
                                                    //Проверка типа параметра
                                                    rootd.setItems(element.data_set, function(view, pos, i) {
                                                        element.selectionCurrent = pos;
                                                        if (typeof element.onSelect === "function") {
                                                            //Проверка типа параметра
                                                            element.onSelect(pos, element.data_set[pos]);
                                                        };
                                                        button.setText(element.data_set[element.selectionCurrent]);
                                                    });
                                                } else {
                                                    rootd.setMessage("Элементы не заданы.");
                                                };
                                                rootd.setPositiveButton("Вернутся", null);
                                                rootd.show();
                                            }
                                        }));
                                        element_layout.addView(textview);
                                        element_layout.addView(button);
                                        root.addView(element_layout);
                                        break;
                                    case "multiselection": //Если element.type == "multiselection"
                                        textview.setText(element.name);
                                        textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element.textSize);
                                        textview.setLayoutParams(params.textview);
                                        textview.setEllipsize(TextUtils.TruncateAt.END);
                                        button.setText(element.buttonText);
                                        button.setLayoutParams(params.button);
                                        button.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
                                        button.setOnClickListener(new OnClickListener({
                                            onClick: function(button) {
                                                if (typeof element.onButtonClick === "function") {
                                                    //Проверка типа параметра
                                                    element.onButtonClick(button, indx);
                                                };
                                                let rootd = new AlertDialog.Builder(ctx, dialog_config.style);
                                                if (typeof element.data_set === "object") {
                                                    //Проверка типа параметра
                                                    let arr = element.data_set;
                                                    let data1 = [];
                                                    let data2 = [];
                                                    let data3 = [];
                                                    for (let i = 0; i < arr.length; i++) {
                                                        //Разбитие объекта на два списка
                                                        if (typeof element.data_set[i][0] === "undefined") {
                                                            element.data_set[i][0] = undefined_text;
                                                        };
                                                        if (typeof element.data_set[i][1] === "undefined") {
                                                            element.data_set[i][1] = false;
                                                        };
                                                        if (typeof element.data_set[i][2] === "undefined") {
                                                            element.data_set[i][2] = element.data_set[i][1];
                                                        };
                                                        data1.push(element.data_set[i][0]);
                                                        data2.push(element.data_set[i][2]);
                                                    };
                                                    rootd.setMultiChoiceItems(data1, data2, function(dialog, index, state) {
                                                        element.data_set[index][2] = state;
                                                        if (typeof element.onSelect === "function") {
                                                            //Проверка типа параметра
                                                            element.onSelect(element.data_set[index][0], index, state);
                                                        };
                                                    });
                                                } else {
                                                    //Если диалог пуст по элементам, создаст с таким текстом:
                                                    rootd.setMessage("Элементы не заданы.");
                                                };
                                                rootd.setPositiveButton("Вернутся", null);
                                                rootd.show();
                                            }
                                        }));
                                        element_layout.addView(textview);
                                        element_layout.addView(button);
                                        root.addView(element_layout);
                                        break;
                                    default: //Тип элемента неправильно установлен
                                        Logger.Log("Error!\nCannot create element «"+key+"» with type «"+element.type+"», perhaps type «"+element.type+"» doesn't exist");
                                        break;
                                };
                                //Добавление подсказки элементу
                                addHint(textview, element, key);
                                //Установка прокрутки текста кнопки элемента
                                if (typeof element.enableScrolling === "boolean") {
                                    if (element.enableScrolling) {
                                        setAutoScrolling(button);
                                    }
                                } else {
                                    setAutoScrolling(button);
                                };

                                dialog.setView(menu_container);

                                //Установление имени и стиля меню
                                let dialog
                                if (typeof object.menu.title === "string" || typeof object.menu.title === "number") {
                                    if (typeof object.drawing.menuStyle !== "undefined") {
                                        dialog = new AlertDialog.Builder(ctx, object.drawing.menuStyle);
                                        dialog.setTitle(String(object.menu.title));
                                    } else {
                                        dialog = new AlertDialog.Builder(ctx, android.R.style.Theme_Material_Dialog_Alert);
                                        dialog.setTitle(String(object.menu.title));
                                    }
                                } else {
                                    Logger.Log("Error!\nUnable to create your menu title, check that the value of the «text» property of the «menu» object is a string or numeric")
                                };

                                //Установка положительной кнопки
                                if (typeof object.menu.positiveButton === "object") {
                                    if (typeof object.menu.positiveButton.text === "string" || typeof object.menu.positiveButton.text === "number") {
                                        if (typeof object.menu.positiveButton.onClick === "function") {
                                            dialog.setPositiveButton(object.menu.positiveButton.text, new DialogInterface.OnClickListener({
                                                onClick: function() {
                                                    object.menu.positiveButton.onClick();
                                                }
                                            }));
                                        } else {
                                            Logger.Log("Error!\nUnable to create the «onClick» function of the positive button for your menu, check that the value type of the «onClick» property of the «positiveButton» object of the «menu» object is «fufunctio")
                                        }
                                    } else {
                                        Logger.Log("Error!\nUnable to set positive button name for your menu, check that the value of the «text» property of the «positiveButton» object of the «menu» object is string or numeric")
                                    }
                                } else {
                                    Logger.Log("Error!\nUnable to create a positive button for your menu, check that the «positiveButton» property of the «menu» object is of type «object»")
                                };

                                //Установка негативной кнопки
                                if (typeof object.menu.negativeButton === "object") {
                                    if (typeof object.menu.negativeButton.text === "string" || typeof object.menu.negativeButton.text === "number") {
                                        if (typeof object.menu.negativeButton.onClick === "function") {
                                            dialog.setNegativeButton(object.menu.negativeButton.text, new DialogInterface.OnClickListener({
                                                onClick: function() {
                                                    object.menu.negativeButton.onClick();
                                                }
                                            }));
                                        } else {
                                            Logger.Log("Error!\nUnable to create the «onClick» function of the negative button for your menu, check that the value type of the «onClick» property of the «negativeButton» object of the «menu» object is «function»")
                                        }
                                    } else {
                                        Logger.Log("Error!\nUnable to set negative button name for your menu, check that the value of the «text» property of the «negativeButton» object of the «menu» object is string or numeric")
                                    }
                                };

                                //Установка нейтральной кнопки
                                if (typeof object.menu.neutralButton === "object") {
                                    if (typeof object.menu.neutralButton.text === "string" || typeof object.menu.neutralButton.text === "number") {
                                        if (typeof object.menu.neutralButton.onClick === "function") {
                                            dialog.setNeutralButton(object.menu.neutralButton.text, new DialogInterface.OnClickListener({
                                                onClick: function() {
                                                    object.menu.neutralButton.onClick();
                                                }
                                            }));
                                        } else {
                                            Logger.Log("Error!\nUnable to create the «onClick» function of the neutral button for your menu, check that the value type of the «onClick» property of the «neutralButton» object of the «menu» object is «function»")
                                        }
                                    } else {
                                        Logger.Log("Error!\nUnable to set neutral button name for your menu, check that the value of the «text» property of the «neutralButton» object of the «menu» object is string or numeric")
                                    }
                                };

                                //Установка анимации и запуск меню
                                const launchMenu = dialog.show();
                                if (typeof object.drawing.animation === "number") {
                                    launchMenu.getWindow().getDecorView().getChildAt(0).startAnimation(android.view.animation.AnimationUtils.loadAnimation(d.getContext(), object.menu.drawing.animation));
                                } else {
                                    launchMenu.getWindow().getDecorView().getChildAt(0).startAnimation(android.view.animation.AnimationUtils.loadAnimation(d.getContext(), android.R.anim.slide_out_right));
                                };
                            }
                        } catch(err) {
                            throw new Error("Unknown error!\n" + err);
                        };
                    }
                })
            );
        };

        /*
        this.update = function() {};
        this.close = function() {};
        */ //не создано из за отсутствия навыков

        //Создание функции получения объекта меню
        this.getContent = function() {
            return object
        };
    }
}