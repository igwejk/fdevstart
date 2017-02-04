/**
 * @file sentence
 * @module jfseb.fdevstart.sentence
 * @copyright (c) Gerd Forstmann
 *
 * Match a tool record on a sentence,
 *
 * This will unify matching required and optional category words
 * with the requirements of the tool.
 *
 */
"use strict";
// <reference path="../../lib/node-4.d.ts" />

var debug = require("debug");
var debuglog = debug('sentence');
function findWordByCategory(oSentence, sCategory) {
    var res = {};
    oSentence.every(function (oWord, iIndex) {
        if (oWord.category === sCategory) {
            res = { word: oWord,
                index: iIndex };
            return false;
        }
        return true;
    });
    return res;
}
exports.findWordByCategory = findWordByCategory;
function getDistinctCategoriesInSentence(oSentence) {
    var res = [];
    var resm = {};
    oSentence.forEach(function (oWord) {
        if (oWord.category === "category") {
            if (!resm[oWord.matchedString]) {
                res.push(oWord.matchedString);
                resm[oWord.matchedString] = 1;
            }
        }
    });
    return res;
}
exports.getDistinctCategoriesInSentence = getDistinctCategoriesInSentence;
function rankingGeometricMean(oSentence) {
    var length = oSentence.length;
    if (length === 0) {
        return 1.0;
    }
    var prod = oSentence.reduce(function (prev, oWord) {
        return prev * (oWord._ranking || 1.0);
    }, 1.0);
    // TODO: find somethign faster ;-)
    return Math.pow(prod, 1 / length);
}
exports.rankingGeometricMean = rankingGeometricMean;
function rankingProduct(oSentence) {
    return rankingGeometricMean(oSentence);
}
exports.rankingProduct = rankingProduct;
function cmpRankingProduct(a, b) {
    return -(rankingProduct(a) - rankingProduct(b));
}
exports.cmpRankingProduct = cmpRankingProduct;
function cutoffSentenceAtRatio(sentences) {
    if (sentences.length === 0) {
        return sentences;
    }
    var bestRank = rankingProduct(sentences[0]);
    for (var i = 1; i < Math.min(sentences.length, 300) && rankingProduct(sentences[i]) / bestRank > 0.8; ++i) {}
    debuglog("reduce sentences by " + i + "/" + sentences.length);
    return sentences.slice(0, i);
}
exports.cutoffSentenceAtRatio = cutoffSentenceAtRatio;
function dumpNice(sentence, fn) {
    var result = [];
    sentence.forEach(function (oWord, index) {
        var sWord = "[" + index + "] : " + (oWord._ranking || 0).toFixed(3) + " " + oWord.category + " \"" + oWord.string + "\" => \"" + oWord.matchedString + "\"";
        result.push(sWord + "\n");
    });
    result.push(".\n");
    return result.join("");
}
exports.dumpNice = dumpNice;
function dumpNiceArr(sentences, fn) {
    if (!sentences) {
        return "";
    }
    var res = sentences.reduce(function (prev, oSentence) {
        return prev + dumpNice(oSentence);
    }, "");
    return res;
}
exports.dumpNiceArr = dumpNiceArr;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9zZW50ZW5jZS50cyIsIm1hdGNoL3NlbnRlbmNlLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwicmVxdWlyZSIsImRlYnVnbG9nIiwiZmluZFdvcmRCeUNhdGVnb3J5Iiwib1NlbnRlbmNlIiwic0NhdGVnb3J5IiwicmVzIiwiZXZlcnkiLCJvV29yZCIsImlJbmRleCIsImNhdGVnb3J5Iiwid29yZCIsImluZGV4IiwiZXhwb3J0cyIsImdldERpc3RpbmN0Q2F0ZWdvcmllc0luU2VudGVuY2UiLCJyZXNtIiwiZm9yRWFjaCIsIm1hdGNoZWRTdHJpbmciLCJwdXNoIiwicmFua2luZ0dlb21ldHJpY01lYW4iLCJsZW5ndGgiLCJwcm9kIiwicmVkdWNlIiwicHJldiIsIl9yYW5raW5nIiwiTWF0aCIsInBvdyIsInJhbmtpbmdQcm9kdWN0IiwiY21wUmFua2luZ1Byb2R1Y3QiLCJhIiwiYiIsImN1dG9mZlNlbnRlbmNlQXRSYXRpbyIsInNlbnRlbmNlcyIsImJlc3RSYW5rIiwiaSIsIm1pbiIsInNsaWNlIiwiZHVtcE5pY2UiLCJzZW50ZW5jZSIsImZuIiwicmVzdWx0Iiwic1dvcmQiLCJ0b0ZpeGVkIiwic3RyaW5nIiwiam9pbiIsImR1bXBOaWNlQXJyIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7QUNXQTtBRENBOztBQUVBLElBQUFBLFFBQUFDLFFBQUEsT0FBQSxDQUFBO0FBTUEsSUFBTUMsV0FBV0YsTUFBTSxVQUFOLENBQWpCO0FBRUEsU0FBQUcsa0JBQUEsQ0FBbUNDLFNBQW5DLEVBQThDQyxTQUE5QyxFQUFnRTtBQUM3RCxRQUFJQyxNQUFNLEVBQVY7QUFDQ0YsY0FBVUcsS0FBVixDQUFnQixVQUFTQyxLQUFULEVBQWdCQyxNQUFoQixFQUFzQjtBQUNwQyxZQUFHRCxNQUFNRSxRQUFOLEtBQW1CTCxTQUF0QixFQUFpQztBQUMvQkMsa0JBQU0sRUFBRUssTUFBTUgsS0FBUjtBQUNFSSx1QkFBUUgsTUFEVixFQUFOO0FBRUEsbUJB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TUFBTVMsYUFBbEcsR0FBK0csSUFBM0g7QUFDQXVCLGVBQU90QixJQUFQLENBQVl1QixRQUFRLElBQXBCO0FBQ0QsS0FIRDtBQUlBRCxXQUFPdEIsSUFBUCxDQUFZLEtBQVo7QUFDQSxXQUFPc0IsT0FBT0ksSUFBUCxDQUFZLEVBQVosQ0FBUDtBQUNIO0FBUkQvQixRQUFBd0IsUUFBQSxHQUFBQSxRQUFBO0FBV0EsU0FBQVEsV0FBQSxDQUE0QmIsU0FBNUIsRUFBNERPLEVBQTVELEVBQXFFO0FBQ25FLFFBQUcsQ0FBQ1AsU0FBSixFQUFlO0FBQ2IsZUFBTyxFQUFQO0FBQ0Q7QUFDRCxRQUFJMUIsTUFBTTBCLFVBQVVWLE1BQVYsQ0FBaUIsVUFBU0MsSUFBVCxFQUFlbkIsU0FBZixFQUF3QjtBQUNqRCxlQUFPbUIsT0FBT2MsU0FBU2pDLFNBQVQsQ0FBZDtBQUNELEtBRlMsRUFFUCxFQUZPLENBQVY7QUFHQSxXQUFPRSxHQUFQO0FBQ0Q7QUFSRE8sUUFBQWdDLFdBQUEsR0FBQUEsV0FBQSIsImZpbGUiOiJtYXRjaC9zZW50ZW5jZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGUgc2VudGVuY2VcbiAqIEBtb2R1bGUgamZzZWIuZmRldnN0YXJ0LnNlbnRlbmNlXG4gKiBAY29weXJpZ2h0IChjKSBHZXJkIEZvcnN0bWFublxuICpcbiAqIE1hdGNoIGEgdG9vbCByZWNvcmQgb24gYSBzZW50ZW5jZSxcbiAqXG4gKiBUaGlzIHdpbGwgdW5pZnkgbWF0Y2hpbmcgcmVxdWlyZWQgYW5kIG9wdGlvbmFsIGNhdGVnb3J5IHdvcmRzXG4gKiB3aXRoIHRoZSByZXF1aXJlbWVudHMgb2YgdGhlIHRvb2wuXG4gKlxuICovXG5cbi8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2xpYi9ub2RlLTQuZC50c1wiIC8+XG5cbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnJztcblxuLy8gaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMvdXRpbHMnO1xuXG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi9pZm1hdGNoJztcblxuY29uc3QgZGVidWdsb2cgPSBkZWJ1Zygnc2VudGVuY2UnKVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFdvcmRCeUNhdGVnb3J5KG9TZW50ZW5jZSwgc0NhdGVnb3J5IDogc3RyaW5nKSA6IHsgd29yZCA6IElNYXRjaC5JV29yZCwgaW5kZXggOiBudW1iZXJ9IHtcbiAgXHR2YXIgcmVzID0ge30gYXMgeyB3b3JkIDogSU1hdGNoLklXb3JkLCBpbmRleCA6IG51bWJlcn07XG4gICAgb1NlbnRlbmNlLmV2ZXJ5KGZ1bmN0aW9uKG9Xb3JkLCBpSW5kZXgpIHtcbiAgICAgIGlmKG9Xb3JkLmNhdGVnb3J5ID09PSBzQ2F0ZWdvcnkpIHtcbiAgICAgICAgcmVzID0geyB3b3JkOiBvV29yZCxcbiAgICAgICAgICAgICAgICBpbmRleCA6IGlJbmRleCB9O1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxuICAgIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXN0aW5jdENhdGVnb3JpZXNJblNlbnRlbmNlKG9TZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UpIDogc3RyaW5nW10ge1xuICB2YXIgcmVzID0gW107XG4gIHZhciByZXNtID0ge307XG4gIG9TZW50ZW5jZS5mb3JFYWNoKGZ1bmN0aW9uKG9Xb3JkKSB7XG4gICAgaWYob1dvcmQuY2F0ZWdvcnkgPT09IFwiY2F0ZWdvcnlcIikge1xuICAgICAgaWYoIXJlc21bb1dvcmQubWF0Y2hlZFN0cmluZ10pIHtcbiAgICAgICAgcmVzLnB1c2gob1dvcmQubWF0Y2hlZFN0cmluZyk7XG4gICAgICAgIHJlc21bb1dvcmQubWF0Y2hlZFN0cmluZ10gPSAxO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5raW5nR2VvbWV0cmljTWVhbihvU2VudGVuY2UgOiBJTWF0Y2guSVNlbnRlbmNlKSA6IG51bWJlciB7XG4gIGNvbnN0IGxlbmd0aCA9IG9TZW50ZW5jZS5sZW5ndGg7XG4gIGlmKGxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAxLjA7XG4gIH1cbiAgdmFyIHByb2QgPSAgb1NlbnRlbmNlLnJlZHVjZShmdW5jdGlvbihwcmV2LCBvV29yZCkge1xuICAgIHJldHVybiBwcmV2ICogKG9Xb3JkLl9yYW5raW5nIHx8IDEuMCk7XG4gIH0sMS4wKTtcbiAgLy8gVE9ETzogZmluZCBzb21ldGhpZ24gZmFzdGVyIDstKVxuICByZXR1cm4gTWF0aC5wb3cocHJvZCwgMS9sZW5ndGgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlOiBJTWF0Y2guSVNlbnRlbmNlKSA6IG51bWJlciB7XG4gIHJldHVybiByYW5raW5nR2VvbWV0cmljTWVhbihvU2VudGVuY2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY21wUmFua2luZ1Byb2R1Y3QoYSA6IElNYXRjaC5JU2VudGVuY2UsIGIgOiBJTWF0Y2guSVNlbnRlbmNlKSB7XG4gIHJldHVybiAtIChyYW5raW5nUHJvZHVjdChhKSAtIHJhbmtpbmdQcm9kdWN0KGIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGN1dG9mZlNlbnRlbmNlQXRSYXRpbyhzZW50ZW5jZXMgOiBJTWF0Y2guSVNlbnRlbmNlW10pIHtcbiAgaWYoc2VudGVuY2VzLmxlbmd0aCA9PT0gMCl7XG4gICAgcmV0dXJuIHNlbnRlbmNlcztcbiAgfVxuICB2YXIgYmVzdFJhbmsgPSByYW5raW5nUHJvZHVjdChzZW50ZW5jZXNbMF0pO1xuICBmb3IodmFyIGkgPSAxOyAoaSA8IE1hdGgubWluKHNlbnRlbmNlcy5sZW5ndGgsIDMwMCkpICYmICgocmFua2luZ1Byb2R1Y3Qoc2VudGVuY2VzW2ldKS8gYmVzdFJhbmspID4gMC44KTsgKysgaSkge1xuICAgIC8vIGVtcHR5XG4gIH1cbiAgZGVidWdsb2coXCJyZWR1Y2Ugc2VudGVuY2VzIGJ5IFwiICsgaSArIFwiL1wiICsgc2VudGVuY2VzLmxlbmd0aCk7XG4gIHJldHVybiBzZW50ZW5jZXMuc2xpY2UoMCxpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGR1bXBOaWNlKHNlbnRlbmNlIDogSU1hdGNoLklTZW50ZW5jZSwgZm4/OiBhbnkpIDogc3RyaW5nIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIHNlbnRlbmNlLmZvckVhY2goZnVuY3Rpb24ob1dvcmQsIGluZGV4KSB7XG4gICAgICB2YXIgc1dvcmQgPSBgWyR7aW5kZXh9XSA6ICR7KG9Xb3JkLl9yYW5raW5nIHx8IDApLnRvRml4ZWQoMyl9ICR7b1dvcmQuY2F0ZWdvcnl9IFwiJHtvV29yZC5zdHJpbmd9XCIgPT4gXCIke29Xb3JkLm1hdGNoZWRTdHJpbmd9XCJgXG4gICAgICByZXN1bHQucHVzaChzV29yZCArIFwiXFxuXCIpO1xuICAgIH0pXG4gICAgcmVzdWx0LnB1c2goXCIuXFxuXCIpO1xuICAgIHJldHVybiByZXN1bHQuam9pbihcIlwiKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZHVtcE5pY2VBcnIoc2VudGVuY2VzIDogSU1hdGNoLklTZW50ZW5jZVtdLCBmbj8gOiBhbnkpIDogc3RyaW5nIHtcbiAgaWYoIXNlbnRlbmNlcykge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHZhciByZXMgPSBzZW50ZW5jZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIG9TZW50ZW5jZSkge1xuICAgIHJldHVybiBwcmV2ICsgZHVtcE5pY2Uob1NlbnRlbmNlKTtcbiAgfSwgXCJcIilcbiAgcmV0dXJuIHJlcztcbn0iLCIvKipcbiAqIEBmaWxlIHNlbnRlbmNlXG4gKiBAbW9kdWxlIGpmc2ViLmZkZXZzdGFydC5zZW50ZW5jZVxuICogQGNvcHlyaWdodCAoYykgR2VyZCBGb3JzdG1hbm5cbiAqXG4gKiBNYXRjaCBhIHRvb2wgcmVjb3JkIG9uIGEgc2VudGVuY2UsXG4gKlxuICogVGhpcyB3aWxsIHVuaWZ5IG1hdGNoaW5nIHJlcXVpcmVkIGFuZCBvcHRpb25hbCBjYXRlZ29yeSB3b3Jkc1xuICogd2l0aCB0aGUgcmVxdWlyZW1lbnRzIG9mIHRoZSB0b29sLlxuICpcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG4vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9saWIvbm9kZS00LmQudHNcIiAvPlxudmFyIGRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpO1xudmFyIGRlYnVnbG9nID0gZGVidWcoJ3NlbnRlbmNlJyk7XG5mdW5jdGlvbiBmaW5kV29yZEJ5Q2F0ZWdvcnkob1NlbnRlbmNlLCBzQ2F0ZWdvcnkpIHtcbiAgICB2YXIgcmVzID0ge307XG4gICAgb1NlbnRlbmNlLmV2ZXJ5KGZ1bmN0aW9uIChvV29yZCwgaUluZGV4KSB7XG4gICAgICAgIGlmIChvV29yZC5jYXRlZ29yeSA9PT0gc0NhdGVnb3J5KSB7XG4gICAgICAgICAgICByZXMgPSB7IHdvcmQ6IG9Xb3JkLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpSW5kZXggfTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzO1xufVxuZXhwb3J0cy5maW5kV29yZEJ5Q2F0ZWdvcnkgPSBmaW5kV29yZEJ5Q2F0ZWdvcnk7XG5mdW5jdGlvbiBnZXREaXN0aW5jdENhdGVnb3JpZXNJblNlbnRlbmNlKG9TZW50ZW5jZSkge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICB2YXIgcmVzbSA9IHt9O1xuICAgIG9TZW50ZW5jZS5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZCkge1xuICAgICAgICBpZiAob1dvcmQuY2F0ZWdvcnkgPT09IFwiY2F0ZWdvcnlcIikge1xuICAgICAgICAgICAgaWYgKCFyZXNtW29Xb3JkLm1hdGNoZWRTdHJpbmddKSB7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2gob1dvcmQubWF0Y2hlZFN0cmluZyk7XG4gICAgICAgICAgICAgICAgcmVzbVtvV29yZC5tYXRjaGVkU3RyaW5nXSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzO1xufVxuZXhwb3J0cy5nZXREaXN0aW5jdENhdGVnb3JpZXNJblNlbnRlbmNlID0gZ2V0RGlzdGluY3RDYXRlZ29yaWVzSW5TZW50ZW5jZTtcbmZ1bmN0aW9uIHJhbmtpbmdHZW9tZXRyaWNNZWFuKG9TZW50ZW5jZSkge1xuICAgIHZhciBsZW5ndGggPSBvU2VudGVuY2UubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDEuMDtcbiAgICB9XG4gICAgdmFyIHByb2QgPSBvU2VudGVuY2UucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBvV29yZCkge1xuICAgICAgICByZXR1cm4gcHJldiAqIChvV29yZC5fcmFua2luZyB8fCAxLjApO1xuICAgIH0sIDEuMCk7XG4gICAgLy8gVE9ETzogZmluZCBzb21ldGhpZ24gZmFzdGVyIDstKVxuICAgIHJldHVybiBNYXRoLnBvdyhwcm9kLCAxIC8gbGVuZ3RoKTtcbn1cbmV4cG9ydHMucmFua2luZ0dlb21ldHJpY01lYW4gPSByYW5raW5nR2VvbWV0cmljTWVhbjtcbmZ1bmN0aW9uIHJhbmtpbmdQcm9kdWN0KG9TZW50ZW5jZSkge1xuICAgIHJldHVybiByYW5raW5nR2VvbWV0cmljTWVhbihvU2VudGVuY2UpO1xufVxuZXhwb3J0cy5yYW5raW5nUHJvZHVjdCA9IHJhbmtpbmdQcm9kdWN0O1xuZnVuY3Rpb24gY21wUmFua2luZ1Byb2R1Y3QoYSwgYikge1xuICAgIHJldHVybiAtKHJhbmtpbmdQcm9kdWN0KGEpIC0gcmFua2luZ1Byb2R1Y3QoYikpO1xufVxuZXhwb3J0cy5jbXBSYW5raW5nUHJvZHVjdCA9IGNtcFJhbmtpbmdQcm9kdWN0O1xuZnVuY3Rpb24gY3V0b2ZmU2VudGVuY2VBdFJhdGlvKHNlbnRlbmNlcykge1xuICAgIGlmIChzZW50ZW5jZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBzZW50ZW5jZXM7XG4gICAgfVxuICAgIHZhciBiZXN0UmFuayA9IHJhbmtpbmdQcm9kdWN0KHNlbnRlbmNlc1swXSk7XG4gICAgZm9yICh2YXIgaSA9IDE7IChpIDwgTWF0aC5taW4oc2VudGVuY2VzLmxlbmd0aCwgMzAwKSkgJiYgKChyYW5raW5nUHJvZHVjdChzZW50ZW5jZXNbaV0pIC8gYmVzdFJhbmspID4gMC44KTsgKytpKSB7XG4gICAgfVxuICAgIGRlYnVnbG9nKFwicmVkdWNlIHNlbnRlbmNlcyBieSBcIiArIGkgKyBcIi9cIiArIHNlbnRlbmNlcy5sZW5ndGgpO1xuICAgIHJldHVybiBzZW50ZW5jZXMuc2xpY2UoMCwgaSk7XG59XG5leHBvcnRzLmN1dG9mZlNlbnRlbmNlQXRSYXRpbyA9IGN1dG9mZlNlbnRlbmNlQXRSYXRpbztcbmZ1bmN0aW9uIGR1bXBOaWNlKHNlbnRlbmNlLCBmbikge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBzZW50ZW5jZS5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHNXb3JkID0gXCJbXCIgKyBpbmRleCArIFwiXSA6IFwiICsgKG9Xb3JkLl9yYW5raW5nIHx8IDApLnRvRml4ZWQoMykgKyBcIiBcIiArIG9Xb3JkLmNhdGVnb3J5ICsgXCIgXFxcIlwiICsgb1dvcmQuc3RyaW5nICsgXCJcXFwiID0+IFxcXCJcIiArIG9Xb3JkLm1hdGNoZWRTdHJpbmcgKyBcIlxcXCJcIjtcbiAgICAgICAgcmVzdWx0LnB1c2goc1dvcmQgKyBcIlxcblwiKTtcbiAgICB9KTtcbiAgICByZXN1bHQucHVzaChcIi5cXG5cIik7XG4gICAgcmV0dXJuIHJlc3VsdC5qb2luKFwiXCIpO1xufVxuZXhwb3J0cy5kdW1wTmljZSA9IGR1bXBOaWNlO1xuZnVuY3Rpb24gZHVtcE5pY2VBcnIoc2VudGVuY2VzLCBmbikge1xuICAgIGlmICghc2VudGVuY2VzKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICB2YXIgcmVzID0gc2VudGVuY2VzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgb1NlbnRlbmNlKSB7XG4gICAgICAgIHJldHVybiBwcmV2ICsgZHVtcE5pY2Uob1NlbnRlbmNlKTtcbiAgICB9LCBcIlwiKTtcbiAgICByZXR1cm4gcmVzO1xufVxuZXhwb3J0cy5kdW1wTmljZUFyciA9IGR1bXBOaWNlQXJyO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
