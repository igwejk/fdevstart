"use strict";

var debug = require('debug');
var debuglog = debug('dispatcher');
function cleanseString(sString) {
    sString = sString.replace(/^\s+/, '');
    sString = sString.replace(/\s+$/, '');
    sString = sString.replace(/\s\s+/g, ' ');
    return sString;
}
exports.cleanseString = cleanseString;
/**
 *@param {string} sString , e.g. "a b c"
 *@return {Array<Array<String>>} broken down array, e.g.
 *[["a b c"], ["a", "b c"], ["a b", "c"], ....["a", "b", "c"]]
 */
function breakdownString(sString) {
    var u = sString.split(" ");
    var k = 0;
    if (u.length === 0) {
        return [[]];
    }
    var w = [[u[0]]];
    while (k < u.length - 1) {
        k = k + 1;
        var r1 = w.map(function (entry) {
            debuglog(JSON.stringify(entry));
            var entry = entry.slice(0);
            debuglog(JSON.stringify(entry));
            entry[entry.length - 1] = entry[entry.length - 1] + " " + u[k];
            return entry;
        });
        var r2 = w.map(function (entry) {
            debuglog("2 >" + JSON.stringify(entry));
            var entry = entry.slice(0);
            entry.push(u[k]);
            return entry;
        });
        debuglog(JSON.stringify(r1));
        debuglog(JSON.stringify(r2));
        w = r1.concat(r2);
    }
    return w;
}
exports.breakdownString = breakdownString;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoL2JyZWFrZG93bi5qcyIsIi4uL3NyYy9tYXRjaC9icmVha2Rvd24udHMiXSwibmFtZXMiOlsiZGVidWciLCJyZXF1aXJlIiwiZGVidWdsb2ciLCJjbGVhbnNlU3RyaW5nIiwic1N0cmluZyIsInJlcGxhY2UiLCJleHBvcnRzIiwiYnJlYWtkb3duU3RyaW5nIiwidSIsInNwbGl0IiwiayIsImxlbmd0aCIsInciLCJyMSIsIm1hcCIsImVudHJ5IiwiSlNPTiIsInN0cmluZ2lmeSIsInNsaWNlIiwicjIiLCJwdXNoIiwiY29uY2F0Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUNDQSxJQUFZQSxRQUFLQyxRQUFNLE9BQU4sQ0FBakI7QUFDQSxJQUFNQyxXQUFXRixNQUFNLFlBQU4sQ0FBakI7QUFHQSxTQUFBRyxhQUFBLENBQThCQyxPQUE5QixFQUE4QztBQUMxQ0EsY0FBVUEsUUFBUUMsT0FBUixDQUFnQixNQUFoQixFQUF1QixFQUF2QixDQUFWO0FBQ0FELGNBQVVBLFFBQVFDLE9BQVIsQ0FBZ0IsTUFBaEIsRUFBdUIsRUFBdkIsQ0FBVjtBQUNBRCxjQUFVQSxRQUFRQyxPQUFSLENBQWdCLFFBQWhCLEVBQTBCLEdBQTFCLENBQVY7QUFDQSxXQUFPRCxPQUFQO0FBQ0g7QUFMZUUsUUFBQUgsYUFBQSxHQUFhQSxhQUFiO0FBTWhCOzs7OztBQUtBLFNBQUFJLGVBQUEsQ0FBZ0NILE9BQWhDLEVBQStDO0FBQzNDLFFBQUlJLElBQUlKLFFBQVFLLEtBQVIsQ0FBYyxHQUFkLENBQVI7QUFDQSxRQUFJQyxJQUFJLENBQVI7QUFDQSxRQUFHRixFQUFFRyxNQUFGLEtBQWEsQ0FBaEIsRUFBbUI7QUFDZixlQUFPLENBQUMsRUFBRCxDQUFQO0FBQ0g7QUFDRCxRQUFJQyxJQUFJLENBQUMsQ0FBQ0osRUFBRSxDQUFGLENBQUQsQ0FBRCxDQUFSO0FBQ0EsV0FBTUUsSUFBSUYsRUFBRUcsTUFBRixHQUFXLENBQXJCLEVBQXdCO0FBQ3BCRCxZQUFJQSxJQUFJLENBQVI7QUFDQSxZQUFJRyxLQUFLRCxFQUFFRSxHQUFGLENBQU0sVUFBVUMsS0FBVixFQUFlO0FBQzFCYixxQkFBU2MsS0FBS0MsU0FBTCxDQUFlRixLQUFmLENBQVQ7QUFDQSxnQkFBSUEsUUFBUUEsTUFBTUcsS0FBTixDQUFZLENBQVosQ0FBWjtBQUNBaEIscUJBQVNjLEtBQUtDLFNBQUwsQ0FBZUYsS0FBZixDQUFUO0FBQ0FBLGtCQUFNQSxNQUFNSixNQUFOLEdBQWMsQ0FBcEIsSUFBMEJJLE1BQU1BLE1BQU1KLE1BQU4sR0FBYSxDQUFuQixJQUF5QixHQUF6QixHQUErQkgsRUFBRUUsQ0FBRixDQUF6RDtBQUNBLG1CQUFPSyxLQUFQO0FBQ0gsU0FOUSxDQUFUO0FBT0EsWUFBSUksS0FBTVAsRUFBRUUsR0FBRixDQUFNLFVBQVVDLEtBQVYsRUFBZTtBQUMzQmIscUJBQVMsUUFBUWMsS0FBS0MsU0FBTCxDQUFlRixLQUFmLENBQWpCO0FBQ0EsZ0JBQUlBLFFBQVFBLE1BQU1HLEtBQU4sQ0FBWSxDQUFaLENBQVo7QUFDQUgsa0JBQU1LLElBQU4sQ0FBV1osRUFBRUUsQ0FBRixDQUFYO0FBQ0EsbUJBQU9LLEtBQVA7QUFDSCxTQUxTLENBQVY7QUFNQWIsaUJBQVNjLEtBQUtDLFNBQUwsQ0FBZUosRUFBZixDQUFUO0FBQ0FYLGlCQUFTYyxLQUFLQyxTQUFMLENBQWVFLEVBQWYsQ0FBVDtBQUNBUCxZQUFJQyxHQUFHUSxNQUFILENBQVVGLEVBQVYsQ0FBSjtBQUNIO0FBQ0QsV0FBT1AsQ0FBUDtBQUNIO0FBM0JlTixRQUFBQyxlQUFBLEdBQWVBLGVBQWYiLCJmaWxlIjoibWF0Y2gvYnJlYWtkb3duLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJyk7XG5jb25zdCBkZWJ1Z2xvZyA9IGRlYnVnKCdkaXNwYXRjaGVyJyk7XG5mdW5jdGlvbiBjbGVhbnNlU3RyaW5nKHNTdHJpbmcpIHtcbiAgICBzU3RyaW5nID0gc1N0cmluZy5yZXBsYWNlKC9eXFxzKy8sICcnKTtcbiAgICBzU3RyaW5nID0gc1N0cmluZy5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbiAgICBzU3RyaW5nID0gc1N0cmluZy5yZXBsYWNlKC9cXHNcXHMrL2csICcgJyk7XG4gICAgcmV0dXJuIHNTdHJpbmc7XG59XG5leHBvcnRzLmNsZWFuc2VTdHJpbmcgPSBjbGVhbnNlU3RyaW5nO1xuLyoqXG4gKkBwYXJhbSB7c3RyaW5nfSBzU3RyaW5nICwgZS5nLiBcImEgYiBjXCJcbiAqQHJldHVybiB7QXJyYXk8QXJyYXk8U3RyaW5nPj59IGJyb2tlbiBkb3duIGFycmF5LCBlLmcuXG4gKltbXCJhIGIgY1wiXSwgW1wiYVwiLCBcImIgY1wiXSwgW1wiYSBiXCIsIFwiY1wiXSwgLi4uLltcImFcIiwgXCJiXCIsIFwiY1wiXV1cbiAqL1xuZnVuY3Rpb24gYnJlYWtkb3duU3RyaW5nKHNTdHJpbmcpIHtcbiAgICB2YXIgdSA9IHNTdHJpbmcuc3BsaXQoXCIgXCIpO1xuICAgIHZhciBrID0gMDtcbiAgICBpZiAodS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFtbXV07XG4gICAgfVxuICAgIHZhciB3ID0gW1t1WzBdXV07XG4gICAgd2hpbGUgKGsgPCB1Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgayA9IGsgKyAxO1xuICAgICAgICB2YXIgcjEgPSB3Lm1hcChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKEpTT04uc3RyaW5naWZ5KGVudHJ5KSk7XG4gICAgICAgICAgICB2YXIgZW50cnkgPSBlbnRyeS5zbGljZSgwKTtcbiAgICAgICAgICAgIGRlYnVnbG9nKEpTT04uc3RyaW5naWZ5KGVudHJ5KSk7XG4gICAgICAgICAgICBlbnRyeVtlbnRyeS5sZW5ndGggLSAxXSA9IGVudHJ5W2VudHJ5Lmxlbmd0aCAtIDFdICsgXCIgXCIgKyB1W2tdO1xuICAgICAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHIyID0gdy5tYXAoZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhcIjIgPlwiICsgSlNPTi5zdHJpbmdpZnkoZW50cnkpKTtcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IGVudHJ5LnNsaWNlKDApO1xuICAgICAgICAgICAgZW50cnkucHVzaCh1W2tdKTtcbiAgICAgICAgICAgIHJldHVybiBlbnRyeTtcbiAgICAgICAgfSk7XG4gICAgICAgIGRlYnVnbG9nKEpTT04uc3RyaW5naWZ5KHIxKSk7XG4gICAgICAgIGRlYnVnbG9nKEpTT04uc3RyaW5naWZ5KHIyKSk7XG4gICAgICAgIHcgPSByMS5jb25jYXQocjIpO1xuICAgIH1cbiAgICByZXR1cm4gdztcbn1cbmV4cG9ydHMuYnJlYWtkb3duU3RyaW5nID0gYnJlYWtkb3duU3RyaW5nO1xuIiwiXHJcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnJztcclxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnZGlzcGF0Y2hlcicpXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFuc2VTdHJpbmcoc1N0cmluZyA6IHN0cmluZykgOiBzdHJpbmcge1xyXG4gICAgc1N0cmluZyA9IHNTdHJpbmcucmVwbGFjZSgvXlxccysvLCcnKTtcclxuICAgIHNTdHJpbmcgPSBzU3RyaW5nLnJlcGxhY2UoL1xccyskLywnJyk7XHJcbiAgICBzU3RyaW5nID0gc1N0cmluZy5yZXBsYWNlKC9cXHNcXHMrL2csICcgJyk7XHJcbiAgICByZXR1cm4gc1N0cmluZ1xyXG59XHJcbi8qKlxyXG4gKkBwYXJhbSB7c3RyaW5nfSBzU3RyaW5nICwgZS5nLiBcImEgYiBjXCJcclxuICpAcmV0dXJuIHtBcnJheTxBcnJheTxTdHJpbmc+Pn0gYnJva2VuIGRvd24gYXJyYXksIGUuZy5cclxuICpbW1wiYSBiIGNcIl0sIFtcImFcIiwgXCJiIGNcIl0sIFtcImEgYlwiLCBcImNcIl0sIC4uLi5bXCJhXCIsIFwiYlwiLCBcImNcIl1dXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYnJlYWtkb3duU3RyaW5nKHNTdHJpbmc6IHN0cmluZykgOiBBcnJheTxBcnJheTxTdHJpbmc+PiB7XHJcbiAgICB2YXIgdSA9IHNTdHJpbmcuc3BsaXQoXCIgXCIpO1xyXG4gICAgdmFyIGsgPSAwO1xyXG4gICAgaWYodS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gW1tdXTtcclxuICAgIH1cclxuICAgIHZhciB3ID0gW1t1WzBdXV07XHJcbiAgICB3aGlsZShrIDwgdS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgayA9IGsgKyAxO1xyXG4gICAgICAgIHZhciByMSA9IHcubWFwKGZ1bmN0aW9uIChlbnRyeSkge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZyhKU09OLnN0cmluZ2lmeShlbnRyeSkpO1xyXG4gICAgICAgICAgICB2YXIgZW50cnkgPSBlbnRyeS5zbGljZSgwKTtcclxuICAgICAgICAgICAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkoZW50cnkpKTtcclxuICAgICAgICAgICAgZW50cnlbZW50cnkubGVuZ3RoIC0xIF0gPSBlbnRyeVtlbnRyeS5sZW5ndGgtMSBdICsgXCIgXCIgKyB1W2tdO1xyXG4gICAgICAgICAgICByZXR1cm4gZW50cnk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdmFyIHIyID0gIHcubWFwKGZ1bmN0aW9uIChlbnRyeSkge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZyhcIjIgPlwiICsgSlNPTi5zdHJpbmdpZnkoZW50cnkpKTtcclxuICAgICAgICAgICAgdmFyIGVudHJ5ID0gZW50cnkuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIGVudHJ5LnB1c2godVtrXSk7XHJcbiAgICAgICAgICAgIHJldHVybiBlbnRyeVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRlYnVnbG9nKEpTT04uc3RyaW5naWZ5KHIxKSk7XHJcbiAgICAgICAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkocjIpKTtcclxuICAgICAgICB3ID0gcjEuY29uY2F0KHIyKTtcclxuICAgIH1cclxuICAgIHJldHVybiB3O1xyXG59XHJcblxyXG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi9pZm1hdGNoJ1xyXG5cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9