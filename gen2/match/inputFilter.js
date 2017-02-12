"use strict";
/**
 * the input filter stage preprocesses a current context
 *
 * It a) combines multi-segment arguments into one context members
 * It b) attempts to augment the context by additional qualifications
 *           (Mid term generating Alternatives, e.g.
 *                 ClientSideTargetResolution -> unit test?
 *                 ClientSideTargetResolution -> source ?
 *           )
 *  Simple rules like  Intent
 *
 *
 * @module jfseb.fdevstart.inputFilter
 * @file inputFilter.ts
 * @copyright (c) 2016 Gerd Forstmann
 */
// <reference path="../../lib/node-4.d.ts" />

var distance = require("../utils/damerauLevenshtein");
var Logger = require("../utils/logger");
var logger = Logger.logger('inputFilter');
var debug = require("debug");
var debugperf = debug('perf');
var utils = require("../utils/utils");
var Algol = require("./algol");
var breakdown = require("./breakdown");
var AnyObject = Object;
var debuglog = debug('inputFilter');
var debuglogV = debug('inputVFilter');
var debuglogM = debug('inputMFilter');
var matchdata = require("./matchdata");
var oUnitTests = matchdata.oUnitTests;
/**
 * @param sText {string} the text to match to NavTargetResolution
 * @param sText2 {string} the query text, e.g. NavTarget
 *
 * @return the distance, note that is is *not* symmetric!
 */
function calcDistance(sText1, sText2) {
    return distance.calcDistance(sText1, sText2);
}
exports.calcDistance = calcDistance;
/**
 * @param sText {string} the text to match to NavTargetResolution
 * @param sText2 {string} the query text, e.g. NavTarget
 *
 * @return the distance, note that is is *not* symmetric!
 */
function calcDistanceLeven(sText1, sText2) {
    // console.log("length2" + sText1 + " - " + sText2)
    if (sText1.length - sText2.length > Algol.calcDist.lengthDelta1 || sText2.length > 1.5 * sText1.length || sText2.length < sText1.length / 2) {
        return 50000;
    }
    var a0 = distance.levenshtein(sText1.substring(0, sText2.length), sText2);
    if (debuglogV.enabled) {
        debuglogV("distance" + a0 + "stripped>" + sText1.substring(0, sText2.length) + "<>" + sText2 + "<");
    }
    if (a0 * 50 > 15 * sText2.length) {
        return 40000;
    }
    var a = distance.levenshtein(sText1, sText2);
    return a0 * 500 / sText2.length + a;
}
exports.calcDistanceLeven = calcDistanceLeven;
var IFMatch = require("../match/ifmatch");
//const levenCutoff = Algol.Cutoff_LevenShtein;
function levenPenaltyOld(i) {
    // 0-> 1
    // 1 -> 0.1
    // 150 ->  0.8
    if (i === 0) {
        return 1;
    }
    // reverse may be better than linear
    return 1 + i * (0.8 - 1) / 150;
}
exports.levenPenaltyOld = levenPenaltyOld;
function levenPenalty(i) {
    // 1 -> 1
    // cutOff => 0.8
    return i;
    //return   1 -  (1 - i) *0.2/Algol.Cutoff_WordMatch;
}
exports.levenPenalty = levenPenalty;
function nonPrivateKeys(oA) {
    return Object.keys(oA).filter(function (key) {
        return key[0] !== '_';
    });
}
function countAinB(oA, oB, fnCompare, aKeyIgnore) {
    aKeyIgnore = Array.isArray(aKeyIgnore) ? aKeyIgnore : typeof aKeyIgnore === "string" ? [aKeyIgnore] : [];
    fnCompare = fnCompare || function () {
        return true;
    };
    return nonPrivateKeys(oA).filter(function (key) {
        return aKeyIgnore.indexOf(key) < 0;
    }).reduce(function (prev, key) {
        if (Object.prototype.hasOwnProperty.call(oB, key)) {
            prev = prev + (fnCompare(oA[key], oB[key], key) ? 1 : 0);
        }
        return prev;
    }, 0);
}
exports.countAinB = countAinB;
function spuriousAnotInB(oA, oB, aKeyIgnore) {
    aKeyIgnore = Array.isArray(aKeyIgnore) ? aKeyIgnore : typeof aKeyIgnore === "string" ? [aKeyIgnore] : [];
    return nonPrivateKeys(oA).filter(function (key) {
        return aKeyIgnore.indexOf(key) < 0;
    }).reduce(function (prev, key) {
        if (!Object.prototype.hasOwnProperty.call(oB, key)) {
            prev = prev + 1;
        }
        return prev;
    }, 0);
}
exports.spuriousAnotInB = spuriousAnotInB;
function lowerCase(o) {
    if (typeof o === "string") {
        return o.toLowerCase();
    }
    return o;
}
function compareContext(oA, oB, aKeyIgnore) {
    var equal = countAinB(oA, oB, function (a, b) {
        return lowerCase(a) === lowerCase(b);
    }, aKeyIgnore);
    var different = countAinB(oA, oB, function (a, b) {
        return lowerCase(a) !== lowerCase(b);
    }, aKeyIgnore);
    var spuriousL = spuriousAnotInB(oA, oB, aKeyIgnore);
    var spuriousR = spuriousAnotInB(oB, oA, aKeyIgnore);
    return {
        equal: equal,
        different: different,
        spuriousL: spuriousL,
        spuriousR: spuriousR
    };
}
exports.compareContext = compareContext;
function sortByRank(a, b) {
    var r = -((a._ranking || 1.0) - (b._ranking || 1.0));
    if (r) {
        return r;
    }
    if (a.category && b.category) {
        r = a.category.localeCompare(b.category);
        if (r) {
            return r;
        }
    }
    if (a.matchedString && b.matchedString) {
        r = a.matchedString.localeCompare(b.matchedString);
        if (r) {
            return r;
        }
    }
    return 0;
}
function checkOneRule(string, lcString, exact, res, oRule, cntRec) {
    if (debuglogV.enabled) {
        debuglogV('attempting to match rule ' + JSON.stringify(oRule) + " to string \"" + string + "\"");
    }
    switch (oRule.type) {
        case 0 /* WORD */:
            if (!oRule.lowercaseword) {
                throw new Error('rule without a lowercase variant' + JSON.stringify(oRule, undefined, 2));
            }
            ;
            if (exact && oRule.word === string || oRule.lowercaseword === lcString) {
                if (debuglog.enabled) {
                    debuglog("\n!matched exact " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                }
                res.push({
                    string: string,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    _ranking: oRule._ranking || 1.0
                });
            }
            if (!exact && !oRule.exactOnly) {
                var levenmatch = calcDistance(oRule.lowercaseword, lcString);
                /*
                          addCntRec(cntRec,"calcDistance", 1);
                          if(levenmatch < 50) {
                            addCntRec(cntRec,"calcDistanceExp", 1);
                          }
                          if(levenmatch < 40000) {
                            addCntRec(cntRec,"calcDistanceBelow40k", 1);
                          }
                          */
                //if(oRule.lowercaseword === "cosmos") {
                //  console.log("here ranking " + levenmatch + " " + oRule.lowercaseword + " " + lcString);
                //}
                if (levenmatch >= Algol.Cutoff_WordMatch) {
                    addCntRec(cntRec, "calcDistanceOk", 1);
                    var rec = {
                        string: string,
                        matchedString: oRule.matchedString,
                        category: oRule.category,
                        _ranking: (oRule._ranking || 1.0) * levenPenalty(levenmatch),
                        levenmatch: levenmatch
                    };
                    if (debuglog) {
                        debuglog("\n!fuzzy " + levenmatch.toFixed(3) + " " + rec._ranking.toFixed(3) + "  " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                    }
                    res.push(rec);
                }
            }
            break;
        case 1 /* REGEXP */:
            {
                if (debuglog.enabled) {
                    debuglog(JSON.stringify(" here regexp" + JSON.stringify(oRule, undefined, 2)));
                }
                var m = oRule.regexp.exec(string);
                if (m) {
                    res.push({
                        string: string,
                        matchedString: oRule.matchIndex !== undefined && m[oRule.matchIndex] || string,
                        category: oRule.category,
                        _ranking: oRule._ranking || 1.0
                    });
                }
            }
            break;
        default:
            throw new Error("unknown type" + JSON.stringify(oRule, undefined, 2));
    }
}
exports.checkOneRule = checkOneRule;
function checkOneRuleWithOffset(string, lcString, exact, res, oRule, cntRec) {
    if (debuglogV.enabled) {
        debuglogV('attempting to match rule ' + JSON.stringify(oRule) + " to string \"" + string + "\"");
    }
    switch (oRule.type) {
        case 0 /* WORD */:
            if (!oRule.lowercaseword) {
                throw new Error('rule without a lowercase variant' + JSON.stringify(oRule, undefined, 2));
            }
            ;
            if (exact && oRule.word === string || oRule.lowercaseword === lcString) {
                if (debuglog.enabled) {
                    debuglog("\n!matched exact " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                }
                res.push({
                    string: string,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    rule: oRule,
                    _ranking: oRule._ranking || 1.0
                });
            }
            if (!exact && !oRule.exactOnly) {
                var levenmatch = calcDistance(oRule.lowercaseword, lcString);
                /*
                          addCntRec(cntRec,"calcDistance", 1);
                          if(levenmatch < 50) {
                            addCntRec(cntRec,"calcDistanceExp", 1);
                          }
                          if(levenmatch < 40000) {
                            addCntRec(cntRec,"calcDistanceBelow40k", 1);
                          }
                          */
                //if(oRule.lowercaseword === "cosmos") {
                //  console.log("here ranking " + levenmatch + " " + oRule.lowercaseword + " " + lcString);
                //}
                if (levenmatch >= Algol.Cutoff_WordMatch) {
                    //console.log("found rec");
                    addCntRec(cntRec, "calcDistanceOk", 1);
                    var rec = {
                        string: string,
                        rule: oRule,
                        matchedString: oRule.matchedString,
                        category: oRule.category,
                        _ranking: (oRule._ranking || 1.0) * levenPenalty(levenmatch),
                        levenmatch: levenmatch
                    };
                    if (debuglog) {
                        debuglog("\n!CORO: fuzzy " + levenmatch.toFixed(3) + " " + rec._ranking.toFixed(3) + "  \"" + string + "\"=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                    }
                    res.push(rec);
                }
            }
            break;
        case 1 /* REGEXP */:
            {
                if (debuglog.enabled) {
                    debuglog(JSON.stringify(" here regexp" + JSON.stringify(oRule, undefined, 2)));
                }
                var m = oRule.regexp.exec(string);
                if (m) {
                    res.push({
                        string: string,
                        rule: oRule,
                        matchedString: oRule.matchIndex !== undefined && m[oRule.matchIndex] || string,
                        category: oRule.category,
                        _ranking: oRule._ranking || 1.0
                    });
                }
            }
            break;
        default:
            throw new Error("unknown type" + JSON.stringify(oRule, undefined, 2));
    }
}
exports.checkOneRuleWithOffset = checkOneRuleWithOffset;
;
function addCntRec(cntRec, member, number) {
    if (!cntRec || number === 0) {
        return;
    }
    cntRec[member] = (cntRec[member] || 0) + number;
}
function categorizeString(word, exact, oRules, cntRec) {
    // simply apply all rules
    if (debuglogM.enabled) {
        debuglogM("rules : " + JSON.stringify(oRules, undefined, 2));
    }
    var lcString = word.toLowerCase();
    var res = [];
    oRules.forEach(function (oRule) {
        checkOneRule(word, lcString, exact, res, oRule, cntRec);
    });
    res.sort(sortByRank);
    return res;
}
exports.categorizeString = categorizeString;
function categorizeSingleWordWithOffset(word, lcword, exact, oRules, cntRec) {
    // simply apply all rules
    if (debuglogM.enabled) {
        debuglogM("rules : " + JSON.stringify(oRules, undefined, 2));
    }
    var res = [];
    oRules.forEach(function (oRule) {
        checkOneRuleWithOffset(word, lcword, exact, res, oRule, cntRec);
    });
    debuglog("CSWWO: got results for " + lcword + "  " + res.length);
    res.sort(sortByRank);
    return res;
}
exports.categorizeSingleWordWithOffset = categorizeSingleWordWithOffset;
function postFilter(res) {
    res.sort(sortByRank);
    var bestRank = 0;
    //console.log("\npiltered " + JSON.stringify(res));
    if (debuglog.enabled) {
        debuglog("preFilter : \n" + res.map(function (word, index) {
            return index + " " + word._ranking + "  => \"" + word.category + "\" " + word.matchedString;
        }).join("\n"));
    }
    var r = res.filter(function (resx, index) {
        if (index === 0) {
            bestRank = resx._ranking;
            return true;
        }
        // 1-0.9 = 0.1
        // 1- 0.93 = 0.7
        // 1/7
        var delta = bestRank / resx._ranking;
        if (resx.matchedString === res[index - 1].matchedString && resx.category === res[index - 1].category) {
            return false;
        }
        //console.log("\n delta for " + delta + "  " + resx._ranking);
        if (resx.levenmatch && delta > 1.03) {
            return false;
        }
        return true;
    });
    if (debuglog.enabled) {
        debuglog("\nfiltered " + r.length + "/" + res.length + JSON.stringify(r));
    }
    return r;
}
exports.postFilter = postFilter;
function postFilterWithOffset(res) {
    res.sort(sortByRank);
    var bestRank = 0;
    //console.log("\npiltered " + JSON.stringify(res));
    if (debuglog.enabled) {
        debuglog(" preFilter : \n" + res.map(function (word) {
            return " " + word._ranking + "  => \"" + word.category + "\" " + word.matchedString + " ";
        }).join("\n"));
    }
    var r = res.filter(function (resx, index) {
        if (index === 0) {
            bestRank = resx._ranking;
            return true;
        }
        // 1-0.9 = 0.1
        // 1- 0.93 = 0.7
        // 1/7
        var delta = bestRank / resx._ranking;
        if (!(resx.rule && resx.rule.range) && !(res[index - 1].rule && res[index - 1].rule.range) && resx.matchedString === res[index - 1].matchedString && resx.category === res[index - 1].category) {
            return false;
        }
        //console.log("\n delta for " + delta + "  " + resx._ranking);
        if (resx.levenmatch && delta > 1.03) {
            return false;
        }
        return true;
    });
    if (debuglog.enabled) {
        debuglog("\nfiltered " + r.length + "/" + res.length + JSON.stringify(r));
    }
    return r;
}
exports.postFilterWithOffset = postFilterWithOffset;
function categorizeString2(word, exact, rules, cntRec) {
    // simply apply all rules
    if (debuglogM.enabled) {
        debuglogM("rules : " + JSON.stringify(rules, undefined, 2));
    }
    var lcString = word.toLowerCase();
    var res = [];
    if (exact) {
        var r = rules.wordMap[lcString];
        if (r) {
            r.rules.forEach(function (oRule) {
                res.push({
                    string: word,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    _ranking: oRule._ranking || 1.0
                });
            });
        }
        rules.nonWordRules.forEach(function (oRule) {
            checkOneRule(word, lcString, exact, res, oRule, cntRec);
        });
        res.sort(sortByRank);
        return res;
    } else {
        debuglog("categorize non exact" + word + " xx  " + rules.allRules.length);
        return postFilter(categorizeString(word, exact, rules.allRules, cntRec));
    }
}
exports.categorizeString2 = categorizeString2;
function categorizeWordInternalWithOffsets(word, lcword, exact, rules, cntRec) {
    debuglogM("categorize " + lcword + " with offset!!!!!!!!!!!!!!!!!" + exact);
    // simply apply all rules
    if (debuglogM.enabled) {
        debuglogM("rules : " + JSON.stringify(rules, undefined, 2));
    }
    var res = [];
    if (exact) {
        var r = rules.wordMap[lcword];
        if (r) {
            debuglogM(" ....pushing n rules exact for " + lcword + ":" + r.rules.length);
            debuglogM(r.rules.map(function (r, index) {
                return '' + index + ' ' + JSON.stringify(r);
            }).join("\n"));
            r.rules.forEach(function (oRule) {
                res.push({
                    string: word,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    rule: oRule,
                    _ranking: oRule._ranking || 1.0
                });
            });
        }
        rules.nonWordRules.forEach(function (oRule) {
            checkOneRuleWithOffset(word, lcword, exact, res, oRule, cntRec);
        });
        res = postFilterWithOffset(res);
        debuglog("here results for" + word + " res " + res.length);
        debuglogM("here results for" + word + " res " + res.length);
        res.sort(sortByRank);
        return res;
    } else {
        debuglog("categorize non exact" + word + " xx  " + rules.allRules.length);
        var rr = categorizeSingleWordWithOffset(word, lcword, exact, rules.allRules, cntRec);
        //debulogM("fuzzy res " + JSON.stringify(rr));
        return postFilterWithOffset(rr);
    }
}
exports.categorizeWordInternalWithOffsets = categorizeWordInternalWithOffsets;
/**
 *
 * Options may be {
 * matchothers : true,  => only rules where all others match are considered
 * augment : true,
 * override : true }  =>
 *
 */
function matchWord(oRule, context, options) {
    if (context[oRule.key] === undefined) {
        return undefined;
    }
    var s1 = context[oRule.key].toLowerCase();
    var s2 = oRule.word.toLowerCase();
    options = options || {};
    var delta = compareContext(context, oRule.follows, oRule.key);
    if (debuglog.enabled) {
        debuglog(JSON.stringify(delta));
        debuglog(JSON.stringify(options));
    }
    if (options.matchothers && delta.different > 0) {
        return undefined;
    }
    var c = calcDistance(s2, s1);
    if (debuglog.enabled) {
        debuglog(" s1 <> s2 " + s1 + "<>" + s2 + "  =>: " + c);
    }
    if (c > 0.80) {
        var res = AnyObject.assign({}, oRule.follows);
        res = AnyObject.assign(res, context);
        if (options.override) {
            res = AnyObject.assign(res, oRule.follows);
        }
        // force key property
        // console.log(' objectcategory', res['systemObjectCategory']);
        res[oRule.key] = oRule.follows[oRule.key] || res[oRule.key];
        res._weight = AnyObject.assign({}, res._weight);
        res._weight[oRule.key] = c;
        Object.freeze(res);
        if (debuglog.enabled) {
            debuglog('Found one' + JSON.stringify(res, undefined, 2));
        }
        return res;
    }
    return undefined;
}
exports.matchWord = matchWord;
function extractArgsMap(match, argsMap) {
    var res = {};
    if (!argsMap) {
        return res;
    }
    Object.keys(argsMap).forEach(function (iKey) {
        var value = match[iKey];
        var key = argsMap[iKey];
        if (typeof value === "string" && value.length > 0) {
            res[key] = value;
        }
    });
    return res;
}
exports.extractArgsMap = extractArgsMap;
exports.RankWord = {
    hasAbove: function hasAbove(lst, border) {
        return !lst.every(function (oMember) {
            return oMember._ranking < border;
        });
    },
    takeFirstN: function takeFirstN(lst, n) {
        var lastRanking = 1.0;
        var cntRanged = 0;
        return lst.filter(function (oMember, iIndex) {
            var isRanged = !!(oMember["rule"] && oMember["rule"].range);
            if (isRanged) {
                cntRanged += 1;
                return true;
            }
            if (iIndex - cntRanged < n || oMember._ranking === lastRanking) {
                lastRanking = oMember._ranking;
                return true;
            }
            return false;
        });
    },
    takeAbove: function takeAbove(lst, border) {
        return lst.filter(function (oMember) {
            return oMember._ranking >= border;
        });
    }
};
/*
var exactLen = 0;
var fuzzyLen = 0;
var fuzzyCnt = 0;
var exactCnt = 0;
var totalCnt = 0;
var totalLen = 0;
var retainedCnt = 0;

export function resetCnt() {
  exactLen = 0;
  fuzzyLen = 0;
  fuzzyCnt = 0;
  exactCnt = 0;
  totalCnt = 0;
  totalLen = 0;
  retainedCnt = 0;
}
*/
function categorizeWordWithRankCutoff(sWordGroup, splitRules, cntRec) {
    var seenIt = categorizeString2(sWordGroup, true, splitRules, cntRec);
    //totalCnt += 1;
    // exactLen += seenIt.length;
    addCntRec(cntRec, 'cntCatExact', 1);
    addCntRec(cntRec, 'cntCatExactRes', seenIt.length);
    if (exports.RankWord.hasAbove(seenIt, 0.8)) {
        if (cntRec) {
            addCntRec(cntRec, 'exactPriorTake', seenIt.length);
        }
        seenIt = exports.RankWord.takeAbove(seenIt, 0.8);
        if (cntRec) {
            addCntRec(cntRec, 'exactAfterTake', seenIt.length);
        }
    } else {
        seenIt = categorizeString2(sWordGroup, false, splitRules, cntRec);
        addCntRec(cntRec, 'cntNonExact', 1);
        addCntRec(cntRec, 'cntNonExactRes', seenIt.length);
    }
    // totalLen += seenIt.length;
    seenIt = exports.RankWord.takeFirstN(seenIt, Algol.Top_N_WordCategorizations);
    // retainedCnt += seenIt.length;
    return seenIt;
}
exports.categorizeWordWithRankCutoff = categorizeWordWithRankCutoff;
/* if we have a  "Run like the Wind"
  an a user type fun like  a Rind , and Rind is an exact match,
  we will not start looking for the long sentence

  this is to be fixed by "spreading" the range indication accross very similar words in the vincinity of the
  target words
*/
function categorizeWordWithOffsetWithRankCutoff(sWordGroup, splitRules, cntRec) {
    var sWordGroupLC = sWordGroup.toLowerCase();
    var seenIt = categorizeWordInternalWithOffsets(sWordGroup, sWordGroupLC, true, splitRules, cntRec);
    //console.log("SEENIT" + JSON.stringify(seenIt));
    //totalCnt += 1;
    // exactLen += seenIt.length;
    //console.log("first run exact " + JSON.stringify(seenIt));
    addCntRec(cntRec, 'cntCatExact', 1);
    addCntRec(cntRec, 'cntCatExactRes', seenIt.length);
    if (exports.RankWord.hasAbove(seenIt, 0.8)) {
        if (cntRec) {
            addCntRec(cntRec, 'exactPriorTake', seenIt.length);
        }
        seenIt = exports.RankWord.takeAbove(seenIt, 0.8);
        if (cntRec) {
            addCntRec(cntRec, 'exactAfterTake', seenIt.length);
        }
    } else {
        seenIt = categorizeWordInternalWithOffsets(sWordGroup, sWordGroupLC, false, splitRules, cntRec);
        addCntRec(cntRec, 'cntNonExact', 1);
        addCntRec(cntRec, 'cntNonExactRes', seenIt.length);
    }
    // totalLen += seenIt.length;
    debuglog(debuglog.enabled ? seenIt.length + " with " + seenIt.reduce(function (prev, obj) {
        return prev + (obj.rule.range ? 1 : 0);
    }, 0) + " ranged !" : '-');
    //  var cntRanged = seenIt.reduce( (prev,obj) => prev + (obj.rule.range ? 1 : 0),0);
    //  console.log(`*********** ${seenIt.length} with ${cntRanged} ranged !`);
    seenIt = exports.RankWord.takeFirstN(seenIt, Algol.Top_N_WordCategorizations);
    // retainedCnt += seenIt.length;
    //console.log("final res of categorizeWordWithOffsetWithRankCutoff" + JSON.stringify(seenIt));
    return seenIt;
}
exports.categorizeWordWithOffsetWithRankCutoff = categorizeWordWithOffsetWithRankCutoff;
function categorizeWordWithOffsetWithRankCutoffSingle(word, rule) {
    var lcword = word.toLowerCase();
    if (lcword === rule.lowercaseword) {
        return {
            string: word,
            matchedString: rule.matchedString,
            category: rule.category,
            rule: rule,
            _ranking: rule._ranking || 1.0
        };
    }
    var res = [];
    checkOneRuleWithOffset(word, lcword, false, res, rule);
    debuglog("catWWOWRCS " + lcword);
    if (res.length) {
        return res[0];
    }
    return undefined;
}
exports.categorizeWordWithOffsetWithRankCutoffSingle = categorizeWordWithOffsetWithRankCutoffSingle;
/*
export function dumpCnt() {
  console.log(`
exactLen = ${exactLen};
exactCnt = ${exactCnt};
fuzzyLen = ${fuzzyLen};
fuzzyCnt = ${fuzzyCnt};
totalCnt = ${totalCnt};
totalLen = ${totalLen};
retainedLen = ${retainedCnt};
  `);
}
*/
function filterRemovingUncategorizedSentence(oSentence) {
    return oSentence.every(function (oWordGroup) {
        return oWordGroup.length > 0;
    });
}
exports.filterRemovingUncategorizedSentence = filterRemovingUncategorizedSentence;
function filterRemovingUncategorized(arr) {
    return arr.filter(function (oSentence) {
        return filterRemovingUncategorizedSentence(oSentence);
    });
}
exports.filterRemovingUncategorized = filterRemovingUncategorized;
function categorizeAWord(sWordGroup, rules, sentence, words, cntRec) {
    var seenIt = words[sWordGroup];
    if (seenIt === undefined) {
        seenIt = categorizeWordWithRankCutoff(sWordGroup, rules, cntRec);
        utils.deepFreeze(seenIt);
        words[sWordGroup] = seenIt;
    }
    if (!seenIt || seenIt.length === 0) {
        logger("***WARNING: Did not find any categorization for \"" + sWordGroup + "\" in sentence \"" + sentence + "\"");
        if (sWordGroup.indexOf(" ") <= 0) {
            debuglog("***WARNING: Did not find any categorization for primitive (!)" + sWordGroup);
        }
        debuglog("***WARNING: Did not find any categorization for " + sWordGroup);
        if (!seenIt) {
            throw new Error("Expecting emtpy list, not undefined for \"" + sWordGroup + "\"");
        }
        words[sWordGroup] = [];
        return [];
    }
    return utils.cloneDeep(seenIt);
}
exports.categorizeAWord = categorizeAWord;
/**
 * Given a  string, break it down into components,
 * [['A', 'B'], ['A B']]
 *
 * then categorizeWords
 * returning
 *
 * [ [[ { category: 'systemId', word : 'A'},
 *      { category: 'otherthing', word : 'A'}
 *    ],
 *    // result of B
 *    [ { category: 'systemId', word : 'B'},
 *      { category: 'otherthing', word : 'A'}
 *      { category: 'anothertryp', word : 'B'}
 *    ]
 *   ],
 * ]]]
 *
 *
 *
 */
function analyzeString(sString, rules, words) {
    var cnt = 0;
    var fac = 1;
    var u = breakdown.breakdownString(sString, Algol.MaxSpacesPerCombinedWord);
    if (debuglog.enabled) {
        debuglog("here breakdown" + JSON.stringify(u));
    }
    //console.log(JSON.stringify(u));
    words = words || {};
    debugperf('this many known words: ' + Object.keys(words).length);
    var res = [];
    var cntRec = {};
    u.forEach(function (aBreakDownSentence) {
        var categorizedSentence = [];
        var isValid = aBreakDownSentence.every(function (sWordGroup, index) {
            var seenIt = categorizeAWord(sWordGroup, rules, sString, words, cntRec);
            if (seenIt.length === 0) {
                return false;
            }
            categorizedSentence[index] = seenIt;
            cnt = cnt + seenIt.length;
            fac = fac * seenIt.length;
            return true;
        });
        if (isValid) {
            res.push(categorizedSentence);
        }
    });
    debuglog(" sentences " + u.length + " matches " + cnt + " fac: " + fac);
    if (debuglog.enabled && u.length) {
        debuglog("first match " + JSON.stringify(u, undefined, 2));
    }
    debugperf(" sentences " + u.length + " / " + res.length + " matches " + cnt + " fac: " + fac + " rec : " + JSON.stringify(cntRec, undefined, 2));
    return res;
}
exports.analyzeString = analyzeString;
function categorizeAWordWithOffsets(sWordGroup, rules, sentence, words, cntRec) {
    var seenIt = words[sWordGroup];
    if (seenIt === undefined) {
        seenIt = categorizeWordWithOffsetWithRankCutoff(sWordGroup, rules, cntRec);
        utils.deepFreeze(seenIt);
        words[sWordGroup] = seenIt;
    }
    if (!seenIt || seenIt.length === 0) {
        logger("***WARNING: Did not find any categorization for \"" + sWordGroup + "\" in sentence \"" + sentence + "\"");
        if (sWordGroup.indexOf(" ") <= 0) {
            debuglog("***WARNING: Did not find any categorization for primitive (!)" + sWordGroup);
        }
        debuglog("***WARNING: Did not find any categorization for " + sWordGroup);
        if (!seenIt) {
            throw new Error("Expecting emtpy list, not undefined for \"" + sWordGroup + "\"");
        }
        words[sWordGroup] = [];
        return [];
    }
    return utils.cloneDeep(seenIt);
}
exports.categorizeAWordWithOffsets = categorizeAWordWithOffsets;
/*
[ [a,b], [c,d]]

00 a
01 b
10 c
11 d
12 c
*/
var clone = utils.cloneDeep;
function copyVecMembers(u) {
    var i = 0;
    for (i = 0; i < u.length; ++i) {
        u[i] = clone(u[i]);
    }
    return u;
}
// we can replicate the tail or the head,
// we replicate the tail as it is smaller.
// [a,b,c ]
function expandMatchArr(deep) {
    var a = [];
    var line = [];
    debuglog(debuglog.enabled ? JSON.stringify(deep) : '-');
    deep.forEach(function (uBreakDownLine, iIndex) {
        line[iIndex] = [];
        uBreakDownLine.forEach(function (aWordGroup, wgIndex) {
            line[iIndex][wgIndex] = [];
            aWordGroup.forEach(function (oWordVariant, iWVIndex) {
                line[iIndex][wgIndex][iWVIndex] = oWordVariant;
            });
        });
    });
    debuglog(debuglog.enabled ? JSON.stringify(line) : '-');
    var res = [];
    var nvecs = [];
    for (var i = 0; i < line.length; ++i) {
        var vecs = [[]];
        var nvecs = [];
        var rvec = [];
        for (var k = 0; k < line[i].length; ++k) {
            //vecs is the vector of all so far seen variants up to k wgs.
            var nextBase = [];
            for (var l = 0; l < line[i][k].length; ++l) {
                //debuglog("vecs now" + JSON.stringify(vecs));
                nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
                //debuglog("vecs copied now" + JSON.stringify(nvecs));
                for (var u = 0; u < vecs.length; ++u) {
                    nvecs[u] = vecs[u].slice(); //
                    nvecs[u] = copyVecMembers(nvecs[u]);
                    // debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
                    nvecs[u].push(clone(line[i][k][l])); // push the lth variant
                }
                //   debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
                //   debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
                nextBase = nextBase.concat(nvecs);
            } //constru
            //  debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
            vecs = nextBase;
        }
        debuglogV(debuglogV.enabled ? "APPENDING TO RES" + i + ":" + l + " >" + JSON.stringify(nextBase) : '-');
        res = res.concat(vecs);
    }
    return res;
}
exports.expandMatchArr = expandMatchArr;
/**
 * Calculate a weight factor for a given distance and
 * category
 * @param {integer} dist distance in words
 * @param {string} category category to use
 * @returns {number} a distance factor >= 1
 *  1.0 for no effect
 */
function reinforceDistWeight(dist, category) {
    var abs = Math.abs(dist);
    return 1.0 + (Algol.aReinforceDistWeight[abs] || 0);
}
exports.reinforceDistWeight = reinforceDistWeight;
/**
 * Given a sentence, extact categories
 */
function extractCategoryMap(oSentence) {
    var res = {};
    debuglog(debuglog.enabled ? 'extractCategoryMap ' + JSON.stringify(oSentence) : '-');
    oSentence.forEach(function (oWord, iIndex) {
        if (oWord.category === IFMatch.CAT_CATEGORY) {
            res[oWord.matchedString] = res[oWord.matchedString] || [];
            res[oWord.matchedString].push({ pos: iIndex });
        }
    });
    utils.deepFreeze(res);
    return res;
}
exports.extractCategoryMap = extractCategoryMap;
function reinForceSentence(oSentence) {
    "use strict";

    var oCategoryMap = extractCategoryMap(oSentence);
    oSentence.forEach(function (oWord, iIndex) {
        var m = oCategoryMap[oWord.category] || [];
        m.forEach(function (oPosition) {
            "use strict";

            oWord.reinforce = oWord.reinforce || 1;
            var boost = reinforceDistWeight(iIndex - oPosition.pos, oWord.category);
            oWord.reinforce *= boost;
            oWord._ranking *= boost;
        });
    });
    oSentence.forEach(function (oWord, iIndex) {
        if (iIndex > 0) {
            if (oSentence[iIndex - 1].category === "meta" && oWord.category === oSentence[iIndex - 1].matchedString) {
                oWord.reinforce = oWord.reinforce || 1;
                var boost = reinforceDistWeight(1, oWord.category);
                oWord.reinforce *= boost;
                oWord._ranking *= boost;
            }
        }
    });
    return oSentence;
}
exports.reinForceSentence = reinForceSentence;
var Sentence = require("./sentence");
function reinForce(aCategorizedArray) {
    "use strict";

    aCategorizedArray.forEach(function (oSentence) {
        reinForceSentence(oSentence);
    });
    aCategorizedArray.sort(Sentence.cmpRankingProduct);
    if (debuglog.enabled) {
        debuglog("after reinforce" + aCategorizedArray.map(function (oSentence) {
            return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
        }).join("\n"));
    }
    return aCategorizedArray;
}
exports.reinForce = reinForce;
/// below may no longer be used
function matchRegExp(oRule, context, options) {
    if (context[oRule.key] === undefined) {
        return undefined;
    }
    var sKey = oRule.key;
    var s1 = context[oRule.key].toLowerCase();
    var reg = oRule.regexp;
    var m = reg.exec(s1);
    if (debuglogV.enabled) {
        debuglogV("applying regexp: " + s1 + " " + JSON.stringify(m));
    }
    if (!m) {
        return undefined;
    }
    options = options || {};
    var delta = compareContext(context, oRule.follows, oRule.key);
    if (debuglogV.enabled) {
        debuglogV(JSON.stringify(delta));
        debuglogV(JSON.stringify(options));
    }
    if (options.matchothers && delta.different > 0) {
        return undefined;
    }
    var oExtractedContext = extractArgsMap(m, oRule.argsMap);
    if (debuglogV.enabled) {
        debuglogV("extracted args " + JSON.stringify(oRule.argsMap));
        debuglogV("match " + JSON.stringify(m));
        debuglogV("extracted args " + JSON.stringify(oExtractedContext));
    }
    var res = AnyObject.assign({}, oRule.follows);
    res = AnyObject.assign(res, oExtractedContext);
    res = AnyObject.assign(res, context);
    if (oExtractedContext[sKey] !== undefined) {
        res[sKey] = oExtractedContext[sKey];
    }
    if (options.override) {
        res = AnyObject.assign(res, oRule.follows);
        res = AnyObject.assign(res, oExtractedContext);
    }
    Object.freeze(res);
    debuglog(debuglog.enabled ? 'Found one' + JSON.stringify(res, undefined, 2) : '-');
    return res;
}
exports.matchRegExp = matchRegExp;
function sortByWeight(sKey, oContextA, oContextB) {
    if (debuglog.enabled) {
        debuglogV('sorting: ' + sKey + 'invoked with\n 1:' + JSON.stringify(oContextA, undefined, 2) + " vs \n 2:" + JSON.stringify(oContextB, undefined, 2));
    }
    var rankingA = parseFloat(oContextA["_ranking"] || "1");
    var rankingB = parseFloat(oContextB["_ranking"] || "1");
    if (rankingA !== rankingB) {
        if (debuglog.enabled) {
            debuglog(" rankin delta" + 100 * (rankingB - rankingA));
        }
        return 100 * (rankingB - rankingA);
    }
    var weightA = oContextA["_weight"] && oContextA["_weight"][sKey] || 0;
    var weightB = oContextB["_weight"] && oContextB["_weight"][sKey] || 0;
    return +(weightB - weightA);
}
exports.sortByWeight = sortByWeight;
// Word, Synonym, Regexp / ExtractionRule
function augmentContext1(context, oRules, options) {
    var sKey = oRules[0].key;
    // check that rule
    if (debuglog.enabled) {
        // check consistency
        oRules.every(function (iRule) {
            if (iRule.key !== sKey) {
                throw new Error("Inhomogenous keys in rules, expected " + sKey + " was " + JSON.stringify(iRule));
            }
            return true;
        });
    }
    // look for rules which match
    var res = oRules.map(function (oRule) {
        // is this rule applicable
        switch (oRule.type) {
            case 0 /* WORD */:
                return matchWord(oRule, context, options);
            case 1 /* REGEXP */:
                return matchRegExp(oRule, context, options);
        }
        return undefined;
    }).filter(function (ores) {
        return !!ores;
    }).sort(sortByWeight.bind(this, sKey));
    //debuglog("hassorted" + JSON.stringify(res,undefined,2));
    return res;
    // Object.keys().forEach(function (sKey) {
    // });
}
exports.augmentContext1 = augmentContext1;
function augmentContext(context, aRules) {
    var options1 = {
        matchothers: true,
        override: false
    };
    var aRes = augmentContext1(context, aRules, options1);
    if (aRes.length === 0) {
        var options2 = {
            matchothers: false,
            override: true
        };
        aRes = augmentContext1(context, aRules, options2);
    }
    return aRes;
}
exports.augmentContext = augmentContext;
function insertOrdered(result, iInsertedMember, limit) {
    // TODO: use some weight
    if (result.length < limit) {
        result.push(iInsertedMember);
    }
    return result;
}
exports.insertOrdered = insertOrdered;
function takeTopN(arr) {
    var u = arr.filter(function (innerArr) {
        return innerArr.length > 0;
    });
    var res = [];
    // shift out the top ones
    u = u.map(function (iArr) {
        var top = iArr.shift();
        res = insertOrdered(res, top, 5);
        return iArr;
    }).filter(function (innerArr) {
        return innerArr.length > 0;
    });
    // as Array<Array<IFMatch.context>>
    return res;
}
exports.takeTopN = takeTopN;
var inputFilterRules = require("./inputFilterRules");
var rm;
function getRMOnce() {
    if (!rm) {
        rm = inputFilterRules.getRuleMap();
    }
    return rm;
}
function applyRules(context) {
    var bestN = [context];
    inputFilterRules.oKeyOrder.forEach(function (sKey) {
        var bestNext = [];
        bestN.forEach(function (oContext) {
            if (oContext[sKey]) {
                debuglog('** applying rules for ' + sKey);
                var res = augmentContext(oContext, getRMOnce()[sKey] || []);
                debuglog(debuglog.enabled ? '** result for ' + sKey + ' = ' + JSON.stringify(res, undefined, 2) : '-');
                bestNext.push(res || []);
            } else {
                // rule not relevant
                bestNext.push([oContext]);
            }
        });
        bestN = takeTopN(bestNext);
    });
    return bestN;
}
exports.applyRules = applyRules;
function applyRulesPickFirst(context) {
    var r = applyRules(context);
    return r && r[0];
}
exports.applyRulesPickFirst = applyRulesPickFirst;
/**
 * Decide whether to requery for a contet
 */
function decideOnReQuery(context) {
    return [];
}
exports.decideOnReQuery = decideOnReQuery;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoL2lucHV0RmlsdGVyLmpzIiwiLi4vc3JjL21hdGNoL2lucHV0RmlsdGVyLnRzIl0sIm5hbWVzIjpbImRpc3RhbmNlIiwicmVxdWlyZSIsIkxvZ2dlciIsImxvZ2dlciIsImRlYnVnIiwiZGVidWdwZXJmIiwidXRpbHMiLCJBbGdvbCIsImJyZWFrZG93biIsIkFueU9iamVjdCIsIk9iamVjdCIsImRlYnVnbG9nIiwiZGVidWdsb2dWIiwiZGVidWdsb2dNIiwibWF0Y2hkYXRhIiwib1VuaXRUZXN0cyIsImNhbGNEaXN0YW5jZSIsInNUZXh0MSIsInNUZXh0MiIsImV4cG9ydHMiLCJjYWxjRGlzdGFuY2VMZXZlbiIsImxlbmd0aCIsImNhbGNEaXN0IiwibGVuZ3RoRGVsdGExIiwiYTAiLCJsZXZlbnNodGVpbiIsInN1YnN0cmluZyIsImVuYWJsZWQiLCJhIiwiSUZNYXRjaCIsImxldmVuUGVuYWx0eU9sZCIsImkiLCJsZXZlblBlbmFsdHkiLCJub25Qcml2YXRlS2V5cyIsIm9BIiwia2V5cyIsImZpbHRlciIsImtleSIsImNvdW50QWluQiIsIm9CIiwiZm5Db21wYXJlIiwiYUtleUlnbm9yZSIsIkFycmF5IiwiaXNBcnJheSIsImluZGV4T2YiLCJyZWR1Y2UiLCJwcmV2IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwic3B1cmlvdXNBbm90SW5CIiwibG93ZXJDYXNlIiwibyIsInRvTG93ZXJDYXNlIiwiY29tcGFyZUNvbnRleHQiLCJlcXVhbCIsImIiLCJkaWZmZXJlbnQiLCJzcHVyaW91c0wiLCJzcHVyaW91c1IiLCJzb3J0QnlSYW5rIiwiciIsIl9yYW5raW5nIiwiY2F0ZWdvcnkiLCJsb2NhbGVDb21wYXJlIiwibWF0Y2hlZFN0cmluZyIsImNoZWNrT25lUnVsZSIsInN0cmluZyIsImxjU3RyaW5nIiwiZXhhY3QiLCJyZXMiLCJvUnVsZSIsImNudFJlYyIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0eXBlIiwibG93ZXJjYXNld29yZCIsIkVycm9yIiwidW5kZWZpbmVkIiwid29yZCIsInB1c2giLCJleGFjdE9ubHkiLCJsZXZlbm1hdGNoIiwiQ3V0b2ZmX1dvcmRNYXRjaCIsImFkZENudFJlYyIsInJlYyIsInRvRml4ZWQiLCJtIiwicmVnZXhwIiwiZXhlYyIsIm1hdGNoSW5kZXgiLCJjaGVja09uZVJ1bGVXaXRoT2Zmc2V0IiwicnVsZSIsIm1lbWJlciIsIm51bWJlciIsImNhdGVnb3JpemVTdHJpbmciLCJvUnVsZXMiLCJmb3JFYWNoIiwic29ydCIsImNhdGVnb3JpemVTaW5nbGVXb3JkV2l0aE9mZnNldCIsImxjd29yZCIsInBvc3RGaWx0ZXIiLCJiZXN0UmFuayIsIm1hcCIsImluZGV4Iiwiam9pbiIsInJlc3giLCJkZWx0YSIsInBvc3RGaWx0ZXJXaXRoT2Zmc2V0IiwicmFuZ2UiLCJjYXRlZ29yaXplU3RyaW5nMiIsInJ1bGVzIiwid29yZE1hcCIsIm5vbldvcmRSdWxlcyIsImFsbFJ1bGVzIiwiY2F0ZWdvcml6ZVdvcmRJbnRlcm5hbFdpdGhPZmZzZXRzIiwicnIiLCJtYXRjaFdvcmQiLCJjb250ZXh0Iiwib3B0aW9ucyIsInMxIiwiczIiLCJmb2xsb3dzIiwibWF0Y2hvdGhlcnMiLCJjIiwiYXNzaWduIiwib3ZlcnJpZGUiLCJfd2VpZ2h0IiwiZnJlZXplIiwiZXh0cmFjdEFyZ3NNYXAiLCJtYXRjaCIsImFyZ3NNYXAiLCJpS2V5IiwidmFsdWUiLCJSYW5rV29yZCIsImhhc0Fib3ZlIiwibHN0IiwiYm9yZGVyIiwiZXZlcnkiLCJvTWVtYmVyIiwidGFrZUZpcnN0TiIsIm4iLCJsYXN0UmFua2luZyIsImNudFJhbmdlZCIsImlJbmRleCIsImlzUmFuZ2VkIiwidGFrZUFib3ZlIiwiY2F0ZWdvcml6ZVdvcmRXaXRoUmFua0N1dG9mZiIsInNXb3JkR3JvdXAiLCJzcGxpdFJ1bGVzIiwic2Vlbkl0IiwiVG9wX05fV29yZENhdGVnb3JpemF0aW9ucyIsImNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmIiwic1dvcmRHcm91cExDIiwib2JqIiwiY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmZTaW5nbGUiLCJmaWx0ZXJSZW1vdmluZ1VuY2F0ZWdvcml6ZWRTZW50ZW5jZSIsIm9TZW50ZW5jZSIsIm9Xb3JkR3JvdXAiLCJmaWx0ZXJSZW1vdmluZ1VuY2F0ZWdvcml6ZWQiLCJhcnIiLCJjYXRlZ29yaXplQVdvcmQiLCJzZW50ZW5jZSIsIndvcmRzIiwiZGVlcEZyZWV6ZSIsImNsb25lRGVlcCIsImFuYWx5emVTdHJpbmciLCJzU3RyaW5nIiwiY250IiwiZmFjIiwidSIsImJyZWFrZG93blN0cmluZyIsIk1heFNwYWNlc1BlckNvbWJpbmVkV29yZCIsImFCcmVha0Rvd25TZW50ZW5jZSIsImNhdGVnb3JpemVkU2VudGVuY2UiLCJpc1ZhbGlkIiwiY2F0ZWdvcml6ZUFXb3JkV2l0aE9mZnNldHMiLCJjbG9uZSIsImNvcHlWZWNNZW1iZXJzIiwiZXhwYW5kTWF0Y2hBcnIiLCJkZWVwIiwibGluZSIsInVCcmVha0Rvd25MaW5lIiwiYVdvcmRHcm91cCIsIndnSW5kZXgiLCJvV29yZFZhcmlhbnQiLCJpV1ZJbmRleCIsIm52ZWNzIiwidmVjcyIsInJ2ZWMiLCJrIiwibmV4dEJhc2UiLCJsIiwic2xpY2UiLCJjb25jYXQiLCJyZWluZm9yY2VEaXN0V2VpZ2h0IiwiZGlzdCIsImFicyIsIk1hdGgiLCJhUmVpbmZvcmNlRGlzdFdlaWdodCIsImV4dHJhY3RDYXRlZ29yeU1hcCIsIm9Xb3JkIiwiQ0FUX0NBVEVHT1JZIiwicG9zIiwicmVpbkZvcmNlU2VudGVuY2UiLCJvQ2F0ZWdvcnlNYXAiLCJvUG9zaXRpb24iLCJyZWluZm9yY2UiLCJib29zdCIsIlNlbnRlbmNlIiwicmVpbkZvcmNlIiwiYUNhdGVnb3JpemVkQXJyYXkiLCJjbXBSYW5raW5nUHJvZHVjdCIsInJhbmtpbmdQcm9kdWN0IiwibWF0Y2hSZWdFeHAiLCJzS2V5IiwicmVnIiwib0V4dHJhY3RlZENvbnRleHQiLCJzb3J0QnlXZWlnaHQiLCJvQ29udGV4dEEiLCJvQ29udGV4dEIiLCJyYW5raW5nQSIsInBhcnNlRmxvYXQiLCJyYW5raW5nQiIsIndlaWdodEEiLCJ3ZWlnaHRCIiwiYXVnbWVudENvbnRleHQxIiwiaVJ1bGUiLCJvcmVzIiwiYmluZCIsImF1Z21lbnRDb250ZXh0IiwiYVJ1bGVzIiwib3B0aW9uczEiLCJhUmVzIiwib3B0aW9uczIiLCJpbnNlcnRPcmRlcmVkIiwicmVzdWx0IiwiaUluc2VydGVkTWVtYmVyIiwibGltaXQiLCJ0YWtlVG9wTiIsImlubmVyQXJyIiwiaUFyciIsInRvcCIsInNoaWZ0IiwiaW5wdXRGaWx0ZXJSdWxlcyIsInJtIiwiZ2V0Uk1PbmNlIiwiZ2V0UnVsZU1hcCIsImFwcGx5UnVsZXMiLCJiZXN0TiIsIm9LZXlPcmRlciIsImJlc3ROZXh0Iiwib0NvbnRleHQiLCJhcHBseVJ1bGVzUGlja0ZpcnN0IiwiZGVjaWRlT25SZVF1ZXJ5Il0sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBLElBQUFBLFdBQUFDLFFBQUEsNkJBQUEsQ0FBQTtBQUVBLElBQUFDLFNBQUFELFFBQUEsaUJBQUEsQ0FBQTtBQUVBLElBQU1FLFNBQVNELE9BQU9DLE1BQVAsQ0FBYyxhQUFkLENBQWY7QUFFQSxJQUFBQyxRQUFBSCxRQUFBLE9BQUEsQ0FBQTtBQUNBLElBQUlJLFlBQVlELE1BQU0sTUFBTixDQUFoQjtBQUVBLElBQUFFLFFBQUFMLFFBQUEsZ0JBQUEsQ0FBQTtBQUdBLElBQUFNLFFBQUFOLFFBQUEsU0FBQSxDQUFBO0FBSUEsSUFBQU8sWUFBQVAsUUFBQSxhQUFBLENBQUE7QUFFQSxJQUFNUSxZQUFpQkMsTUFBdkI7QUFFQSxJQUFNQyxXQUFXUCxNQUFNLGFBQU4sQ0FBakI7QUFDQSxJQUFNUSxZQUFZUixNQUFNLGNBQU4sQ0FBbEI7QUFDQSxJQUFNUyxZQUFZVCxNQUFNLGNBQU4sQ0FBbEI7QUFJQSxJQUFBVSxZQUFBYixRQUFBLGFBQUEsQ0FBQTtBQUNBLElBQUljLGFBQWFE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QUFaO0FBQ0Q7QUFIRDFDLFFBQUEwTyxtQkFBQSxHQUFBQSxtQkFBQTtBQUtBOzs7QUFHQSxTQUFBQyxlQUFBLENBQWdDeEksT0FBaEMsRUFBd0Q7QUFDdEQsV0FBTyxFQUFQO0FBQ0Q7QUFGRG5HLFFBQUEyTyxlQUFBLEdBQUFBLGVBQUEiLCJmaWxlIjoibWF0Y2gvaW5wdXRGaWx0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICogdGhlIGlucHV0IGZpbHRlciBzdGFnZSBwcmVwcm9jZXNzZXMgYSBjdXJyZW50IGNvbnRleHRcbiAqXG4gKiBJdCBhKSBjb21iaW5lcyBtdWx0aS1zZWdtZW50IGFyZ3VtZW50cyBpbnRvIG9uZSBjb250ZXh0IG1lbWJlcnNcbiAqIEl0IGIpIGF0dGVtcHRzIHRvIGF1Z21lbnQgdGhlIGNvbnRleHQgYnkgYWRkaXRpb25hbCBxdWFsaWZpY2F0aW9uc1xuICogICAgICAgICAgIChNaWQgdGVybSBnZW5lcmF0aW5nIEFsdGVybmF0aXZlcywgZS5nLlxuICogICAgICAgICAgICAgICAgIENsaWVudFNpZGVUYXJnZXRSZXNvbHV0aW9uIC0+IHVuaXQgdGVzdD9cbiAqICAgICAgICAgICAgICAgICBDbGllbnRTaWRlVGFyZ2V0UmVzb2x1dGlvbiAtPiBzb3VyY2UgP1xuICogICAgICAgICAgIClcbiAqICBTaW1wbGUgcnVsZXMgbGlrZSAgSW50ZW50XG4gKlxuICpcbiAqIEBtb2R1bGUgamZzZWIuZmRldnN0YXJ0LmlucHV0RmlsdGVyXG4gKiBAZmlsZSBpbnB1dEZpbHRlci50c1xuICogQGNvcHlyaWdodCAoYykgMjAxNiBHZXJkIEZvcnN0bWFublxuICovXG4vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9saWIvbm9kZS00LmQudHNcIiAvPlxudmFyIGRpc3RhbmNlID0gcmVxdWlyZShcIi4uL3V0aWxzL2RhbWVyYXVMZXZlbnNodGVpblwiKTtcbnZhciBMb2dnZXIgPSByZXF1aXJlKFwiLi4vdXRpbHMvbG9nZ2VyXCIpO1xudmFyIGxvZ2dlciA9IExvZ2dlci5sb2dnZXIoJ2lucHV0RmlsdGVyJyk7XG52YXIgZGVidWcgPSByZXF1aXJlKFwiZGVidWdcIik7XG52YXIgZGVidWdwZXJmID0gZGVidWcoJ3BlcmYnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy91dGlsc1wiKTtcbnZhciBBbGdvbCA9IHJlcXVpcmUoXCIuL2FsZ29sXCIpO1xudmFyIGJyZWFrZG93biA9IHJlcXVpcmUoXCIuL2JyZWFrZG93blwiKTtcbnZhciBBbnlPYmplY3QgPSBPYmplY3Q7XG52YXIgZGVidWdsb2cgPSBkZWJ1ZygnaW5wdXRGaWx0ZXInKTtcbnZhciBkZWJ1Z2xvZ1YgPSBkZWJ1ZygnaW5wdXRWRmlsdGVyJyk7XG52YXIgZGVidWdsb2dNID0gZGVidWcoJ2lucHV0TUZpbHRlcicpO1xudmFyIG1hdGNoZGF0YSA9IHJlcXVpcmUoXCIuL21hdGNoZGF0YVwiKTtcbnZhciBvVW5pdFRlc3RzID0gbWF0Y2hkYXRhLm9Vbml0VGVzdHM7XG4vKipcbiAqIEBwYXJhbSBzVGV4dCB7c3RyaW5nfSB0aGUgdGV4dCB0byBtYXRjaCB0byBOYXZUYXJnZXRSZXNvbHV0aW9uXG4gKiBAcGFyYW0gc1RleHQyIHtzdHJpbmd9IHRoZSBxdWVyeSB0ZXh0LCBlLmcuIE5hdlRhcmdldFxuICpcbiAqIEByZXR1cm4gdGhlIGRpc3RhbmNlLCBub3RlIHRoYXQgaXMgaXMgKm5vdCogc3ltbWV0cmljIVxuICovXG5mdW5jdGlvbiBjYWxjRGlzdGFuY2Uoc1RleHQxLCBzVGV4dDIpIHtcbiAgICByZXR1cm4gZGlzdGFuY2UuY2FsY0Rpc3RhbmNlKHNUZXh0MSwgc1RleHQyKTtcbn1cbmV4cG9ydHMuY2FsY0Rpc3RhbmNlID0gY2FsY0Rpc3RhbmNlO1xuLyoqXG4gKiBAcGFyYW0gc1RleHQge3N0cmluZ30gdGhlIHRleHQgdG8gbWF0Y2ggdG8gTmF2VGFyZ2V0UmVzb2x1dGlvblxuICogQHBhcmFtIHNUZXh0MiB7c3RyaW5nfSB0aGUgcXVlcnkgdGV4dCwgZS5nLiBOYXZUYXJnZXRcbiAqXG4gKiBAcmV0dXJuIHRoZSBkaXN0YW5jZSwgbm90ZSB0aGF0IGlzIGlzICpub3QqIHN5bW1ldHJpYyFcbiAqL1xuZnVuY3Rpb24gY2FsY0Rpc3RhbmNlTGV2ZW4oc1RleHQxLCBzVGV4dDIpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcImxlbmd0aDJcIiArIHNUZXh0MSArIFwiIC0gXCIgKyBzVGV4dDIpXG4gICAgaWYgKCgoc1RleHQxLmxlbmd0aCAtIHNUZXh0Mi5sZW5ndGgpID4gQWxnb2wuY2FsY0Rpc3QubGVuZ3RoRGVsdGExKVxuICAgICAgICB8fCAoc1RleHQyLmxlbmd0aCA+IDEuNSAqIHNUZXh0MS5sZW5ndGgpXG4gICAgICAgIHx8IChzVGV4dDIubGVuZ3RoIDwgKHNUZXh0MS5sZW5ndGggLyAyKSkpIHtcbiAgICAgICAgcmV0dXJuIDUwMDAwO1xuICAgIH1cbiAgICB2YXIgYTAgPSBkaXN0YW5jZS5sZXZlbnNodGVpbihzVGV4dDEuc3Vic3RyaW5nKDAsIHNUZXh0Mi5sZW5ndGgpLCBzVGV4dDIpO1xuICAgIGlmIChkZWJ1Z2xvZ1YuZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZ1YoXCJkaXN0YW5jZVwiICsgYTAgKyBcInN0cmlwcGVkPlwiICsgc1RleHQxLnN1YnN0cmluZygwLCBzVGV4dDIubGVuZ3RoKSArIFwiPD5cIiArIHNUZXh0MiArIFwiPFwiKTtcbiAgICB9XG4gICAgaWYgKGEwICogNTAgPiAxNSAqIHNUZXh0Mi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIDQwMDAwO1xuICAgIH1cbiAgICB2YXIgYSA9IGRpc3RhbmNlLmxldmVuc2h0ZWluKHNUZXh0MSwgc1RleHQyKTtcbiAgICByZXR1cm4gYTAgKiA1MDAgLyBzVGV4dDIubGVuZ3RoICsgYTtcbn1cbmV4cG9ydHMuY2FsY0Rpc3RhbmNlTGV2ZW4gPSBjYWxjRGlzdGFuY2VMZXZlbjtcbnZhciBJRk1hdGNoID0gcmVxdWlyZShcIi4uL21hdGNoL2lmbWF0Y2hcIik7XG4vL2NvbnN0IGxldmVuQ3V0b2ZmID0gQWxnb2wuQ3V0b2ZmX0xldmVuU2h0ZWluO1xuZnVuY3Rpb24gbGV2ZW5QZW5hbHR5T2xkKGkpIHtcbiAgICAvLyAwLT4gMVxuICAgIC8vIDEgLT4gMC4xXG4gICAgLy8gMTUwIC0+ICAwLjhcbiAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgLy8gcmV2ZXJzZSBtYXkgYmUgYmV0dGVyIHRoYW4gbGluZWFyXG4gICAgcmV0dXJuIDEgKyBpICogKDAuOCAtIDEpIC8gMTUwO1xufVxuZXhwb3J0cy5sZXZlblBlbmFsdHlPbGQgPSBsZXZlblBlbmFsdHlPbGQ7XG5mdW5jdGlvbiBsZXZlblBlbmFsdHkoaSkge1xuICAgIC8vIDEgLT4gMVxuICAgIC8vIGN1dE9mZiA9PiAwLjhcbiAgICByZXR1cm4gaTtcbiAgICAvL3JldHVybiAgIDEgLSAgKDEgLSBpKSAqMC4yL0FsZ29sLkN1dG9mZl9Xb3JkTWF0Y2g7XG59XG5leHBvcnRzLmxldmVuUGVuYWx0eSA9IGxldmVuUGVuYWx0eTtcbmZ1bmN0aW9uIG5vblByaXZhdGVLZXlzKG9BKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9BKS5maWx0ZXIoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICByZXR1cm4ga2V5WzBdICE9PSAnXyc7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjb3VudEFpbkIob0EsIG9CLCBmbkNvbXBhcmUsIGFLZXlJZ25vcmUpIHtcbiAgICBhS2V5SWdub3JlID0gQXJyYXkuaXNBcnJheShhS2V5SWdub3JlKSA/IGFLZXlJZ25vcmUgOlxuICAgICAgICB0eXBlb2YgYUtleUlnbm9yZSA9PT0gXCJzdHJpbmdcIiA/IFthS2V5SWdub3JlXSA6IFtdO1xuICAgIGZuQ29tcGFyZSA9IGZuQ29tcGFyZSB8fCBmdW5jdGlvbiAoKSB7IHJldHVybiB0cnVlOyB9O1xuICAgIHJldHVybiBub25Qcml2YXRlS2V5cyhvQSkuZmlsdGVyKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuIGFLZXlJZ25vcmUuaW5kZXhPZihrZXkpIDwgMDtcbiAgICB9KS5cbiAgICAgICAgcmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBrZXkpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvQiwga2V5KSkge1xuICAgICAgICAgICAgcHJldiA9IHByZXYgKyAoZm5Db21wYXJlKG9BW2tleV0sIG9CW2tleV0sIGtleSkgPyAxIDogMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByZXY7XG4gICAgfSwgMCk7XG59XG5leHBvcnRzLmNvdW50QWluQiA9IGNvdW50QWluQjtcbmZ1bmN0aW9uIHNwdXJpb3VzQW5vdEluQihvQSwgb0IsIGFLZXlJZ25vcmUpIHtcbiAgICBhS2V5SWdub3JlID0gQXJyYXkuaXNBcnJheShhS2V5SWdub3JlKSA/IGFLZXlJZ25vcmUgOlxuICAgICAgICB0eXBlb2YgYUtleUlnbm9yZSA9PT0gXCJzdHJpbmdcIiA/IFthS2V5SWdub3JlXSA6IFtdO1xuICAgIHJldHVybiBub25Qcml2YXRlS2V5cyhvQSkuZmlsdGVyKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuIGFLZXlJZ25vcmUuaW5kZXhPZihrZXkpIDwgMDtcbiAgICB9KS5cbiAgICAgICAgcmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBrZXkpIHtcbiAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob0IsIGtleSkpIHtcbiAgICAgICAgICAgIHByZXYgPSBwcmV2ICsgMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJldjtcbiAgICB9LCAwKTtcbn1cbmV4cG9ydHMuc3B1cmlvdXNBbm90SW5CID0gc3B1cmlvdXNBbm90SW5CO1xuZnVuY3Rpb24gbG93ZXJDYXNlKG8pIHtcbiAgICBpZiAodHlwZW9mIG8gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIG8udG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIG87XG59XG5mdW5jdGlvbiBjb21wYXJlQ29udGV4dChvQSwgb0IsIGFLZXlJZ25vcmUpIHtcbiAgICB2YXIgZXF1YWwgPSBjb3VudEFpbkIob0EsIG9CLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbG93ZXJDYXNlKGEpID09PSBsb3dlckNhc2UoYik7IH0sIGFLZXlJZ25vcmUpO1xuICAgIHZhciBkaWZmZXJlbnQgPSBjb3VudEFpbkIob0EsIG9CLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbG93ZXJDYXNlKGEpICE9PSBsb3dlckNhc2UoYik7IH0sIGFLZXlJZ25vcmUpO1xuICAgIHZhciBzcHVyaW91c0wgPSBzcHVyaW91c0Fub3RJbkIob0EsIG9CLCBhS2V5SWdub3JlKTtcbiAgICB2YXIgc3B1cmlvdXNSID0gc3B1cmlvdXNBbm90SW5CKG9CLCBvQSwgYUtleUlnbm9yZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZXF1YWw6IGVxdWFsLFxuICAgICAgICBkaWZmZXJlbnQ6IGRpZmZlcmVudCxcbiAgICAgICAgc3B1cmlvdXNMOiBzcHVyaW91c0wsXG4gICAgICAgIHNwdXJpb3VzUjogc3B1cmlvdXNSXG4gICAgfTtcbn1cbmV4cG9ydHMuY29tcGFyZUNvbnRleHQgPSBjb21wYXJlQ29udGV4dDtcbmZ1bmN0aW9uIHNvcnRCeVJhbmsoYSwgYikge1xuICAgIHZhciByID0gLSgoYS5fcmFua2luZyB8fCAxLjApIC0gKGIuX3JhbmtpbmcgfHwgMS4wKSk7XG4gICAgaWYgKHIpIHtcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgfVxuICAgIGlmIChhLmNhdGVnb3J5ICYmIGIuY2F0ZWdvcnkpIHtcbiAgICAgICAgciA9IGEuY2F0ZWdvcnkubG9jYWxlQ29tcGFyZShiLmNhdGVnb3J5KTtcbiAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChhLm1hdGNoZWRTdHJpbmcgJiYgYi5tYXRjaGVkU3RyaW5nKSB7XG4gICAgICAgIHIgPSBhLm1hdGNoZWRTdHJpbmcubG9jYWxlQ29tcGFyZShiLm1hdGNoZWRTdHJpbmcpO1xuICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBjaGVja09uZVJ1bGUoc3RyaW5nLCBsY1N0cmluZywgZXhhY3QsIHJlcywgb1J1bGUsIGNudFJlYykge1xuICAgIGlmIChkZWJ1Z2xvZ1YuZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZ1YoJ2F0dGVtcHRpbmcgdG8gbWF0Y2ggcnVsZSAnICsgSlNPTi5zdHJpbmdpZnkob1J1bGUpICsgXCIgdG8gc3RyaW5nIFxcXCJcIiArIHN0cmluZyArIFwiXFxcIlwiKTtcbiAgICB9XG4gICAgc3dpdGNoIChvUnVsZS50eXBlKSB7XG4gICAgICAgIGNhc2UgMCAvKiBXT1JEICovOlxuICAgICAgICAgICAgaWYgKCFvUnVsZS5sb3dlcmNhc2V3b3JkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdydWxlIHdpdGhvdXQgYSBsb3dlcmNhc2UgdmFyaWFudCcgKyBKU09OLnN0cmluZ2lmeShvUnVsZSwgdW5kZWZpbmVkLCAyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA7XG4gICAgICAgICAgICBpZiAoZXhhY3QgJiYgb1J1bGUud29yZCA9PT0gc3RyaW5nIHx8IG9SdWxlLmxvd2VyY2FzZXdvcmQgPT09IGxjU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coXCJcXG4hbWF0Y2hlZCBleGFjdCBcIiArIHN0cmluZyArIFwiPVwiICsgb1J1bGUubG93ZXJjYXNld29yZCArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZzogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvUnVsZS5tYXRjaGVkU3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgIF9yYW5raW5nOiBvUnVsZS5fcmFua2luZyB8fCAxLjBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZXhhY3QgJiYgIW9SdWxlLmV4YWN0T25seSkge1xuICAgICAgICAgICAgICAgIHZhciBsZXZlbm1hdGNoID0gY2FsY0Rpc3RhbmNlKG9SdWxlLmxvd2VyY2FzZXdvcmQsIGxjU3RyaW5nKTtcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlXCIsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZihsZXZlbm1hdGNoIDwgNTApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlRXhwXCIsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGxldmVubWF0Y2ggPCA0MDAwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsXCJjYWxjRGlzdGFuY2VCZWxvdzQwa1wiLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIC8vaWYob1J1bGUubG93ZXJjYXNld29yZCA9PT0gXCJjb3Ntb3NcIikge1xuICAgICAgICAgICAgICAgIC8vICBjb25zb2xlLmxvZyhcImhlcmUgcmFua2luZyBcIiArIGxldmVubWF0Y2ggKyBcIiBcIiArIG9SdWxlLmxvd2VyY2FzZXdvcmQgKyBcIiBcIiArIGxjU3RyaW5nKTtcbiAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICBpZiAobGV2ZW5tYXRjaCA+PSBBbGdvbC5DdXRvZmZfV29yZE1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsIFwiY2FsY0Rpc3RhbmNlT2tcIiwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmc6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IG9SdWxlLm1hdGNoZWRTdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgICAgICBfcmFua2luZzogKG9SdWxlLl9yYW5raW5nIHx8IDEuMCkgKiBsZXZlblBlbmFsdHkobGV2ZW5tYXRjaCksXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXZlbm1hdGNoOiBsZXZlbm1hdGNoXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWJ1Z2xvZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coXCJcXG4hZnV6enkgXCIgKyAobGV2ZW5tYXRjaCkudG9GaXhlZCgzKSArIFwiIFwiICsgcmVjLl9yYW5raW5nLnRvRml4ZWQoMykgKyBcIiAgXCIgKyBzdHJpbmcgKyBcIj1cIiArIG9SdWxlLmxvd2VyY2FzZXdvcmQgKyBcIiA9PiBcIiArIG9SdWxlLm1hdGNoZWRTdHJpbmcgKyBcIi9cIiArIG9SdWxlLmNhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXMucHVzaChyZWMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDEgLyogUkVHRVhQICovOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKEpTT04uc3RyaW5naWZ5KFwiIGhlcmUgcmVnZXhwXCIgKyBKU09OLnN0cmluZ2lmeShvUnVsZSwgdW5kZWZpbmVkLCAyKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbSA9IG9SdWxlLnJlZ2V4cC5leGVjKHN0cmluZyk7XG4gICAgICAgICAgICAgICAgaWYgKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiAob1J1bGUubWF0Y2hJbmRleCAhPT0gdW5kZWZpbmVkICYmIG1bb1J1bGUubWF0Y2hJbmRleF0pIHx8IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBvUnVsZS5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICAgICAgICAgIF9yYW5raW5nOiBvUnVsZS5fcmFua2luZyB8fCAxLjBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHR5cGVcIiArIEpTT04uc3RyaW5naWZ5KG9SdWxlLCB1bmRlZmluZWQsIDIpKTtcbiAgICB9XG59XG5leHBvcnRzLmNoZWNrT25lUnVsZSA9IGNoZWNrT25lUnVsZTtcbmZ1bmN0aW9uIGNoZWNrT25lUnVsZVdpdGhPZmZzZXQoc3RyaW5nLCBsY1N0cmluZywgZXhhY3QsIHJlcywgb1J1bGUsIGNudFJlYykge1xuICAgIGlmIChkZWJ1Z2xvZ1YuZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZ1YoJ2F0dGVtcHRpbmcgdG8gbWF0Y2ggcnVsZSAnICsgSlNPTi5zdHJpbmdpZnkob1J1bGUpICsgXCIgdG8gc3RyaW5nIFxcXCJcIiArIHN0cmluZyArIFwiXFxcIlwiKTtcbiAgICB9XG4gICAgc3dpdGNoIChvUnVsZS50eXBlKSB7XG4gICAgICAgIGNhc2UgMCAvKiBXT1JEICovOlxuICAgICAgICAgICAgaWYgKCFvUnVsZS5sb3dlcmNhc2V3b3JkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdydWxlIHdpdGhvdXQgYSBsb3dlcmNhc2UgdmFyaWFudCcgKyBKU09OLnN0cmluZ2lmeShvUnVsZSwgdW5kZWZpbmVkLCAyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA7XG4gICAgICAgICAgICBpZiAoZXhhY3QgJiYgb1J1bGUud29yZCA9PT0gc3RyaW5nIHx8IG9SdWxlLmxvd2VyY2FzZXdvcmQgPT09IGxjU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coXCJcXG4hbWF0Y2hlZCBleGFjdCBcIiArIHN0cmluZyArIFwiPVwiICsgb1J1bGUubG93ZXJjYXNld29yZCArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZzogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvUnVsZS5tYXRjaGVkU3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgIHJ1bGU6IG9SdWxlLFxuICAgICAgICAgICAgICAgICAgICBfcmFua2luZzogb1J1bGUuX3JhbmtpbmcgfHwgMS4wXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWV4YWN0ICYmICFvUnVsZS5leGFjdE9ubHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGV2ZW5tYXRjaCA9IGNhbGNEaXN0YW5jZShvUnVsZS5sb3dlcmNhc2V3b3JkLCBsY1N0cmluZyk7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZVwiLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYobGV2ZW5tYXRjaCA8IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZUV4cFwiLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZihsZXZlbm1hdGNoIDwgNDAwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlQmVsb3c0MGtcIiwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAvL2lmKG9SdWxlLmxvd2VyY2FzZXdvcmQgPT09IFwiY29zbW9zXCIpIHtcbiAgICAgICAgICAgICAgICAvLyAgY29uc29sZS5sb2coXCJoZXJlIHJhbmtpbmcgXCIgKyBsZXZlbm1hdGNoICsgXCIgXCIgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICsgXCIgXCIgKyBsY1N0cmluZyk7XG4gICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICAgICAgaWYgKGxldmVubWF0Y2ggPj0gQWxnb2wuQ3V0b2ZmX1dvcmRNYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZm91bmQgcmVjXCIpO1xuICAgICAgICAgICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLCBcImNhbGNEaXN0YW5jZU9rXCIsIDEpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVjID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBydWxlOiBvUnVsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IG9SdWxlLm1hdGNoZWRTdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgICAgICBfcmFua2luZzogKG9SdWxlLl9yYW5raW5nIHx8IDEuMCkgKiBsZXZlblBlbmFsdHkobGV2ZW5tYXRjaCksXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXZlbm1hdGNoOiBsZXZlbm1hdGNoXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWJ1Z2xvZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coXCJcXG4hQ09STzogZnV6enkgXCIgKyAobGV2ZW5tYXRjaCkudG9GaXhlZCgzKSArIFwiIFwiICsgcmVjLl9yYW5raW5nLnRvRml4ZWQoMykgKyBcIiAgXFxcIlwiICsgc3RyaW5nICsgXCJcXFwiPVwiICsgb1J1bGUubG93ZXJjYXNld29yZCArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlcy5wdXNoKHJlYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMSAvKiBSRUdFWFAgKi86XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkoXCIgaGVyZSByZWdleHBcIiArIEpTT04uc3RyaW5naWZ5KG9SdWxlLCB1bmRlZmluZWQsIDIpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBtID0gb1J1bGUucmVnZXhwLmV4ZWMoc3RyaW5nKTtcbiAgICAgICAgICAgICAgICBpZiAobSkge1xuICAgICAgICAgICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmc6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGU6IG9SdWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogKG9SdWxlLm1hdGNoSW5kZXggIT09IHVuZGVmaW5lZCAmJiBtW29SdWxlLm1hdGNoSW5kZXhdKSB8fCBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgICAgICBfcmFua2luZzogb1J1bGUuX3JhbmtpbmcgfHwgMS4wXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biB0eXBlXCIgKyBKU09OLnN0cmluZ2lmeShvUnVsZSwgdW5kZWZpbmVkLCAyKSk7XG4gICAgfVxufVxuZXhwb3J0cy5jaGVja09uZVJ1bGVXaXRoT2Zmc2V0ID0gY2hlY2tPbmVSdWxlV2l0aE9mZnNldDtcbjtcbmZ1bmN0aW9uIGFkZENudFJlYyhjbnRSZWMsIG1lbWJlciwgbnVtYmVyKSB7XG4gICAgaWYgKCghY250UmVjKSB8fCAobnVtYmVyID09PSAwKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNudFJlY1ttZW1iZXJdID0gKGNudFJlY1ttZW1iZXJdIHx8IDApICsgbnVtYmVyO1xufVxuZnVuY3Rpb24gY2F0ZWdvcml6ZVN0cmluZyh3b3JkLCBleGFjdCwgb1J1bGVzLCBjbnRSZWMpIHtcbiAgICAvLyBzaW1wbHkgYXBwbHkgYWxsIHJ1bGVzXG4gICAgaWYgKGRlYnVnbG9nTS5lbmFibGVkKSB7XG4gICAgICAgIGRlYnVnbG9nTShcInJ1bGVzIDogXCIgKyBKU09OLnN0cmluZ2lmeShvUnVsZXMsIHVuZGVmaW5lZCwgMikpO1xuICAgIH1cbiAgICB2YXIgbGNTdHJpbmcgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIG9SdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xuICAgICAgICBjaGVja09uZVJ1bGUod29yZCwgbGNTdHJpbmcsIGV4YWN0LCByZXMsIG9SdWxlLCBjbnRSZWMpO1xuICAgIH0pO1xuICAgIHJlcy5zb3J0KHNvcnRCeVJhbmspO1xuICAgIHJldHVybiByZXM7XG59XG5leHBvcnRzLmNhdGVnb3JpemVTdHJpbmcgPSBjYXRlZ29yaXplU3RyaW5nO1xuZnVuY3Rpb24gY2F0ZWdvcml6ZVNpbmdsZVdvcmRXaXRoT2Zmc2V0KHdvcmQsIGxjd29yZCwgZXhhY3QsIG9SdWxlcywgY250UmVjKSB7XG4gICAgLy8gc2ltcGx5IGFwcGx5IGFsbCBydWxlc1xuICAgIGlmIChkZWJ1Z2xvZ00uZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZ00oXCJydWxlcyA6IFwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGVzLCB1bmRlZmluZWQsIDIpKTtcbiAgICB9XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIG9SdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xuICAgICAgICBjaGVja09uZVJ1bGVXaXRoT2Zmc2V0KHdvcmQsIGxjd29yZCwgZXhhY3QsIHJlcywgb1J1bGUsIGNudFJlYyk7XG4gICAgfSk7XG4gICAgZGVidWdsb2coXCJDU1dXTzogZ290IHJlc3VsdHMgZm9yIFwiICsgbGN3b3JkICsgXCIgIFwiICsgcmVzLmxlbmd0aCk7XG4gICAgcmVzLnNvcnQoc29ydEJ5UmFuayk7XG4gICAgcmV0dXJuIHJlcztcbn1cbmV4cG9ydHMuY2F0ZWdvcml6ZVNpbmdsZVdvcmRXaXRoT2Zmc2V0ID0gY2F0ZWdvcml6ZVNpbmdsZVdvcmRXaXRoT2Zmc2V0O1xuZnVuY3Rpb24gcG9zdEZpbHRlcihyZXMpIHtcbiAgICByZXMuc29ydChzb3J0QnlSYW5rKTtcbiAgICB2YXIgYmVzdFJhbmsgPSAwO1xuICAgIC8vY29uc29sZS5sb2coXCJcXG5waWx0ZXJlZCBcIiArIEpTT04uc3RyaW5naWZ5KHJlcykpO1xuICAgIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XG4gICAgICAgIGRlYnVnbG9nKFwicHJlRmlsdGVyIDogXFxuXCIgKyByZXMubWFwKGZ1bmN0aW9uICh3b3JkLCBpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4ICsgXCIgXCIgKyB3b3JkLl9yYW5raW5nICsgXCIgID0+IFxcXCJcIiArIHdvcmQuY2F0ZWdvcnkgKyBcIlxcXCIgXCIgKyB3b3JkLm1hdGNoZWRTdHJpbmc7XG4gICAgICAgIH0pLmpvaW4oXCJcXG5cIikpO1xuICAgIH1cbiAgICB2YXIgciA9IHJlcy5maWx0ZXIoZnVuY3Rpb24gKHJlc3gsIGluZGV4KSB7XG4gICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgYmVzdFJhbmsgPSByZXN4Ll9yYW5raW5nO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMS0wLjkgPSAwLjFcbiAgICAgICAgLy8gMS0gMC45MyA9IDAuN1xuICAgICAgICAvLyAxLzdcbiAgICAgICAgdmFyIGRlbHRhID0gYmVzdFJhbmsgLyByZXN4Ll9yYW5raW5nO1xuICAgICAgICBpZiAoKHJlc3gubWF0Y2hlZFN0cmluZyA9PT0gcmVzW2luZGV4IC0gMV0ubWF0Y2hlZFN0cmluZylcbiAgICAgICAgICAgICYmIChyZXN4LmNhdGVnb3J5ID09PSByZXNbaW5kZXggLSAxXS5jYXRlZ29yeSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiXFxuIGRlbHRhIGZvciBcIiArIGRlbHRhICsgXCIgIFwiICsgcmVzeC5fcmFua2luZyk7XG4gICAgICAgIGlmIChyZXN4LmxldmVubWF0Y2ggJiYgKGRlbHRhID4gMS4wMykpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZyhcIlxcbmZpbHRlcmVkIFwiICsgci5sZW5ndGggKyBcIi9cIiArIHJlcy5sZW5ndGggKyBKU09OLnN0cmluZ2lmeShyKSk7XG4gICAgfVxuICAgIHJldHVybiByO1xufVxuZXhwb3J0cy5wb3N0RmlsdGVyID0gcG9zdEZpbHRlcjtcbmZ1bmN0aW9uIHBvc3RGaWx0ZXJXaXRoT2Zmc2V0KHJlcykge1xuICAgIHJlcy5zb3J0KHNvcnRCeVJhbmspO1xuICAgIHZhciBiZXN0UmFuayA9IDA7XG4gICAgLy9jb25zb2xlLmxvZyhcIlxcbnBpbHRlcmVkIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzKSk7XG4gICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgICAgZGVidWdsb2coXCIgcHJlRmlsdGVyIDogXFxuXCIgKyByZXMubWFwKGZ1bmN0aW9uICh3b3JkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCIgXCIgKyB3b3JkLl9yYW5raW5nICsgXCIgID0+IFxcXCJcIiArIHdvcmQuY2F0ZWdvcnkgKyBcIlxcXCIgXCIgKyB3b3JkLm1hdGNoZWRTdHJpbmcgKyBcIiBcIjtcbiAgICAgICAgfSkuam9pbihcIlxcblwiKSk7XG4gICAgfVxuICAgIHZhciByID0gcmVzLmZpbHRlcihmdW5jdGlvbiAocmVzeCwgaW5kZXgpIHtcbiAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICBiZXN0UmFuayA9IHJlc3guX3Jhbmtpbmc7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyAxLTAuOSA9IDAuMVxuICAgICAgICAvLyAxLSAwLjkzID0gMC43XG4gICAgICAgIC8vIDEvN1xuICAgICAgICB2YXIgZGVsdGEgPSBiZXN0UmFuayAvIHJlc3guX3Jhbmtpbmc7XG4gICAgICAgIGlmICghKHJlc3gucnVsZSAmJiByZXN4LnJ1bGUucmFuZ2UpXG4gICAgICAgICAgICAmJiAhKHJlc1tpbmRleCAtIDFdLnJ1bGUgJiYgcmVzW2luZGV4IC0gMV0ucnVsZS5yYW5nZSlcbiAgICAgICAgICAgICYmIChyZXN4Lm1hdGNoZWRTdHJpbmcgPT09IHJlc1tpbmRleCAtIDFdLm1hdGNoZWRTdHJpbmcpXG4gICAgICAgICAgICAmJiAocmVzeC5jYXRlZ29yeSA9PT0gcmVzW2luZGV4IC0gMV0uY2F0ZWdvcnkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIlxcbiBkZWx0YSBmb3IgXCIgKyBkZWx0YSArIFwiICBcIiArIHJlc3guX3JhbmtpbmcpO1xuICAgICAgICBpZiAocmVzeC5sZXZlbm1hdGNoICYmIChkZWx0YSA+IDEuMDMpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgICAgZGVidWdsb2coXCJcXG5maWx0ZXJlZCBcIiArIHIubGVuZ3RoICsgXCIvXCIgKyByZXMubGVuZ3RoICsgSlNPTi5zdHJpbmdpZnkocikpO1xuICAgIH1cbiAgICByZXR1cm4gcjtcbn1cbmV4cG9ydHMucG9zdEZpbHRlcldpdGhPZmZzZXQgPSBwb3N0RmlsdGVyV2l0aE9mZnNldDtcbmZ1bmN0aW9uIGNhdGVnb3JpemVTdHJpbmcyKHdvcmQsIGV4YWN0LCBydWxlcywgY250UmVjKSB7XG4gICAgLy8gc2ltcGx5IGFwcGx5IGFsbCBydWxlc1xuICAgIGlmIChkZWJ1Z2xvZ00uZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZ00oXCJydWxlcyA6IFwiICsgSlNPTi5zdHJpbmdpZnkocnVsZXMsIHVuZGVmaW5lZCwgMikpO1xuICAgIH1cbiAgICB2YXIgbGNTdHJpbmcgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGlmIChleGFjdCkge1xuICAgICAgICB2YXIgciA9IHJ1bGVzLndvcmRNYXBbbGNTdHJpbmddO1xuICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgci5ydWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nOiB3b3JkLFxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvUnVsZS5tYXRjaGVkU3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgIF9yYW5raW5nOiBvUnVsZS5fcmFua2luZyB8fCAxLjBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJ1bGVzLm5vbldvcmRSdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xuICAgICAgICAgICAgY2hlY2tPbmVSdWxlKHdvcmQsIGxjU3RyaW5nLCBleGFjdCwgcmVzLCBvUnVsZSwgY250UmVjKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlcy5zb3J0KHNvcnRCeVJhbmspO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZGVidWdsb2coXCJjYXRlZ29yaXplIG5vbiBleGFjdFwiICsgd29yZCArIFwiIHh4ICBcIiArIHJ1bGVzLmFsbFJ1bGVzLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiBwb3N0RmlsdGVyKGNhdGVnb3JpemVTdHJpbmcod29yZCwgZXhhY3QsIHJ1bGVzLmFsbFJ1bGVzLCBjbnRSZWMpKTtcbiAgICB9XG59XG5leHBvcnRzLmNhdGVnb3JpemVTdHJpbmcyID0gY2F0ZWdvcml6ZVN0cmluZzI7XG5mdW5jdGlvbiBjYXRlZ29yaXplV29yZEludGVybmFsV2l0aE9mZnNldHMod29yZCwgbGN3b3JkLCBleGFjdCwgcnVsZXMsIGNudFJlYykge1xuICAgIGRlYnVnbG9nTShcImNhdGVnb3JpemUgXCIgKyBsY3dvcmQgKyBcIiB3aXRoIG9mZnNldCEhISEhISEhISEhISEhISEhXCIgKyBleGFjdCk7XG4gICAgLy8gc2ltcGx5IGFwcGx5IGFsbCBydWxlc1xuICAgIGlmIChkZWJ1Z2xvZ00uZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZ00oXCJydWxlcyA6IFwiICsgSlNPTi5zdHJpbmdpZnkocnVsZXMsIHVuZGVmaW5lZCwgMikpO1xuICAgIH1cbiAgICB2YXIgcmVzID0gW107XG4gICAgaWYgKGV4YWN0KSB7XG4gICAgICAgIHZhciByID0gcnVsZXMud29yZE1hcFtsY3dvcmRdO1xuICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgZGVidWdsb2dNKFwiIC4uLi5wdXNoaW5nIG4gcnVsZXMgZXhhY3QgZm9yIFwiICsgbGN3b3JkICsgXCI6XCIgKyByLnJ1bGVzLmxlbmd0aCk7XG4gICAgICAgICAgICBkZWJ1Z2xvZ00oci5ydWxlcy5tYXAoZnVuY3Rpb24gKHIsIGluZGV4KSB7IHJldHVybiAnJyArIGluZGV4ICsgJyAnICsgSlNPTi5zdHJpbmdpZnkocik7IH0pLmpvaW4oXCJcXG5cIikpO1xuICAgICAgICAgICAgci5ydWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nOiB3b3JkLFxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvUnVsZS5tYXRjaGVkU3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgIHJ1bGU6IG9SdWxlLFxuICAgICAgICAgICAgICAgICAgICBfcmFua2luZzogb1J1bGUuX3JhbmtpbmcgfHwgMS4wXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBydWxlcy5ub25Xb3JkUnVsZXMuZm9yRWFjaChmdW5jdGlvbiAob1J1bGUpIHtcbiAgICAgICAgICAgIGNoZWNrT25lUnVsZVdpdGhPZmZzZXQod29yZCwgbGN3b3JkLCBleGFjdCwgcmVzLCBvUnVsZSwgY250UmVjKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlcyA9IHBvc3RGaWx0ZXJXaXRoT2Zmc2V0KHJlcyk7XG4gICAgICAgIGRlYnVnbG9nKFwiaGVyZSByZXN1bHRzIGZvclwiICsgd29yZCArIFwiIHJlcyBcIiArIHJlcy5sZW5ndGgpO1xuICAgICAgICBkZWJ1Z2xvZ00oXCJoZXJlIHJlc3VsdHMgZm9yXCIgKyB3b3JkICsgXCIgcmVzIFwiICsgcmVzLmxlbmd0aCk7XG4gICAgICAgIHJlcy5zb3J0KHNvcnRCeVJhbmspO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZGVidWdsb2coXCJjYXRlZ29yaXplIG5vbiBleGFjdFwiICsgd29yZCArIFwiIHh4ICBcIiArIHJ1bGVzLmFsbFJ1bGVzLmxlbmd0aCk7XG4gICAgICAgIHZhciByciA9IGNhdGVnb3JpemVTaW5nbGVXb3JkV2l0aE9mZnNldCh3b3JkLCBsY3dvcmQsIGV4YWN0LCBydWxlcy5hbGxSdWxlcywgY250UmVjKTtcbiAgICAgICAgLy9kZWJ1bG9nTShcImZ1enp5IHJlcyBcIiArIEpTT04uc3RyaW5naWZ5KHJyKSk7XG4gICAgICAgIHJldHVybiBwb3N0RmlsdGVyV2l0aE9mZnNldChycik7XG4gICAgfVxufVxuZXhwb3J0cy5jYXRlZ29yaXplV29yZEludGVybmFsV2l0aE9mZnNldHMgPSBjYXRlZ29yaXplV29yZEludGVybmFsV2l0aE9mZnNldHM7XG4vKipcbiAqXG4gKiBPcHRpb25zIG1heSBiZSB7XG4gKiBtYXRjaG90aGVycyA6IHRydWUsICA9PiBvbmx5IHJ1bGVzIHdoZXJlIGFsbCBvdGhlcnMgbWF0Y2ggYXJlIGNvbnNpZGVyZWRcbiAqIGF1Z21lbnQgOiB0cnVlLFxuICogb3ZlcnJpZGUgOiB0cnVlIH0gID0+XG4gKlxuICovXG5mdW5jdGlvbiBtYXRjaFdvcmQob1J1bGUsIGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBpZiAoY29udGV4dFtvUnVsZS5rZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdmFyIHMxID0gY29udGV4dFtvUnVsZS5rZXldLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIHMyID0gb1J1bGUud29yZC50b0xvd2VyQ2FzZSgpO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHZhciBkZWx0YSA9IGNvbXBhcmVDb250ZXh0KGNvbnRleHQsIG9SdWxlLmZvbGxvd3MsIG9SdWxlLmtleSk7XG4gICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgICAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkoZGVsdGEpKTtcbiAgICAgICAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkob3B0aW9ucykpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5tYXRjaG90aGVycyAmJiAoZGVsdGEuZGlmZmVyZW50ID4gMCkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdmFyIGMgPSBjYWxjRGlzdGFuY2UoczIsIHMxKTtcbiAgICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZyhcIiBzMSA8PiBzMiBcIiArIHMxICsgXCI8PlwiICsgczIgKyBcIiAgPT46IFwiICsgYyk7XG4gICAgfVxuICAgIGlmIChjID4gMC44MCkge1xuICAgICAgICB2YXIgcmVzID0gQW55T2JqZWN0LmFzc2lnbih7fSwgb1J1bGUuZm9sbG93cyk7XG4gICAgICAgIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBjb250ZXh0KTtcbiAgICAgICAgaWYgKG9wdGlvbnMub3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBvUnVsZS5mb2xsb3dzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBmb3JjZSBrZXkgcHJvcGVydHlcbiAgICAgICAgLy8gY29uc29sZS5sb2coJyBvYmplY3RjYXRlZ29yeScsIHJlc1snc3lzdGVtT2JqZWN0Q2F0ZWdvcnknXSk7XG4gICAgICAgIHJlc1tvUnVsZS5rZXldID0gb1J1bGUuZm9sbG93c1tvUnVsZS5rZXldIHx8IHJlc1tvUnVsZS5rZXldO1xuICAgICAgICByZXMuX3dlaWdodCA9IEFueU9iamVjdC5hc3NpZ24oe30sIHJlcy5fd2VpZ2h0KTtcbiAgICAgICAgcmVzLl93ZWlnaHRbb1J1bGUua2V5XSA9IGM7XG4gICAgICAgIE9iamVjdC5mcmVlemUocmVzKTtcbiAgICAgICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKCdGb3VuZCBvbmUnICsgSlNPTi5zdHJpbmdpZnkocmVzLCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuZXhwb3J0cy5tYXRjaFdvcmQgPSBtYXRjaFdvcmQ7XG5mdW5jdGlvbiBleHRyYWN0QXJnc01hcChtYXRjaCwgYXJnc01hcCkge1xuICAgIHZhciByZXMgPSB7fTtcbiAgICBpZiAoIWFyZ3NNYXApIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgT2JqZWN0LmtleXMoYXJnc01hcCkuZm9yRWFjaChmdW5jdGlvbiAoaUtleSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBtYXRjaFtpS2V5XTtcbiAgICAgICAgdmFyIGtleSA9IGFyZ3NNYXBbaUtleV07XG4gICAgICAgIGlmICgodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSAmJiB2YWx1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbn1cbmV4cG9ydHMuZXh0cmFjdEFyZ3NNYXAgPSBleHRyYWN0QXJnc01hcDtcbmV4cG9ydHMuUmFua1dvcmQgPSB7XG4gICAgaGFzQWJvdmU6IGZ1bmN0aW9uIChsc3QsIGJvcmRlcikge1xuICAgICAgICByZXR1cm4gIWxzdC5ldmVyeShmdW5jdGlvbiAob01lbWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIChvTWVtYmVyLl9yYW5raW5nIDwgYm9yZGVyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICB0YWtlRmlyc3ROOiBmdW5jdGlvbiAobHN0LCBuKSB7XG4gICAgICAgIHZhciBsYXN0UmFua2luZyA9IDEuMDtcbiAgICAgICAgdmFyIGNudFJhbmdlZCA9IDA7XG4gICAgICAgIHJldHVybiBsc3QuZmlsdGVyKGZ1bmN0aW9uIChvTWVtYmVyLCBpSW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBpc1JhbmdlZCA9ICEhKG9NZW1iZXJbXCJydWxlXCJdICYmIG9NZW1iZXJbXCJydWxlXCJdLnJhbmdlKTtcbiAgICAgICAgICAgIGlmIChpc1JhbmdlZCkge1xuICAgICAgICAgICAgICAgIGNudFJhbmdlZCArPSAxO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCgoaUluZGV4IC0gY250UmFuZ2VkKSA8IG4pIHx8IChvTWVtYmVyLl9yYW5raW5nID09PSBsYXN0UmFua2luZykpIHtcbiAgICAgICAgICAgICAgICBsYXN0UmFua2luZyA9IG9NZW1iZXIuX3Jhbmtpbmc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgdGFrZUFib3ZlOiBmdW5jdGlvbiAobHN0LCBib3JkZXIpIHtcbiAgICAgICAgcmV0dXJuIGxzdC5maWx0ZXIoZnVuY3Rpb24gKG9NZW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAob01lbWJlci5fcmFua2luZyA+PSBib3JkZXIpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuLypcbnZhciBleGFjdExlbiA9IDA7XG52YXIgZnV6enlMZW4gPSAwO1xudmFyIGZ1enp5Q250ID0gMDtcbnZhciBleGFjdENudCA9IDA7XG52YXIgdG90YWxDbnQgPSAwO1xudmFyIHRvdGFsTGVuID0gMDtcbnZhciByZXRhaW5lZENudCA9IDA7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldENudCgpIHtcbiAgZXhhY3RMZW4gPSAwO1xuICBmdXp6eUxlbiA9IDA7XG4gIGZ1enp5Q250ID0gMDtcbiAgZXhhY3RDbnQgPSAwO1xuICB0b3RhbENudCA9IDA7XG4gIHRvdGFsTGVuID0gMDtcbiAgcmV0YWluZWRDbnQgPSAwO1xufVxuKi9cbmZ1bmN0aW9uIGNhdGVnb3JpemVXb3JkV2l0aFJhbmtDdXRvZmYoc1dvcmRHcm91cCwgc3BsaXRSdWxlcywgY250UmVjKSB7XG4gICAgdmFyIHNlZW5JdCA9IGNhdGVnb3JpemVTdHJpbmcyKHNXb3JkR3JvdXAsIHRydWUsIHNwbGl0UnVsZXMsIGNudFJlYyk7XG4gICAgLy90b3RhbENudCArPSAxO1xuICAgIC8vIGV4YWN0TGVuICs9IHNlZW5JdC5sZW5ndGg7XG4gICAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0JywgMSk7XG4gICAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XG4gICAgaWYgKGV4cG9ydHMuUmFua1dvcmQuaGFzQWJvdmUoc2Vlbkl0LCAwLjgpKSB7XG4gICAgICAgIGlmIChjbnRSZWMpIHtcbiAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsICdleGFjdFByaW9yVGFrZScsIHNlZW5JdC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHNlZW5JdCA9IGV4cG9ydHMuUmFua1dvcmQudGFrZUFib3ZlKHNlZW5JdCwgMC44KTtcbiAgICAgICAgaWYgKGNudFJlYykge1xuICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYywgJ2V4YWN0QWZ0ZXJUYWtlJywgc2Vlbkl0Lmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHNlZW5JdCA9IGNhdGVnb3JpemVTdHJpbmcyKHNXb3JkR3JvdXAsIGZhbHNlLCBzcGxpdFJ1bGVzLCBjbnRSZWMpO1xuICAgICAgICBhZGRDbnRSZWMoY250UmVjLCAnY250Tm9uRXhhY3QnLCAxKTtcbiAgICAgICAgYWRkQ250UmVjKGNudFJlYywgJ2NudE5vbkV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XG4gICAgfVxuICAgIC8vIHRvdGFsTGVuICs9IHNlZW5JdC5sZW5ndGg7XG4gICAgc2Vlbkl0ID0gZXhwb3J0cy5SYW5rV29yZC50YWtlRmlyc3ROKHNlZW5JdCwgQWxnb2wuVG9wX05fV29yZENhdGVnb3JpemF0aW9ucyk7XG4gICAgLy8gcmV0YWluZWRDbnQgKz0gc2Vlbkl0Lmxlbmd0aDtcbiAgICByZXR1cm4gc2Vlbkl0O1xufVxuZXhwb3J0cy5jYXRlZ29yaXplV29yZFdpdGhSYW5rQ3V0b2ZmID0gY2F0ZWdvcml6ZVdvcmRXaXRoUmFua0N1dG9mZjtcbi8qIGlmIHdlIGhhdmUgYSAgXCJSdW4gbGlrZSB0aGUgV2luZFwiXG4gIGFuIGEgdXNlciB0eXBlIGZ1biBsaWtlICBhIFJpbmQgLCBhbmQgUmluZCBpcyBhbiBleGFjdCBtYXRjaCxcbiAgd2Ugd2lsbCBub3Qgc3RhcnQgbG9va2luZyBmb3IgdGhlIGxvbmcgc2VudGVuY2VcblxuICB0aGlzIGlzIHRvIGJlIGZpeGVkIGJ5IFwic3ByZWFkaW5nXCIgdGhlIHJhbmdlIGluZGljYXRpb24gYWNjcm9zcyB2ZXJ5IHNpbWlsYXIgd29yZHMgaW4gdGhlIHZpbmNpbml0eSBvZiB0aGVcbiAgdGFyZ2V0IHdvcmRzXG4qL1xuZnVuY3Rpb24gY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmYoc1dvcmRHcm91cCwgc3BsaXRSdWxlcywgY250UmVjKSB7XG4gICAgdmFyIHNXb3JkR3JvdXBMQyA9IHNXb3JkR3JvdXAudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgc2Vlbkl0ID0gY2F0ZWdvcml6ZVdvcmRJbnRlcm5hbFdpdGhPZmZzZXRzKHNXb3JkR3JvdXAsIHNXb3JkR3JvdXBMQywgdHJ1ZSwgc3BsaXRSdWxlcywgY250UmVjKTtcbiAgICAvL2NvbnNvbGUubG9nKFwiU0VFTklUXCIgKyBKU09OLnN0cmluZ2lmeShzZWVuSXQpKTtcbiAgICAvL3RvdGFsQ250ICs9IDE7XG4gICAgLy8gZXhhY3RMZW4gKz0gc2Vlbkl0Lmxlbmd0aDtcbiAgICAvL2NvbnNvbGUubG9nKFwiZmlyc3QgcnVuIGV4YWN0IFwiICsgSlNPTi5zdHJpbmdpZnkoc2Vlbkl0KSk7XG4gICAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0JywgMSk7XG4gICAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XG4gICAgaWYgKGV4cG9ydHMuUmFua1dvcmQuaGFzQWJvdmUoc2Vlbkl0LCAwLjgpKSB7XG4gICAgICAgIGlmIChjbnRSZWMpIHtcbiAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsICdleGFjdFByaW9yVGFrZScsIHNlZW5JdC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHNlZW5JdCA9IGV4cG9ydHMuUmFua1dvcmQudGFrZUFib3ZlKHNlZW5JdCwgMC44KTtcbiAgICAgICAgaWYgKGNudFJlYykge1xuICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYywgJ2V4YWN0QWZ0ZXJUYWtlJywgc2Vlbkl0Lmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHNlZW5JdCA9IGNhdGVnb3JpemVXb3JkSW50ZXJuYWxXaXRoT2Zmc2V0cyhzV29yZEdyb3VwLCBzV29yZEdyb3VwTEMsIGZhbHNlLCBzcGxpdFJ1bGVzLCBjbnRSZWMpO1xuICAgICAgICBhZGRDbnRSZWMoY250UmVjLCAnY250Tm9uRXhhY3QnLCAxKTtcbiAgICAgICAgYWRkQ250UmVjKGNudFJlYywgJ2NudE5vbkV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XG4gICAgfVxuICAgIC8vIHRvdGFsTGVuICs9IHNlZW5JdC5sZW5ndGg7XG4gICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChzZWVuSXQubGVuZ3RoICsgXCIgd2l0aCBcIiArIHNlZW5JdC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIG9iaikgeyByZXR1cm4gcHJldiArIChvYmoucnVsZS5yYW5nZSA/IDEgOiAwKTsgfSwgMCkgKyBcIiByYW5nZWQgIVwiKSA6ICctJyk7XG4gICAgLy8gIHZhciBjbnRSYW5nZWQgPSBzZWVuSXQucmVkdWNlKCAocHJldixvYmopID0+IHByZXYgKyAob2JqLnJ1bGUucmFuZ2UgPyAxIDogMCksMCk7XG4gICAgLy8gIGNvbnNvbGUubG9nKGAqKioqKioqKioqKiAke3NlZW5JdC5sZW5ndGh9IHdpdGggJHtjbnRSYW5nZWR9IHJhbmdlZCAhYCk7XG4gICAgc2Vlbkl0ID0gZXhwb3J0cy5SYW5rV29yZC50YWtlRmlyc3ROKHNlZW5JdCwgQWxnb2wuVG9wX05fV29yZENhdGVnb3JpemF0aW9ucyk7XG4gICAgLy8gcmV0YWluZWRDbnQgKz0gc2Vlbkl0Lmxlbmd0aDtcbiAgICAvL2NvbnNvbGUubG9nKFwiZmluYWwgcmVzIG9mIGNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmXCIgKyBKU09OLnN0cmluZ2lmeShzZWVuSXQpKTtcbiAgICByZXR1cm4gc2Vlbkl0O1xufVxuZXhwb3J0cy5jYXRlZ29yaXplV29yZFdpdGhPZmZzZXRXaXRoUmFua0N1dG9mZiA9IGNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmO1xuZnVuY3Rpb24gY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmZTaW5nbGUod29yZCwgcnVsZSkge1xuICAgIHZhciBsY3dvcmQgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGxjd29yZCA9PT0gcnVsZS5sb3dlcmNhc2V3b3JkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdHJpbmc6IHdvcmQsXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBydWxlLm1hdGNoZWRTdHJpbmcsXG4gICAgICAgICAgICBjYXRlZ29yeTogcnVsZS5jYXRlZ29yeSxcbiAgICAgICAgICAgIHJ1bGU6IHJ1bGUsXG4gICAgICAgICAgICBfcmFua2luZzogcnVsZS5fcmFua2luZyB8fCAxLjBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGNoZWNrT25lUnVsZVdpdGhPZmZzZXQod29yZCwgbGN3b3JkLCBmYWxzZSwgcmVzLCBydWxlKTtcbiAgICBkZWJ1Z2xvZyhcImNhdFdXT1dSQ1MgXCIgKyBsY3dvcmQpO1xuICAgIGlmIChyZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiByZXNbMF07XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5leHBvcnRzLmNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmU2luZ2xlID0gY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmZTaW5nbGU7XG4vKlxuZXhwb3J0IGZ1bmN0aW9uIGR1bXBDbnQoKSB7XG4gIGNvbnNvbGUubG9nKGBcbmV4YWN0TGVuID0gJHtleGFjdExlbn07XG5leGFjdENudCA9ICR7ZXhhY3RDbnR9O1xuZnV6enlMZW4gPSAke2Z1enp5TGVufTtcbmZ1enp5Q250ID0gJHtmdXp6eUNudH07XG50b3RhbENudCA9ICR7dG90YWxDbnR9O1xudG90YWxMZW4gPSAke3RvdGFsTGVufTtcbnJldGFpbmVkTGVuID0gJHtyZXRhaW5lZENudH07XG4gIGApO1xufVxuKi9cbmZ1bmN0aW9uIGZpbHRlclJlbW92aW5nVW5jYXRlZ29yaXplZFNlbnRlbmNlKG9TZW50ZW5jZSkge1xuICAgIHJldHVybiBvU2VudGVuY2UuZXZlcnkoZnVuY3Rpb24gKG9Xb3JkR3JvdXApIHtcbiAgICAgICAgcmV0dXJuIChvV29yZEdyb3VwLmxlbmd0aCA+IDApO1xuICAgIH0pO1xufVxuZXhwb3J0cy5maWx0ZXJSZW1vdmluZ1VuY2F0ZWdvcml6ZWRTZW50ZW5jZSA9IGZpbHRlclJlbW92aW5nVW5jYXRlZ29yaXplZFNlbnRlbmNlO1xuZnVuY3Rpb24gZmlsdGVyUmVtb3ZpbmdVbmNhdGVnb3JpemVkKGFycikge1xuICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlclJlbW92aW5nVW5jYXRlZ29yaXplZFNlbnRlbmNlKG9TZW50ZW5jZSk7XG4gICAgfSk7XG59XG5leHBvcnRzLmZpbHRlclJlbW92aW5nVW5jYXRlZ29yaXplZCA9IGZpbHRlclJlbW92aW5nVW5jYXRlZ29yaXplZDtcbmZ1bmN0aW9uIGNhdGVnb3JpemVBV29yZChzV29yZEdyb3VwLCBydWxlcywgc2VudGVuY2UsIHdvcmRzLCBjbnRSZWMpIHtcbiAgICB2YXIgc2Vlbkl0ID0gd29yZHNbc1dvcmRHcm91cF07XG4gICAgaWYgKHNlZW5JdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNlZW5JdCA9IGNhdGVnb3JpemVXb3JkV2l0aFJhbmtDdXRvZmYoc1dvcmRHcm91cCwgcnVsZXMsIGNudFJlYyk7XG4gICAgICAgIHV0aWxzLmRlZXBGcmVlemUoc2Vlbkl0KTtcbiAgICAgICAgd29yZHNbc1dvcmRHcm91cF0gPSBzZWVuSXQ7XG4gICAgfVxuICAgIGlmICghc2Vlbkl0IHx8IHNlZW5JdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbG9nZ2VyKFwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgXFxcIlwiICsgc1dvcmRHcm91cCArIFwiXFxcIiBpbiBzZW50ZW5jZSBcXFwiXCJcbiAgICAgICAgICAgICsgc2VudGVuY2UgKyBcIlxcXCJcIik7XG4gICAgICAgIGlmIChzV29yZEdyb3VwLmluZGV4T2YoXCIgXCIpIDw9IDApIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgcHJpbWl0aXZlICghKVwiICsgc1dvcmRHcm91cCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVidWdsb2coXCIqKipXQVJOSU5HOiBEaWQgbm90IGZpbmQgYW55IGNhdGVnb3JpemF0aW9uIGZvciBcIiArIHNXb3JkR3JvdXApO1xuICAgICAgICBpZiAoIXNlZW5JdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0aW5nIGVtdHB5IGxpc3QsIG5vdCB1bmRlZmluZWQgZm9yIFxcXCJcIiArIHNXb3JkR3JvdXAgKyBcIlxcXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgd29yZHNbc1dvcmRHcm91cF0gPSBbXTtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICByZXR1cm4gdXRpbHMuY2xvbmVEZWVwKHNlZW5JdCk7XG59XG5leHBvcnRzLmNhdGVnb3JpemVBV29yZCA9IGNhdGVnb3JpemVBV29yZDtcbi8qKlxuICogR2l2ZW4gYSAgc3RyaW5nLCBicmVhayBpdCBkb3duIGludG8gY29tcG9uZW50cyxcbiAqIFtbJ0EnLCAnQiddLCBbJ0EgQiddXVxuICpcbiAqIHRoZW4gY2F0ZWdvcml6ZVdvcmRzXG4gKiByZXR1cm5pbmdcbiAqXG4gKiBbIFtbIHsgY2F0ZWdvcnk6ICdzeXN0ZW1JZCcsIHdvcmQgOiAnQSd9LFxuICogICAgICB7IGNhdGVnb3J5OiAnb3RoZXJ0aGluZycsIHdvcmQgOiAnQSd9XG4gKiAgICBdLFxuICogICAgLy8gcmVzdWx0IG9mIEJcbiAqICAgIFsgeyBjYXRlZ29yeTogJ3N5c3RlbUlkJywgd29yZCA6ICdCJ30sXG4gKiAgICAgIHsgY2F0ZWdvcnk6ICdvdGhlcnRoaW5nJywgd29yZCA6ICdBJ31cbiAqICAgICAgeyBjYXRlZ29yeTogJ2Fub3RoZXJ0cnlwJywgd29yZCA6ICdCJ31cbiAqICAgIF1cbiAqICAgXSxcbiAqIF1dXVxuICpcbiAqXG4gKlxuICovXG5mdW5jdGlvbiBhbmFseXplU3RyaW5nKHNTdHJpbmcsIHJ1bGVzLCB3b3Jkcykge1xuICAgIHZhciBjbnQgPSAwO1xuICAgIHZhciBmYWMgPSAxO1xuICAgIHZhciB1ID0gYnJlYWtkb3duLmJyZWFrZG93blN0cmluZyhzU3RyaW5nLCBBbGdvbC5NYXhTcGFjZXNQZXJDb21iaW5lZFdvcmQpO1xuICAgIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XG4gICAgICAgIGRlYnVnbG9nKFwiaGVyZSBicmVha2Rvd25cIiArIEpTT04uc3RyaW5naWZ5KHUpKTtcbiAgICB9XG4gICAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh1KSk7XG4gICAgd29yZHMgPSB3b3JkcyB8fCB7fTtcbiAgICBkZWJ1Z3BlcmYoJ3RoaXMgbWFueSBrbm93biB3b3JkczogJyArIE9iamVjdC5rZXlzKHdvcmRzKS5sZW5ndGgpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICB2YXIgY250UmVjID0ge307XG4gICAgdS5mb3JFYWNoKGZ1bmN0aW9uIChhQnJlYWtEb3duU2VudGVuY2UpIHtcbiAgICAgICAgdmFyIGNhdGVnb3JpemVkU2VudGVuY2UgPSBbXTtcbiAgICAgICAgdmFyIGlzVmFsaWQgPSBhQnJlYWtEb3duU2VudGVuY2UuZXZlcnkoZnVuY3Rpb24gKHNXb3JkR3JvdXAsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgc2Vlbkl0ID0gY2F0ZWdvcml6ZUFXb3JkKHNXb3JkR3JvdXAsIHJ1bGVzLCBzU3RyaW5nLCB3b3JkcywgY250UmVjKTtcbiAgICAgICAgICAgIGlmIChzZWVuSXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0ZWdvcml6ZWRTZW50ZW5jZVtpbmRleF0gPSBzZWVuSXQ7XG4gICAgICAgICAgICBjbnQgPSBjbnQgKyBzZWVuSXQubGVuZ3RoO1xuICAgICAgICAgICAgZmFjID0gZmFjICogc2Vlbkl0Lmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGlzVmFsaWQpIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKGNhdGVnb3JpemVkU2VudGVuY2UpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgZGVidWdsb2coXCIgc2VudGVuY2VzIFwiICsgdS5sZW5ndGggKyBcIiBtYXRjaGVzIFwiICsgY250ICsgXCIgZmFjOiBcIiArIGZhYyk7XG4gICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQgJiYgdS5sZW5ndGgpIHtcbiAgICAgICAgZGVidWdsb2coXCJmaXJzdCBtYXRjaCBcIiArIEpTT04uc3RyaW5naWZ5KHUsIHVuZGVmaW5lZCwgMikpO1xuICAgIH1cbiAgICBkZWJ1Z3BlcmYoXCIgc2VudGVuY2VzIFwiICsgdS5sZW5ndGggKyBcIiAvIFwiICsgcmVzLmxlbmd0aCArIFwiIG1hdGNoZXMgXCIgKyBjbnQgKyBcIiBmYWM6IFwiICsgZmFjICsgXCIgcmVjIDogXCIgKyBKU09OLnN0cmluZ2lmeShjbnRSZWMsIHVuZGVmaW5lZCwgMikpO1xuICAgIHJldHVybiByZXM7XG59XG5leHBvcnRzLmFuYWx5emVTdHJpbmcgPSBhbmFseXplU3RyaW5nO1xuZnVuY3Rpb24gY2F0ZWdvcml6ZUFXb3JkV2l0aE9mZnNldHMoc1dvcmRHcm91cCwgcnVsZXMsIHNlbnRlbmNlLCB3b3JkcywgY250UmVjKSB7XG4gICAgdmFyIHNlZW5JdCA9IHdvcmRzW3NXb3JkR3JvdXBdO1xuICAgIGlmIChzZWVuSXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzZWVuSXQgPSBjYXRlZ29yaXplV29yZFdpdGhPZmZzZXRXaXRoUmFua0N1dG9mZihzV29yZEdyb3VwLCBydWxlcywgY250UmVjKTtcbiAgICAgICAgdXRpbHMuZGVlcEZyZWV6ZShzZWVuSXQpO1xuICAgICAgICB3b3Jkc1tzV29yZEdyb3VwXSA9IHNlZW5JdDtcbiAgICB9XG4gICAgaWYgKCFzZWVuSXQgfHwgc2Vlbkl0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBsb2dnZXIoXCIqKipXQVJOSU5HOiBEaWQgbm90IGZpbmQgYW55IGNhdGVnb3JpemF0aW9uIGZvciBcXFwiXCIgKyBzV29yZEdyb3VwICsgXCJcXFwiIGluIHNlbnRlbmNlIFxcXCJcIlxuICAgICAgICAgICAgKyBzZW50ZW5jZSArIFwiXFxcIlwiKTtcbiAgICAgICAgaWYgKHNXb3JkR3JvdXAuaW5kZXhPZihcIiBcIikgPD0gMCkge1xuICAgICAgICAgICAgZGVidWdsb2coXCIqKipXQVJOSU5HOiBEaWQgbm90IGZpbmQgYW55IGNhdGVnb3JpemF0aW9uIGZvciBwcmltaXRpdmUgKCEpXCIgKyBzV29yZEdyb3VwKTtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1Z2xvZyhcIioqKldBUk5JTkc6IERpZCBub3QgZmluZCBhbnkgY2F0ZWdvcml6YXRpb24gZm9yIFwiICsgc1dvcmRHcm91cCk7XG4gICAgICAgIGlmICghc2Vlbkl0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgZW10cHkgbGlzdCwgbm90IHVuZGVmaW5lZCBmb3IgXFxcIlwiICsgc1dvcmRHcm91cCArIFwiXFxcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICB3b3Jkc1tzV29yZEdyb3VwXSA9IFtdO1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHJldHVybiB1dGlscy5jbG9uZURlZXAoc2Vlbkl0KTtcbn1cbmV4cG9ydHMuY2F0ZWdvcml6ZUFXb3JkV2l0aE9mZnNldHMgPSBjYXRlZ29yaXplQVdvcmRXaXRoT2Zmc2V0cztcbi8qXG5bIFthLGJdLCBbYyxkXV1cblxuMDAgYVxuMDEgYlxuMTAgY1xuMTEgZFxuMTIgY1xuKi9cbnZhciBjbG9uZSA9IHV0aWxzLmNsb25lRGVlcDtcbmZ1bmN0aW9uIGNvcHlWZWNNZW1iZXJzKHUpIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdVtpXSA9IGNsb25lKHVbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gdTtcbn1cbi8vIHdlIGNhbiByZXBsaWNhdGUgdGhlIHRhaWwgb3IgdGhlIGhlYWQsXG4vLyB3ZSByZXBsaWNhdGUgdGhlIHRhaWwgYXMgaXQgaXMgc21hbGxlci5cbi8vIFthLGIsYyBdXG5mdW5jdGlvbiBleHBhbmRNYXRjaEFycihkZWVwKSB7XG4gICAgdmFyIGEgPSBbXTtcbiAgICB2YXIgbGluZSA9IFtdO1xuICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyBKU09OLnN0cmluZ2lmeShkZWVwKSA6ICctJyk7XG4gICAgZGVlcC5mb3JFYWNoKGZ1bmN0aW9uICh1QnJlYWtEb3duTGluZSwgaUluZGV4KSB7XG4gICAgICAgIGxpbmVbaUluZGV4XSA9IFtdO1xuICAgICAgICB1QnJlYWtEb3duTGluZS5mb3JFYWNoKGZ1bmN0aW9uIChhV29yZEdyb3VwLCB3Z0luZGV4KSB7XG4gICAgICAgICAgICBsaW5lW2lJbmRleF1bd2dJbmRleF0gPSBbXTtcbiAgICAgICAgICAgIGFXb3JkR3JvdXAuZm9yRWFjaChmdW5jdGlvbiAob1dvcmRWYXJpYW50LCBpV1ZJbmRleCkge1xuICAgICAgICAgICAgICAgIGxpbmVbaUluZGV4XVt3Z0luZGV4XVtpV1ZJbmRleF0gPSBvV29yZFZhcmlhbnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IEpTT04uc3RyaW5naWZ5KGxpbmUpIDogJy0nKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgdmFyIG52ZWNzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciB2ZWNzID0gW1tdXTtcbiAgICAgICAgdmFyIG52ZWNzID0gW107XG4gICAgICAgIHZhciBydmVjID0gW107XG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgbGluZVtpXS5sZW5ndGg7ICsraykge1xuICAgICAgICAgICAgLy92ZWNzIGlzIHRoZSB2ZWN0b3Igb2YgYWxsIHNvIGZhciBzZWVuIHZhcmlhbnRzIHVwIHRvIGsgd2dzLlxuICAgICAgICAgICAgdmFyIG5leHRCYXNlID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBsID0gMDsgbCA8IGxpbmVbaV1ba10ubGVuZ3RoOyArK2wpIHtcbiAgICAgICAgICAgICAgICAvL2RlYnVnbG9nKFwidmVjcyBub3dcIiArIEpTT04uc3RyaW5naWZ5KHZlY3MpKTtcbiAgICAgICAgICAgICAgICBudmVjcyA9IFtdOyAvL3ZlY3Muc2xpY2UoKTsgLy8gY29weSB0aGUgdmVjW2ldIGJhc2UgdmVjdG9yO1xuICAgICAgICAgICAgICAgIC8vZGVidWdsb2coXCJ2ZWNzIGNvcGllZCBub3dcIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdSA9IDA7IHUgPCB2ZWNzLmxlbmd0aDsgKyt1KSB7XG4gICAgICAgICAgICAgICAgICAgIG52ZWNzW3VdID0gdmVjc1t1XS5zbGljZSgpOyAvL1xuICAgICAgICAgICAgICAgICAgICBudmVjc1t1XSA9IGNvcHlWZWNNZW1iZXJzKG52ZWNzW3VdKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gZGVidWdsb2coXCJjb3BpZWQgdmVjc1tcIisgdStcIl1cIiArIEpTT04uc3RyaW5naWZ5KHZlY3NbdV0pKTtcbiAgICAgICAgICAgICAgICAgICAgbnZlY3NbdV0ucHVzaChjbG9uZShsaW5lW2ldW2tdW2xdKSk7IC8vIHB1c2ggdGhlIGx0aCB2YXJpYW50XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICAgZGVidWdsb2coXCIgYXQgICAgIFwiICsgayArIFwiOlwiICsgbCArIFwiIG5leHRiYXNlID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcbiAgICAgICAgICAgICAgICAvLyAgIGRlYnVnbG9nKFwiIGFwcGVuZCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBudmVjcyAgICA+XCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpXG4gICAgICAgICAgICAgICAgbmV4dEJhc2UgPSBuZXh0QmFzZS5jb25jYXQobnZlY3MpO1xuICAgICAgICAgICAgfSAvL2NvbnN0cnVcbiAgICAgICAgICAgIC8vICBkZWJ1Z2xvZyhcIm5vdyBhdCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXG4gICAgICAgICAgICB2ZWNzID0gbmV4dEJhc2U7XG4gICAgICAgIH1cbiAgICAgICAgZGVidWdsb2dWKGRlYnVnbG9nVi5lbmFibGVkID8gKFwiQVBQRU5ESU5HIFRPIFJFU1wiICsgaSArIFwiOlwiICsgbCArIFwiID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSkgOiAnLScpO1xuICAgICAgICByZXMgPSByZXMuY29uY2F0KHZlY3MpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZXhwb3J0cy5leHBhbmRNYXRjaEFyciA9IGV4cGFuZE1hdGNoQXJyO1xuLyoqXG4gKiBDYWxjdWxhdGUgYSB3ZWlnaHQgZmFjdG9yIGZvciBhIGdpdmVuIGRpc3RhbmNlIGFuZFxuICogY2F0ZWdvcnlcbiAqIEBwYXJhbSB7aW50ZWdlcn0gZGlzdCBkaXN0YW5jZSBpbiB3b3Jkc1xuICogQHBhcmFtIHtzdHJpbmd9IGNhdGVnb3J5IGNhdGVnb3J5IHRvIHVzZVxuICogQHJldHVybnMge251bWJlcn0gYSBkaXN0YW5jZSBmYWN0b3IgPj0gMVxuICogIDEuMCBmb3Igbm8gZWZmZWN0XG4gKi9cbmZ1bmN0aW9uIHJlaW5mb3JjZURpc3RXZWlnaHQoZGlzdCwgY2F0ZWdvcnkpIHtcbiAgICB2YXIgYWJzID0gTWF0aC5hYnMoZGlzdCk7XG4gICAgcmV0dXJuIDEuMCArIChBbGdvbC5hUmVpbmZvcmNlRGlzdFdlaWdodFthYnNdIHx8IDApO1xufVxuZXhwb3J0cy5yZWluZm9yY2VEaXN0V2VpZ2h0ID0gcmVpbmZvcmNlRGlzdFdlaWdodDtcbi8qKlxuICogR2l2ZW4gYSBzZW50ZW5jZSwgZXh0YWN0IGNhdGVnb3JpZXNcbiAqL1xuZnVuY3Rpb24gZXh0cmFjdENhdGVnb3J5TWFwKG9TZW50ZW5jZSkge1xuICAgIHZhciByZXMgPSB7fTtcbiAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdleHRyYWN0Q2F0ZWdvcnlNYXAgJyArIEpTT04uc3RyaW5naWZ5KG9TZW50ZW5jZSkpIDogJy0nKTtcbiAgICBvU2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbiAob1dvcmQsIGlJbmRleCkge1xuICAgICAgICBpZiAob1dvcmQuY2F0ZWdvcnkgPT09IElGTWF0Y2guQ0FUX0NBVEVHT1JZKSB7XG4gICAgICAgICAgICByZXNbb1dvcmQubWF0Y2hlZFN0cmluZ10gPSByZXNbb1dvcmQubWF0Y2hlZFN0cmluZ10gfHwgW107XG4gICAgICAgICAgICByZXNbb1dvcmQubWF0Y2hlZFN0cmluZ10ucHVzaCh7IHBvczogaUluZGV4IH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdXRpbHMuZGVlcEZyZWV6ZShyZXMpO1xuICAgIHJldHVybiByZXM7XG59XG5leHBvcnRzLmV4dHJhY3RDYXRlZ29yeU1hcCA9IGV4dHJhY3RDYXRlZ29yeU1hcDtcbmZ1bmN0aW9uIHJlaW5Gb3JjZVNlbnRlbmNlKG9TZW50ZW5jZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBvQ2F0ZWdvcnlNYXAgPSBleHRyYWN0Q2F0ZWdvcnlNYXAob1NlbnRlbmNlKTtcbiAgICBvU2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbiAob1dvcmQsIGlJbmRleCkge1xuICAgICAgICB2YXIgbSA9IG9DYXRlZ29yeU1hcFtvV29yZC5jYXRlZ29yeV0gfHwgW107XG4gICAgICAgIG0uZm9yRWFjaChmdW5jdGlvbiAob1Bvc2l0aW9uKSB7XG4gICAgICAgICAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAgICAgICAgIG9Xb3JkLnJlaW5mb3JjZSA9IG9Xb3JkLnJlaW5mb3JjZSB8fCAxO1xuICAgICAgICAgICAgdmFyIGJvb3N0ID0gcmVpbmZvcmNlRGlzdFdlaWdodChpSW5kZXggLSBvUG9zaXRpb24ucG9zLCBvV29yZC5jYXRlZ29yeSk7XG4gICAgICAgICAgICBvV29yZC5yZWluZm9yY2UgKj0gYm9vc3Q7XG4gICAgICAgICAgICBvV29yZC5fcmFua2luZyAqPSBib29zdDtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgb1NlbnRlbmNlLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkLCBpSW5kZXgpIHtcbiAgICAgICAgaWYgKGlJbmRleCA+IDApIHtcbiAgICAgICAgICAgIGlmIChvU2VudGVuY2VbaUluZGV4IC0gMV0uY2F0ZWdvcnkgPT09IFwibWV0YVwiICYmIChvV29yZC5jYXRlZ29yeSA9PT0gb1NlbnRlbmNlW2lJbmRleCAtIDFdLm1hdGNoZWRTdHJpbmcpKSB7XG4gICAgICAgICAgICAgICAgb1dvcmQucmVpbmZvcmNlID0gb1dvcmQucmVpbmZvcmNlIHx8IDE7XG4gICAgICAgICAgICAgICAgdmFyIGJvb3N0ID0gcmVpbmZvcmNlRGlzdFdlaWdodCgxLCBvV29yZC5jYXRlZ29yeSk7XG4gICAgICAgICAgICAgICAgb1dvcmQucmVpbmZvcmNlICo9IGJvb3N0O1xuICAgICAgICAgICAgICAgIG9Xb3JkLl9yYW5raW5nICo9IGJvb3N0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9TZW50ZW5jZTtcbn1cbmV4cG9ydHMucmVpbkZvcmNlU2VudGVuY2UgPSByZWluRm9yY2VTZW50ZW5jZTtcbnZhciBTZW50ZW5jZSA9IHJlcXVpcmUoXCIuL3NlbnRlbmNlXCIpO1xuZnVuY3Rpb24gcmVpbkZvcmNlKGFDYXRlZ29yaXplZEFycmF5KSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgYUNhdGVnb3JpemVkQXJyYXkuZm9yRWFjaChmdW5jdGlvbiAob1NlbnRlbmNlKSB7XG4gICAgICAgIHJlaW5Gb3JjZVNlbnRlbmNlKG9TZW50ZW5jZSk7XG4gICAgfSk7XG4gICAgYUNhdGVnb3JpemVkQXJyYXkuc29ydChTZW50ZW5jZS5jbXBSYW5raW5nUHJvZHVjdCk7XG4gICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgICAgZGVidWdsb2coXCJhZnRlciByZWluZm9yY2VcIiArIGFDYXRlZ29yaXplZEFycmF5Lm1hcChmdW5jdGlvbiAob1NlbnRlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gU2VudGVuY2UucmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlKSArIFwiOlwiICsgSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcbiAgICAgICAgfSkuam9pbihcIlxcblwiKSk7XG4gICAgfVxuICAgIHJldHVybiBhQ2F0ZWdvcml6ZWRBcnJheTtcbn1cbmV4cG9ydHMucmVpbkZvcmNlID0gcmVpbkZvcmNlO1xuLy8vIGJlbG93IG1heSBubyBsb25nZXIgYmUgdXNlZFxuZnVuY3Rpb24gbWF0Y2hSZWdFeHAob1J1bGUsIGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBpZiAoY29udGV4dFtvUnVsZS5rZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdmFyIHNLZXkgPSBvUnVsZS5rZXk7XG4gICAgdmFyIHMxID0gY29udGV4dFtvUnVsZS5rZXldLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIHJlZyA9IG9SdWxlLnJlZ2V4cDtcbiAgICB2YXIgbSA9IHJlZy5leGVjKHMxKTtcbiAgICBpZiAoZGVidWdsb2dWLmVuYWJsZWQpIHtcbiAgICAgICAgZGVidWdsb2dWKFwiYXBwbHlpbmcgcmVnZXhwOiBcIiArIHMxICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShtKSk7XG4gICAgfVxuICAgIGlmICghbSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgZGVsdGEgPSBjb21wYXJlQ29udGV4dChjb250ZXh0LCBvUnVsZS5mb2xsb3dzLCBvUnVsZS5rZXkpO1xuICAgIGlmIChkZWJ1Z2xvZ1YuZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZ1YoSlNPTi5zdHJpbmdpZnkoZGVsdGEpKTtcbiAgICAgICAgZGVidWdsb2dWKEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMubWF0Y2hvdGhlcnMgJiYgKGRlbHRhLmRpZmZlcmVudCA+IDApKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHZhciBvRXh0cmFjdGVkQ29udGV4dCA9IGV4dHJhY3RBcmdzTWFwKG0sIG9SdWxlLmFyZ3NNYXApO1xuICAgIGlmIChkZWJ1Z2xvZ1YuZW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z2xvZ1YoXCJleHRyYWN0ZWQgYXJncyBcIiArIEpTT04uc3RyaW5naWZ5KG9SdWxlLmFyZ3NNYXApKTtcbiAgICAgICAgZGVidWdsb2dWKFwibWF0Y2ggXCIgKyBKU09OLnN0cmluZ2lmeShtKSk7XG4gICAgICAgIGRlYnVnbG9nVihcImV4dHJhY3RlZCBhcmdzIFwiICsgSlNPTi5zdHJpbmdpZnkob0V4dHJhY3RlZENvbnRleHQpKTtcbiAgICB9XG4gICAgdmFyIHJlcyA9IEFueU9iamVjdC5hc3NpZ24oe30sIG9SdWxlLmZvbGxvd3MpO1xuICAgIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBvRXh0cmFjdGVkQ29udGV4dCk7XG4gICAgcmVzID0gQW55T2JqZWN0LmFzc2lnbihyZXMsIGNvbnRleHQpO1xuICAgIGlmIChvRXh0cmFjdGVkQ29udGV4dFtzS2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlc1tzS2V5XSA9IG9FeHRyYWN0ZWRDb250ZXh0W3NLZXldO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5vdmVycmlkZSkge1xuICAgICAgICByZXMgPSBBbnlPYmplY3QuYXNzaWduKHJlcywgb1J1bGUuZm9sbG93cyk7XG4gICAgICAgIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBvRXh0cmFjdGVkQ29udGV4dCk7XG4gICAgfVxuICAgIE9iamVjdC5mcmVlemUocmVzKTtcbiAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdGb3VuZCBvbmUnICsgSlNPTi5zdHJpbmdpZnkocmVzLCB1bmRlZmluZWQsIDIpKSA6ICctJyk7XG4gICAgcmV0dXJuIHJlcztcbn1cbmV4cG9ydHMubWF0Y2hSZWdFeHAgPSBtYXRjaFJlZ0V4cDtcbmZ1bmN0aW9uIHNvcnRCeVdlaWdodChzS2V5LCBvQ29udGV4dEEsIG9Db250ZXh0Qikge1xuICAgIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XG4gICAgICAgIGRlYnVnbG9nVignc29ydGluZzogJyArIHNLZXkgKyAnaW52b2tlZCB3aXRoXFxuIDE6JyArIEpTT04uc3RyaW5naWZ5KG9Db250ZXh0QSwgdW5kZWZpbmVkLCAyKSArXG4gICAgICAgICAgICBcIiB2cyBcXG4gMjpcIiArIEpTT04uc3RyaW5naWZ5KG9Db250ZXh0QiwgdW5kZWZpbmVkLCAyKSk7XG4gICAgfVxuICAgIHZhciByYW5raW5nQSA9IHBhcnNlRmxvYXQob0NvbnRleHRBW1wiX3JhbmtpbmdcIl0gfHwgXCIxXCIpO1xuICAgIHZhciByYW5raW5nQiA9IHBhcnNlRmxvYXQob0NvbnRleHRCW1wiX3JhbmtpbmdcIl0gfHwgXCIxXCIpO1xuICAgIGlmIChyYW5raW5nQSAhPT0gcmFua2luZ0IpIHtcbiAgICAgICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiIHJhbmtpbiBkZWx0YVwiICsgMTAwICogKHJhbmtpbmdCIC0gcmFua2luZ0EpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTAwICogKHJhbmtpbmdCIC0gcmFua2luZ0EpO1xuICAgIH1cbiAgICB2YXIgd2VpZ2h0QSA9IG9Db250ZXh0QVtcIl93ZWlnaHRcIl0gJiYgb0NvbnRleHRBW1wiX3dlaWdodFwiXVtzS2V5XSB8fCAwO1xuICAgIHZhciB3ZWlnaHRCID0gb0NvbnRleHRCW1wiX3dlaWdodFwiXSAmJiBvQ29udGV4dEJbXCJfd2VpZ2h0XCJdW3NLZXldIHx8IDA7XG4gICAgcmV0dXJuICsod2VpZ2h0QiAtIHdlaWdodEEpO1xufVxuZXhwb3J0cy5zb3J0QnlXZWlnaHQgPSBzb3J0QnlXZWlnaHQ7XG4vLyBXb3JkLCBTeW5vbnltLCBSZWdleHAgLyBFeHRyYWN0aW9uUnVsZVxuZnVuY3Rpb24gYXVnbWVudENvbnRleHQxKGNvbnRleHQsIG9SdWxlcywgb3B0aW9ucykge1xuICAgIHZhciBzS2V5ID0gb1J1bGVzWzBdLmtleTtcbiAgICAvLyBjaGVjayB0aGF0IHJ1bGVcbiAgICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xuICAgICAgICAvLyBjaGVjayBjb25zaXN0ZW5jeVxuICAgICAgICBvUnVsZXMuZXZlcnkoZnVuY3Rpb24gKGlSdWxlKSB7XG4gICAgICAgICAgICBpZiAoaVJ1bGUua2V5ICE9PSBzS2V5KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5ob21vZ2Vub3VzIGtleXMgaW4gcnVsZXMsIGV4cGVjdGVkIFwiICsgc0tleSArIFwiIHdhcyBcIiArIEpTT04uc3RyaW5naWZ5KGlSdWxlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGxvb2sgZm9yIHJ1bGVzIHdoaWNoIG1hdGNoXG4gICAgdmFyIHJlcyA9IG9SdWxlcy5tYXAoZnVuY3Rpb24gKG9SdWxlKSB7XG4gICAgICAgIC8vIGlzIHRoaXMgcnVsZSBhcHBsaWNhYmxlXG4gICAgICAgIHN3aXRjaCAob1J1bGUudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAwIC8qIFdPUkQgKi86XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoV29yZChvUnVsZSwgY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjYXNlIDEgLyogUkVHRVhQICovOlxuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaFJlZ0V4cChvUnVsZSwgY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9KS5maWx0ZXIoZnVuY3Rpb24gKG9yZXMpIHtcbiAgICAgICAgcmV0dXJuICEhb3JlcztcbiAgICB9KS5zb3J0KHNvcnRCeVdlaWdodC5iaW5kKHRoaXMsIHNLZXkpKTtcbiAgICAvL2RlYnVnbG9nKFwiaGFzc29ydGVkXCIgKyBKU09OLnN0cmluZ2lmeShyZXMsdW5kZWZpbmVkLDIpKTtcbiAgICByZXR1cm4gcmVzO1xuICAgIC8vIE9iamVjdC5rZXlzKCkuZm9yRWFjaChmdW5jdGlvbiAoc0tleSkge1xuICAgIC8vIH0pO1xufVxuZXhwb3J0cy5hdWdtZW50Q29udGV4dDEgPSBhdWdtZW50Q29udGV4dDE7XG5mdW5jdGlvbiBhdWdtZW50Q29udGV4dChjb250ZXh0LCBhUnVsZXMpIHtcbiAgICB2YXIgb3B0aW9uczEgPSB7XG4gICAgICAgIG1hdGNob3RoZXJzOiB0cnVlLFxuICAgICAgICBvdmVycmlkZTogZmFsc2VcbiAgICB9O1xuICAgIHZhciBhUmVzID0gYXVnbWVudENvbnRleHQxKGNvbnRleHQsIGFSdWxlcywgb3B0aW9uczEpO1xuICAgIGlmIChhUmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB2YXIgb3B0aW9uczIgPSB7XG4gICAgICAgICAgICBtYXRjaG90aGVyczogZmFsc2UsXG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgICBhUmVzID0gYXVnbWVudENvbnRleHQxKGNvbnRleHQsIGFSdWxlcywgb3B0aW9uczIpO1xuICAgIH1cbiAgICByZXR1cm4gYVJlcztcbn1cbmV4cG9ydHMuYXVnbWVudENvbnRleHQgPSBhdWdtZW50Q29udGV4dDtcbmZ1bmN0aW9uIGluc2VydE9yZGVyZWQocmVzdWx0LCBpSW5zZXJ0ZWRNZW1iZXIsIGxpbWl0KSB7XG4gICAgLy8gVE9ETzogdXNlIHNvbWUgd2VpZ2h0XG4gICAgaWYgKHJlc3VsdC5sZW5ndGggPCBsaW1pdCkge1xuICAgICAgICByZXN1bHQucHVzaChpSW5zZXJ0ZWRNZW1iZXIpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZXhwb3J0cy5pbnNlcnRPcmRlcmVkID0gaW5zZXJ0T3JkZXJlZDtcbmZ1bmN0aW9uIHRha2VUb3BOKGFycikge1xuICAgIHZhciB1ID0gYXJyLmZpbHRlcihmdW5jdGlvbiAoaW5uZXJBcnIpIHsgcmV0dXJuIGlubmVyQXJyLmxlbmd0aCA+IDA7IH0pO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICAvLyBzaGlmdCBvdXQgdGhlIHRvcCBvbmVzXG4gICAgdSA9IHUubWFwKGZ1bmN0aW9uIChpQXJyKSB7XG4gICAgICAgIHZhciB0b3AgPSBpQXJyLnNoaWZ0KCk7XG4gICAgICAgIHJlcyA9IGluc2VydE9yZGVyZWQocmVzLCB0b3AsIDUpO1xuICAgICAgICByZXR1cm4gaUFycjtcbiAgICB9KS5maWx0ZXIoZnVuY3Rpb24gKGlubmVyQXJyKSB7IHJldHVybiBpbm5lckFyci5sZW5ndGggPiAwOyB9KTtcbiAgICAvLyBhcyBBcnJheTxBcnJheTxJRk1hdGNoLmNvbnRleHQ+PlxuICAgIHJldHVybiByZXM7XG59XG5leHBvcnRzLnRha2VUb3BOID0gdGFrZVRvcE47XG52YXIgaW5wdXRGaWx0ZXJSdWxlcyA9IHJlcXVpcmUoXCIuL2lucHV0RmlsdGVyUnVsZXNcIik7XG52YXIgcm07XG5mdW5jdGlvbiBnZXRSTU9uY2UoKSB7XG4gICAgaWYgKCFybSkge1xuICAgICAgICBybSA9IGlucHV0RmlsdGVyUnVsZXMuZ2V0UnVsZU1hcCgpO1xuICAgIH1cbiAgICByZXR1cm4gcm07XG59XG5mdW5jdGlvbiBhcHBseVJ1bGVzKGNvbnRleHQpIHtcbiAgICB2YXIgYmVzdE4gPSBbY29udGV4dF07XG4gICAgaW5wdXRGaWx0ZXJSdWxlcy5vS2V5T3JkZXIuZm9yRWFjaChmdW5jdGlvbiAoc0tleSkge1xuICAgICAgICB2YXIgYmVzdE5leHQgPSBbXTtcbiAgICAgICAgYmVzdE4uZm9yRWFjaChmdW5jdGlvbiAob0NvbnRleHQpIHtcbiAgICAgICAgICAgIGlmIChvQ29udGV4dFtzS2V5XSkge1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCcqKiBhcHBseWluZyBydWxlcyBmb3IgJyArIHNLZXkpO1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSBhdWdtZW50Q29udGV4dChvQ29udGV4dCwgZ2V0Uk1PbmNlKClbc0tleV0gfHwgW10pO1xuICAgICAgICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoJyoqIHJlc3VsdCBmb3IgJyArIHNLZXkgKyAnID0gJyArIEpTT04uc3RyaW5naWZ5KHJlcywgdW5kZWZpbmVkLCAyKSkgOiAnLScpO1xuICAgICAgICAgICAgICAgIGJlc3ROZXh0LnB1c2gocmVzIHx8IFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHJ1bGUgbm90IHJlbGV2YW50XG4gICAgICAgICAgICAgICAgYmVzdE5leHQucHVzaChbb0NvbnRleHRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJlc3ROID0gdGFrZVRvcE4oYmVzdE5leHQpO1xuICAgIH0pO1xuICAgIHJldHVybiBiZXN0Tjtcbn1cbmV4cG9ydHMuYXBwbHlSdWxlcyA9IGFwcGx5UnVsZXM7XG5mdW5jdGlvbiBhcHBseVJ1bGVzUGlja0ZpcnN0KGNvbnRleHQpIHtcbiAgICB2YXIgciA9IGFwcGx5UnVsZXMoY29udGV4dCk7XG4gICAgcmV0dXJuIHIgJiYgclswXTtcbn1cbmV4cG9ydHMuYXBwbHlSdWxlc1BpY2tGaXJzdCA9IGFwcGx5UnVsZXNQaWNrRmlyc3Q7XG4vKipcbiAqIERlY2lkZSB3aGV0aGVyIHRvIHJlcXVlcnkgZm9yIGEgY29udGV0XG4gKi9cbmZ1bmN0aW9uIGRlY2lkZU9uUmVRdWVyeShjb250ZXh0KSB7XG4gICAgcmV0dXJuIFtdO1xufVxuZXhwb3J0cy5kZWNpZGVPblJlUXVlcnkgPSBkZWNpZGVPblJlUXVlcnk7XG4iLCIvKipcclxuICogdGhlIGlucHV0IGZpbHRlciBzdGFnZSBwcmVwcm9jZXNzZXMgYSBjdXJyZW50IGNvbnRleHRcclxuICpcclxuICogSXQgYSkgY29tYmluZXMgbXVsdGktc2VnbWVudCBhcmd1bWVudHMgaW50byBvbmUgY29udGV4dCBtZW1iZXJzXHJcbiAqIEl0IGIpIGF0dGVtcHRzIHRvIGF1Z21lbnQgdGhlIGNvbnRleHQgYnkgYWRkaXRpb25hbCBxdWFsaWZpY2F0aW9uc1xyXG4gKiAgICAgICAgICAgKE1pZCB0ZXJtIGdlbmVyYXRpbmcgQWx0ZXJuYXRpdmVzLCBlLmcuXHJcbiAqICAgICAgICAgICAgICAgICBDbGllbnRTaWRlVGFyZ2V0UmVzb2x1dGlvbiAtPiB1bml0IHRlc3Q/XHJcbiAqICAgICAgICAgICAgICAgICBDbGllbnRTaWRlVGFyZ2V0UmVzb2x1dGlvbiAtPiBzb3VyY2UgP1xyXG4gKiAgICAgICAgICAgKVxyXG4gKiAgU2ltcGxlIHJ1bGVzIGxpa2UgIEludGVudFxyXG4gKlxyXG4gKlxyXG4gKiBAbW9kdWxlIGpmc2ViLmZkZXZzdGFydC5pbnB1dEZpbHRlclxyXG4gKiBAZmlsZSBpbnB1dEZpbHRlci50c1xyXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2IEdlcmQgRm9yc3RtYW5uXHJcbiAqL1xyXG4vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9saWIvbm9kZS00LmQudHNcIiAvPlxyXG5pbXBvcnQgKiBhcyBkaXN0YW5jZSBmcm9tICcuLi91dGlscy9kYW1lcmF1TGV2ZW5zaHRlaW4nO1xyXG5cclxuaW1wb3J0ICogYXMgTG9nZ2VyIGZyb20gJy4uL3V0aWxzL2xvZ2dlcidcclxuXHJcbmNvbnN0IGxvZ2dlciA9IExvZ2dlci5sb2dnZXIoJ2lucHV0RmlsdGVyJyk7XHJcblxyXG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XHJcbnZhciBkZWJ1Z3BlcmYgPSBkZWJ1ZygncGVyZicpO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMvdXRpbHMnO1xyXG5cclxuXHJcbmltcG9ydCAqIGFzIEFsZ29sIGZyb20gJy4vYWxnb2wnO1xyXG5cclxuaW1wb3J0ICogYXMgSU1hdGNoIGZyb20gJy4vaWZtYXRjaCc7XHJcblxyXG5pbXBvcnQgKiBhcyBicmVha2Rvd24gZnJvbSAnLi9icmVha2Rvd24nO1xyXG5cclxuY29uc3QgQW55T2JqZWN0ID0gPGFueT5PYmplY3Q7XHJcblxyXG5jb25zdCBkZWJ1Z2xvZyA9IGRlYnVnKCdpbnB1dEZpbHRlcicpXHJcbmNvbnN0IGRlYnVnbG9nViA9IGRlYnVnKCdpbnB1dFZGaWx0ZXInKVxyXG5jb25zdCBkZWJ1Z2xvZ00gPSBkZWJ1ZygnaW5wdXRNRmlsdGVyJylcclxuXHJcblxyXG5cclxuaW1wb3J0ICogYXMgbWF0Y2hkYXRhIGZyb20gJy4vbWF0Y2hkYXRhJztcclxudmFyIG9Vbml0VGVzdHMgPSBtYXRjaGRhdGEub1VuaXRUZXN0c1xyXG5cclxuXHJcblxyXG4vKipcclxuICogQHBhcmFtIHNUZXh0IHtzdHJpbmd9IHRoZSB0ZXh0IHRvIG1hdGNoIHRvIE5hdlRhcmdldFJlc29sdXRpb25cclxuICogQHBhcmFtIHNUZXh0MiB7c3RyaW5nfSB0aGUgcXVlcnkgdGV4dCwgZS5nLiBOYXZUYXJnZXRcclxuICpcclxuICogQHJldHVybiB0aGUgZGlzdGFuY2UsIG5vdGUgdGhhdCBpcyBpcyAqbm90KiBzeW1tZXRyaWMhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2FsY0Rpc3RhbmNlKHNUZXh0MTogc3RyaW5nLCBzVGV4dDI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgcmV0dXJuIGRpc3RhbmNlLmNhbGNEaXN0YW5jZShzVGV4dDEsc1RleHQyKTtcclxufVxyXG5cclxuXHJcblxyXG4vKipcclxuICogQHBhcmFtIHNUZXh0IHtzdHJpbmd9IHRoZSB0ZXh0IHRvIG1hdGNoIHRvIE5hdlRhcmdldFJlc29sdXRpb25cclxuICogQHBhcmFtIHNUZXh0MiB7c3RyaW5nfSB0aGUgcXVlcnkgdGV4dCwgZS5nLiBOYXZUYXJnZXRcclxuICpcclxuICogQHJldHVybiB0aGUgZGlzdGFuY2UsIG5vdGUgdGhhdCBpcyBpcyAqbm90KiBzeW1tZXRyaWMhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2FsY0Rpc3RhbmNlTGV2ZW4oc1RleHQxOiBzdHJpbmcsIHNUZXh0Mjogc3RyaW5nKTogbnVtYmVyIHtcclxuICAvLyBjb25zb2xlLmxvZyhcImxlbmd0aDJcIiArIHNUZXh0MSArIFwiIC0gXCIgKyBzVGV4dDIpXHJcbiAgIGlmKCgoc1RleHQxLmxlbmd0aCAtIHNUZXh0Mi5sZW5ndGgpID4gQWxnb2wuY2FsY0Rpc3QubGVuZ3RoRGVsdGExKVxyXG4gICAgfHwgKHNUZXh0Mi5sZW5ndGggPiAxLjUgKiBzVGV4dDEubGVuZ3RoIClcclxuICAgIHx8IChzVGV4dDIubGVuZ3RoIDwgKHNUZXh0MS5sZW5ndGgvMikpICkge1xyXG4gICAgcmV0dXJuIDUwMDAwO1xyXG4gIH1cclxuICB2YXIgYTAgPSBkaXN0YW5jZS5sZXZlbnNodGVpbihzVGV4dDEuc3Vic3RyaW5nKDAsIHNUZXh0Mi5sZW5ndGgpLCBzVGV4dDIpXHJcbiAgaWYoZGVidWdsb2dWLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nVihcImRpc3RhbmNlXCIgKyBhMCArIFwic3RyaXBwZWQ+XCIgKyBzVGV4dDEuc3Vic3RyaW5nKDAsc1RleHQyLmxlbmd0aCkgKyBcIjw+XCIgKyBzVGV4dDIrIFwiPFwiKTtcclxuICB9XHJcbiAgaWYoYTAgKiA1MCA+IDE1ICogc1RleHQyLmxlbmd0aCkge1xyXG4gICAgICByZXR1cm4gNDAwMDA7XHJcbiAgfVxyXG4gIHZhciBhID0gZGlzdGFuY2UubGV2ZW5zaHRlaW4oc1RleHQxLCBzVGV4dDIpXHJcbiAgcmV0dXJuIGEwICogNTAwIC8gc1RleHQyLmxlbmd0aCArIGFcclxufVxyXG5cclxuXHJcblxyXG5cclxuaW1wb3J0ICogYXMgSUZNYXRjaCBmcm9tICcuLi9tYXRjaC9pZm1hdGNoJztcclxuXHJcbnR5cGUgSVJ1bGUgPSBJRk1hdGNoLklSdWxlXHJcblxyXG5cclxuaW50ZXJmYWNlIElNYXRjaE9wdGlvbnMge1xyXG4gIG1hdGNob3RoZXJzPzogYm9vbGVhbixcclxuICBhdWdtZW50PzogYm9vbGVhbixcclxuICBvdmVycmlkZT86IGJvb2xlYW5cclxufVxyXG5cclxuaW50ZXJmYWNlIElNYXRjaENvdW50IHtcclxuICBlcXVhbDogbnVtYmVyXHJcbiAgZGlmZmVyZW50OiBudW1iZXJcclxuICBzcHVyaW91c1I6IG51bWJlclxyXG4gIHNwdXJpb3VzTDogbnVtYmVyXHJcbn1cclxuXHJcbnR5cGUgRW51bVJ1bGVUeXBlID0gSUZNYXRjaC5FbnVtUnVsZVR5cGVcclxuXHJcbi8vY29uc3QgbGV2ZW5DdXRvZmYgPSBBbGdvbC5DdXRvZmZfTGV2ZW5TaHRlaW47XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxldmVuUGVuYWx0eU9sZChpOiBudW1iZXIpOiBudW1iZXIge1xyXG4gIC8vIDAtPiAxXHJcbiAgLy8gMSAtPiAwLjFcclxuICAvLyAxNTAgLT4gIDAuOFxyXG4gIGlmIChpID09PSAwKSB7XHJcbiAgICByZXR1cm4gMTtcclxuICB9XHJcbiAgLy8gcmV2ZXJzZSBtYXkgYmUgYmV0dGVyIHRoYW4gbGluZWFyXHJcbiAgcmV0dXJuIDEgKyBpICogKDAuOCAtIDEpIC8gMTUwXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsZXZlblBlbmFsdHkoaTogbnVtYmVyKTogbnVtYmVyIHtcclxuICAvLyAxIC0+IDFcclxuICAvLyBjdXRPZmYgPT4gMC44XHJcbiAgcmV0dXJuIGk7XHJcbiAgLy9yZXR1cm4gICAxIC0gICgxIC0gaSkgKjAuMi9BbGdvbC5DdXRvZmZfV29yZE1hdGNoO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gbm9uUHJpdmF0ZUtleXMob0EpIHtcclxuICByZXR1cm4gT2JqZWN0LmtleXMob0EpLmZpbHRlcihrZXkgPT4ge1xyXG4gICAgcmV0dXJuIGtleVswXSAhPT0gJ18nO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY291bnRBaW5CKG9BLCBvQiwgZm5Db21wYXJlLCBhS2V5SWdub3JlPyk6IG51bWJlciB7XHJcbiAgYUtleUlnbm9yZSA9IEFycmF5LmlzQXJyYXkoYUtleUlnbm9yZSkgPyBhS2V5SWdub3JlIDpcclxuICAgIHR5cGVvZiBhS2V5SWdub3JlID09PSBcInN0cmluZ1wiID8gW2FLZXlJZ25vcmVdIDogW107XHJcbiAgZm5Db21wYXJlID0gZm5Db21wYXJlIHx8IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWU7IH1cclxuICByZXR1cm4gbm9uUHJpdmF0ZUtleXMob0EpLmZpbHRlcihmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICByZXR1cm4gYUtleUlnbm9yZS5pbmRleE9mKGtleSkgPCAwO1xyXG4gIH0pLlxyXG4gICAgcmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBrZXkpIHtcclxuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvQiwga2V5KSkge1xyXG4gICAgICAgIHByZXYgPSBwcmV2ICsgKGZuQ29tcGFyZShvQVtrZXldLCBvQltrZXldLCBrZXkpID8gMSA6IDApXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHByZXZcclxuICAgIH0sIDApXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzcHVyaW91c0Fub3RJbkIob0EsIG9CLCBhS2V5SWdub3JlPykge1xyXG4gIGFLZXlJZ25vcmUgPSBBcnJheS5pc0FycmF5KGFLZXlJZ25vcmUpID8gYUtleUlnbm9yZSA6XHJcbiAgICB0eXBlb2YgYUtleUlnbm9yZSA9PT0gXCJzdHJpbmdcIiA/IFthS2V5SWdub3JlXSA6IFtdO1xyXG4gIHJldHVybiBub25Qcml2YXRlS2V5cyhvQSkuZmlsdGVyKGZ1bmN0aW9uIChrZXkpIHtcclxuICAgIHJldHVybiBhS2V5SWdub3JlLmluZGV4T2Yoa2V5KSA8IDA7XHJcbiAgfSkuXHJcbiAgICByZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGtleSkge1xyXG4gICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvQiwga2V5KSkge1xyXG4gICAgICAgIHByZXYgPSBwcmV2ICsgMVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBwcmV2XHJcbiAgICB9LCAwKVxyXG59XHJcblxyXG5mdW5jdGlvbiBsb3dlckNhc2Uobykge1xyXG4gIGlmICh0eXBlb2YgbyA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgcmV0dXJuIG8udG9Mb3dlckNhc2UoKVxyXG4gIH1cclxuICByZXR1cm4gb1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZUNvbnRleHQob0EsIG9CLCBhS2V5SWdub3JlPykge1xyXG4gIHZhciBlcXVhbCA9IGNvdW50QWluQihvQSwgb0IsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBsb3dlckNhc2UoYSkgPT09IGxvd2VyQ2FzZShiKTsgfSwgYUtleUlnbm9yZSk7XHJcbiAgdmFyIGRpZmZlcmVudCA9IGNvdW50QWluQihvQSwgb0IsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBsb3dlckNhc2UoYSkgIT09IGxvd2VyQ2FzZShiKTsgfSwgYUtleUlnbm9yZSk7XHJcbiAgdmFyIHNwdXJpb3VzTCA9IHNwdXJpb3VzQW5vdEluQihvQSwgb0IsIGFLZXlJZ25vcmUpXHJcbiAgdmFyIHNwdXJpb3VzUiA9IHNwdXJpb3VzQW5vdEluQihvQiwgb0EsIGFLZXlJZ25vcmUpXHJcbiAgcmV0dXJuIHtcclxuICAgIGVxdWFsOiBlcXVhbCxcclxuICAgIGRpZmZlcmVudDogZGlmZmVyZW50LFxyXG4gICAgc3B1cmlvdXNMOiBzcHVyaW91c0wsXHJcbiAgICBzcHVyaW91c1I6IHNwdXJpb3VzUlxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc29ydEJ5UmFuayhhOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZywgYjogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmcpOiBudW1iZXIge1xyXG4gIHZhciByID0gLSgoYS5fcmFua2luZyB8fCAxLjApIC0gKGIuX3JhbmtpbmcgfHwgMS4wKSk7XHJcbiAgaWYgKHIpIHtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuICBpZiAoYS5jYXRlZ29yeSAmJiBiLmNhdGVnb3J5KSB7XHJcbiAgICByID0gYS5jYXRlZ29yeS5sb2NhbGVDb21wYXJlKGIuY2F0ZWdvcnkpO1xyXG4gICAgaWYgKHIpIHtcclxuICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmIChhLm1hdGNoZWRTdHJpbmcgJiYgYi5tYXRjaGVkU3RyaW5nKSB7XHJcbiAgICByID0gYS5tYXRjaGVkU3RyaW5nLmxvY2FsZUNvbXBhcmUoYi5tYXRjaGVkU3RyaW5nKTtcclxuICAgIGlmIChyKSB7XHJcbiAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gMDtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjaGVja09uZVJ1bGUoc3RyaW5nOiBzdHJpbmcsIGxjU3RyaW5nIDogc3RyaW5nLCBleGFjdCA6IGJvb2xlYW4sXHJcbnJlcyA6IEFycmF5PElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+LFxyXG5vUnVsZSA6IElNYXRjaC5tUnVsZSwgY250UmVjPyA6IElDbnRSZWMgKSB7XHJcbiAgIGlmIChkZWJ1Z2xvZ1YuZW5hYmxlZCkge1xyXG4gICAgICBkZWJ1Z2xvZ1YoJ2F0dGVtcHRpbmcgdG8gbWF0Y2ggcnVsZSAnICsgSlNPTi5zdHJpbmdpZnkob1J1bGUpICsgXCIgdG8gc3RyaW5nIFxcXCJcIiArIHN0cmluZyArIFwiXFxcIlwiKTtcclxuICAgIH1cclxuICAgIHN3aXRjaCAob1J1bGUudHlwZSkge1xyXG4gICAgICBjYXNlIElGTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQ6XHJcbiAgICAgICAgaWYoIW9SdWxlLmxvd2VyY2FzZXdvcmQpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncnVsZSB3aXRob3V0IGEgbG93ZXJjYXNlIHZhcmlhbnQnICsgSlNPTi5zdHJpbmdpZnkob1J1bGUsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgICAgICB9O1xyXG4gICAgICAgIGlmIChleGFjdCAmJiBvUnVsZS53b3JkID09PSBzdHJpbmcgfHwgb1J1bGUubG93ZXJjYXNld29yZCA9PT0gbGNTdHJpbmcpIHtcclxuICAgICAgICAgIGlmKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgICAgICAgICAgZGVidWdsb2coXCJcXG4hbWF0Y2hlZCBleGFjdCBcIiArIHN0cmluZyArIFwiPVwiICArIG9SdWxlLmxvd2VyY2FzZXdvcmQgICsgXCIgPT4gXCIgKyBvUnVsZS5tYXRjaGVkU3RyaW5nICsgXCIvXCIgKyBvUnVsZS5jYXRlZ29yeSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXMucHVzaCh7XHJcbiAgICAgICAgICAgIHN0cmluZzogc3RyaW5nLFxyXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvUnVsZS5tYXRjaGVkU3RyaW5nLFxyXG4gICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXHJcbiAgICAgICAgICAgIF9yYW5raW5nOiBvUnVsZS5fcmFua2luZyB8fCAxLjBcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZXhhY3QgJiYgIW9SdWxlLmV4YWN0T25seSkge1xyXG4gICAgICAgICAgdmFyIGxldmVubWF0Y2ggPSBjYWxjRGlzdGFuY2Uob1J1bGUubG93ZXJjYXNld29yZCwgbGNTdHJpbmcpO1xyXG5cclxuLypcclxuICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsXCJjYWxjRGlzdGFuY2VcIiwgMSk7XHJcbiAgICAgICAgICBpZihsZXZlbm1hdGNoIDwgNTApIHtcclxuICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZUV4cFwiLCAxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmKGxldmVubWF0Y2ggPCA0MDAwMCkge1xyXG4gICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlQmVsb3c0MGtcIiwgMSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAqL1xyXG4gICAgICAgICAgLy9pZihvUnVsZS5sb3dlcmNhc2V3b3JkID09PSBcImNvc21vc1wiKSB7XHJcbiAgICAgICAgICAvLyAgY29uc29sZS5sb2coXCJoZXJlIHJhbmtpbmcgXCIgKyBsZXZlbm1hdGNoICsgXCIgXCIgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICsgXCIgXCIgKyBsY1N0cmluZyk7XHJcbiAgICAgICAgICAvL31cclxuICAgICAgICAgIGlmIChsZXZlbm1hdGNoID49IEFsZ29sLkN1dG9mZl9Xb3JkTWF0Y2gpIHsgLy8gbGV2ZW5DdXRvZmYpIHtcclxuICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZU9rXCIsIDEpO1xyXG4gICAgICAgICAgICB2YXIgcmVjID0ge1xyXG4gICAgICAgICAgICAgIHN0cmluZzogc3RyaW5nLFxyXG4gICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IG9SdWxlLm1hdGNoZWRTdHJpbmcsXHJcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxyXG4gICAgICAgICAgICAgIF9yYW5raW5nOiAob1J1bGUuX3JhbmtpbmcgfHwgMS4wKSAqIGxldmVuUGVuYWx0eShsZXZlbm1hdGNoKSxcclxuICAgICAgICAgICAgICBsZXZlbm1hdGNoOiBsZXZlbm1hdGNoXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmKGRlYnVnbG9nKSB7XHJcbiAgICAgICAgICAgICAgZGVidWdsb2coXCJcXG4hZnV6enkgXCIgKyAobGV2ZW5tYXRjaCkudG9GaXhlZCgzKSArIFwiIFwiICsgcmVjLl9yYW5raW5nLnRvRml4ZWQoMykgKyBcIiAgXCIgKyBzdHJpbmcgKyBcIj1cIiAgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlcy5wdXNoKHJlYyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIElGTWF0Y2guRW51bVJ1bGVUeXBlLlJFR0VYUDoge1xyXG4gICAgICAgIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICAgICAgICBkZWJ1Z2xvZyhKU09OLnN0cmluZ2lmeShcIiBoZXJlIHJlZ2V4cFwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGUsIHVuZGVmaW5lZCwgMikpKVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbSA9IG9SdWxlLnJlZ2V4cC5leGVjKHN0cmluZylcclxuICAgICAgICBpZiAobSkge1xyXG4gICAgICAgICAgcmVzLnB1c2goe1xyXG4gICAgICAgICAgICBzdHJpbmc6IHN0cmluZyxcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogKG9SdWxlLm1hdGNoSW5kZXggIT09IHVuZGVmaW5lZCAmJiBtW29SdWxlLm1hdGNoSW5kZXhdKSB8fCBzdHJpbmcsXHJcbiAgICAgICAgICAgIGNhdGVnb3J5OiBvUnVsZS5jYXRlZ29yeSxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IG9SdWxlLl9yYW5raW5nIHx8IDEuMFxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHR5cGVcIiArIEpTT04uc3RyaW5naWZ5KG9SdWxlLCB1bmRlZmluZWQsIDIpKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjaGVja09uZVJ1bGVXaXRoT2Zmc2V0KHN0cmluZzogc3RyaW5nLCBsY1N0cmluZyA6IHN0cmluZywgZXhhY3QgOiBib29sZWFuLFxyXG5yZXMgOiBBcnJheTxJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPixcclxub1J1bGUgOiBJTWF0Y2gubVJ1bGUsIGNudFJlYz8gOiBJQ250UmVjICkge1xyXG4gICBpZiAoZGVidWdsb2dWLmVuYWJsZWQpIHtcclxuICAgICAgZGVidWdsb2dWKCdhdHRlbXB0aW5nIHRvIG1hdGNoIHJ1bGUgJyArIEpTT04uc3RyaW5naWZ5KG9SdWxlKSArIFwiIHRvIHN0cmluZyBcXFwiXCIgKyBzdHJpbmcgKyBcIlxcXCJcIik7XHJcbiAgICB9XHJcbiAgICBzd2l0Y2ggKG9SdWxlLnR5cGUpIHtcclxuICAgICAgY2FzZSBJRk1hdGNoLkVudW1SdWxlVHlwZS5XT1JEOlxyXG4gICAgICAgIGlmKCFvUnVsZS5sb3dlcmNhc2V3b3JkKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3J1bGUgd2l0aG91dCBhIGxvd2VyY2FzZSB2YXJpYW50JyArIEpTT04uc3RyaW5naWZ5KG9SdWxlLCB1bmRlZmluZWQsIDIpKTtcclxuICAgICAgICAgfTtcclxuICAgICAgICBpZiAoZXhhY3QgJiYgb1J1bGUud29yZCA9PT0gc3RyaW5nIHx8IG9SdWxlLmxvd2VyY2FzZXdvcmQgPT09IGxjU3RyaW5nKSB7XHJcbiAgICAgICAgICBpZihkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiXFxuIW1hdGNoZWQgZXhhY3QgXCIgKyBzdHJpbmcgKyBcIj1cIiAgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVzLnB1c2goe1xyXG4gICAgICAgICAgICBzdHJpbmc6IHN0cmluZyxcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogb1J1bGUubWF0Y2hlZFN0cmluZyxcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxyXG4gICAgICAgICAgICBydWxlOiBvUnVsZSxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IG9SdWxlLl9yYW5raW5nIHx8IDEuMFxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFleGFjdCAmJiAhb1J1bGUuZXhhY3RPbmx5KSB7XHJcbiAgICAgICAgICB2YXIgbGV2ZW5tYXRjaCA9IGNhbGNEaXN0YW5jZShvUnVsZS5sb3dlcmNhc2V3b3JkLCBsY1N0cmluZyk7XHJcblxyXG4vKlxyXG4gICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZVwiLCAxKTtcclxuICAgICAgICAgIGlmKGxldmVubWF0Y2ggPCA1MCkge1xyXG4gICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlRXhwXCIsIDEpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYobGV2ZW5tYXRjaCA8IDQwMDAwKSB7XHJcbiAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsXCJjYWxjRGlzdGFuY2VCZWxvdzQwa1wiLCAxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICovXHJcbiAgICAgICAgICAvL2lmKG9SdWxlLmxvd2VyY2FzZXdvcmQgPT09IFwiY29zbW9zXCIpIHtcclxuICAgICAgICAgIC8vICBjb25zb2xlLmxvZyhcImhlcmUgcmFua2luZyBcIiArIGxldmVubWF0Y2ggKyBcIiBcIiArIG9SdWxlLmxvd2VyY2FzZXdvcmQgKyBcIiBcIiArIGxjU3RyaW5nKTtcclxuICAgICAgICAgIC8vfVxyXG4gICAgICAgICAgaWYgKGxldmVubWF0Y2ggPj0gQWxnb2wuQ3V0b2ZmX1dvcmRNYXRjaCkgeyAvLyBsZXZlbkN1dG9mZikge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZm91bmQgcmVjXCIpO1xyXG4gICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlT2tcIiwgMSk7XHJcbiAgICAgICAgICAgIHZhciByZWMgPSB7XHJcbiAgICAgICAgICAgICAgc3RyaW5nOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgcnVsZSA6IG9SdWxlLFxyXG4gICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IG9SdWxlLm1hdGNoZWRTdHJpbmcsXHJcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxyXG4gICAgICAgICAgICAgIF9yYW5raW5nOiAob1J1bGUuX3JhbmtpbmcgfHwgMS4wKSAqIGxldmVuUGVuYWx0eShsZXZlbm1hdGNoKSxcclxuICAgICAgICAgICAgICBsZXZlbm1hdGNoOiBsZXZlbm1hdGNoXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmKGRlYnVnbG9nKSB7XHJcbiAgICAgICAgICAgICAgZGVidWdsb2coXCJcXG4hQ09STzogZnV6enkgXCIgKyAobGV2ZW5tYXRjaCkudG9GaXhlZCgzKSArIFwiIFwiICsgcmVjLl9yYW5raW5nLnRvRml4ZWQoMykgKyBcIiAgXFxcIlwiICsgc3RyaW5nICsgXCJcXFwiPVwiICArIG9SdWxlLmxvd2VyY2FzZXdvcmQgICsgXCIgPT4gXCIgKyBvUnVsZS5tYXRjaGVkU3RyaW5nICsgXCIvXCIgKyBvUnVsZS5jYXRlZ29yeSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzLnB1c2gocmVjKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgSUZNYXRjaC5FbnVtUnVsZVR5cGUuUkVHRVhQOiB7XHJcbiAgICAgICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgICAgICAgIGRlYnVnbG9nKEpTT04uc3RyaW5naWZ5KFwiIGhlcmUgcmVnZXhwXCIgKyBKU09OLnN0cmluZ2lmeShvUnVsZSwgdW5kZWZpbmVkLCAyKSkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBtID0gb1J1bGUucmVnZXhwLmV4ZWMoc3RyaW5nKVxyXG4gICAgICAgIGlmIChtKSB7XHJcbiAgICAgICAgICByZXMucHVzaCh7XHJcbiAgICAgICAgICAgIHN0cmluZzogc3RyaW5nLFxyXG4gICAgICAgICAgICBydWxlOiBvUnVsZSxcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogKG9SdWxlLm1hdGNoSW5kZXggIT09IHVuZGVmaW5lZCAmJiBtW29SdWxlLm1hdGNoSW5kZXhdKSB8fCBzdHJpbmcsXHJcbiAgICAgICAgICAgIGNhdGVnb3J5OiBvUnVsZS5jYXRlZ29yeSxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IG9SdWxlLl9yYW5raW5nIHx8IDEuMFxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHR5cGVcIiArIEpTT04uc3RyaW5naWZ5KG9SdWxlLCB1bmRlZmluZWQsIDIpKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcblxyXG5pbnRlcmZhY2UgSUNudFJlYyB7XHJcblxyXG59O1xyXG5cclxuZnVuY3Rpb24gYWRkQ250UmVjKGNudFJlYyA6IElDbnRSZWMsIG1lbWJlciA6IHN0cmluZywgbnVtYmVyIDogbnVtYmVyKSB7XHJcbiAgaWYoKCFjbnRSZWMpIHx8IChudW1iZXIgPT09IDApKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNudFJlY1ttZW1iZXJdID0gKGNudFJlY1ttZW1iZXJdIHx8IDApICsgbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2F0ZWdvcml6ZVN0cmluZyh3b3JkOiBzdHJpbmcsIGV4YWN0OiBib29sZWFuLCBvUnVsZXM6IEFycmF5PElNYXRjaC5tUnVsZT4sXHJcbiBjbnRSZWM/IDogSUNudFJlYyk6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB7XHJcbiAgLy8gc2ltcGx5IGFwcGx5IGFsbCBydWxlc1xyXG4gIGlmKGRlYnVnbG9nTS5lbmFibGVkICkgIHtcclxuICAgIGRlYnVnbG9nTShcInJ1bGVzIDogXCIgKyBKU09OLnN0cmluZ2lmeShvUnVsZXMsIHVuZGVmaW5lZCwgMikpO1xyXG4gIH1cclxuICB2YXIgbGNTdHJpbmcgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XHJcbiAgdmFyIHJlczogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4gPSBbXVxyXG4gIG9SdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xyXG4gICAgY2hlY2tPbmVSdWxlKHdvcmQsbGNTdHJpbmcsZXhhY3QscmVzLG9SdWxlLGNudFJlYyk7XHJcbiAgfSk7XHJcbiAgcmVzLnNvcnQoc29ydEJ5UmFuayk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2F0ZWdvcml6ZVNpbmdsZVdvcmRXaXRoT2Zmc2V0KHdvcmQ6IHN0cmluZywgbGN3b3JkIDogc3RyaW5nLCBleGFjdDogYm9vbGVhbiwgb1J1bGVzOiBBcnJheTxJTWF0Y2gubVJ1bGU+LFxyXG4gY250UmVjPyA6IElDbnRSZWMpOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4ge1xyXG4gIC8vIHNpbXBseSBhcHBseSBhbGwgcnVsZXNcclxuICBpZihkZWJ1Z2xvZ00uZW5hYmxlZCApICB7XHJcbiAgICBkZWJ1Z2xvZ00oXCJydWxlcyA6IFwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGVzLCB1bmRlZmluZWQsIDIpKTtcclxuICB9XHJcbiAgdmFyIHJlczogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4gPSBbXVxyXG4gIG9SdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xyXG4gICAgY2hlY2tPbmVSdWxlV2l0aE9mZnNldCh3b3JkLGxjd29yZCxleGFjdCxyZXMsb1J1bGUsY250UmVjKTtcclxuICB9KTtcclxuICBkZWJ1Z2xvZyhgQ1NXV086IGdvdCByZXN1bHRzIGZvciAke2xjd29yZH0gICR7cmVzLmxlbmd0aH1gKTtcclxuICByZXMuc29ydChzb3J0QnlSYW5rKTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBvc3RGaWx0ZXIocmVzIDogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+KSA6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB7XHJcbiAgcmVzLnNvcnQoc29ydEJ5UmFuayk7XHJcbiAgdmFyIGJlc3RSYW5rID0gMDtcclxuICAvL2NvbnNvbGUubG9nKFwiXFxucGlsdGVyZWQgXCIgKyBKU09OLnN0cmluZ2lmeShyZXMpKTtcclxuICBpZihkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICBkZWJ1Z2xvZyhcInByZUZpbHRlciA6IFxcblwiICsgcmVzLm1hcChmdW5jdGlvbih3b3JkLGluZGV4KSB7XHJcbiAgICAgIHJldHVybiBgJHtpbmRleH0gJHt3b3JkLl9yYW5raW5nfSAgPT4gXCIke3dvcmQuY2F0ZWdvcnl9XCIgJHt3b3JkLm1hdGNoZWRTdHJpbmd9YDtcclxuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xyXG4gIH1cclxuICB2YXIgciA9IHJlcy5maWx0ZXIoZnVuY3Rpb24ocmVzeCxpbmRleCkge1xyXG4gICAgaWYoaW5kZXggPT09IDApIHtcclxuICAgICAgYmVzdFJhbmsgPSByZXN4Ll9yYW5raW5nO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIC8vIDEtMC45ID0gMC4xXHJcbiAgICAvLyAxLSAwLjkzID0gMC43XHJcbiAgICAvLyAxLzdcclxuICAgIHZhciBkZWx0YSA9IGJlc3RSYW5rIC8gcmVzeC5fcmFua2luZztcclxuICAgIGlmKChyZXN4Lm1hdGNoZWRTdHJpbmcgPT09IHJlc1tpbmRleC0xXS5tYXRjaGVkU3RyaW5nKVxyXG4gICAgICAmJiAocmVzeC5jYXRlZ29yeSA9PT0gcmVzW2luZGV4LTFdLmNhdGVnb3J5KSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiXFxuIGRlbHRhIGZvciBcIiArIGRlbHRhICsgXCIgIFwiICsgcmVzeC5fcmFua2luZyk7XHJcbiAgICBpZiAocmVzeC5sZXZlbm1hdGNoICYmIChkZWx0YSA+IDEuMDMpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIGlmKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgICAgZGVidWdsb2coYFxcbmZpbHRlcmVkICR7ci5sZW5ndGh9LyR7cmVzLmxlbmd0aH1gICsgSlNPTi5zdHJpbmdpZnkocikpO1xyXG4gIH1cclxuICByZXR1cm4gcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBvc3RGaWx0ZXJXaXRoT2Zmc2V0KHJlcyA6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPikgOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4ge1xyXG4gIHJlcy5zb3J0KHNvcnRCeVJhbmspO1xyXG4gIHZhciBiZXN0UmFuayA9IDA7XHJcbiAgLy9jb25zb2xlLmxvZyhcIlxcbnBpbHRlcmVkIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzKSk7XHJcbiAgaWYoZGVidWdsb2cuZW5hYmxlZCkge1xyXG4gICAgZGVidWdsb2coXCIgcHJlRmlsdGVyIDogXFxuXCIgKyByZXMubWFwKGZ1bmN0aW9uKHdvcmQpIHtcclxuICAgICAgcmV0dXJuIGAgJHt3b3JkLl9yYW5raW5nfSAgPT4gXCIke3dvcmQuY2F0ZWdvcnl9XCIgJHt3b3JkLm1hdGNoZWRTdHJpbmd9IGA7XHJcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcclxuICB9XHJcbiAgdmFyIHIgPSByZXMuZmlsdGVyKGZ1bmN0aW9uKHJlc3gsaW5kZXgpIHtcclxuICAgIGlmKGluZGV4ID09PSAwKSB7XHJcbiAgICAgIGJlc3RSYW5rID0gcmVzeC5fcmFua2luZztcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICAvLyAxLTAuOSA9IDAuMVxyXG4gICAgLy8gMS0gMC45MyA9IDAuN1xyXG4gICAgLy8gMS83XHJcbiAgICB2YXIgZGVsdGEgPSBiZXN0UmFuayAvIHJlc3guX3Jhbmtpbmc7XHJcbiAgICBpZihcclxuICAgICAgICAhKHJlc3gucnVsZSAmJiByZXN4LnJ1bGUucmFuZ2UpXHJcbiAgICAgJiYgIShyZXNbaW5kZXgtMV0ucnVsZSAmJiByZXNbaW5kZXgtMV0ucnVsZS5yYW5nZSlcclxuICAgICAmJiAocmVzeC5tYXRjaGVkU3RyaW5nID09PSByZXNbaW5kZXgtMV0ubWF0Y2hlZFN0cmluZylcclxuICAgICAmJiAocmVzeC5jYXRlZ29yeSA9PT0gcmVzW2luZGV4LTFdLmNhdGVnb3J5KSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiXFxuIGRlbHRhIGZvciBcIiArIGRlbHRhICsgXCIgIFwiICsgcmVzeC5fcmFua2luZyk7XHJcbiAgICBpZiAocmVzeC5sZXZlbm1hdGNoICYmIChkZWx0YSA+IDEuMDMpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIGlmKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgICAgZGVidWdsb2coYFxcbmZpbHRlcmVkICR7ci5sZW5ndGh9LyR7cmVzLmxlbmd0aH1gICsgSlNPTi5zdHJpbmdpZnkocikpO1xyXG4gIH1cclxuICByZXR1cm4gcjtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2F0ZWdvcml6ZVN0cmluZzIod29yZDogc3RyaW5nLCBleGFjdDogYm9vbGVhbiwgIHJ1bGVzIDogSU1hdGNoLlNwbGl0UnVsZXNcclxuICAsIGNudFJlYz8gOklDbnRSZWMpOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4ge1xyXG4gIC8vIHNpbXBseSBhcHBseSBhbGwgcnVsZXNcclxuICBpZiAoZGVidWdsb2dNLmVuYWJsZWQgKSAge1xyXG4gICAgZGVidWdsb2dNKFwicnVsZXMgOiBcIiArIEpTT04uc3RyaW5naWZ5KHJ1bGVzLHVuZGVmaW5lZCwgMikpO1xyXG4gIH1cclxuICB2YXIgbGNTdHJpbmcgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XHJcbiAgdmFyIHJlczogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4gPSBbXTtcclxuICBpZiAoZXhhY3QpIHtcclxuICAgIHZhciByID0gcnVsZXMud29yZE1hcFtsY1N0cmluZ107XHJcbiAgICBpZiAocikge1xyXG4gICAgICByLnJ1bGVzLmZvckVhY2goZnVuY3Rpb24ob1J1bGUpIHtcclxuICAgICAgICByZXMucHVzaCh7XHJcbiAgICAgICAgICAgIHN0cmluZzogd29yZCxcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogb1J1bGUubWF0Y2hlZFN0cmluZyxcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxyXG4gICAgICAgICAgICBfcmFua2luZzogb1J1bGUuX3JhbmtpbmcgfHwgMS4wXHJcbiAgICAgICAgICB9KVxyXG4gICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcnVsZXMubm9uV29yZFJ1bGVzLmZvckVhY2goZnVuY3Rpb24gKG9SdWxlKSB7XHJcbiAgICAgIGNoZWNrT25lUnVsZSh3b3JkLGxjU3RyaW5nLGV4YWN0LHJlcyxvUnVsZSxjbnRSZWMpO1xyXG4gICAgfSk7XHJcbiAgICByZXMuc29ydChzb3J0QnlSYW5rKTtcclxuICAgIHJldHVybiByZXM7XHJcbiAgfSBlbHNlIHtcclxuICAgIGRlYnVnbG9nKFwiY2F0ZWdvcml6ZSBub24gZXhhY3RcIiArIHdvcmQgKyBcIiB4eCAgXCIgKyBydWxlcy5hbGxSdWxlcy5sZW5ndGgpO1xyXG4gICAgcmV0dXJuIHBvc3RGaWx0ZXIoY2F0ZWdvcml6ZVN0cmluZyh3b3JkLCBleGFjdCwgcnVsZXMuYWxsUnVsZXMsIGNudFJlYykpO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYXRlZ29yaXplV29yZEludGVybmFsV2l0aE9mZnNldHMod29yZDogc3RyaW5nLCBsY3dvcmQgOiBzdHJpbmcsIGV4YWN0OiBib29sZWFuLCAgcnVsZXMgOiBJTWF0Y2guU3BsaXRSdWxlc1xyXG4gICwgY250UmVjPyA6SUNudFJlYyk6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPiB7XHJcblxyXG4gIGRlYnVnbG9nTShcImNhdGVnb3JpemUgXCIgKyBsY3dvcmQgKyBcIiB3aXRoIG9mZnNldCEhISEhISEhISEhISEhISEhXCIgKyBleGFjdClcclxuICAvLyBzaW1wbHkgYXBwbHkgYWxsIHJ1bGVzXHJcbiAgaWYgKGRlYnVnbG9nTS5lbmFibGVkICkgIHtcclxuICAgIGRlYnVnbG9nTShcInJ1bGVzIDogXCIgKyBKU09OLnN0cmluZ2lmeShydWxlcyx1bmRlZmluZWQsIDIpKTtcclxuICB9XHJcbiAgdmFyIHJlczogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4gPSBbXTtcclxuICBpZiAoZXhhY3QpIHtcclxuICAgIHZhciByID0gcnVsZXMud29yZE1hcFtsY3dvcmRdO1xyXG4gICAgaWYgKHIpIHtcclxuICAgICAgZGVidWdsb2dNKGAgLi4uLnB1c2hpbmcgbiBydWxlcyBleGFjdCBmb3IgJHtsY3dvcmR9OmAgKyByLnJ1bGVzLmxlbmd0aCk7XHJcbiAgICAgIGRlYnVnbG9nTShyLnJ1bGVzLm1hcCgocixpbmRleCk9PiAnJyArIGluZGV4ICsgJyAnICsgSlNPTi5zdHJpbmdpZnkocikpLmpvaW4oXCJcXG5cIikpO1xyXG4gICAgICByLnJ1bGVzLmZvckVhY2goZnVuY3Rpb24ob1J1bGUpIHtcclxuICAgICAgICByZXMucHVzaCh7XHJcbiAgICAgICAgICAgIHN0cmluZzogd29yZCxcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogb1J1bGUubWF0Y2hlZFN0cmluZyxcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxyXG4gICAgICAgICAgICBydWxlOiBvUnVsZSxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IG9SdWxlLl9yYW5raW5nIHx8IDEuMFxyXG4gICAgICAgICAgfSlcclxuICAgICB9KTtcclxuICAgIH1cclxuICAgIHJ1bGVzLm5vbldvcmRSdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xyXG4gICAgICBjaGVja09uZVJ1bGVXaXRoT2Zmc2V0KHdvcmQsbGN3b3JkLCBleGFjdCxyZXMsb1J1bGUsY250UmVjKTtcclxuICAgIH0pO1xyXG4gICAgcmVzID0gcG9zdEZpbHRlcldpdGhPZmZzZXQocmVzKTtcclxuICAgIGRlYnVnbG9nKFwiaGVyZSByZXN1bHRzIGZvclwiICsgd29yZCArIFwiIHJlcyBcIiArIHJlcy5sZW5ndGgpO1xyXG4gICAgZGVidWdsb2dNKFwiaGVyZSByZXN1bHRzIGZvclwiICsgd29yZCArIFwiIHJlcyBcIiArIHJlcy5sZW5ndGgpO1xyXG4gICAgcmVzLnNvcnQoc29ydEJ5UmFuayk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBkZWJ1Z2xvZyhcImNhdGVnb3JpemUgbm9uIGV4YWN0XCIgKyB3b3JkICsgXCIgeHggIFwiICsgcnVsZXMuYWxsUnVsZXMubGVuZ3RoKTtcclxuICAgIHZhciByciA9IGNhdGVnb3JpemVTaW5nbGVXb3JkV2l0aE9mZnNldCh3b3JkLGxjd29yZCwgZXhhY3QsIHJ1bGVzLmFsbFJ1bGVzLCBjbnRSZWMpO1xyXG4gICAgLy9kZWJ1bG9nTShcImZ1enp5IHJlcyBcIiArIEpTT04uc3RyaW5naWZ5KHJyKSk7XHJcbiAgICByZXR1cm4gcG9zdEZpbHRlcldpdGhPZmZzZXQocnIpO1xyXG4gIH1cclxufVxyXG5cclxuXHJcblxyXG4vKipcclxuICpcclxuICogT3B0aW9ucyBtYXkgYmUge1xyXG4gKiBtYXRjaG90aGVycyA6IHRydWUsICA9PiBvbmx5IHJ1bGVzIHdoZXJlIGFsbCBvdGhlcnMgbWF0Y2ggYXJlIGNvbnNpZGVyZWRcclxuICogYXVnbWVudCA6IHRydWUsXHJcbiAqIG92ZXJyaWRlIDogdHJ1ZSB9ICA9PlxyXG4gKlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoV29yZChvUnVsZTogSVJ1bGUsIGNvbnRleHQ6IElGTWF0Y2guY29udGV4dCwgb3B0aW9ucz86IElNYXRjaE9wdGlvbnMpIHtcclxuICBpZiAoY29udGV4dFtvUnVsZS5rZXldID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIHZhciBzMSA9IGNvbnRleHRbb1J1bGUua2V5XS50b0xvd2VyQ2FzZSgpXHJcbiAgdmFyIHMyID0gb1J1bGUud29yZC50b0xvd2VyQ2FzZSgpO1xyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcbiAgdmFyIGRlbHRhID0gY29tcGFyZUNvbnRleHQoY29udGV4dCwgb1J1bGUuZm9sbG93cywgb1J1bGUua2V5KVxyXG4gIGlmKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nKEpTT04uc3RyaW5naWZ5KGRlbHRhKSk7XHJcbiAgICBkZWJ1Z2xvZyhKU09OLnN0cmluZ2lmeShvcHRpb25zKSk7XHJcbiAgfVxyXG4gIGlmIChvcHRpb25zLm1hdGNob3RoZXJzICYmIChkZWx0YS5kaWZmZXJlbnQgPiAwKSkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxyXG4gIH1cclxuICB2YXIgYzogbnVtYmVyID0gY2FsY0Rpc3RhbmNlKHMyLCBzMSk7XHJcbiAgaWYoZGVidWdsb2cuZW5hYmxlZCkge1xyXG4gICAgZGVidWdsb2coXCIgczEgPD4gczIgXCIgKyBzMSArIFwiPD5cIiArIHMyICsgXCIgID0+OiBcIiArIGMpO1xyXG4gIH1cclxuICBpZiAoYyA+IDAuODApIHtcclxuICAgIHZhciByZXMgPSBBbnlPYmplY3QuYXNzaWduKHt9LCBvUnVsZS5mb2xsb3dzKSBhcyBhbnk7XHJcbiAgICByZXMgPSBBbnlPYmplY3QuYXNzaWduKHJlcywgY29udGV4dCk7XHJcbiAgICBpZiAob3B0aW9ucy5vdmVycmlkZSkge1xyXG4gICAgICByZXMgPSBBbnlPYmplY3QuYXNzaWduKHJlcywgb1J1bGUuZm9sbG93cyk7XHJcbiAgICB9XHJcbiAgICAvLyBmb3JjZSBrZXkgcHJvcGVydHlcclxuICAgIC8vIGNvbnNvbGUubG9nKCcgb2JqZWN0Y2F0ZWdvcnknLCByZXNbJ3N5c3RlbU9iamVjdENhdGVnb3J5J10pO1xyXG4gICAgcmVzW29SdWxlLmtleV0gPSBvUnVsZS5mb2xsb3dzW29SdWxlLmtleV0gfHwgcmVzW29SdWxlLmtleV07XHJcbiAgICByZXMuX3dlaWdodCA9IEFueU9iamVjdC5hc3NpZ24oe30sIHJlcy5fd2VpZ2h0KTtcclxuICAgIHJlcy5fd2VpZ2h0W29SdWxlLmtleV0gPSBjO1xyXG4gICAgT2JqZWN0LmZyZWV6ZShyZXMpO1xyXG4gICAgaWYgKCBkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICAgIGRlYnVnbG9nKCdGb3VuZCBvbmUnICsgSlNPTi5zdHJpbmdpZnkocmVzLCB1bmRlZmluZWQsIDIpKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXM7XHJcbiAgfVxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QXJnc01hcChtYXRjaDogQXJyYXk8c3RyaW5nPiwgYXJnc01hcDogeyBba2V5OiBudW1iZXJdOiBzdHJpbmcgfSk6IElGTWF0Y2guY29udGV4dCB7XHJcbiAgdmFyIHJlcyA9IHt9IGFzIElGTWF0Y2guY29udGV4dDtcclxuICBpZiAoIWFyZ3NNYXApIHtcclxuICAgIHJldHVybiByZXM7XHJcbiAgfVxyXG4gIE9iamVjdC5rZXlzKGFyZ3NNYXApLmZvckVhY2goZnVuY3Rpb24gKGlLZXkpIHtcclxuICAgIHZhciB2YWx1ZSA9IG1hdGNoW2lLZXldXHJcbiAgICB2YXIga2V5ID0gYXJnc01hcFtpS2V5XTtcclxuICAgIGlmICgodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSAmJiB2YWx1ZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHJlc1trZXldID0gdmFsdWVcclxuICAgIH1cclxuICB9XHJcbiAgKTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgUmFua1dvcmQgPSB7XHJcbiAgaGFzQWJvdmU6IGZ1bmN0aW9uIChsc3Q6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiwgYm9yZGVyOiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgIHJldHVybiAhbHN0LmV2ZXJ5KGZ1bmN0aW9uIChvTWVtYmVyKSB7XHJcbiAgICAgIHJldHVybiAob01lbWJlci5fcmFua2luZyA8IGJvcmRlcik7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICB0YWtlRmlyc3ROOiBmdW5jdGlvbjxUIGV4dGVuZHMgSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IChsc3Q6IEFycmF5PFQ+LCBuOiBudW1iZXIpOiBBcnJheTxUPiB7XHJcbiAgICB2YXIgbGFzdFJhbmtpbmcgPSAxLjA7XHJcbiAgICB2YXIgY250UmFuZ2VkID0gMDtcclxuICAgIHJldHVybiBsc3QuZmlsdGVyKGZ1bmN0aW9uIChvTWVtYmVyLCBpSW5kZXgpIHtcclxuICAgIHZhciBpc1JhbmdlZCA9ICEhKG9NZW1iZXJbXCJydWxlXCJdICYmIG9NZW1iZXJbXCJydWxlXCJdLnJhbmdlKTtcclxuICAgIGlmKGlzUmFuZ2VkKSB7XHJcbiAgICAgIGNudFJhbmdlZCArPSAxO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmICgoKGlJbmRleCAtIGNudFJhbmdlZCkgPCBuKSB8fCAob01lbWJlci5fcmFua2luZyA9PT0gbGFzdFJhbmtpbmcpKSAge1xyXG4gICAgICAgIGxhc3RSYW5raW5nID0gb01lbWJlci5fcmFua2luZztcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICB9LFxyXG4gIHRha2VBYm92ZSA6IGZ1bmN0aW9uPFQgZXh0ZW5kcyBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4gKGxzdDogQXJyYXk8VD4sIGJvcmRlcjogbnVtYmVyKTogQXJyYXk8VD4ge1xyXG4gICAgcmV0dXJuIGxzdC5maWx0ZXIoZnVuY3Rpb24gKG9NZW1iZXIpIHtcclxuICAgICAgcmV0dXJuIChvTWVtYmVyLl9yYW5raW5nID49IGJvcmRlcik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG59O1xyXG5cclxuLypcclxudmFyIGV4YWN0TGVuID0gMDtcclxudmFyIGZ1enp5TGVuID0gMDtcclxudmFyIGZ1enp5Q250ID0gMDtcclxudmFyIGV4YWN0Q250ID0gMDtcclxudmFyIHRvdGFsQ250ID0gMDtcclxudmFyIHRvdGFsTGVuID0gMDtcclxudmFyIHJldGFpbmVkQ250ID0gMDtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZXNldENudCgpIHtcclxuICBleGFjdExlbiA9IDA7XHJcbiAgZnV6enlMZW4gPSAwO1xyXG4gIGZ1enp5Q250ID0gMDtcclxuICBleGFjdENudCA9IDA7XHJcbiAgdG90YWxDbnQgPSAwO1xyXG4gIHRvdGFsTGVuID0gMDtcclxuICByZXRhaW5lZENudCA9IDA7XHJcbn1cclxuKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYXRlZ29yaXplV29yZFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXA6IHN0cmluZywgc3BsaXRSdWxlcyA6IElNYXRjaC5TcGxpdFJ1bGVzICwgY250UmVjPyA6IElDbnRSZWMgKTogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IHtcclxuICB2YXIgc2Vlbkl0ID0gY2F0ZWdvcml6ZVN0cmluZzIoc1dvcmRHcm91cCwgdHJ1ZSwgc3BsaXRSdWxlcywgY250UmVjKTtcclxuICAvL3RvdGFsQ250ICs9IDE7XHJcbiAgLy8gZXhhY3RMZW4gKz0gc2Vlbkl0Lmxlbmd0aDtcclxuICBhZGRDbnRSZWMoY250UmVjLCAnY250Q2F0RXhhY3QnLCAxKTtcclxuICBhZGRDbnRSZWMoY250UmVjLCAnY250Q2F0RXhhY3RSZXMnLCBzZWVuSXQubGVuZ3RoKTtcclxuXHJcbiAgaWYgKFJhbmtXb3JkLmhhc0Fib3ZlKHNlZW5JdCwgMC44KSkge1xyXG4gICAgaWYoY250UmVjKSB7XHJcbiAgICAgIGFkZENudFJlYyhjbnRSZWMsICdleGFjdFByaW9yVGFrZScsIHNlZW5JdC5sZW5ndGgpXHJcbiAgICB9XHJcbiAgICBzZWVuSXQgPSBSYW5rV29yZC50YWtlQWJvdmUoc2Vlbkl0LCAwLjgpO1xyXG4gICAgaWYoY250UmVjKSB7XHJcbiAgICAgIGFkZENudFJlYyhjbnRSZWMsICdleGFjdEFmdGVyVGFrZScsIHNlZW5JdC5sZW5ndGgpXHJcbiAgICB9XHJcbiAgIC8vIGV4YWN0Q250ICs9IDE7XHJcbiAgfSBlbHNlIHtcclxuICAgIHNlZW5JdCA9IGNhdGVnb3JpemVTdHJpbmcyKHNXb3JkR3JvdXAsIGZhbHNlLCBzcGxpdFJ1bGVzLCBjbnRSZWMpO1xyXG4gICAgYWRkQ250UmVjKGNudFJlYywgJ2NudE5vbkV4YWN0JywgMSk7XHJcbiAgICBhZGRDbnRSZWMoY250UmVjLCAnY250Tm9uRXhhY3RSZXMnLCBzZWVuSXQubGVuZ3RoKTtcclxuICAvLyAgZnV6enlMZW4gKz0gc2Vlbkl0Lmxlbmd0aDtcclxuICAvLyAgZnV6enlDbnQgKz0gMTtcclxuICB9XHJcbiAvLyB0b3RhbExlbiArPSBzZWVuSXQubGVuZ3RoO1xyXG4gIHNlZW5JdCA9IFJhbmtXb3JkLnRha2VGaXJzdE4oc2Vlbkl0LCBBbGdvbC5Ub3BfTl9Xb3JkQ2F0ZWdvcml6YXRpb25zKTtcclxuIC8vIHJldGFpbmVkQ250ICs9IHNlZW5JdC5sZW5ndGg7XHJcbiAgcmV0dXJuIHNlZW5JdDtcclxufVxyXG5cclxuLyogaWYgd2UgaGF2ZSBhICBcIlJ1biBsaWtlIHRoZSBXaW5kXCJcclxuICBhbiBhIHVzZXIgdHlwZSBmdW4gbGlrZSAgYSBSaW5kICwgYW5kIFJpbmQgaXMgYW4gZXhhY3QgbWF0Y2gsXHJcbiAgd2Ugd2lsbCBub3Qgc3RhcnQgbG9va2luZyBmb3IgdGhlIGxvbmcgc2VudGVuY2VcclxuXHJcbiAgdGhpcyBpcyB0byBiZSBmaXhlZCBieSBcInNwcmVhZGluZ1wiIHRoZSByYW5nZSBpbmRpY2F0aW9uIGFjY3Jvc3MgdmVyeSBzaW1pbGFyIHdvcmRzIGluIHRoZSB2aW5jaW5pdHkgb2YgdGhlXHJcbiAgdGFyZ2V0IHdvcmRzXHJcbiovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmYoc1dvcmRHcm91cDogc3RyaW5nLCBzcGxpdFJ1bGVzIDogSU1hdGNoLlNwbGl0UnVsZXMsIGNudFJlYz8gOiBJQ250UmVjICk6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPiB7XHJcbiAgdmFyIHNXb3JkR3JvdXBMQyA9IHNXb3JkR3JvdXAudG9Mb3dlckNhc2UoKTtcclxuICB2YXIgc2Vlbkl0ID0gY2F0ZWdvcml6ZVdvcmRJbnRlcm5hbFdpdGhPZmZzZXRzKHNXb3JkR3JvdXAsIHNXb3JkR3JvdXBMQywgdHJ1ZSwgc3BsaXRSdWxlcywgY250UmVjKTtcclxuICAvL2NvbnNvbGUubG9nKFwiU0VFTklUXCIgKyBKU09OLnN0cmluZ2lmeShzZWVuSXQpKTtcclxuICAvL3RvdGFsQ250ICs9IDE7XHJcbiAgLy8gZXhhY3RMZW4gKz0gc2Vlbkl0Lmxlbmd0aDtcclxuICAvL2NvbnNvbGUubG9nKFwiZmlyc3QgcnVuIGV4YWN0IFwiICsgSlNPTi5zdHJpbmdpZnkoc2Vlbkl0KSk7XHJcbiAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0JywgMSk7XHJcbiAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XHJcblxyXG4gIGlmIChSYW5rV29yZC5oYXNBYm92ZShzZWVuSXQsIDAuOCkpIHtcclxuICAgIGlmKGNudFJlYykge1xyXG4gICAgICBhZGRDbnRSZWMoY250UmVjLCAnZXhhY3RQcmlvclRha2UnLCBzZWVuSXQubGVuZ3RoKVxyXG4gICAgfVxyXG4gICAgc2Vlbkl0ID0gUmFua1dvcmQudGFrZUFib3ZlKHNlZW5JdCwgMC44KTtcclxuICAgIGlmKGNudFJlYykge1xyXG4gICAgICBhZGRDbnRSZWMoY250UmVjLCAnZXhhY3RBZnRlclRha2UnLCBzZWVuSXQubGVuZ3RoKVxyXG4gICAgfVxyXG4gICAvLyBleGFjdENudCArPSAxO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzZWVuSXQgPSBjYXRlZ29yaXplV29yZEludGVybmFsV2l0aE9mZnNldHMoc1dvcmRHcm91cCwgc1dvcmRHcm91cExDLCBmYWxzZSwgc3BsaXRSdWxlcywgY250UmVjKTtcclxuICAgIGFkZENudFJlYyhjbnRSZWMsICdjbnROb25FeGFjdCcsIDEpO1xyXG4gICAgYWRkQ250UmVjKGNudFJlYywgJ2NudE5vbkV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XHJcbiAgLy8gIGZ1enp5TGVuICs9IHNlZW5JdC5sZW5ndGg7XHJcbiAgLy8gIGZ1enp5Q250ICs9IDE7XHJcbiAgfVxyXG4gIC8vIHRvdGFsTGVuICs9IHNlZW5JdC5sZW5ndGg7XHJcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZD8gKCBgJHtzZWVuSXQubGVuZ3RofSB3aXRoICR7c2Vlbkl0LnJlZHVjZSggKHByZXYsb2JqKSA9PiBwcmV2ICsgKG9iai5ydWxlLnJhbmdlID8gMSA6IDApLDApfSByYW5nZWQgIWApOiAnLScpO1xyXG4vLyAgdmFyIGNudFJhbmdlZCA9IHNlZW5JdC5yZWR1Y2UoIChwcmV2LG9iaikgPT4gcHJldiArIChvYmoucnVsZS5yYW5nZSA/IDEgOiAwKSwwKTtcclxuLy8gIGNvbnNvbGUubG9nKGAqKioqKioqKioqKiAke3NlZW5JdC5sZW5ndGh9IHdpdGggJHtjbnRSYW5nZWR9IHJhbmdlZCAhYCk7XHJcblxyXG4gIHNlZW5JdCA9IFJhbmtXb3JkLnRha2VGaXJzdE4oc2Vlbkl0LCBBbGdvbC5Ub3BfTl9Xb3JkQ2F0ZWdvcml6YXRpb25zKTtcclxuIC8vIHJldGFpbmVkQ250ICs9IHNlZW5JdC5sZW5ndGg7XHJcbiAgLy9jb25zb2xlLmxvZyhcImZpbmFsIHJlcyBvZiBjYXRlZ29yaXplV29yZFdpdGhPZmZzZXRXaXRoUmFua0N1dG9mZlwiICsgSlNPTi5zdHJpbmdpZnkoc2Vlbkl0KSk7XHJcblxyXG4gIHJldHVybiBzZWVuSXQ7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmZTaW5nbGUod29yZDogc3RyaW5nLCBydWxlOiBJTWF0Y2gubVJ1bGUpOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCB7XHJcbiAgdmFyIGxjd29yZCA9IHdvcmQudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgaWYobGN3b3JkID09PSBydWxlLmxvd2VyY2FzZXdvcmQpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHN0cmluZzogd29yZCxcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogcnVsZS5tYXRjaGVkU3RyaW5nLFxyXG4gICAgICAgICAgICBjYXRlZ29yeTogcnVsZS5jYXRlZ29yeSxcclxuICAgICAgICAgICAgcnVsZTogcnVsZSxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IHJ1bGUuX3JhbmtpbmcgfHwgMS4wXHJcbiAgICAgICAgICB9O1xyXG4gIH1cclxuXHJcbiAgdmFyIHJlczogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4gPSBbXVxyXG4gIGNoZWNrT25lUnVsZVdpdGhPZmZzZXQod29yZCxsY3dvcmQsZmFsc2UscmVzLHJ1bGUpO1xyXG4gIGRlYnVnbG9nKFwiY2F0V1dPV1JDUyBcIiArIGxjd29yZCk7XHJcbiAgaWYocmVzLmxlbmd0aCkge1xyXG4gICAgcmV0dXJuIHJlc1swXTtcclxuICB9XHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5cclxuXHJcblxyXG4vKlxyXG5leHBvcnQgZnVuY3Rpb24gZHVtcENudCgpIHtcclxuICBjb25zb2xlLmxvZyhgXHJcbmV4YWN0TGVuID0gJHtleGFjdExlbn07XHJcbmV4YWN0Q250ID0gJHtleGFjdENudH07XHJcbmZ1enp5TGVuID0gJHtmdXp6eUxlbn07XHJcbmZ1enp5Q250ID0gJHtmdXp6eUNudH07XHJcbnRvdGFsQ250ID0gJHt0b3RhbENudH07XHJcbnRvdGFsTGVuID0gJHt0b3RhbExlbn07XHJcbnJldGFpbmVkTGVuID0gJHtyZXRhaW5lZENudH07XHJcbiAgYCk7XHJcbn1cclxuKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJSZW1vdmluZ1VuY2F0ZWdvcml6ZWRTZW50ZW5jZShvU2VudGVuY2U6IElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nW11bXSk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBvU2VudGVuY2UuZXZlcnkoZnVuY3Rpb24gKG9Xb3JkR3JvdXApIHtcclxuICAgIHJldHVybiAob1dvcmRHcm91cC5sZW5ndGggPiAwKTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyUmVtb3ZpbmdVbmNhdGVnb3JpemVkKGFycjogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdbXVtdW10pOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1tdW11bXSB7XHJcbiAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xyXG4gICAgcmV0dXJuIGZpbHRlclJlbW92aW5nVW5jYXRlZ29yaXplZFNlbnRlbmNlKG9TZW50ZW5jZSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYXRlZ29yaXplQVdvcmQoc1dvcmRHcm91cDogc3RyaW5nLCBydWxlczogSU1hdGNoLlNwbGl0UnVsZXMsIHNlbnRlbmNlOiBzdHJpbmcsIHdvcmRzOiB7IFtrZXk6IHN0cmluZ106IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPn0sXHJcbmNudFJlYyA/IDogSUNudFJlYyApIDogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1tdIHtcclxuICB2YXIgc2Vlbkl0ID0gd29yZHNbc1dvcmRHcm91cF07XHJcbiAgaWYgKHNlZW5JdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBzZWVuSXQgPSBjYXRlZ29yaXplV29yZFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXAsIHJ1bGVzLCBjbnRSZWMpO1xyXG4gICAgdXRpbHMuZGVlcEZyZWV6ZShzZWVuSXQpO1xyXG4gICAgd29yZHNbc1dvcmRHcm91cF0gPSBzZWVuSXQ7XHJcbiAgfVxyXG4gIGlmICghc2Vlbkl0IHx8IHNlZW5JdC5sZW5ndGggPT09IDApIHtcclxuICAgIGxvZ2dlcihcIioqKldBUk5JTkc6IERpZCBub3QgZmluZCBhbnkgY2F0ZWdvcml6YXRpb24gZm9yIFxcXCJcIiArIHNXb3JkR3JvdXAgKyBcIlxcXCIgaW4gc2VudGVuY2UgXFxcIlwiXHJcbiAgICAgICsgc2VudGVuY2UgKyBcIlxcXCJcIik7XHJcbiAgICBpZiAoc1dvcmRHcm91cC5pbmRleE9mKFwiIFwiKSA8PSAwKSB7XHJcbiAgICAgIGRlYnVnbG9nKFwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgcHJpbWl0aXZlICghKVwiICsgc1dvcmRHcm91cCk7XHJcbiAgICB9XHJcbiAgICBkZWJ1Z2xvZyhcIioqKldBUk5JTkc6IERpZCBub3QgZmluZCBhbnkgY2F0ZWdvcml6YXRpb24gZm9yIFwiICsgc1dvcmRHcm91cCk7XHJcbiAgICBpZiAoIXNlZW5JdCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgZW10cHkgbGlzdCwgbm90IHVuZGVmaW5lZCBmb3IgXFxcIlwiICsgc1dvcmRHcm91cCArIFwiXFxcIlwiKVxyXG4gICAgfVxyXG4gICAgd29yZHNbc1dvcmRHcm91cF0gPSBbXVxyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICByZXR1cm4gdXRpbHMuY2xvbmVEZWVwKHNlZW5JdCk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2l2ZW4gYSAgc3RyaW5nLCBicmVhayBpdCBkb3duIGludG8gY29tcG9uZW50cyxcclxuICogW1snQScsICdCJ10sIFsnQSBCJ11dXHJcbiAqXHJcbiAqIHRoZW4gY2F0ZWdvcml6ZVdvcmRzXHJcbiAqIHJldHVybmluZ1xyXG4gKlxyXG4gKiBbIFtbIHsgY2F0ZWdvcnk6ICdzeXN0ZW1JZCcsIHdvcmQgOiAnQSd9LFxyXG4gKiAgICAgIHsgY2F0ZWdvcnk6ICdvdGhlcnRoaW5nJywgd29yZCA6ICdBJ31cclxuICogICAgXSxcclxuICogICAgLy8gcmVzdWx0IG9mIEJcclxuICogICAgWyB7IGNhdGVnb3J5OiAnc3lzdGVtSWQnLCB3b3JkIDogJ0InfSxcclxuICogICAgICB7IGNhdGVnb3J5OiAnb3RoZXJ0aGluZycsIHdvcmQgOiAnQSd9XHJcbiAqICAgICAgeyBjYXRlZ29yeTogJ2Fub3RoZXJ0cnlwJywgd29yZCA6ICdCJ31cclxuICogICAgXVxyXG4gKiAgIF0sXHJcbiAqIF1dXVxyXG4gKlxyXG4gKlxyXG4gKlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVTdHJpbmcoc1N0cmluZzogc3RyaW5nLCBydWxlczogSU1hdGNoLlNwbGl0UnVsZXMsXHJcbiAgd29yZHM/OiB7IFtrZXk6IHN0cmluZ106IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB9KVxyXG4gIDogWyBbIElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdbXV0gXVxyXG4gICB7XHJcbiAgdmFyIGNudCA9IDA7XHJcbiAgdmFyIGZhYyA9IDE7XHJcbiAgdmFyIHUgPSBicmVha2Rvd24uYnJlYWtkb3duU3RyaW5nKHNTdHJpbmcsIEFsZ29sLk1heFNwYWNlc1BlckNvbWJpbmVkV29yZCk7XHJcbiAgaWYoZGVidWdsb2cuZW5hYmxlZCkge1xyXG4gICAgZGVidWdsb2coXCJoZXJlIGJyZWFrZG93blwiICsgSlNPTi5zdHJpbmdpZnkodSkpO1xyXG4gIH1cclxuICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHUpKTtcclxuICB3b3JkcyA9IHdvcmRzIHx8IHt9O1xyXG4gIGRlYnVncGVyZigndGhpcyBtYW55IGtub3duIHdvcmRzOiAnICsgT2JqZWN0LmtleXMod29yZHMpLmxlbmd0aCk7XHJcbiAgdmFyIHJlcyA9IFtdIGFzIFtbIElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdbXV0gXTtcclxuICB2YXIgY250UmVjID0ge307XHJcbiAgdS5mb3JFYWNoKGZ1bmN0aW9uIChhQnJlYWtEb3duU2VudGVuY2UpIHtcclxuICAgICAgdmFyIGNhdGVnb3JpemVkU2VudGVuY2UgPSBbXSBhcyBbIElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdbXSBdO1xyXG4gICAgICB2YXIgaXNWYWxpZCA9IGFCcmVha0Rvd25TZW50ZW5jZS5ldmVyeShmdW5jdGlvbiAoc1dvcmRHcm91cDogc3RyaW5nLCBpbmRleCA6IG51bWJlcikge1xyXG4gICAgICAgIHZhciBzZWVuSXQgPSBjYXRlZ29yaXplQVdvcmQoc1dvcmRHcm91cCwgcnVsZXMsIHNTdHJpbmcsIHdvcmRzLCBjbnRSZWMpO1xyXG4gICAgICAgIGlmKHNlZW5JdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0ZWdvcml6ZWRTZW50ZW5jZVtpbmRleF0gPSBzZWVuSXQ7XHJcbiAgICAgICAgY250ID0gY250ICsgc2Vlbkl0Lmxlbmd0aDtcclxuICAgICAgICBmYWMgPSBmYWMgKiBzZWVuSXQubGVuZ3RoO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYoaXNWYWxpZCkge1xyXG4gICAgICAgIHJlcy5wdXNoKGNhdGVnb3JpemVkU2VudGVuY2UpO1xyXG4gICAgICB9XHJcbiAgfSk7XHJcbiAgZGVidWdsb2coXCIgc2VudGVuY2VzIFwiICsgdS5sZW5ndGggKyBcIiBtYXRjaGVzIFwiICsgY250ICsgXCIgZmFjOiBcIiArIGZhYyk7XHJcbiAgaWYoZGVidWdsb2cuZW5hYmxlZCAmJiB1Lmxlbmd0aCkge1xyXG4gICAgZGVidWdsb2coXCJmaXJzdCBtYXRjaCBcIisgSlNPTi5zdHJpbmdpZnkodSx1bmRlZmluZWQsMikpO1xyXG4gIH1cclxuICBkZWJ1Z3BlcmYoXCIgc2VudGVuY2VzIFwiICsgdS5sZW5ndGggKyBcIiAvIFwiICsgcmVzLmxlbmd0aCArICBcIiBtYXRjaGVzIFwiICsgY250ICsgXCIgZmFjOiBcIiArIGZhYyArIFwiIHJlYyA6IFwiICsgSlNPTi5zdHJpbmdpZnkoY250UmVjLHVuZGVmaW5lZCwyKSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYXRlZ29yaXplQVdvcmRXaXRoT2Zmc2V0cyhzV29yZEdyb3VwOiBzdHJpbmcsIHJ1bGVzOiBJTWF0Y2guU3BsaXRSdWxlcywgc2VudGVuY2U6IHN0cmluZywgd29yZHM6IHsgW2tleTogc3RyaW5nXTogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+fSxcclxuY250UmVjID8gOiBJQ250UmVjICkgOiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkW10ge1xyXG4gIHZhciBzZWVuSXQgPSB3b3Jkc1tzV29yZEdyb3VwXTtcclxuICBpZiAoc2Vlbkl0ID09PSB1bmRlZmluZWQpIHtcclxuICAgIHNlZW5JdCA9IGNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXAsIHJ1bGVzLCBjbnRSZWMpO1xyXG4gICAgdXRpbHMuZGVlcEZyZWV6ZShzZWVuSXQpO1xyXG4gICAgd29yZHNbc1dvcmRHcm91cF0gPSBzZWVuSXQ7XHJcbiAgfVxyXG4gIGlmICghc2Vlbkl0IHx8IHNlZW5JdC5sZW5ndGggPT09IDApIHtcclxuICAgIGxvZ2dlcihcIioqKldBUk5JTkc6IERpZCBub3QgZmluZCBhbnkgY2F0ZWdvcml6YXRpb24gZm9yIFxcXCJcIiArIHNXb3JkR3JvdXAgKyBcIlxcXCIgaW4gc2VudGVuY2UgXFxcIlwiXHJcbiAgICAgICsgc2VudGVuY2UgKyBcIlxcXCJcIik7XHJcbiAgICBpZiAoc1dvcmRHcm91cC5pbmRleE9mKFwiIFwiKSA8PSAwKSB7XHJcbiAgICAgIGRlYnVnbG9nKFwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgcHJpbWl0aXZlICghKVwiICsgc1dvcmRHcm91cCk7XHJcbiAgICB9XHJcbiAgICBkZWJ1Z2xvZyhcIioqKldBUk5JTkc6IERpZCBub3QgZmluZCBhbnkgY2F0ZWdvcml6YXRpb24gZm9yIFwiICsgc1dvcmRHcm91cCk7XHJcbiAgICBpZiAoIXNlZW5JdCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgZW10cHkgbGlzdCwgbm90IHVuZGVmaW5lZCBmb3IgXFxcIlwiICsgc1dvcmRHcm91cCArIFwiXFxcIlwiKVxyXG4gICAgfVxyXG4gICAgd29yZHNbc1dvcmRHcm91cF0gPSBbXVxyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICByZXR1cm4gdXRpbHMuY2xvbmVEZWVwKHNlZW5JdCk7XHJcbn1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuLypcclxuWyBbYSxiXSwgW2MsZF1dXHJcblxyXG4wMCBhXHJcbjAxIGJcclxuMTAgY1xyXG4xMSBkXHJcbjEyIGNcclxuKi9cclxuXHJcblxyXG5jb25zdCBjbG9uZSA9IHV0aWxzLmNsb25lRGVlcDtcclxuXHJcblxyXG5mdW5jdGlvbiBjb3B5VmVjTWVtYmVycyh1KSB7XHJcbiAgdmFyIGkgPSAwO1xyXG4gIGZvcihpID0gMDsgaSA8IHUubGVuZ3RoOyArK2kpIHtcclxuICAgIHVbaV0gPSBjbG9uZSh1W2ldKTtcclxuICB9XHJcbiAgcmV0dXJuIHU7XHJcbn1cclxuLy8gd2UgY2FuIHJlcGxpY2F0ZSB0aGUgdGFpbCBvciB0aGUgaGVhZCxcclxuLy8gd2UgcmVwbGljYXRlIHRoZSB0YWlsIGFzIGl0IGlzIHNtYWxsZXIuXHJcblxyXG4vLyBbYSxiLGMgXVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZE1hdGNoQXJyKGRlZXA6IEFycmF5PEFycmF5PGFueT4+KTogQXJyYXk8QXJyYXk8YW55Pj4ge1xyXG4gIHZhciBhID0gW107XHJcbiAgdmFyIGxpbmUgPSBbXTtcclxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gSlNPTi5zdHJpbmdpZnkoZGVlcCkgOiAnLScpO1xyXG4gIGRlZXAuZm9yRWFjaChmdW5jdGlvbiAodUJyZWFrRG93bkxpbmUsIGlJbmRleDogbnVtYmVyKSB7XHJcbiAgICBsaW5lW2lJbmRleF0gPSBbXTtcclxuICAgIHVCcmVha0Rvd25MaW5lLmZvckVhY2goZnVuY3Rpb24gKGFXb3JkR3JvdXAsIHdnSW5kZXg6IG51bWJlcikge1xyXG4gICAgICBsaW5lW2lJbmRleF1bd2dJbmRleF0gPSBbXTtcclxuICAgICAgYVdvcmRHcm91cC5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZFZhcmlhbnQsIGlXVkluZGV4OiBudW1iZXIpIHtcclxuICAgICAgICBsaW5lW2lJbmRleF1bd2dJbmRleF1baVdWSW5kZXhdID0gb1dvcmRWYXJpYW50O1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pXHJcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IEpTT04uc3RyaW5naWZ5KGxpbmUpIDogJy0nKTtcclxuICB2YXIgcmVzID0gW107XHJcbiAgdmFyIG52ZWNzID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lLmxlbmd0aDsgKytpKSB7XHJcbiAgICB2YXIgdmVjcyA9IFtbXV07XHJcbiAgICB2YXIgbnZlY3MgPSBbXTtcclxuICAgIHZhciBydmVjID0gW107XHJcbiAgICBmb3IgKHZhciBrID0gMDsgayA8IGxpbmVbaV0ubGVuZ3RoOyArK2spIHsgLy8gd29yZGdyb3VwIGtcclxuICAgICAgLy92ZWNzIGlzIHRoZSB2ZWN0b3Igb2YgYWxsIHNvIGZhciBzZWVuIHZhcmlhbnRzIHVwIHRvIGsgd2dzLlxyXG4gICAgICB2YXIgbmV4dEJhc2UgPSBbXTtcclxuICAgICAgZm9yICh2YXIgbCA9IDA7IGwgPCBsaW5lW2ldW2tdLmxlbmd0aDsgKytsKSB7IC8vIGZvciBlYWNoIHZhcmlhbnRcclxuICAgICAgICAvL2RlYnVnbG9nKFwidmVjcyBub3dcIiArIEpTT04uc3RyaW5naWZ5KHZlY3MpKTtcclxuICAgICAgICBudmVjcyA9IFtdOyAvL3ZlY3Muc2xpY2UoKTsgLy8gY29weSB0aGUgdmVjW2ldIGJhc2UgdmVjdG9yO1xyXG4gICAgICAgIC8vZGVidWdsb2coXCJ2ZWNzIGNvcGllZCBub3dcIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSk7XHJcbiAgICAgICAgZm9yICh2YXIgdSA9IDA7IHUgPCB2ZWNzLmxlbmd0aDsgKyt1KSB7XHJcbiAgICAgICAgICBudmVjc1t1XSA9IHZlY3NbdV0uc2xpY2UoKTsgLy9cclxuICAgICAgICAgIG52ZWNzW3VdID0gY29weVZlY01lbWJlcnMobnZlY3NbdV0pO1xyXG4gICAgICAgICAgLy8gZGVidWdsb2coXCJjb3BpZWQgdmVjc1tcIisgdStcIl1cIiArIEpTT04uc3RyaW5naWZ5KHZlY3NbdV0pKTtcclxuICAgICAgICAgIG52ZWNzW3VdLnB1c2goXHJcbiAgICAgICAgICAgIGNsb25lKGxpbmVbaV1ba11bbF0pKTsgLy8gcHVzaCB0aGUgbHRoIHZhcmlhbnRcclxuICAgICAgICAgIC8vIGRlYnVnbG9nKFwibm93IG52ZWNzIFwiICsgbnZlY3MubGVuZ3RoICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyAgIGRlYnVnbG9nKFwiIGF0ICAgICBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBuZXh0YmFzZSA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXHJcbiAgICAgICAgLy8gICBkZWJ1Z2xvZyhcIiBhcHBlbmQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbnZlY3MgICAgPlwiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKVxyXG4gICAgICAgIG5leHRCYXNlID0gbmV4dEJhc2UuY29uY2F0KG52ZWNzKTtcclxuICAgICAgICAvLyAgIGRlYnVnbG9nKFwiICByZXN1bHQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbnZlY3MgICAgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxyXG4gICAgICB9IC8vY29uc3RydVxyXG4gICAgICAvLyAgZGVidWdsb2coXCJub3cgYXQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxyXG4gICAgICB2ZWNzID0gbmV4dEJhc2U7XHJcbiAgICB9XHJcbiAgICBkZWJ1Z2xvZ1YoZGVidWdsb2dWLmVuYWJsZWQgPyAoXCJBUFBFTkRJTkcgVE8gUkVTXCIgKyBpICsgXCI6XCIgKyBsICsgXCIgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKSA6ICctJyk7XHJcbiAgICByZXMgPSByZXMuY29uY2F0KHZlY3MpO1xyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZSBhIHdlaWdodCBmYWN0b3IgZm9yIGEgZ2l2ZW4gZGlzdGFuY2UgYW5kXHJcbiAqIGNhdGVnb3J5XHJcbiAqIEBwYXJhbSB7aW50ZWdlcn0gZGlzdCBkaXN0YW5jZSBpbiB3b3Jkc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gY2F0ZWdvcnkgY2F0ZWdvcnkgdG8gdXNlXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IGEgZGlzdGFuY2UgZmFjdG9yID49IDFcclxuICogIDEuMCBmb3Igbm8gZWZmZWN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVpbmZvcmNlRGlzdFdlaWdodChkaXN0OiBudW1iZXIsIGNhdGVnb3J5OiBzdHJpbmcpOiBudW1iZXIge1xyXG4gIHZhciBhYnMgPSBNYXRoLmFicyhkaXN0KTtcclxuICByZXR1cm4gMS4wICsgKEFsZ29sLmFSZWluZm9yY2VEaXN0V2VpZ2h0W2Fic10gfHwgMCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHaXZlbiBhIHNlbnRlbmNlLCBleHRhY3QgY2F0ZWdvcmllc1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RDYXRlZ29yeU1hcChvU2VudGVuY2U6IEFycmF5PElGTWF0Y2guSVdvcmQ+KTogeyBba2V5OiBzdHJpbmddOiBBcnJheTx7IHBvczogbnVtYmVyIH0+IH0ge1xyXG4gIHZhciByZXMgPSB7fTtcclxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdleHRyYWN0Q2F0ZWdvcnlNYXAgJyArIEpTT04uc3RyaW5naWZ5KG9TZW50ZW5jZSkpIDogJy0nKTtcclxuICBvU2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbiAob1dvcmQsIGlJbmRleCkge1xyXG4gICAgaWYgKG9Xb3JkLmNhdGVnb3J5ID09PSBJRk1hdGNoLkNBVF9DQVRFR09SWSkge1xyXG4gICAgICByZXNbb1dvcmQubWF0Y2hlZFN0cmluZ10gPSByZXNbb1dvcmQubWF0Y2hlZFN0cmluZ10gfHwgW107XHJcbiAgICAgIHJlc1tvV29yZC5tYXRjaGVkU3RyaW5nXS5wdXNoKHsgcG9zOiBpSW5kZXggfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdXRpbHMuZGVlcEZyZWV6ZShyZXMpO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWluRm9yY2VTZW50ZW5jZShvU2VudGVuY2UpIHtcclxuICBcInVzZSBzdHJpY3RcIjtcclxuICB2YXIgb0NhdGVnb3J5TWFwID0gZXh0cmFjdENhdGVnb3J5TWFwKG9TZW50ZW5jZSk7XHJcbiAgb1NlbnRlbmNlLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkLCBpSW5kZXgpIHtcclxuICAgIHZhciBtID0gb0NhdGVnb3J5TWFwW29Xb3JkLmNhdGVnb3J5XSB8fCBbXTtcclxuICAgIG0uZm9yRWFjaChmdW5jdGlvbiAob1Bvc2l0aW9uOiB7IHBvczogbnVtYmVyIH0pIHtcclxuICAgICAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgICAgIG9Xb3JkLnJlaW5mb3JjZSA9IG9Xb3JkLnJlaW5mb3JjZSB8fCAxO1xyXG4gICAgICB2YXIgYm9vc3QgPSByZWluZm9yY2VEaXN0V2VpZ2h0KGlJbmRleCAtIG9Qb3NpdGlvbi5wb3MsIG9Xb3JkLmNhdGVnb3J5KTtcclxuICAgICAgb1dvcmQucmVpbmZvcmNlICo9IGJvb3N0O1xyXG4gICAgICBvV29yZC5fcmFua2luZyAqPSBib29zdDtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIG9TZW50ZW5jZS5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZCwgaUluZGV4KSB7XHJcbiAgICBpZiAoaUluZGV4ID4gMCApIHtcclxuICAgICAgaWYgKG9TZW50ZW5jZVtpSW5kZXgtMV0uY2F0ZWdvcnkgPT09IFwibWV0YVwiICAmJiAob1dvcmQuY2F0ZWdvcnkgPT09IG9TZW50ZW5jZVtpSW5kZXgtMV0ubWF0Y2hlZFN0cmluZykgKSB7XHJcbiAgICAgICAgb1dvcmQucmVpbmZvcmNlID0gb1dvcmQucmVpbmZvcmNlIHx8IDE7XHJcbiAgICAgICAgdmFyIGJvb3N0ID0gcmVpbmZvcmNlRGlzdFdlaWdodCgxLCBvV29yZC5jYXRlZ29yeSk7XHJcbiAgICAgICAgb1dvcmQucmVpbmZvcmNlICo9IGJvb3N0O1xyXG4gICAgICAgIG9Xb3JkLl9yYW5raW5nICo9IGJvb3N0O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIG9TZW50ZW5jZTtcclxufVxyXG5cclxuXHJcbmltcG9ydCAqIGFzIFNlbnRlbmNlIGZyb20gJy4vc2VudGVuY2UnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlaW5Gb3JjZShhQ2F0ZWdvcml6ZWRBcnJheSkge1xyXG4gIFwidXNlIHN0cmljdFwiO1xyXG4gIGFDYXRlZ29yaXplZEFycmF5LmZvckVhY2goZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xyXG4gICAgcmVpbkZvcmNlU2VudGVuY2Uob1NlbnRlbmNlKTtcclxuICB9KVxyXG4gIGFDYXRlZ29yaXplZEFycmF5LnNvcnQoU2VudGVuY2UuY21wUmFua2luZ1Byb2R1Y3QpO1xyXG4gIGlmKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nKFwiYWZ0ZXIgcmVpbmZvcmNlXCIgKyBhQ2F0ZWdvcml6ZWRBcnJheS5tYXAoZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xyXG4gICAgICByZXR1cm4gU2VudGVuY2UucmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlKSArIFwiOlwiICsgSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcclxuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xyXG4gIH1cclxuICByZXR1cm4gYUNhdGVnb3JpemVkQXJyYXk7XHJcbn1cclxuXHJcblxyXG4vLy8gYmVsb3cgbWF5IG5vIGxvbmdlciBiZSB1c2VkXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hSZWdFeHAob1J1bGU6IElSdWxlLCBjb250ZXh0OiBJRk1hdGNoLmNvbnRleHQsIG9wdGlvbnM/OiBJTWF0Y2hPcHRpb25zKSB7XHJcbiAgaWYgKGNvbnRleHRbb1J1bGUua2V5XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICB2YXIgc0tleSA9IG9SdWxlLmtleTtcclxuICB2YXIgczEgPSBjb250ZXh0W29SdWxlLmtleV0udG9Mb3dlckNhc2UoKVxyXG4gIHZhciByZWcgPSBvUnVsZS5yZWdleHA7XHJcblxyXG4gIHZhciBtID0gcmVnLmV4ZWMoczEpO1xyXG4gIGlmKGRlYnVnbG9nVi5lbmFibGVkKSB7XHJcbiAgICBkZWJ1Z2xvZ1YoXCJhcHBseWluZyByZWdleHA6IFwiICsgczEgKyBcIiBcIiArIEpTT04uc3RyaW5naWZ5KG0pKTtcclxuICB9XHJcbiAgaWYgKCFtKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG4gIHZhciBkZWx0YSA9IGNvbXBhcmVDb250ZXh0KGNvbnRleHQsIG9SdWxlLmZvbGxvd3MsIG9SdWxlLmtleSlcclxuICBpZiAoZGVidWdsb2dWLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nVihKU09OLnN0cmluZ2lmeShkZWx0YSkpO1xyXG4gICAgZGVidWdsb2dWKEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpKTtcclxuICB9XHJcbiAgaWYgKG9wdGlvbnMubWF0Y2hvdGhlcnMgJiYgKGRlbHRhLmRpZmZlcmVudCA+IDApKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgfVxyXG4gIHZhciBvRXh0cmFjdGVkQ29udGV4dCA9IGV4dHJhY3RBcmdzTWFwKG0sIG9SdWxlLmFyZ3NNYXApO1xyXG4gIGlmIChkZWJ1Z2xvZ1YuZW5hYmxlZCkge1xyXG4gICAgZGVidWdsb2dWKFwiZXh0cmFjdGVkIGFyZ3MgXCIgKyBKU09OLnN0cmluZ2lmeShvUnVsZS5hcmdzTWFwKSk7XHJcbiAgICBkZWJ1Z2xvZ1YoXCJtYXRjaCBcIiArIEpTT04uc3RyaW5naWZ5KG0pKTtcclxuICAgIGRlYnVnbG9nVihcImV4dHJhY3RlZCBhcmdzIFwiICsgSlNPTi5zdHJpbmdpZnkob0V4dHJhY3RlZENvbnRleHQpKTtcclxuICB9XHJcbiAgdmFyIHJlcyA9IEFueU9iamVjdC5hc3NpZ24oe30sIG9SdWxlLmZvbGxvd3MpIGFzIGFueTtcclxuICByZXMgPSBBbnlPYmplY3QuYXNzaWduKHJlcywgb0V4dHJhY3RlZENvbnRleHQpO1xyXG4gIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBjb250ZXh0KTtcclxuICBpZiAob0V4dHJhY3RlZENvbnRleHRbc0tleV0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmVzW3NLZXldID0gb0V4dHJhY3RlZENvbnRleHRbc0tleV07XHJcbiAgfVxyXG4gIGlmIChvcHRpb25zLm92ZXJyaWRlKSB7XHJcbiAgICByZXMgPSBBbnlPYmplY3QuYXNzaWduKHJlcywgb1J1bGUuZm9sbG93cyk7XHJcbiAgICByZXMgPSBBbnlPYmplY3QuYXNzaWduKHJlcywgb0V4dHJhY3RlZENvbnRleHQpXHJcbiAgfVxyXG4gIE9iamVjdC5mcmVlemUocmVzKTtcclxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdGb3VuZCBvbmUnICsgSlNPTi5zdHJpbmdpZnkocmVzLCB1bmRlZmluZWQsIDIpKSA6ICctJyk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNvcnRCeVdlaWdodChzS2V5OiBzdHJpbmcsIG9Db250ZXh0QTogSUZNYXRjaC5jb250ZXh0LCBvQ29udGV4dEI6IElGTWF0Y2guY29udGV4dCk6IG51bWJlciB7XHJcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nVignc29ydGluZzogJyArIHNLZXkgKyAnaW52b2tlZCB3aXRoXFxuIDE6JyArIEpTT04uc3RyaW5naWZ5KG9Db250ZXh0QSwgdW5kZWZpbmVkLCAyKSArXHJcbiAgICBcIiB2cyBcXG4gMjpcIiArIEpTT04uc3RyaW5naWZ5KG9Db250ZXh0QiwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgfVxyXG4gIHZhciByYW5raW5nQTogbnVtYmVyID0gcGFyc2VGbG9hdChvQ29udGV4dEFbXCJfcmFua2luZ1wiXSB8fCBcIjFcIik7XHJcbiAgdmFyIHJhbmtpbmdCOiBudW1iZXIgPSBwYXJzZUZsb2F0KG9Db250ZXh0QltcIl9yYW5raW5nXCJdIHx8IFwiMVwiKTtcclxuICBpZiAocmFua2luZ0EgIT09IHJhbmtpbmdCKSB7XHJcbiAgICBpZihkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICAgIGRlYnVnbG9nKFwiIHJhbmtpbiBkZWx0YVwiICsgMTAwICogKHJhbmtpbmdCIC0gcmFua2luZ0EpKTtcclxuICAgIH1cclxuICAgIHJldHVybiAxMDAgKiAocmFua2luZ0IgLSByYW5raW5nQSlcclxuICB9XHJcblxyXG4gIHZhciB3ZWlnaHRBID0gb0NvbnRleHRBW1wiX3dlaWdodFwiXSAmJiBvQ29udGV4dEFbXCJfd2VpZ2h0XCJdW3NLZXldIHx8IDA7XHJcbiAgdmFyIHdlaWdodEIgPSBvQ29udGV4dEJbXCJfd2VpZ2h0XCJdICYmIG9Db250ZXh0QltcIl93ZWlnaHRcIl1bc0tleV0gfHwgMDtcclxuICByZXR1cm4gKyh3ZWlnaHRCIC0gd2VpZ2h0QSk7XHJcbn1cclxuXHJcblxyXG4vLyBXb3JkLCBTeW5vbnltLCBSZWdleHAgLyBFeHRyYWN0aW9uUnVsZVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRDb250ZXh0MShjb250ZXh0OiBJRk1hdGNoLmNvbnRleHQsIG9SdWxlczogQXJyYXk8SVJ1bGU+LCBvcHRpb25zOiBJTWF0Y2hPcHRpb25zKTogQXJyYXk8SUZNYXRjaC5jb250ZXh0PiB7XHJcbiAgdmFyIHNLZXkgPSBvUnVsZXNbMF0ua2V5O1xyXG4gIC8vIGNoZWNrIHRoYXQgcnVsZVxyXG4gIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICAvLyBjaGVjayBjb25zaXN0ZW5jeVxyXG4gICAgb1J1bGVzLmV2ZXJ5KGZ1bmN0aW9uIChpUnVsZSkge1xyXG4gICAgICBpZiAoaVJ1bGUua2V5ICE9PSBzS2V5KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5ob21vZ2Vub3VzIGtleXMgaW4gcnVsZXMsIGV4cGVjdGVkIFwiICsgc0tleSArIFwiIHdhcyBcIiArIEpTT04uc3RyaW5naWZ5KGlSdWxlKSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8vIGxvb2sgZm9yIHJ1bGVzIHdoaWNoIG1hdGNoXHJcbiAgdmFyIHJlcyA9IG9SdWxlcy5tYXAoZnVuY3Rpb24gKG9SdWxlKSB7XHJcbiAgICAvLyBpcyB0aGlzIHJ1bGUgYXBwbGljYWJsZVxyXG4gICAgc3dpdGNoIChvUnVsZS50eXBlKSB7XHJcbiAgICAgIGNhc2UgSUZNYXRjaC5FbnVtUnVsZVR5cGUuV09SRDpcclxuICAgICAgICByZXR1cm4gbWF0Y2hXb3JkKG9SdWxlLCBjb250ZXh0LCBvcHRpb25zKVxyXG4gICAgICBjYXNlIElGTWF0Y2guRW51bVJ1bGVUeXBlLlJFR0VYUDpcclxuICAgICAgICByZXR1cm4gbWF0Y2hSZWdFeHAob1J1bGUsIGNvbnRleHQsIG9wdGlvbnMpO1xyXG4gICAgICAvLyAgIGNhc2UgXCJFeHRyYWN0aW9uXCI6XHJcbiAgICAgIC8vICAgICByZXR1cm4gbWF0Y2hFeHRyYWN0aW9uKG9SdWxlLGNvbnRleHQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxyXG4gIH0pLmZpbHRlcihmdW5jdGlvbiAob3Jlcykge1xyXG4gICAgcmV0dXJuICEhb3Jlc1xyXG4gIH0pLnNvcnQoXHJcbiAgICBzb3J0QnlXZWlnaHQuYmluZCh0aGlzLCBzS2V5KVxyXG4gICAgKTtcclxuICAgIC8vZGVidWdsb2coXCJoYXNzb3J0ZWRcIiArIEpTT04uc3RyaW5naWZ5KHJlcyx1bmRlZmluZWQsMikpO1xyXG4gIHJldHVybiByZXM7XHJcbiAgLy8gT2JqZWN0LmtleXMoKS5mb3JFYWNoKGZ1bmN0aW9uIChzS2V5KSB7XHJcbiAgLy8gfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50Q29udGV4dChjb250ZXh0OiBJRk1hdGNoLmNvbnRleHQsIGFSdWxlczogQXJyYXk8SVJ1bGU+KTogQXJyYXk8SUZNYXRjaC5jb250ZXh0PiB7XHJcblxyXG4gIHZhciBvcHRpb25zMTogSU1hdGNoT3B0aW9ucyA9IHtcclxuICAgIG1hdGNob3RoZXJzOiB0cnVlLFxyXG4gICAgb3ZlcnJpZGU6IGZhbHNlXHJcbiAgfSBhcyBJTWF0Y2hPcHRpb25zO1xyXG5cclxuICB2YXIgYVJlcyA9IGF1Z21lbnRDb250ZXh0MShjb250ZXh0LCBhUnVsZXMsIG9wdGlvbnMxKVxyXG5cclxuICBpZiAoYVJlcy5sZW5ndGggPT09IDApIHtcclxuICAgIHZhciBvcHRpb25zMjogSU1hdGNoT3B0aW9ucyA9IHtcclxuICAgICAgbWF0Y2hvdGhlcnM6IGZhbHNlLFxyXG4gICAgICBvdmVycmlkZTogdHJ1ZVxyXG4gICAgfSBhcyBJTWF0Y2hPcHRpb25zO1xyXG4gICAgYVJlcyA9IGF1Z21lbnRDb250ZXh0MShjb250ZXh0LCBhUnVsZXMsIG9wdGlvbnMyKTtcclxuICB9XHJcbiAgcmV0dXJuIGFSZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRPcmRlcmVkKHJlc3VsdDogQXJyYXk8SUZNYXRjaC5jb250ZXh0PiwgaUluc2VydGVkTWVtYmVyOiBJRk1hdGNoLmNvbnRleHQsIGxpbWl0OiBudW1iZXIpOiBBcnJheTxJRk1hdGNoLmNvbnRleHQ+IHtcclxuICAvLyBUT0RPOiB1c2Ugc29tZSB3ZWlnaHRcclxuICBpZiAocmVzdWx0Lmxlbmd0aCA8IGxpbWl0KSB7XHJcbiAgICByZXN1bHQucHVzaChpSW5zZXJ0ZWRNZW1iZXIpXHJcbiAgfVxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGFrZVRvcE4oYXJyOiBBcnJheTxBcnJheTxJRk1hdGNoLmNvbnRleHQ+Pik6IEFycmF5PElGTWF0Y2guY29udGV4dD4ge1xyXG4gIHZhciB1ID0gYXJyLmZpbHRlcihmdW5jdGlvbiAoaW5uZXJBcnIpIHsgcmV0dXJuIGlubmVyQXJyLmxlbmd0aCA+IDAgfSlcclxuXHJcbiAgdmFyIHJlcyA9IFtdO1xyXG4gIC8vIHNoaWZ0IG91dCB0aGUgdG9wIG9uZXNcclxuICB1ID0gdS5tYXAoZnVuY3Rpb24gKGlBcnIpIHtcclxuICAgIHZhciB0b3AgPSBpQXJyLnNoaWZ0KCk7XHJcbiAgICByZXMgPSBpbnNlcnRPcmRlcmVkKHJlcywgdG9wLCA1KVxyXG4gICAgcmV0dXJuIGlBcnJcclxuICB9KS5maWx0ZXIoZnVuY3Rpb24gKGlubmVyQXJyOiBBcnJheTxJRk1hdGNoLmNvbnRleHQ+KTogYm9vbGVhbiB7IHJldHVybiBpbm5lckFyci5sZW5ndGggPiAwIH0pO1xyXG4gIC8vIGFzIEFycmF5PEFycmF5PElGTWF0Y2guY29udGV4dD4+XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuaW1wb3J0ICogYXMgaW5wdXRGaWx0ZXJSdWxlcyBmcm9tICcuL2lucHV0RmlsdGVyUnVsZXMnO1xyXG5cclxudmFyIHJtO1xyXG5cclxuZnVuY3Rpb24gZ2V0Uk1PbmNlKCkge1xyXG4gIGlmICghcm0pIHtcclxuICAgIHJtID0gaW5wdXRGaWx0ZXJSdWxlcy5nZXRSdWxlTWFwKClcclxuICB9XHJcbiAgcmV0dXJuIHJtO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlSdWxlcyhjb250ZXh0OiBJRk1hdGNoLmNvbnRleHQpOiBBcnJheTxJRk1hdGNoLmNvbnRleHQ+IHtcclxuICB2YXIgYmVzdE46IEFycmF5PElGTWF0Y2guY29udGV4dD4gPSBbY29udGV4dF07XHJcbiAgaW5wdXRGaWx0ZXJSdWxlcy5vS2V5T3JkZXIuZm9yRWFjaChmdW5jdGlvbiAoc0tleTogc3RyaW5nKSB7XHJcbiAgICB2YXIgYmVzdE5leHQ6IEFycmF5PEFycmF5PElGTWF0Y2guY29udGV4dD4+ID0gW107XHJcbiAgICBiZXN0Ti5mb3JFYWNoKGZ1bmN0aW9uIChvQ29udGV4dDogSUZNYXRjaC5jb250ZXh0KSB7XHJcbiAgICAgIGlmIChvQ29udGV4dFtzS2V5XSkge1xyXG4gICAgICAgIGRlYnVnbG9nKCcqKiBhcHBseWluZyBydWxlcyBmb3IgJyArIHNLZXkpXHJcbiAgICAgICAgdmFyIHJlcyA9IGF1Z21lbnRDb250ZXh0KG9Db250ZXh0LCBnZXRSTU9uY2UoKVtzS2V5XSB8fCBbXSlcclxuICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCcqKiByZXN1bHQgZm9yICcgKyBzS2V5ICsgJyA9ICcgKyBKU09OLnN0cmluZ2lmeShyZXMsIHVuZGVmaW5lZCwgMikpOiAnLScpO1xyXG4gICAgICAgIGJlc3ROZXh0LnB1c2gocmVzIHx8IFtdKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIHJ1bGUgbm90IHJlbGV2YW50XHJcbiAgICAgICAgYmVzdE5leHQucHVzaChbb0NvbnRleHRdKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIGJlc3ROID0gdGFrZVRvcE4oYmVzdE5leHQpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBiZXN0TlxyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UnVsZXNQaWNrRmlyc3QoY29udGV4dDogSUZNYXRjaC5jb250ZXh0KTogSUZNYXRjaC5jb250ZXh0IHtcclxuICB2YXIgciA9IGFwcGx5UnVsZXMoY29udGV4dCk7XHJcbiAgcmV0dXJuIHIgJiYgclswXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIERlY2lkZSB3aGV0aGVyIHRvIHJlcXVlcnkgZm9yIGEgY29udGV0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGVjaWRlT25SZVF1ZXJ5KGNvbnRleHQ6IElGTWF0Y2guY29udGV4dCk6IEFycmF5PElGTWF0Y2guY29udGV4dD4ge1xyXG4gIHJldHVybiBbXVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
