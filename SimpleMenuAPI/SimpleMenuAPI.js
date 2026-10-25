/// <reference path="../../toolchain/declarations/android.d.ts" />
/// <reference path="../../toolchain/declarations/core-engine.d.ts" />
/// <reference path="../../toolchain/declarations/ColorHelperLib.d.ts" />
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
    api: "CoreEngine",
    dependencies: ["ColorHelperLib"]
});

IMPORT("ColorHelperLib");

let ValuesCache = {
    themeColor: Object.create(null),
    themeStyle: Object.create(null),
    defaultText: Object.create(null),
    mainDialogWight: 0,
    clearCache: function() {
        ValuesCache.themeColor = Object.create(null);
        ValuesCache.themeStyle = Object.create(null);
        ValuesCache.defaultText = Object.create(null);
        ValuesCache.mainDialogWight = 0;
    }
};

let AttributesReader = {
    getThemeValue: function(ctx, attrId, fallback, valueType) {
        var typedValue = new android.util.TypedValue();
        var theme = ctx.getTheme();

        var ok = theme.resolveAttribute(attrId, typedValue, true);
        if (!ok) ok = theme.resolveAttribute(attrId, typedValue, true);
        if (!ok) return fallback;

        switch (valueType) {
            case 'color':
                if (typedValue.resourceId !== 0) {
                    return ctx.getResources().getColor(typedValue.resourceId, ctx.getTheme());
                }
                return typedValue.data;

            case 'dimension':
                if (typedValue.resourceId !== 0) {
                    return ctx.getResources().getDimensionPixelSize(typedValue.resourceId);
                }
                return typedValue.getDimension(ctx.getResources().getDisplayMetrics());

            case 'resourceId':
                return typedValue.resourceId !== 0 ? typedValue.resourceId : fallback;

            case 'drawable':
                if (typedValue.resourceId !== 0) {
                    return ctx.getResources().getDrawable(typedValue.resourceId, ctx.getTheme());
                }
                return fallback;

            default:
                return typedValue.data;
        }
    },

    getThemeColor: function(ctx, attrId, fallback, cacheKey) {
        var contextId = java.lang.System.identityHashCode(ctx);
        var perContext = ValuesCache.themeColor[contextId];
        if (perContext && perContext[cacheKey] !== undefined) {
            return perContext[cacheKey];
        }

        var resolved = AttributesReader.getThemeValue(ctx, attrId, null, 'color');
        if (resolved === null) return fallback;

        if (!perContext) {
            perContext = Object.create(null);
            ValuesCache.themeColor[contextId] = perContext;
        }
        perContext[cacheKey] = resolved;
        return resolved;
    },

    getColorFromStyle: function(ctx, styleAttrId, styleAttrValue, fallback, cacheKey) {
        var contextId = java.lang.System.identityHashCode(ctx);
        var perContext = ValuesCache.themeStyle[contextId];
        if (perContext && cacheKey && perContext[cacheKey] !== undefined) {
            return perContext[cacheKey];
        }

        var styleId = AttributesReader.getThemeValue(ctx, styleAttrId, 0, 'resourceId');
        var resolved = null;

        if (styleId !== 0) {
            var ta = ctx.obtainStyledAttributes(styleId, [styleAttrValue]);
            try {
                if (ta.hasValue(0)) {
                    resolved = ta.getColor(0, -1);
                }
            } finally {
                ta.recycle();
            }
        }

        if (resolved === null) return fallback;

        if (cacheKey) {
            if (!perContext) {
                perContext = Object.create(null);
                ValuesCache.themeStyle[contextId] = perContext;
            }
            perContext[cacheKey] = resolved;
        }
        return resolved;
    },

    getDialogTitleColor: function(ctx, fallback) {
        var titleColor = AttributesReader.getColorFromStyle(
            ctx,
            android.R.attr.windowTitleStyle,
            android.R.attr.textColor,
            null,
            'dialogTitle'
        );
        if (titleColor !== null) return titleColor;

        var primaryColor = AttributesReader.getThemeColor(
            ctx, android.R.attr.textColorPrimary, null, 'titleFallbackPrimary'
        );
        if (primaryColor !== null) return primaryColor;

        return AttributesReader.getThemeColor(
            ctx, android.R.attr.textColor, fallback, 'titleFallbackText'
        );
    },

    getPrimaryTextColor: function(ctx, fallback) {
        return AttributesReader.getThemeColor(
            ctx, android.R.attr.textColorPrimary, fallback, 'primaryText'
        );
    },

    getSecondaryTextColor: function(ctx, fallback) {
        return AttributesReader.getThemeColor(
            ctx, android.R.attr.textColorSecondary, fallback, 'secondaryText'
        );
    },

    getAccentColor: function(ctx, fallback) {
        return AttributesReader.getThemeColor(
            ctx, android.R.attr.colorAccent, fallback, 'accent'
        );
    },

    getPrimaryColor: function(ctx, fallback) {
        return AttributesReader.getThemeColor(
            ctx, android.R.attr.colorPrimary, fallback, 'primary'
        );
    },

    getPrimaryDarkColor: function(ctx, fallback) {
        return AttributesReader.getThemeColor(
            ctx, android.R.attr.colorPrimaryDark, fallback, 'primaryDark'
        );
    },

    extractColorFromDrawable: function(d) {
        if (d === null || d === undefined) return null;

        if (d instanceof android.graphics.drawable.ColorDrawable) {
            return d.getColor();
        }

        if (d instanceof android.graphics.drawable.GradientDrawable) {
            try {
                var cs = d.getColor();
                if (cs !== null) return cs.getDefaultColor();
            } catch (e) {}
            return null;
        }

        if (d instanceof android.graphics.drawable.InsetDrawable) {
            try {
                return AttributesReader.extractColorFromDrawable(d.getDrawable());
            } catch (e) {
                return null;
            }
        }

        if (d instanceof android.graphics.drawable.LayerDrawable) {
            var n = d.getNumberOfLayers();
            for (var i = n - 1; i >= 0; i--) {
                var c = AttributesReader.extractColorFromDrawable(d.getDrawable(i));
                if (c !== null) return c;
            }
            return null;
        }

        return null;
    },

    getWindowBackground: function(ctx) {
        var contextId = java.lang.System.identityHashCode(ctx);
        var perContext = ValuesCache.themeStyle[contextId];
        if (perContext && perContext.windowBg !== undefined) {
            return perContext.windowBg;
        }

        var d = AttributesReader.getThemeValue(ctx, android.R.attr.windowBackground, null, 'drawable');
        if (d === null) return null;

        if (!perContext) {
            perContext = Object.create(null);
            ValuesCache.themeStyle[contextId] = perContext;
        }
        perContext.windowBg = d;
        return d;
    },

    getWindowBackgroundColor: function(ctx, fallback) {
        var d = AttributesReader.getWindowBackground(ctx);
        if (d === null) return fallback;

        var c = AttributesReader.extractColorFromDrawable(d);
        return c !== null ? c : fallback;
    },

    getSystemText: function(candidateKeys, defaultText) {
        if (!(Array.isArray(candidateKeys) && candidateKeys.length > 0 && candidateKeys.every(function (item) { return typeof item === "string" }))) {
            throw new Error ("[SimpleMenu] getSystemDefaultText(): candidateKeys must be a non-empty string array");
        }
        if (typeof defaultText !== "string") {
            throw new Error("[SimpleMenu] getSystemDefaultText(): defaultText must be a string");
        }
        var systemRes;
        try {
            systemRes = android.content.res.Resources.getSystem();
        } catch (e) {
            Logger.Log("[SimpleMenu] getSystemDefaultText(): cannot get system resources:\n" + e, "WARNING");
            return defaultText;
        }
        var currentLocale = null;
        try {
            var config = systemRes.getConfiguration();
            try {
                var locales = config.locales;
                if (locales && locales.size() > 0) {
                    currentLocale = locales.get(0);
                }
            } catch (e) {}
            if (currentLocale === null) currentLocale = config.locale || java.util.Locale.getDefault();
        } catch (e) {
            Logger.Log("[SimpleMenuAPI] getSystemDefaultText(): cannot read configuration:\n" + e, "WARNING");
        }
        var currentLang = (currentLocale !== null) ? currentLocale.getLanguage() : "en";
        var cacheKey = currentLang + "|" + candidateKeys.join(",");
        if (ValuesCache.defaultText[cacheKey] !== undefined) return ValuesCache.defaultText[cacheKey];
        var enRes = null;
        if (currentLang !== "en") {
            try {
                var app = UI.getContext();
                if (app !== null) {
                    var enConfig = new android.content.res.Configuration(systemRes.getConfiguration());
                    enConfig.setLocale(java.util.Locale.ENGLISH);
                    var enContext = app.createConfigurationContext(enConfig);
                    if (enContext !== null) {
                        enRes = enContext.getResources();
                    }
                }
            } catch (e) {
                Logger.Log("[SimpleMenuAPI] getSystemDefaultText(): EN resources unavailable:\n" + e, "WARNING");
            }
        }
        var result = null;
        var englishFallback = null;
        for (var i = 0; i < candidateKeys.length; i++) {
            var key = candidateKeys[i];
            var id;
            try {
                id = systemRes.getIdentifier(key, "string", "android");
            } catch (e) {
                continue;
            }
            if (id === 0) continue;
            try {
                var strCurrent = systemRes.getString(id);
                if (!strCurrent || !strCurrent.trim()) continue;
                if (currentLang === "en") {
                    result = strCurrent;
                    break;
                }
                var strEn = null;
                if (enRes !== null) {
                    try {
                        strEn = enRes.getString(id);
                    } catch (e) {}
                }
                if (strEn !== null && strCurrent === strEn) {
                    if (englishFallback === null) englishFallback = strCurrent;
                    continue;
                }
                result = strCurrent;
                break;
            } catch (e) {
                Logger.Log("[SimpleMenu] getSystemDefaultText(): failed for key '" + key + "': " + e, "WARNING");
            }
        }
        if (result === null) result = englishFallback || defaultText;
        ValuesCache.defaultText[cacheKey] = result;
        return result;
    },
};

let SimpleMenu = {
    dpToPx: function (dp, context) {
        context = context || UI.getContext();
        let dm = context.getResources().getDisplayMetrics();
        return Math.round(android.util.TypedValue.applyDimension(
            android.util.TypedValue.COMPLEX_UNIT_DIP, dp, dm
        ));
    },

    pxToDp: function (px, context) {
        context = context || UI.getContext();
        let dm = context.getResources().getDisplayMetrics();
        return Math.round(px / dm.density);
    },

    pxToSp: function (px, context) {
        context = context || UI.getContext();
        let dm = context.getResources().getDisplayMetrics();
        return Math.round(px / dm.scaledDensity);
    },

    deepClone: function(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof java.lang.Object) return obj;
        if (obj.getClass && typeof obj.getClass === "function") return obj;

        if (Object.prototype.toString.call(obj) === "[object Array]") {
            var arr = [];
            for (var i = 0; i < obj.length; i++) arr[i] = SimpleMenu.deepClone(obj[i]);
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

    deepEqual: function(a, b) {
    var stack = [];

    function eq(a, b) {
        if (a === b) return true;
        if (typeof a === 'number' && typeof b === 'number' &&
            a !== a && b !== b) {
            return true;
        }
        var typeA = typeof a;
        var typeB = typeof b;
        if (typeA !== 'object' || typeB !== 'object' ||
            a === null || b === null) {
            return false;
        }
        for (var i = 0; i < stack.length; i++) {
            if (stack[i][0] === a && stack[i][1] === b) return true;
        }
        stack.push([a, b]);
        var result = true;
        var key, keysA, keysB, len, j;
        if (a instanceof Date && b instanceof Date) {
            result = a.getTime() === b.getTime();
            stack.pop();
            return result;
        }
        if (a instanceof RegExp && b instanceof RegExp) {
            result = a.toString() === b.toString();
            stack.pop();
            return result;
        }
        var isArrA = Object.prototype.toString.call(a) === '[object Array]';
        var isArrB = Object.prototype.toString.call(b) === '[object Array]';
        if (isArrA !== isArrB) {
            stack.pop();
            return false;
        }
        keysA = [];
        keysB = [];
        for (key in a) {
            if (Object.prototype.hasOwnProperty.call(a, key)) keysA.push(key);
        }
        for (key in b) {
            if (Object.prototype.hasOwnProperty.call(b, key)) keysB.push(key);
        }
        if (keysA.length !== keysB.length) {
        stack.pop();
        return false;
        }
        for (j = 0, len = keysA.length; j < len; j++) {
            key = keysA[j];
            if (!Object.prototype.hasOwnProperty.call(b, key)) {
                result = false;
                break;
            }
            if (!eq(a[key], b[key])) {
                result = false;
                break;
            }
        }
        stack.pop();
        return result;
    }

    return eq(a, b);
    },

    _SCHEMA: function () { 
        return {
            menu: {
                title:             { type: "string", default: __mod__.getName() || __name__ },
                titleParam:        { $ref: "SUB_SCHEMAS.titleParam" },
                isReactivePattern: { type: "boolean", default: true },
                positiveButton:    { $ref: "SUB_SCHEMAS.positiveButton" },
                negativeButton:    { $ref: "SUB_SCHEMAS.negativeButton" },
                neutralButton:     { $ref: "SUB_SCHEMAS.neutralButton" },
                dimBehind:         { type: "boolean", default: "drawing.dimBehind" },
                dialogAlignment:   { type: "alignment as a string",  default: "drawing.dialogAlignment" }
            },

            drawing: {
                cornerRadius:               { type: "number or numeric string", default: 28 },
                dimBehind:                  { type: "boolean", default: true },
                dialogAlignment:            { type: "alignment as a string",  default: "CENTRE" },
                paddingHorizontal:          { type: "number or numeric string", default: 12 },
                titleSize:                  { type: "number or numeric string", default: 20 },
                titleColor:                 { type: "color",            default: null },
                titleAlignment:             { type: "alignment as a string",  default: "CENTRE" },
                menuStyle:                  { type: "menu style as a string", default: "Default" },
                nameSize:                   { type: "number or numeric string", default: 16 },
                nameColor:                  { type: "color",  default: null },
                buttonTextSize:             { type: "number or numeric string", default: 16 },
                buttonTextColor:            { type: "color",  default: null },
                // separatorColor:             { type: "color or color[]",  default: android.graphics.Color.GRAY },
                // separatorHeight:            { type: "number or numeric string", default: 2 },
                // separatorGradientDirection: { type: "gradient direction as a string", default: "LEFT_RIGHT" },
                subtitleSize:                  { type: "number or numeric string", default: 14 },
                subtitleColor:                 { type: "color",            default: null },
                subtitleAlignment:             { type: "alignment as a string",  default: "LEFT" },
                
            },
            
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
                    properties: {
                        text:    { type: "string", default: android.content.res.Resources.getSystem().getString(android.R.string.ok) },
                        onClick: { type: "function",  default: null }
                    }
                },
                negativeButton: {
                    type: "object",
                    properties: {
                        text:    { type: "string", default: android.content.res.Resources.getSystem().getString(android.R.string.cancel) },
                        onClick: { type: "function", default: null  }
                    }
                },
                neutralButton: {
                    type: "object",
                    default: null,
                    properties: {
                        text:    { type: "string", default: AttributesReader.getSystemText(["restore_default", "reset_to_default", "restore_defaults", "reset_default", "reset", "revert", "clear"], "Reset to default") },
                        onClick: { type: "function", default: null  }
                    }
                },
                titleParam: {
                    type: "object",
                    properties:{
                        size:              { type: "number or numeric string", default: "drawing.titleSize" },
                        color:             { type: "color",                    default: "drawing.titleColor" },
                        paddingHorizontal: { type: "number or numeric string", default: "drawing.paddingHorizontal"},
                        paddingTop:        { type: "number or numeric string", default: 18},
                        paddingBottom:     { type: "number or numeric string", default: 10},
                        alignment:         { type: "alignment as a string",    default: "drawing.titleAlignment" },
                    }
                }
            },

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
                        hint:              { $ref: "SUB_SCHEMAS.hint", default: null }
                    },

                    checkbox: {
                        type:              { type: "string" },
                        name:              { type: "string" },
                        onCheck:           { type: "function", default: null },
                        nameSize:          { type: "number or numeric string",   default: "drawing.nameSize" },
                        nameColor:         { type: "color",    default: "drawing.nameColor" },
                        state:             { type: "boolean",  default: false },
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
                        editTextDialog: {
                            type: "object",
                            properties: {
                                // title:              { type: "string", default: "elements.edittext.name" },
                                // titleParam:         { $ref: "SUB_SCHEMAS.titleParam" },
                                text:               { type: "string", default: "" }, 
                                textSize:           { type: "number or numeric string", default: "drawing.nameSize" }, 
                                textColor:          { type: "color", default: "drawing.nameColor" },
                                placeholder:        { type: "string", default: "" },
                                // placeholderOpacity: { type: "number", default: 0.5 },
                                linesCount:         { type: "number", default: 1 },
                                dimBehind:          { type: "boolean", default: "drawing.dimBehind" },
                                dialogAlignment:    { type: "alignment as a string",  default: "drawing.dialogAlignment" },
                                positiveButton:     { $ref: "SUB_SCHEMAS.positiveButton" },
                                neutralButton:      { $ref: "SUB_SCHEMAS.neutralButton", default: null },
                                negativeButton:     { $ref: "SUB_SCHEMAS.negativeButton" }
                            }
                        },
                        onButtonClick:              { type: "function", default: null },
                        beforeTextChange:           { type: "function", default: null },
                        onTextChange:               { type: "function", default: null },
                        afterTextChange:            { type: "function", default: null },
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
                        seekBarDialog: {
                            type: "object",
                            properties: {
                                // title:           { type: "string", default: "elements.seekbar.name" },
                                // titleParam:      { $ref: "SUB_SCHEMAS.titleParam" },
                                min:             { type: "number" },
                                max:             { type: "number" },
                                // step:            { type: "number or numeric string", default: 1 },
                                current:         { type: "number", default: 0 },
                                prefixText:      { type: "string", default: "" },
                                suffixText:      { type: "string", default: "" },
                                textSize:        { type: "number or numeric string", default: "drawing.nameSize" },
                                textColor:       { type: "color", default: "drawing.nameColor" },
                                dimBehind:       { type: "boolean", default: "drawing.dimBehind" },
                                dialogAlignment: { type: "alignment as a string",  default: "drawing.dialogAlignment" },
                                positiveButton:  { $ref: "SUB_SCHEMAS.positiveButton" },
                                neutralButton:   { $ref: "SUB_SCHEMAS.neutralButton", default: null },
                                negativeButton:  { $ref: "SUB_SCHEMAS.negativeButton" }
                            }
                        },
                        onButtonClick:                  { type: "function", default: null },
                        onProgressChange:               { type: "function", default: null },
                        onStartTrackingTouch:           { type: "function", default: null },
                        onStopTrackingTouch:            { type: "function", default: null },
                        hint:                           { $ref: "SUB_SCHEMAS.hint", default: null }
                    },

                    // separator: {
                    //     type:                  { type: "string" },
                    //     name:                  { type: "string", default: null },
                    //     nameSize:              { type: "number or numeric string", default: "drawing.nameSize" },
                    //     nameColor:             { type: "color",  default: "drawing.nameColor" },
                    //     lineGradientDirection: { type: "gradient direction as a string", default: "drawing.separatorGradientDirection" },
                    //     lineColor:             { type: "color or color[]",  default: "drawing.separatorColor" },
                    //     lineHeight:            { type: "number or numeric string", default: "drawing.separatorHeight" }
                    // },
                    section: {
                        type:                  { type: "string" },
                        subtitle:              { type: "string", default: null },
                        subtitleSize:          { type: "number or numeric string", default: "drawing.subtitleSize" },
                        subtitleColor:         { type: "color",  default: "drawing.subtitleColor" },
                        subtitleAlignment:     { type: "alignment as a string",  default: "drawing.subtitleAlignment" },   
                        elements:              { type: "array", $external: true }
                    }
                }
            }
        }
    },

    Create: function(userConfig) {
        userConfig = userConfig || {};
        const SCHEMA = SimpleMenu._SCHEMA();
        
        // ВАЛИДАЦИЯ
        let errors = [];
        let warnings = [];

        var ORIENTATIONS = {
            TOP_BOTTOM: android.graphics.drawable.GradientDrawable.Orientation.TOP_BOTTOM,
            TR_BL:      android.graphics.drawable.GradientDrawable.Orientation.TR_BL,
            RIGHT_LEFT: android.graphics.drawable.GradientDrawable.Orientation.RIGHT_LEFT,
            BR_TL:      android.graphics.drawable.GradientDrawable.Orientation.BR_TL,
            BOTTOM_TOP: android.graphics.drawable.GradientDrawable.Orientation.BOTTOM_TOP,
            BL_TR:      android.graphics.drawable.GradientDrawable.Orientation.BL_TR,
            LEFT_RIGHT: android.graphics.drawable.GradientDrawable.Orientation.LEFT_RIGHT,
            TL_BR:      android.graphics.drawable.GradientDrawable.Orientation.TL_BR
        };
        var ALIGNMENTS = {
            LEFT: android.view.Gravity.START | android.view.Gravity.CENTER_VERTICAL,
            RIGHT: android.view.Gravity.END | android.view.Gravity.CENTER_VERTICAL,
            CENTRE: android.view.Gravity.CENTER,
        };
        var STYLES = {
            Default_Light: android.R.style.Theme_DeviceDefault_Light_Dialog,
            Default: android.R.style.Theme_DeviceDefault_Dialog,
            Material_Light: android.R.style.Theme_Material_Light_Dialog,
            Material: android.R.style.Theme_Material_Dialog
        };
        const POPUP_ANIM_MS = 150;

        let draft_config;
        let isShown = false; 

        // Окно ошибок
        function reportValidation(errors, warnings) {
            if (errors.length === 0 && warnings.length === 0) return;
            if (errors.length > 0) {
                var msg = "\n[SimpleMenuAPI] Create():\n  - " + errors.join("\n  - ");
                if (warnings.length > 0) msg += "\n\nWarnings:\n  - " + warnings.join("\n  - ");
                throw new Error(msg);
            }
            Logger.Log("\n[SimpleMenuAPI] Create():\n  - " + warnings.join("\n  - "), "WARNING"
            );
        }

        // Проверка типов
        function checkType(value, expectedType) {
            if (expectedType === "array") return Array.isArray(value);
            if (expectedType === "color") return ColorHelper.isColor(value);
            if (expectedType === "function") return typeof value === "function";
            if (expectedType === "number or numeric string") {
                if (typeof value === "number") return Number.isFinite(value);
                if (typeof value === "string") {
                    var t = value.trim();
                    return t !== "" && Number.isFinite(Number(t));
                }
                return false;
            }
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
                return ColorHelper.isColor(value) ||
                    (Array.isArray(value) && value.length > 0 && 
                    value.every(ColorHelper.isColor));
            }
            if (expectedType === "gradient direction as a string") {
                return typeof value === "string" && ORIENTATIONS[value] !== undefined;
            }
            if (expectedType === "alignment as a string") {
                return typeof value === "string" && ALIGNMENTS[value] !== undefined;
            }
            if (expectedType === "menu style as a string") {
                return typeof value === "string" && STYLES[value] !== undefined;
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
                return ColorHelper.convertColor(value, "android");
            }
            // Одиночный цвет превращаем в массив [color] и конвертируем все цвета в массиве
            if (expectedType === "color or color[]") {
                var rawArray = Array.isArray(value) ? value : [value];
                var normalizedColors = [];
                for (var i = 0; i < rawArray.length; i++) {
                    normalizedColors.push(ColorHelper.convertColor(rawArray[i], "android"));
                }
                return normalizedColors;
            }
            return value;
        }

        // Логическая валидация элементов
        function sanitizeElementLogic(element, path) {
            if (!element) return element;

            if (element.type === "seekbar") {
                var min = element.seekBarDialog.min;
                var max = element.seekBarDialog.max;
                var current = element.seekBarDialog.current;
                // Если min больше max — меняем их местами
                if (min > max) {
                    warnings.push(path + " (seekbar) 'min' (" + min + ") > 'max' (" + max + "). Swapping values.");
                    element.seekBarDialog.min = max;
                    element.seekBarDialog.max = min;
                    min = element.seekBarDialog.min;
                    max = element.seekBarDialog.max;
                }
                // Подгоняем current под границы [min, max]
                if (current < min) {
                    warnings.push(path + " (seekbar) 'current' (" + current + ") is lower than 'min' (" + min + "). Set to min.");
                    element.seekBarDialog.current = min;
                } else if (current > max) {
                    warnings.push(path + " (seekbar) 'current' (" + current + ") is higher than 'max' (" + max + "). Set to max.");
                    element.seekBarDialog.current = max;
                }
            }

            // Предотвращение выхода за пределы массива
            if (element.type === "selection") {
                if (element.selectedIndex < 0) {
                    warnings.push(path + " (selection) 'selectedIndex' (" + element.selectedIndex + ") is lower than 0. Set to 0.");
                    element.selectedIndex = 0;
                } else if (element.selectedIndex >= element.options.length) {
                    warnings.push(path + " (selection) 'selectedIndex' (" + element.selectedIndex + ") is higher than or equal to 'options.length' (" + element.options.length + "). Set to " + (element.options.length - 1) + ".");
                    element.selectedIndex = element.options.length - 1;
                }
            }

            if (element.type === "multiselection") {
                for (var i = 0; i < element.selectedIndexes.length; i++) {
                    if (element.selectedIndexes[i] < 0) {
                        warnings.push(path + " (multiselection) 'selectedIndexes[" + i + "]' (" + element.selectedIndexes[i] + ") is lower than 0. Set to 0.");
                        element.selectedIndexes[i] = 0;
                    } else if (element.selectedIndexes[i] >= element.options.length) {
                        warnings.push(path + " (multiselection) 'selectedIndexes[" + i + "]' (" + element.selectedIndexes[i] + ") is higher than or equal to 'options.length' (" + element.options.length + "). Set to " + (element.options.length - 1) + ".");
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
                    warnings.push(path + " (multiselection) 'selectedIndexes' contained duplicate values. Deduplicated from " + element.selectedIndexes.length + " to " + unique.length + " item(s).");
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

                if (rules && rules.$external) {
                    result[key] = userSection[key];
                    continue;
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

        function validateElements(userElements, globalSchema, parsedConfig, options) {
            options = options || {};
            var allowSections = options.allowSections !== false;  // по умолчанию разрешены
            var pathPrefix   = options.pathPrefix || "elements";

            if (!Array.isArray(userElements)) return [];

            var validatedList = [];
            var elementsSchema = globalSchema.elements.properties;

            for (var i = 0; i < userElements.length; i++) {
                var item = userElements[i];
                var itemPath = pathPrefix + "[" + i + "]";
                var itemType = item && item.type;

                if (!itemType || !elementsSchema[itemType]) {
                    warnings.push("Element at " + itemPath + " has missing or unknown type '" + itemType + "'");
                    continue;
                }

                // --- Особая ветка: section ---
                if (itemType === "section") {
                    if (!allowSections) {
                        errors.push("Element at " + itemPath + " is 'section', but nested sections are not allowed");
                        continue;
                    }
                    var validSection = validateSection(
                        itemPath + " (section)",
                        item,
                        elementsSchema.section,
                        parsedConfig,
                        globalSchema
                    );

                    // Рекурсивно валидируем содержимое — уже без права на section
                    if (item.elements === undefined || item.elements === null) {
                        warnings.push("Section at " + itemPath + " has no 'elements' and will render as empty");
                        validSection.elements = [];
                    } else if (!Array.isArray(item.elements)) {
                        errors.push("Section at " + itemPath + ": 'elements' must be an array");
                        validSection.elements = [];
                    } else if (item.elements.length === 0) {
                        warnings.push("Section at " + itemPath + " has empty 'elements'");
                        validSection.elements = validateElements(item.elements, globalSchema, parsedConfig, {
                            allowSections: false,
                            pathPrefix: itemPath + ".elements"
                        });
                    } else {
                        validSection.elements = validateElements(item.elements, globalSchema, parsedConfig, {
                            allowSections: false,
                            pathPrefix: itemPath + ".elements"
                        });
                    }

                    validatedList.push(validSection);
                    continue;
                }

                // --- Обычный элемент ---
                var validItem = validateSection(
                    itemPath + " (" + itemType + ")",
                    item,
                    elementsSchema[itemType],
                    parsedConfig,
                    globalSchema
                );
                validItem = sanitizeElementLogic(validItem, itemPath);
                validatedList.push(validItem);
            }
            return validatedList;
        }

        let config = {};
        // Сначала валидируем drawing, чтобы заполнить стандартные значения
        config.drawing = validateSection("drawing", userConfig.drawing, SCHEMA.drawing, config, SCHEMA);
        config.menu = validateSection("menu", userConfig.menu, SCHEMA.menu, config, SCHEMA);
        config.elements = validateElements(userConfig.elements, SCHEMA, config, {allowSections: true, pathPrefix: "elements"});
        // Проверка наличия положительной кнопки при транзакционной модели поведения меню
        if (!config.menu.isReactivePattern && !(typeof config.menu.positiveButton === "object" && config.menu.positiveButton !== null)) {
            errors.push("Positive menu button is not set in main menu object. This element is required for the transactional menu behavior model (the 'isReactivePattern' parameter is set to false).");
        }
        reportValidation(errors, warnings);

        let ctx = new android.view.ContextThemeWrapper(UI.getContext(), STYLES[config.drawing.menuStyle]);
        var THEME_COLORS = {
            title:           ColorHelper.convertColor(AttributesReader.getDialogTitleColor(ctx, null), "android"),
            primaryText:     ColorHelper.convertColor(AttributesReader.getPrimaryTextColor(ctx, null), "android"),
            secondaryText:   ColorHelper.convertColor(AttributesReader.getSecondaryTextColor(ctx, null), "android"),
            accent:          ColorHelper.convertColor(AttributesReader.getAccentColor(ctx, null), "android"),
            primary:         ColorHelper.convertColor(AttributesReader.getPrimaryColor(ctx, null), "android"),
            primaryDark:     ColorHelper.convertColor(AttributesReader.getPrimaryDarkColor(ctx, null), "android"),
            Background:      ColorHelper.convertColor(AttributesReader.getWindowBackgroundColor(ctx, null), "android")
        };

        // CREATE
        let AlertDialog = android.app.AlertDialog;
        let CheckBox = android.widget.CheckBox;
        let DialogInterface = android.content.DialogInterface;
        let EditText = android.widget.EditText;
        // let GradientDrawable = android.graphics.drawable.GradientDrawable;
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
            if (view.getParent() != null) view.getParent().removeView(view);
        };

        function setTextColor(text_view, color_config, theme_color) {
            if (color_config === null){
                if (theme_color !== null){
                    text_view.setTextColor(theme_color);
                }
            } else {
                text_view.setTextColor(ColorHelper.convertColor(color_config, "android"));
            }
        };

        // СЕПАРАТОР
        // function setSeparator(ctx, element_config, content_container) {
        //     let padding = SimpleMenu.dpToPx(config.drawing.paddingHorizontal, ctx);
        //     let textview = new TextView(ctx);
        //     if (element_config.lineColor.length === 1) {
        //         textview.setBackground(new android.graphics.drawable.ColorDrawable(element_config.lineColor[0]));
        //     } else {
        //         textview.setBackground(new GradientDrawable(ORIENTATIONS[element_config.lineGradientDirection], element_config.lineColor));
        //     }
        //     if (element_config.name !== null) {
        //         textview.setText(element_config.name);
        //         textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.nameSize);
        //         setTextColor(textview, element_config.nameColor, THEME_COLORS.primaryText);
        //         textview.setGravity(Gravity.LEFT | Gravity.CENTER_VERTICAL);
        //         let lp = new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
        //         // lp.setMargins(padding, 0, padding, 0);
        //         textview.setPadding(padding, 0, padding, 0);
        //         textview.setLayoutParams(lp);
        //     } else {
        //         let lp = new LinearLayout.LayoutParams(
        //             LayoutParams.MATCH_PARENT, 
        //             SimpleMenu.dpToPx(element_config.lineHeight, ctx), 1)
        //         // lp.setMargins(padding, 0, padding, 0);
        //         textview.setPadding(padding, 0, padding, 0);
        //         textview.setLayoutParams(lp);
        //     };
        //     content_container.addView(textview);
        // };

        // ИМЯ ЭЛЕМЕНТА
        function setName(ctx, element_config, name_container, element_container) {
            let textview = new TextView(ctx);
            textview.setText(element_config.name); // Установление текста
            textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.nameSize); // Установление размера текста
            if (element_config.nameColor !== null) textview.setTextColor(element_config.nameColor);
            let lp = new LinearLayout.LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT
            );
            lp.setMargins(0, SimpleMenu.dpToPx(10, ctx), 0, SimpleMenu.dpToPx(10, ctx));
            textview.setLayoutParams(lp);
            textview.setEllipsize(TextUtils.TruncateAt.END); // Установка отображения
            textview.setMaxLines(2); // Установка количества строк 
            textview.setGravity(Gravity.START | Gravity.CENTER_VERTICAL); // Установка расположения внутри родителя
            if (typeof element_config.hint === "object" && element_config.hint !== null) { //Добавление подсказки элементу
                if(element_config.hint.symbolColor !== null){
                    (textview).setText(Html.fromHtml(textview.getText().replace("\n", "<br>") + " <font color='" + ColorHelper.convertColor(element_config.hint.symbolColor, "hex") + "'>" + element_config.hint.symbol + "</font>")); //не хватает element_config.hint.symbolSize
                } else {
                    (textview).setText(Html.fromHtml(textview.getText().replace("\n", "<br>") + element_config.hint.symbol)); //не хватает element_config.hint.symbolSize
                }
                textview.setOnClickListener(new OnClickListener({
                    onClick: function() {
                        let builder = new AlertDialog.Builder(ctx);
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

            name_container.setPadding(SimpleMenu.dpToPx(config.drawing.paddingHorizontal, ctx), 0, 0, 0);
            name_container.addView(textview);
            element_container.addView(name_container);
        };

        // ДИАЛОГ
        function createAndShowDialog(ctx, dialog_config, builder, isMainMenu, index, positiveFunction) {
            if (typeof dialog_config.positiveButton === "object" && dialog_config.positiveButton !== null) {
                builder.setPositiveButton(dialog_config.positiveButton.text, new DialogInterface.OnClickListener({
                    onClick: function() {
                        positiveFunction();
                        if (typeof dialog_config.positiveButton.onClick === "function"){
                            dialog_config.positiveButton.onClick(builder, index); 
                        }
                    }
                }));
            }
            if (typeof dialog_config.negativeButton === "object" && dialog_config.negativeButton !== null){
                builder.setNegativeButton(dialog_config.negativeButton.text, new DialogInterface.OnClickListener({
                    onClick: function() {
                        if (typeof dialog_config.negativeButton.onClick === "function"){
                            dialog_config.negativeButton.onClick(builder, index);
                        }
                    }
                }));
            }
            if (typeof dialog_config.neutralButton === "object" && dialog_config.neutralButton !== null){
                builder.setNeutralButton(dialog_config.neutralButton.text, new DialogInterface.OnClickListener({
                    onClick: function() {
                        if (typeof dialog_config.neutralButton.onClick === "function"){
                            dialog_config.neutralButton.onClick(builder, index);
                        }
                    }
                }));
            }

            if(isMainMenu){
                let padding = SimpleMenu.dpToPx(dialog_config.titleParam.paddingHorizontal*2, ctx);
                let paddingTop = SimpleMenu.dpToPx(dialog_config.titleParam.paddingTop, ctx);
                let paddingBottom = SimpleMenu.dpToPx(dialog_config.titleParam.paddingBottom, ctx);
                let customTitle = new android.widget.TextView(ctx);
                customTitle.setText(dialog_config.title);
                customTitle.setPadding(padding, paddingTop, padding, paddingBottom);
                customTitle.setGravity(ALIGNMENTS[dialog_config.titleParam.alignment]);
                customTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, dialog_config.titleParam.size);
                setTextColor(customTitle, dialog_config.titleParam.color, THEME_COLORS.title);
                builder.setCustomTitle(customTitle);
            }

            // Закрытие
            var dialog = builder.create();
            let window = dialog.getWindow();
            dialog.setCancelable(true);
            dialog.setCanceledOnTouchOutside(isMainMenu && config.menu.isReactivePattern);
            if (typeof dialog_config.negativeButton === "object" && dialog_config.negativeButton !== null){
                dialog.setOnCancelListener(new DialogInterface.OnCancelListener({
                    onCancel: function(dialog) {
                        if (typeof dialog_config.negativeButton.onClick === "function"){
                            dialog_config.negativeButton.onClick(dialog, index);
                        }
                    }
                }));
            }

            // Обновление флага
            if (isMainMenu) {
                dialog.setOnDismissListener(new DialogInterface.OnDismissListener({
                    onDismiss: function() { isShown = false; }
                }));
            }

            // Затемнение фона диалога
            if (!dialog_config.dimBehind){
                window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            }

            // Выравнивание диалога
            let params = window.getAttributes();
            params.gravity = ALIGNMENTS[dialog_config.dialogAlignment];
            params.x = SimpleMenu.dpToPx(0, ctx);
            params.y = SimpleMenu.dpToPx(0, ctx);

            // Правильный отступ при меньшей ширины дочернего диалога
            let padding = SimpleMenu.dpToPx(config.drawing.paddingHorizontal, ctx);
            if (!isMainMenu && ValuesCache.mainDialogWight > 0) {
                if (dialog_config.dialogAlignment === "LEFT") {
                    params.x = padding;
                } else if (dialog_config.dialogAlignment === "RIGHT") {
                    params.x = -padding;
                } else {
                    params.x = 0;
                }
            }
            
            // Закругление углов
            if (THEME_COLORS.Background !== null) {
                let original = window.getDecorView().getBackground();
                let radius = isMainMenu ?
                    SimpleMenu.dpToPx(config.drawing.cornerRadius, ctx) :
                    SimpleMenu.dpToPx(config.drawing.cornerRadius -
                    config.drawing.paddingHorizontal, ctx);
                let shape = null;
                if (original instanceof android.graphics.drawable.InsetDrawable) {
                    let inner = original.getDrawable();
                    if (inner instanceof android.graphics.drawable.GradientDrawable) {
                        shape = inner;
                    }
                }
                if (shape !== null) {
                    shape.setColor(THEME_COLORS.Background);
                    shape.setCornerRadius(radius);
                } else {
                    shape = new android.graphics.drawable.GradientDrawable();
                    shape.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
                    shape.setColor(THEME_COLORS.Background);
                    shape.setCornerRadius(radius);
                    window.setBackground(shape);
                }
            }
            
            window.setAttributes(params);
            dialog.show();

            // Ширина дочерних диалогов
            if (!isMainMenu && ValuesCache.mainDialogWight > 0) {
                let childWidth = ValuesCache.mainDialogWight - padding*2;
                window.setLayout(childWidth, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
            }

            if (isMainMenu && ValuesCache.mainDialogWight === 0) {
                let decor = window.getDecorView();
                decor.post(new java.lang.Runnable({
                    run: function() {
                        ValuesCache.mainDialogWight = decor.getWidth();
                    }
                }));
            }
        };

        // КНОПКА
        function createButton(ctx, element_config, widget_container, element_container, content_container, index, onClickFunction) {
            const chevronWidth = SimpleMenu.dpToPx(20, ctx);
            // Текст кнопки
            let button_text = new TextView(ctx);
            button_text.setText(element_config.buttonText);
            setTextColor(button_text, element_config.buttonTextColor, THEME_COLORS.primaryText);
            button_text.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.buttonTextSize);
            button_text.setMaxLines(2);
            button_text.setEllipsize(TextUtils.TruncateAt.END);
            button_text.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);
            button_text.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1));
            // Слот шеврона
            let chevron = new TextView(ctx);
            chevron.setText(">");
            chevron.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.buttonTextSize);
            setTextColor(chevron, element_config.buttonTextColor, THEME_COLORS.primaryText);
            chevron.setGravity(Gravity.CENTER);
            chevron.setLayoutParams(new LinearLayout.LayoutParams(chevronWidth, LayoutParams.WRAP_CONTENT));
            widget_container.addView(button_text);
            widget_container.addView(chevron);
            widget_container.setClickable(true);
            widget_container.setPadding(0, 0, SimpleMenu.dpToPx(config.drawing.paddingHorizontal, ctx), 0);
            widget_container.setOnClickListener(new OnClickListener({
                onClick: function(button) {
                    onClickFunction && onClickFunction(element_config, button, index);
                    if (element_config.onButtonClick !== null) element_config.onButtonClick(button, index);
                }
            }));
            element_container.addView(widget_container);
            content_container.addView(element_container);
        };

        // ЧЕКБОКС                               
        function createCheckBox(ctx, element_config, widget_container, element_container, content_container, index) {
            let checkbox = new CheckBox(ctx);
            checkbox.setChecked(element_config.state);
            checkbox.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, 
                LinearLayout.LayoutParams.WRAP_CONTENT
            ));
            checkbox.setOnCheckedChangeListener(new OnCheckedChangeListener({
                onCheckedChanged: function(checkbox, isChecked) {
                    element_config.state = isChecked;
                    if (element_config.onCheck != null) {
                        element_config.onCheck(checkbox, isChecked, index);
                    }
                }
            }));
            widget_container.setPadding(0, 0, SimpleMenu.dpToPx(config.drawing.paddingHorizontal, ctx), 0);
            widget_container.addView(checkbox);
            element_container.addView(widget_container);
            content_container.addView(element_container);
        };

        // ПЕРЕКЛЮЧАТЕЛЬ
        function createSwitch(ctx, element_config, widget_container, element_container, content_container, index) {
            let switcher = new Switch(ctx);
            switcher.setChecked(element_config.state);
            switcher.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, 
                LinearLayout.LayoutParams.WRAP_CONTENT
            ));
            switcher.setOnCheckedChangeListener(new OnCheckedChangeListener({
                onCheckedChanged: function(switcher, isChecked) {
                    element_config.state = isChecked;
                    if (element_config.onSwitch !== null) {
                    element_config.onSwitch(switcher, isChecked, index);
                    }
                }
            }));
            widget_container.setPadding(0, 0, SimpleMenu.dpToPx(config.drawing.paddingHorizontal, ctx), 0);
            widget_container.addView(switcher);
            element_container.addView(widget_container);
            content_container.addView(element_container);
        };

        // получение параметров 
        function getStyledOptions(ctx, options, textSize, textColor) {
            if (!options) return [];
            let result = [];
            // Переводим SP в пиксели для AbsoluteSizeSpan
            let pxSize = null;
            pxSize = Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, textSize, ctx.getResources().getDisplayMetrics()));
            for (let i = 0; i < options.length; i++) {
                let text = String(options[i]);
                let spannable = new android.text.SpannableString(text);
                // Цвет текста
                if (textColor !== null) {
                    spannable.setSpan(new android.text.style.ForegroundColorSpan(textColor), 0, text.length, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                }
                // Размер текста
                if (pxSize !== null) {
                    spannable.setSpan(new android.text.style.AbsoluteSizeSpan(pxSize), 0, text.length, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                }
                result.push(spannable);
            }
            return result;
        };

        // Параметры drawable
        function setDrawable(ctx, shape, type, change, padding, radiusPx, sideElement, sideList){
            if (THEME_COLORS.Background === null) return;

            if (radiusPx !== null){
                let r = SimpleMenu.dpToPx(radiusPx, ctx);
                switch (type){
                    case "single_element":
                        switch (sideList){
                        case true: // лист над элементом
                            shape.setCornerRadii([r, r, 0, 0, r, r, r, r]);
                        break;
                        case false: // лист под элементом
                            shape.setCornerRadii([r, r, r, r, 0, 0, r, r]);
                        break;
                        default: // лист не показан (не менаем элемент)
                            shape.setCornerRadii([r, r, r, r, r, r, r, r]);
                        }
                    break;
                    case "section_element":
                        switch (sideElement){
                            case true: // элемент вверху секции
                                switch (sideList){
                                    case true: // лист над элементом
                                        shape.setCornerRadii([r, r, 0, 0, 0, 0, 0, 0]);
                                    break;
                                    case false: // лист под элементом
                                        shape.setCornerRadii([r, r, r, r, 0, 0, 0, 0]);
                                    break;
                                    default: // лист не показан (не менаем элемент)
                                        shape.setCornerRadii([r, r, r, r, 0, 0, 0, 0]);
                                }
                            break;
                            case false: // элемент внизу секции
                                switch (sideList){
                                    case true: // лист над элементом
                                        shape.setCornerRadii([0, 0, 0, 0, r, r, r, r]);
                                    break;
                                    case false: // лист под элементом
                                        shape.setCornerRadii([0, 0, 0, 0, 0, 0, r, r]);
                                    break;
                                    default: // лист не показан (не менаем элемент)
                                        shape.setCornerRadii([0, 0, 0, 0, r, r, r, r]);
                                }
                            break;
                            default: // элемент в секции по центру
                                shape.setCornerRadii([0, 0, 0, 0, 0, 0, 0, 0]);
                        }
                    break;
                    case "list":
                        switch (sideList){
                            case true: // лист над элементом
                                shape.setCornerRadii([r, r, r, r, 0, 0, 0, 0]);
                            break;
                            case false: // лист под элементом
                                shape.setCornerRadii([0, 0, 0, 0, r, r, r, r]);
                            break;
                            default:
                                shape.setCornerRadii([r, r, r, r, r, r, r, r]);
                        }
                    break;
                    case "section":
                        shape.setCornerRadii([r, r, r, r, r, r, r, r]);
                    break;
                }
            };

            if (change !== null){
                let adjusted = ColorHelper.isDark(THEME_COLORS.Background)
                    ? ColorHelper.lighten(THEME_COLORS.Background, change)
                    : ColorHelper.darken(THEME_COLORS.Background, change);
                shape.setColor(adjusted);
            } else {
                shape.setColor(THEME_COLORS.Background);
            };

            let drawable;
            padding = padding !== null ? SimpleMenu.dpToPx(padding, ctx) : 0;
            if (android.os.Build.VERSION.SDK_INT >= 29) {
                shape.setPadding(padding, 0, padding, 0);
                drawable = shape;
            } else {
                drawable = new android.graphics.drawable.InsetDrawable(shape, padding, 0, padding, 0);
            }

            return drawable;
        };

        // Определение верха или низа
        function isPopupAboveAnchor(listPopup) {
            try {
                let clazz = listPopup.getClass();
                let field = clazz.getDeclaredField("mPopup");
                field.setAccessible(true);
                let popupWindow = field.get(listPopup);
                if (popupWindow != null) {
                    return popupWindow.isAboveAnchor();
                }
            } catch (err) {
                Logger.Log("\n[SimpleMenuAPI]: Reflection error getting render side ListPopupWindow\n" + err, "ERROR");
            }
            return false;
        };

        // Убираем тень у списка
        function disablePopupElevation(listPopup) {
            try {
                let field = listPopup.getClass().getDeclaredField("mPopup");
                field.setAccessible(true);
                let popupWindow = field.get(listPopup);
                if (popupWindow === null) return;
                popupWindow.setElevation(0.5);

                let content = popupWindow.getContentView();
                if (content !== null && android.os.Build.VERSION.SDK_INT >= 21) {
                    content.setElevation(0);
                }
            } catch (err) {
                Logger.Log("\n[SimpleMenuAPI]: Reflection error disabling popup elevation\n" + err, "ERROR");
            }
        };

        // Применение параметров к элементу списка
        function applyListPopupItemStyle(ctx, listPopup) {
            let listView = listPopup.getListView();
            if (listView === null) return;

            let pad = SimpleMenu.dpToPx(config.drawing.paddingHorizontal, ctx);

            let adjust = function(view) {
                if (!(view instanceof android.widget.CheckedTextView)) return;
                view.setPadding(0, view.getPaddingTop(), 0, view.getPaddingBottom());
                view.setCompoundDrawablePadding(pad);
                view.setSingleLine(false);
                view.setMaxLines(2);
                view.setEllipsize(android.text.TextUtils.TruncateAt.END);
            };

            for (let i = 0; i < listView.getChildCount(); i++) adjust(listView.getChildAt(i));

            listView.setOnHierarchyChangeListener(new android.view.ViewGroup.OnHierarchyChangeListener({
                onChildViewAdded: function(parent, child) { adjust(child); },
                onChildViewRemoved: function(parent, child) {}
            }));
        };

        // Анимация закрытия
        function setPopupExitSlide(listPopup, isAbove) {
            if (android.os.Build.VERSION.SDK_INT < 23) return;
            try {
                let field = listPopup.getClass().getDeclaredField("mPopup");
                field.setAccessible(true);
                let popupWindow = field.get(listPopup);
                if (popupWindow === null) return;

                let gravity = isAbove
                    ? android.view.Gravity.BOTTOM
                    : android.view.Gravity.TOP;

                let slide = new android.transition.Slide(gravity);
                slide.setDuration(POPUP_ANIM_MS);
                popupWindow.setExitTransition(slide);
            } catch (err) {
                Logger.Log("\n[SimpleMenuAPI]: Reflection error setting popup exit transition\n" + err, "ERROR");
            }
        };

        // СЕЛЕКТОР
        function createSelection(ctx, element_config, widget_container, element_container, content_container, element_shape, element_type, element_side, index) {
            if (element_config.buttonText === null) {
                element_config.buttonText = element_config.options[element_config.selectedIndex];
            }

            let openSpinner = function(element_config, button, elementIndex) {
                let listPopup = new android.widget.ListPopupWindow(ctx);

                let styledOptions = getStyledOptions(
                    ctx, element_config.options,
                    element_config.buttonTextSize,
                    element_config.buttonTextColor
                );

                let adapter = new android.widget.ArrayAdapter(
                    ctx, android.R.layout.simple_list_item_single_choice, styledOptions
                );
                listPopup.setAdapter(adapter);
                listPopup.setAnchorView(button);
                listPopup.setModal(true);
                listPopup.setSelection(element_config.selectedIndex);

                let list_shape = new android.graphics.drawable.GradientDrawable();
                list_shape.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE)
                // ЛИСТ: цвет и отступы
                listPopup.setBackgroundDrawable(
                    setDrawable(ctx, list_shape, "list", 10,
                        config.drawing.paddingHorizontal, null,  null, null));
                listPopup.setWidth(button.getWidth());

                // Убираем тень у списка
                disablePopupElevation(listPopup);

                // Ограничение высоты + нативный скролл
                let maxHeight = Math.floor(ctx.getResources().getDisplayMetrics().heightPixels * 0.45);
                let estimatedHeight = (element_config.options ? element_config.options.length : 0) * SimpleMenu.dpToPx(48, ctx);
                if (estimatedHeight > maxHeight) listPopup.setHeight(maxHeight);

                listPopup.setOnItemClickListener(new android.widget.AdapterView.OnItemClickListener({
                    onItemClick: function(list, item, position, itemId) {
                        element_config.selectedIndex = position;
                        if (element_config.onSelect !== null) {
                            element_config.onSelect(list, item, position, itemId, elementIndex);
                        }
                        listPopup.dismiss();
                    }
                }));

                listPopup.show();

                // Определение верха или низа
                let isAbove = isPopupAboveAnchor(listPopup);
                // ЛИСТ: углы и направление
                setDrawable(ctx, list_shape, "list", 10, config.drawing.paddingHorizontal,
                    config.drawing.cornerRadius - config.drawing.paddingHorizontal, 
                    element_side, isAbove);
                // ЭЛЕМЕНТ: Установка параметрв
                setDrawable(ctx, element_shape, element_type, 10, null,
                    config.drawing.cornerRadius - config.drawing.paddingHorizontal,
                    element_side, isAbove);

                button.post(new Runnable({
                    run: function() {
                        let listView = listPopup.getListView();
                        if (listView === null) return;
                        listView.setChoiceMode(android.widget.ListView.CHOICE_MODE_SINGLE);
                        listView.setItemChecked(element_config.selectedIndex, true);
                        // применение параметров к элементу списка
                        applyListPopupItemStyle(ctx, listPopup);
                    }
                }));

                // Анимация закрытия
                setPopupExitSlide(listPopup, isAbove);
                // Закрытие списка
                listPopup.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                    onDismiss: function() {
                        element_container.postDelayed(new Runnable({
                            run: function() {
                                // ЭЛЕМЕНТ: Сброс параметров
                                setDrawable(ctx, element_shape, element_type, 5, null,
                                    config.drawing.cornerRadius - config.drawing.paddingHorizontal, 
                                    element_side, null);
                            }
                        }), POPUP_ANIM_MS);
                    }
                }));
            };
            createButton(ctx, element_config, widget_container, element_container, content_container, index, openSpinner);
        };

        // МУЛЬТИСЕЛЕКТОР
        function createMultiSelection(ctx, element_config, widget_container, element_container, content_container, element_shape, element_type, element_side, index) {
            if (element_config.buttonText === null) {
                element_config.buttonText = element_config.selectedIndexes
                    .map(function (i) { return element_config.options[i]; })
                    .join(", ");
            }

            let openMultiSpinner = function(element_config, button, elementIndex) {
                let listPopup = new android.widget.ListPopupWindow(ctx);
                let target = element_config.selectedIndexes;

                let styledOptions = getStyledOptions(
                    ctx, element_config.options,
                    element_config.buttonTextSize,
                    element_config.buttonTextColor
                );

                let adapter = new android.widget.ArrayAdapter(
                    ctx,
                    android.R.layout.simple_list_item_multiple_choice,
                    styledOptions
                );
                listPopup.setAdapter(adapter);
                listPopup.setAnchorView(button);
                listPopup.setModal(true);

                let list_shape = new android.graphics.drawable.GradientDrawable();
                list_shape.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
                // ЛИСТ: цвет и отступы
                listPopup.setBackgroundDrawable(
                    setDrawable(ctx, list_shape, "list", 10,
                        config.drawing.paddingHorizontal, null, null, null));
                listPopup.setWidth(button.getWidth());

                // Убираем тень у списка
                disablePopupElevation(listPopup);

                // Ограничение высоты + нативный скролл
                let maxHeight = Math.floor(ctx.getResources().getDisplayMetrics().heightPixels * 0.45);
                let estimatedHeight = (element_config.options ? element_config.options.length : 0) * SimpleMenu.dpToPx(48, ctx);
                if (estimatedHeight > maxHeight) listPopup.setHeight(maxHeight);

                listPopup.show();

                // Определение верха или низа
                let isAbove = isPopupAboveAnchor(listPopup);
                // ЛИСТ: углы и направление
                setDrawable(ctx, list_shape, "list", 10, config.drawing.paddingHorizontal,
                    config.drawing.cornerRadius - config.drawing.paddingHorizontal,
                    element_side, isAbove);
                // ЭЛЕМЕНТ: Установка параметров
                setDrawable(ctx, element_shape, element_type, 10, null,
                    config.drawing.cornerRadius - config.drawing.paddingHorizontal,
                    element_side, isAbove);

                button.post(new Runnable({
                    run: function() {
                        let listView = listPopup.getListView();
                        if (listView === null) throw new Error("\n[SimpleMenuAPI] elements[" + index + "] ('multiselection') ListPopupWindow.getListView() returned null after show()");
                        listView.setChoiceMode(android.widget.ListView.CHOICE_MODE_MULTIPLE);
                        for (let i = 0; i < target.length; i++) listView.setItemChecked(target[i], true);

                        listView.setOnItemClickListener(new android.widget.AdapterView.OnItemClickListener({
                            onItemClick: function(list, item, position, itemId) {
                                let i = target.indexOf(position);
                                let isChecked;
                                if (i === -1) {
                                    target.push(position);
                                    isChecked = true;
                                } else {
                                    target.splice(i, 1);
                                    isChecked = false;
                                }
                                listView.setItemChecked(position, isChecked);

                                if (element_config.onItemSelect !== null) {
                                    element_config.onItemSelect(list, item, position, isChecked, itemId, elementIndex);
                                }
                            }
                        }));
                        applyListPopupItemStyle(ctx, listPopup);
                    }
                }));

                // Анимация закрытия
                setPopupExitSlide(listPopup, isAbove);

                // Закрытие списка
                listPopup.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                    onDismiss: function() {
                        if (element_config.onDismissSpinner !== null) {
                            element_config.onDismissSpinner(elementIndex);
                        }
                        element_container.postDelayed(new Runnable({
                            run: function() {
                                // ЭЛЕМЕНТ: Сброс параметров
                                setDrawable(ctx, element_shape, element_type, 5, null,
                                    config.drawing.cornerRadius - config.drawing.paddingHorizontal,
                                    element_side, null);
                            }
                        }), POPUP_ANIM_MS);
                    }
                }));
            };

            createButton(ctx, element_config, widget_container, element_container, content_container, index, openMultiSpinner);
        };

        // ПОЛЗУНОК
        function createSeekBar(ctx, element_config, widget_container, element_container, content_container, index){
            if (element_config.buttonText === null){
                element_config.buttonText = element_config.seekBarDialog.prefixText + element_config.seekBarDialog.current + element_config.seekBarDialog.suffixText
            }
            let openSeekBarDialog = function(element_config, button, elementIndex){
                let seekbar = new SeekBar(ctx);
                let layout = new LinearLayout(ctx);
                let textview = new TextView(ctx);
                //let padding = SimpleMenu.dpToPx(element_config.seekBarDialog.titleParam.paddingHorizontal, ctx);
                layout.setOrientation(LinearLayout.VERTICAL);
                layout.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.FILL_PARENT, LinearLayout.LayoutParams.FILL_PARENT));
                textview.setText(element_config.seekBarDialog.prefixText
                    + element_config.seekBarDialog.current
                    + element_config.seekBarDialog.suffixText);
                element_config.seekBarDialog.textColor !== null && textview.setTextColor(element_config.seekBarDialog.textColor);
                textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.seekBarDialog.textSize);
                textview.setTypeface(null, Typeface.BOLD);
                textview.setGravity(Gravity.LEFT);
                //textview.setPadding(padding, SimpleMenu.dpToPx(7, ctx), padding, SimpleMenu.dpToPx(7, ctx));
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
                let dialog = new AlertDialog.Builder(ctx);
                dialog.setView(layout);
                function updateCurrent() {
                    element_config.seekBarDialog.current = seekbar.getProgress();
                }
                createAndShowDialog(ctx, element_config.seekBarDialog, dialog, false, elementIndex, updateCurrent);
            }

            createButton(ctx, element_config, widget_container, element_container, content_container, index, openSeekBarDialog);
        };

        // РЕДАКТИРУЕМЫЙ ТЕКСТ
        function createEditText(ctx, element_config, widget_container, element_container, content_container, index) {
            if (element_config.buttonText === null){
                element_config.buttonText = element_config.editTextDialog.text;
            }
            let openEditTextDialog = function(element_config, button, elementIndex){
                let edittext = new EditText(ctx);
                let layout = new LinearLayout(ctx);
                layout.setOrientation(LinearLayout.VERTICAL);
                layout.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.FILL_PARENT, LinearLayout.LayoutParams.FILL_PARENT));
                edittext.setHint(element_config.editTextDialog.placeholder);
                // edittext.setHintTextColor(...)(element_config.editTextDialog.textColor); для config.editTextDialog.placeholderOpacity
                // edittext.setHintSize(element_config.editTextDialog.textSize);
                edittext.setText(element_config.editTextDialog.text);
                edittext.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.editTextDialog.textSize);
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
                let dialog = new AlertDialog.Builder(ctx);
                dialog.setView(layout);
                function updateCurrent() {
                    element_config.editTextDialog.text = String(edittext.getText());
                }
                createAndShowDialog(ctx, element_config.editTextDialog, dialog, false, elementIndex, updateCurrent);
            }

            createButton(ctx, element_config, widget_container, element_container, content_container, index, openEditTextDialog);
        };

        // ПЕРЕБОР
        function renderElement(ctx, element_config, name_container, widget_container, element_container, content_container, element_shape, element_type, element_side, index, key){
            switch (key) {
                // case "separator":
                //     setSeparator(ctx, element_config, content_container);
                //     break;
                case "button":
                    setName(ctx, element_config, name_container, element_container);
                    createButton(ctx, element_config, widget_container, element_container, content_container, index);
                    break;
                case "checkbox":
                    setName(ctx, element_config, name_container, element_container);
                    createCheckBox(ctx, element_config, widget_container, element_container, content_container, index);
                    break;
                case "switch":
                    setName(ctx, element_config, name_container, element_container);
                    createSwitch(ctx, element_config, widget_container, element_container, content_container, index);
                    break;
                case "selection":
                    setName(ctx, element_config, name_container, element_container);
                    createSelection(ctx, element_config, widget_container, element_container, content_container, element_shape, element_type, element_side, index);
                    break;
                case "multiselection":
                    setName(ctx, element_config, name_container, element_container);
                    createMultiSelection(ctx, element_config, widget_container, element_container, content_container, element_shape, element_type, element_side, index);
                    break;
                case "seekbar":
                    setName(ctx, element_config, name_container, element_container);
                    createSeekBar(ctx, element_config, widget_container, element_container, content_container, index)
                    break;
                case "edittext":
                    setName(ctx, element_config, name_container, element_container);
                    createEditText(ctx, element_config, widget_container, element_container, content_container, index);
                    break;
                
                default:
                    Logger.Log("\n[SimpleMenuAPI] show(): Unknown element '" + element_config.type + "'. Expected one of: " + Object.keys(SCHEMA.elements.properties).join(", "), "WARNING");
            };
        }

        return {
            show: function() {
                if (isShown) return;
                isShown = true;
                let activity = UI.getContext();
                if (!config.menu.isReactivePattern) draft_config = SimpleMenu.deepClone(config);
                let target_config = config.menu.isReactivePattern ? config : draft_config;
                activity.runOnUiThread(
                    new Runnable({
                        run: function() {
                            try {
                                let ctx = new android.view.ContextThemeWrapper(activity, STYLES[config.drawing.menuStyle]);
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

                                let padding = SimpleMenu.dpToPx(config.drawing.paddingHorizontal, ctx);
                                content_container.setOrientation(LinearLayout.VERTICAL);
                                content_container.setGravity(Gravity.CENTER);
                                content_container.setPadding(padding, 0, padding, 0);

                                scrollable_container.addView(content_container);
                                menu_container.addView(scrollable_container);
                                
                                let element_index = 0;
                                // Создание элементов
                                for (let index = 0; index < target_config.elements.length; index++){
                                    let element_config = target_config.elements[index];
                                    element_index++;

                                    if(element_config.type !== "section") {
                                        // Контейнер элемента
                                        let element_container = new LinearLayout(ctx);
                                        let element_params = new LinearLayout.LayoutParams(
                                            LayoutParams.MATCH_PARENT,
                                            LayoutParams.WRAP_CONTENT
                                        );
                                        element_params.setMargins(0, 0, 0, SimpleMenu.dpToPx(config.drawing.paddingHorizontal/2, ctx));
                                        element_container.setLayoutParams(element_params);

                                        element_container.setGravity(Gravity.CENTER_VERTICAL);
                                        element_container.setOrientation(LinearLayout.HORIZONTAL);
                                        element_container.setMinimumHeight(SimpleMenu.dpToPx(48, ctx));

                                        let element_shape = new android.graphics.drawable.GradientDrawable()
                                        element_shape.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);

                                        element_container.setBackground(setDrawable(ctx, element_shape, "single_element", 5, null,
                                            config.drawing.cornerRadius - config.drawing.paddingHorizontal, null, null));

                                        // Контейнер имени элемента
                                        let name_container = new LinearLayout(ctx);
                                        name_container.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, 2));
                                        name_container.setGravity(Gravity.CENTER_VERTICAL);

                                        // Контейнер интерактивного элемента
                                        let widget_container = new LinearLayout(ctx);
                                        widget_container.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, 1));
                                        widget_container.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);

                                        renderElement(ctx, element_config, name_container, widget_container, element_container, content_container, element_shape, "single_element", null, element_index, element_config.type);

                                    } else {
                                        let section_container = new LinearLayout(ctx);
                                        section_container.setOrientation(LinearLayout.VERTICAL);
                                        section_container.setGravity(Gravity.CENTER);

                                        let section_params = new LinearLayout.LayoutParams(
                                            LayoutParams.MATCH_PARENT,
                                            LayoutParams.WRAP_CONTENT
                                        );

                                        section_params.setMargins(0, 0, 0, SimpleMenu.dpToPx(config.drawing.paddingHorizontal/2, ctx));
                                        section_container.setLayoutParams(section_params);

                                        let section_shape = new android.graphics.drawable.GradientDrawable()
                                        section_shape.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);

                                        section_container.setBackground(setDrawable(ctx, section_shape, "section", 5, null,
                                            config.drawing.cornerRadius - config.drawing.paddingHorizontal, null, null));
                                        
                                        if(element_config.subtitle !== null){
                                            let textview = new TextView(ctx);
                                            textview.setText(element_config.subtitle);
                                            textview.setTextSize(TypedValue.COMPLEX_UNIT_SP, element_config.subtitleSize);
                                            setTextColor(textview, element_config.subtitleColor, THEME_COLORS.accent);
                                            let lp = new LinearLayout.LayoutParams(
                                                LayoutParams.MATCH_PARENT,
                                                LayoutParams.WRAP_CONTENT
                                            );
                                            lp.setMargins(padding, SimpleMenu.dpToPx(10, ctx), padding, SimpleMenu.dpToPx(5, ctx));
                                            textview.setLayoutParams(lp);
                                            textview.setEllipsize(TextUtils.TruncateAt.END);
                                            textview.setMaxLines(2); 
                                            textview.setGravity(ALIGNMENTS[element_config.subtitleAlignment]);

                                            let customTypeface = android.graphics.Typeface.create(
                                                android.graphics.Typeface.DEFAULT, // базовый шрифт
                                                500,                               // числовой вес
                                                false                              // не курсив
                                            );
                                            textview.setTypeface(customTypeface);

                                            section_container.addView(textview);
                                        };

                                        for (let jndex = 0; jndex < target_config.elements[index].elements.length; jndex++){
                                            let sectional_element_config = target_config.elements[index].elements[jndex];
                                            element_index++;

                                            // Контейнер элемента
                                            let element_container = new LinearLayout(ctx);
                                            element_container.setLayoutParams(new LinearLayout.LayoutParams(
                                                LayoutParams.MATCH_PARENT,
                                                LayoutParams.WRAP_CONTENT
                                            ));
                                            element_container.setGravity(Gravity.CENTER_VERTICAL);
                                            element_container.setOrientation(LinearLayout.HORIZONTAL);
                                            element_container.setMinimumHeight(SimpleMenu.dpToPx(48, ctx));


                                            let element_shape = new android.graphics.drawable.GradientDrawable()
                                            element_shape.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);

                                            let element_side = null;
                                            if (jndex === target_config.elements[index].elements.length - 1){
                                                element_side = false;
                                            } else if (jndex == 0 && target_config.elements[index].subtitle === null){
                                                element_side = true;
                                            }

                                            let element_type = "section_element";
                                            if(target_config.elements[index].elements.length === 1 && target_config.elements[index].subtitle === null) element_type = "single_element";
                                        
                                            element_container.setBackground(setDrawable(ctx, element_shape, element_type, 5, null,
                                                config.drawing.cornerRadius - config.drawing.paddingHorizontal, element_side, null));

                                            // Контейнер имени элемента
                                            let name_container = new LinearLayout(ctx);
                                            name_container.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, 2));
                                            name_container.setGravity(Gravity.CENTER_VERTICAL);

                                            // Контейнер интерактивного элемента
                                            let widget_container = new LinearLayout(ctx);
                                            widget_container.setLayoutParams(new LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, 1));
                                            widget_container.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);

                                            renderElement(ctx, sectional_element_config, name_container, widget_container, element_container, section_container, element_shape, element_type, element_side, element_index, sectional_element_config.type);
                                        };
                                        content_container.addView(section_container);
                                    }
                                };
                                
                                let builder = new AlertDialog.Builder(ctx).setView(menu_container);
                                let applyChanges = function(){
                                    if (!config.menu.isReactivePattern) config = SimpleMenu.deepClone(draft_config);
                                }
                                createAndShowDialog(ctx, config.menu, builder, true, -1, applyChanges);

                            } catch(err) {
                                isShown = false;
                                Logger.Log("\n[SimpleMenuAPI] show(): Unknown error!\n" + err, "ERROR");
                                throw err;
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
                    let parsed = {};
                    // Сначала валидируем drawing, чтобы заполнить стандартные значения
                    parsed.drawing = validateSection("drawing", newConfig.drawing, SCHEMA.drawing, parsed, SCHEMA);
                    parsed.menu = validateSection("menu", newConfig.menu, SCHEMA.menu, parsed, SCHEMA);
                    parsed.elements = validateElements(newConfig.elements, SCHEMA, parsed);
                    // Проверка наличия положительной кнопки при транзакционной модели поведения меню
                    if (!parsed.menu.isReactivePattern && typeof parsed.menu.positiveButton !== "object") {
                        errors.push("Positive menu button is not set in menu object. This element is required for the transactional menu behavior model (the 'isReactivePattern' parameter is set to false).");
                    }
                    reportValidation(errors, warnings);
                    config = parsed;
                } catch(err) {
                    Logger.Log("\n[SimpleMenuAPI] setContent(): Unknown error!\n" + err, "ERROR");
                    throw err;
                }
            },
            refresh: function() {
                try {
                    
                } catch(err) {
                    Logger.Log("\n[SimpleMenuAPI] refresh(): Unknown error!\n" + err, "ERROR");
                    throw err;
                }
            },
            hide: function() {
                try {
                    
                } catch(err) {
                    Logger.Log("\n[SimpleMenuAPI] hide(): Unknown error!\n" + err, "ERROR");
                    throw err;
                }
            },
            isVisible: function() {
                return isShown;
            }
        };
    }
}

EXPORT("SimpleMenu", SimpleMenu);
EXPORT("AttributesReader", AttributesReader);
EXPORT("ValuesCache ", ValuesCache );