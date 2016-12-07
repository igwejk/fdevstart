/**
 * @copyright (c) 2016 Gerd Forstmann
 */
"use strict";
var debug = require('debug');
var debuglog = debug('plainrecognizer');
var AnyObject = Object;
function recognize(sString, mRules) {
    var res = undefined;
    mRules.every(function (oRule) {
        res = matchRegularExpression(sString, oRule);
        return !res;
    });
    return res;
}
exports.recognize = recognize;
function countParenGroups(s) {
    var res = 0;
    for (var i = 0; i < s.length; ++i) {
        if (s.charAt(i) === '(') {
            ++res;
        }
    }
    return res;
}
exports.countParenGroups = countParenGroups;
/**
 * given a string, e.g.
 * "who is the <category> of <A1>",
 * @param {string} a
 * @returns {IMatch.IRule} a regexp rule
 */
function parseRuleString(a) {
    var s = "^" + a + "$";
    var argMaps = {};
    var m = undefined;
    while (m = /<([^>]+)>/.exec(s)) {
        var cat = m[1];
        var pos = 1 + countParenGroups(s.substring(0, m.index));
        s = s.replace("<" + cat + ">", "(.*)");
        if (argMaps[cat]) {
            throw Error("Model error duplicate entry!");
        }
        argMaps[cat] = pos;
    }
    return {
        type: 1,
        regexp: new RegExp(s, "i"),
        argsMap: argMaps
    };
}
exports.parseRuleString = parseRuleString;
/**
 * given a string, e.g.
 * "who is the <category> of <A1>",
 * @param {string} a
 * @returns {IMatch.IRule} a regexp rule
 */
function parseRuleArray(a) {
    var s = "^" + a + "$";
    var r = a[0];
    if (typeof a[0] === "string") {
        r = new RegExp(a[0], "i");
    }
    if (!(r instanceof RegExp)) {
        throw Error("illegal state" + JSON.stringify(a));
    }
    return {
        type: 1,
        regexp: r,
        argsMap: a[1]
    };
}
exports.parseRuleArray = parseRuleArray;
function parseRule(a) {
    if (typeof a === 'string') {
        return parseRuleString(a);
    }
    else if (Array.isArray(a)) {
        return parseRuleArray(a);
    }
    throw new Error("unknown rule definition");
}
exports.parseRule = parseRule;
function parseRules(oJSON) {
    var res = {};
    Object.keys(oJSON).forEach(function (sKey) {
        res[sKey] = oJSON[sKey].map(function (oRule) {
            return parseRule(oRule);
        });
    });
    return res;
}
exports.parseRules = parseRules;
;
function extractArgsMap(s, match, argsMap) {
    if (!argsMap) {
        return [];
    }
    var result = [];
    Object.keys(argsMap).forEach(function (sKey) {
        var res = {};
        var index = argsMap[sKey];
        var value = match[index];
        if ((typeof value === "string") && value.length > 0) {
            res.type = sKey;
            res.entity = value;
            res.startIndex = s.indexOf(value); // this may not be precise
            res.endIndex = res.startIndex + value.length;
            //res[sKey] = value
            result.push(res);
        }
    });
    return result;
}
exports.extractArgsMap = extractArgsMap;
function matchRegularExpression(text, oRule) {
    debuglog("regexp is " + oRule.regexp.toString());
    debuglog(" text is " + text);
    var m = oRule.regexp.exec(text);
    if (!m) {
        return undefined;
    }
    var res = {};
    res.entities = extractArgsMap(text, m, oRule.argsMap);
    res.score = 0.9;
    debuglog("match " + JSON.stringify(m));
    debuglog('Found one' + JSON.stringify(res, undefined, 2));
    return res;
}
exports.matchRegularExpression = matchRegularExpression;
function recognizeText(text, aRules) {
    var res = undefined;
    aRules.every(function (oRule) {
        res = matchRegularExpression(text, oRule);
        return !res;
    });
    return res;
}
exports.recognizeText = recognizeText;
var RegExpRecognizer = (function () {
    function RegExpRecognizer(xRules) {
        this.oRules = xRules;
        debuglog("rules " + JSON.stringify(this.oRules));
    }
    ;
    RegExpRecognizer.prototype.recognize = function (context, callback) {
        var u = {};
        var text = context.message.text;
        var that = this;
        debuglog("rules " + JSON.stringify(this.oRules));
        var results = Object.keys(this.oRules).map(function (sKey) {
            var u = recognizeText(text, that.oRules[sKey]);
            if (u) {
                u.intent = sKey;
            }
            return u ? u : undefined;
        }).filter(function (o) { return !!o; });
        if (results.length > 1) {
            /* TODO abiguous */
            debuglog("ambiguous result for >" + text + "<" + JSON.stringify(res));
        }
        if (results.length > 0) {
            var res = results[0];
            callback(undefined, res);
            return;
        }
        debuglog('recognizing nothing');
        u.intent = "None";
        u.score = 0.1;
        var e1 = {};
        e1.startIndex = "exit ".length;
        e1.endIndex = context.message.text.length;
        e1.score = 0.1;
        u.entities = [];
        callback(undefined, u);
    };
    return RegExpRecognizer;
}());
exports.RegExpRecognizer = RegExpRecognizer; // class

//# sourceMappingURL=plainrecognizer.js.map