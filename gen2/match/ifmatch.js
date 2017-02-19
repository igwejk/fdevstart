"use strict";

var EnumResponseCode;
(function (EnumResponseCode) {
    EnumResponseCode[EnumResponseCode["NOMATCH"] = 0] = "NOMATCH";
    EnumResponseCode[EnumResponseCode["EXEC"] = 1] = "EXEC";
    EnumResponseCode[EnumResponseCode["QUERY"] = 2] = "QUERY";
})(EnumResponseCode = exports.EnumResponseCode || (exports.EnumResponseCode = {}));
exports.CAT_CATEGORY = "category";
exports.CAT_FILLER = "filler";
exports.CAT_TOOL = "tool";
exports.ERR_NO_KNOWN_WORD = "NO_KNOWN_WORD";
exports.ERR_EMPTY_INPUT = "EMPTY_INPUT";
;
;
exports.aOperatorNames = ["starting with", "ending with", "containing", "excluding", "having", "being"];
;
var EnumRuleType;
(function (EnumRuleType) {
    EnumRuleType[EnumRuleType["WORD"] = 0] = "WORD";
    EnumRuleType[EnumRuleType["REGEXP"] = 1] = "REGEXP";
})(EnumRuleType = exports.EnumRuleType || (exports.EnumRuleType = {}));
;
;
;
;
;
;
var EnumActionType;
(function (EnumActionType) {
    EnumActionType[EnumActionType["STARTURL"] = 0] = "STARTURL";
    EnumActionType[EnumActionType["STARTCMDLINE"] = 1] = "STARTCMDLINE";
})(EnumActionType = exports.EnumActionType || (exports.EnumActionType = {}));
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoL2lmbWF0Y2guanMiLCIuLi9zcmMvbWF0Y2gvaWZtYXRjaC50cyJdLCJuYW1lcyI6WyJFbnVtUmVzcG9uc2VDb2RlIiwiZXhwb3J0cyIsIkNBVF9DQVRFR09SWSIsIkNBVF9GSUxMRVIiLCJDQVRfVE9PTCIsIkVSUl9OT19LTk9XTl9XT1JEIiwiRVJSX0VNUFRZX0lOUFVUIiwiYU9wZXJhdG9yTmFtZXMiLCJFbnVtUnVsZVR5cGUiLCJFbnVtQWN0aW9uVHlwZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FDRUEsSUFBa0JBLGdCQUFsQjtBQUFBLENBQUEsVUFBa0JBLGdCQUFsQixFQUFrQztBQUNoQ0EscUJBQUFBLGlCQUFBLFNBQUEsSUFBQSxDQUFBLElBQUEsU0FBQTtBQUNBQSxxQkFBQUEsaUJBQUEsTUFBQSxJQUFBLENBQUEsSUFBQSxNQUFBO0FBQ0FBLHFCQUFBQSxpQkFBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLE9BQUE7QUFDRCxDQUpELEVBQWtCQSxtQkFBQUMsUUFBQUQsZ0JBQUEsS0FBQUMsUUFBQUQsZ0JBQUEsR0FBZ0IsRUFBaEIsQ0FBbEI7QUFPYUMsUUFBQUMsWUFBQSxHQUFlLFVBQWY7QUFDQUQsUUFBQUUsVUFBQSxHQUFhLFFBQWI7QUFDQUYsUUFBQUcsUUFBQSxHQUFXLE1BQVg7QUFHQUgsUUFBQUksaUJBQUEsR0FBb0IsZUFBcEI7QUFDQUosUUFBQUssZUFBQSxHQUFrQixhQUFsQjtBQUtaO0FBUUE7QUFhWUwsUUFBQU0sY0FBQSxHQUFpQixDQUFDLGVBQUQsRUFBa0IsYUFBbEIsRUFBaUMsWUFBakMsRUFBK0MsV0FBL0MsRUFBNEQsUUFBNUQsRUFBc0UsT0FBdEUsQ0FBakI7QUFnRFo7QUFPRCxJQUFtQkMsWUFBbkI7QUFBQSxDQUFBLFVBQW1CQSxZQUFuQixFQUErQjtBQUM3QkEsaUJBQUFBLGFBQUEsTUFBQSxJQUFBLENBQUEsSUFBQSxNQUFBO0FBQ0FBLGlCQUFBQSxhQUFBLFFBQUEsSUFBQSxDQUFBLElBQUEsUUFBQTtBQUNELENBSEQsRUFBbUJBLGVBQUFQLFFBQUFPLFlBQUEsS0FBQVAsUUFBQU8sWUFBQSxHQUFZLEVBQVosQ0FBbkI7QUFRSztBQTJFSjtBQUlnQjtBQStCaEI7QUFvQ0E7QUFhQTtBQTRCRCxJQUFrQkMsY0FBbEI7QUFBQSxDQUFBLFVBQWtCQSxjQUFsQixFQUFnQztBQUM5QkEsbUJBQUFBLGVBQUEsVUFBQSxJQUFBLENBQUEsSUFBQSxVQUFBO0FBQ0FBLG1CQUFBQSxlQUFBLGNBQUEsSUFBQSxDQUFBLElBQUEsY0FBQTtBQUNELENBSEQsRUFBa0JBLGlCQUFBUixRQUFBUSxjQUFBLEtBQUFSLFFBQUFRLGNBQUEsR0FBYyxFQUFkLENBQWxCO0FBdUNDIiwiZmlsZSI6Im1hdGNoL2lmbWF0Y2guanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbnZhciBFbnVtUmVzcG9uc2VDb2RlO1xuKGZ1bmN0aW9uIChFbnVtUmVzcG9uc2VDb2RlKSB7XG4gICAgRW51bVJlc3BvbnNlQ29kZVtFbnVtUmVzcG9uc2VDb2RlW1wiTk9NQVRDSFwiXSA9IDBdID0gXCJOT01BVENIXCI7XG4gICAgRW51bVJlc3BvbnNlQ29kZVtFbnVtUmVzcG9uc2VDb2RlW1wiRVhFQ1wiXSA9IDFdID0gXCJFWEVDXCI7XG4gICAgRW51bVJlc3BvbnNlQ29kZVtFbnVtUmVzcG9uc2VDb2RlW1wiUVVFUllcIl0gPSAyXSA9IFwiUVVFUllcIjtcbn0pKEVudW1SZXNwb25zZUNvZGUgPSBleHBvcnRzLkVudW1SZXNwb25zZUNvZGUgfHwgKGV4cG9ydHMuRW51bVJlc3BvbnNlQ29kZSA9IHt9KSk7XG5leHBvcnRzLkNBVF9DQVRFR09SWSA9IFwiY2F0ZWdvcnlcIjtcbmV4cG9ydHMuQ0FUX0ZJTExFUiA9IFwiZmlsbGVyXCI7XG5leHBvcnRzLkNBVF9UT09MID0gXCJ0b29sXCI7XG5leHBvcnRzLkVSUl9OT19LTk9XTl9XT1JEID0gXCJOT19LTk9XTl9XT1JEXCI7XG5leHBvcnRzLkVSUl9FTVBUWV9JTlBVVCA9IFwiRU1QVFlfSU5QVVRcIjtcbjtcbjtcbmV4cG9ydHMuYU9wZXJhdG9yTmFtZXMgPSBbXCJzdGFydGluZyB3aXRoXCIsIFwiZW5kaW5nIHdpdGhcIiwgXCJjb250YWluaW5nXCIsIFwiZXhjbHVkaW5nXCIsIFwiaGF2aW5nXCIsIFwiYmVpbmdcIl07XG47XG52YXIgRW51bVJ1bGVUeXBlO1xuKGZ1bmN0aW9uIChFbnVtUnVsZVR5cGUpIHtcbiAgICBFbnVtUnVsZVR5cGVbRW51bVJ1bGVUeXBlW1wiV09SRFwiXSA9IDBdID0gXCJXT1JEXCI7XG4gICAgRW51bVJ1bGVUeXBlW0VudW1SdWxlVHlwZVtcIlJFR0VYUFwiXSA9IDFdID0gXCJSRUdFWFBcIjtcbn0pKEVudW1SdWxlVHlwZSA9IGV4cG9ydHMuRW51bVJ1bGVUeXBlIHx8IChleHBvcnRzLkVudW1SdWxlVHlwZSA9IHt9KSk7XG47XG47XG47XG47XG47XG47XG52YXIgRW51bUFjdGlvblR5cGU7XG4oZnVuY3Rpb24gKEVudW1BY3Rpb25UeXBlKSB7XG4gICAgRW51bUFjdGlvblR5cGVbRW51bUFjdGlvblR5cGVbXCJTVEFSVFVSTFwiXSA9IDBdID0gXCJTVEFSVFVSTFwiO1xuICAgIEVudW1BY3Rpb25UeXBlW0VudW1BY3Rpb25UeXBlW1wiU1RBUlRDTURMSU5FXCJdID0gMV0gPSBcIlNUQVJUQ01ETElORVwiO1xufSkoRW51bUFjdGlvblR5cGUgPSBleHBvcnRzLkVudW1BY3Rpb25UeXBlIHx8IChleHBvcnRzLkVudW1BY3Rpb25UeXBlID0ge30pKTtcbjtcbiIsIlxyXG5cclxuZXhwb3J0IGNvbnN0IGVudW0gRW51bVJlc3BvbnNlQ29kZSB7XHJcbiAgTk9NQVRDSCA9IDAsXHJcbiAgRVhFQyxcclxuICBRVUVSWVxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNvbnN0IENBVF9DQVRFR09SWSA9IFwiY2F0ZWdvcnlcIjtcclxuZXhwb3J0IGNvbnN0IENBVF9GSUxMRVIgPSBcImZpbGxlclwiO1xyXG5leHBvcnQgY29uc3QgQ0FUX1RPT0wgPSBcInRvb2xcIjtcclxuXHJcblxyXG5leHBvcnQgY29uc3QgRVJSX05PX0tOT1dOX1dPUkQgPSBcIk5PX0tOT1dOX1dPUkRcIjtcclxuZXhwb3J0IGNvbnN0IEVSUl9FTVBUWV9JTlBVVCA9IFwiRU1QVFlfSU5QVVRcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUVSRXJyb3Ige1xyXG4gIGVycl9jb2RlIDogc3RyaW5nLFxyXG4gIHRleHQgOiBzdHJpbmdcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUVSRXJyb3JOT19LTk9XTl9XT1JEIGV4dGVuZHMgSUVSRXJyb3J7XHJcbiAgY29udGV4dCA6IHtcclxuICAgIHRva2VuIDogc3RyaW5nLFxyXG4gICAgaW5kZXg6IG51bWJlcixcclxuICAgIHRva2VucyA6IHN0cmluZ1tdXHJcbiAgfVxyXG59O1xyXG5cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElQcm9tcHREZXNjcmlwdGlvbiB7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZyxcclxuICB0eXBlOiBzdHJpbmcsXHJcbiAgcGF0dGVybjogUmVnRXhwLFxyXG4gIG1lc3NhZ2U6IHN0cmluZyxcclxuICBkZWZhdWx0OiBzdHJpbmcsXHJcbiAgcmVxdWlyZWQ6IGJvb2xlYW5cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGFPcGVyYXRvck5hbWVzID0gW1wic3RhcnRpbmcgd2l0aFwiLCBcImVuZGluZyB3aXRoXCIsIFwiY29udGFpbmluZ1wiLCBcImV4Y2x1ZGluZ1wiLCBcImhhdmluZ1wiLCBcImJlaW5nXCJdO1xyXG5leHBvcnQgdHlwZSBPcGVyYXRvck5hbWUgPSBcInN0YXJ0aW5nIHdpdGhcIiB8IFwiZW5kaW5nIHdpdGhcIiB8IFwiY29udGFpbmluZ1wiIHwgXCJiZWluZ1wiIHwgXCJleGNsdWRpbmdcIiB8IFwiaGF2aW5nXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElPcGVyYXRvciB7XHJcbiAgb3BlcmF0b3IgOiBPcGVyYXRvck5hbWUsXHJcbiAgY29kZSA6IHN0cmluZyxcclxuICBhcml0eSA6IG51bWJlcixcclxuICBhcmdjYXRlZ29yeSA6IFsgc3RyaW5nW10gXVxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBJUmVjb3JkID0geyBba2V5IDogc3RyaW5nXSA6IHN0cmluZ1xyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVdoYXRJc0Fuc3dlciB7XHJcbiAgc2VudGVuY2U6IElTZW50ZW5jZSxcclxuICByZWNvcmQgOiBJUmVjb3JkLFxyXG4gIGNhdGVnb3J5IDogc3RyaW5nLFxyXG4gIHJlc3VsdDogc3RyaW5nLFxyXG4gIF9yYW5raW5nIDogbnVtYmVyXHJcbn1cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElQcm9jZXNzZWRXaGF0SXNBbnN3ZXJzIGV4dGVuZHMgSVByb2Nlc3NlZCB7XHJcbiAgc2VudGVuY2VzPyA6IElTZW50ZW5jZVtdLFxyXG4gIGFuc3dlcnMgOiBJV2hhdElzQW5zd2VyW11cclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElQcm9jZXNzZWRXaGF0SXNUdXBlbEFuc3dlcnMgZXh0ZW5kcyBJUHJvY2Vzc2VkIHtcclxuICBzZW50ZW5jZXM/IDogSVNlbnRlbmNlW10sXHJcbiAgdHVwZWxhbnN3ZXJzIDogQXJyYXk8SVdoYXRJc1R1cGVsQW5zd2VyPlxyXG59XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJV2hhdElzVHVwZWxBbnN3ZXIge1xyXG4gIHNlbnRlbmNlOiBJU2VudGVuY2UsXHJcbiAgcmVjb3JkIDogSVJlY29yZCxcclxuICBjYXRlZ29yaWVzIDogc3RyaW5nW10sXHJcbiAgcmVzdWx0OiBzdHJpbmdbXSxcclxuICBfcmFua2luZyA6IG51bWJlclxyXG59XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJTWF0Y2hlZFNldFJlY29yZCB7XHJcbiAgc2V0SWQgOiBzdHJpbmcsXHJcbiAgcmVjb3JkIDogSVJlY29yZFxyXG59O1xyXG5leHBvcnQgdHlwZSBJTWF0Y2hlZFNldFJlY29yZHMgPSBJTWF0Y2hlZFNldFJlY29yZFtdO1xyXG4vKipcclxuICogTWFwIGNhdGVnb3J5IC0+IHZhbHVlXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBJTWF0Y2hTZXQgPSB7IFtrZXkgOiBzdHJpbmddIDogc3RyaW5nfTtcclxuXHJcbmV4cG9ydCBjb25zdCAgZW51bSBFbnVtUnVsZVR5cGUge1xyXG4gIFdPUkQsXHJcbiAgUkVHRVhQXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVRvb2xTZXQge1xyXG4gICAgICBzZXQ6IHN0cmluZ1tdLFxyXG4gICAgICByZXNwb25zZTogc3RyaW5nXHJcbiAgICB9O1xyXG5cclxuZXhwb3J0IHR5cGUgSVRvb2xTZXRzID0ge1xyXG4gICAgW2tleTogc3RyaW5nXTogSVRvb2xTZXRcclxuICAgIH07XHJcbi8qKlxyXG4gKiBAaW50ZXJmYWNlIElUb29sXHJcbiAqXHJcbiAqIHZhciBvVG9vbCA9IHsgJ25hbWUnIDogJ0ZMUEQnLFxyXG4gKiAgICdyZXF1aXJlcycgOiB7ICdzeXN0ZW1JZCcgOiB7fSwgJ2NsaWVudCcgOnt9fSxcclxuICogICAnb3B0aW9uYWwnIDogeyAnY2F0YWxvZycgOiB7fSwgJ2dyb3VwJyA6e319XHJcbiAqIH07XHJcbiovXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVRvb2wge1xyXG4gIG5hbWU6IHN0cmluZyxcclxuICByZXF1aXJlczogeyBba2V5OiBzdHJpbmddOiBPYmplY3QgfSxcclxuICBvcHRpb25hbD86IHsgW2tleTogc3RyaW5nXTogT2JqZWN0IH0sXHJcbiAgc2V0cz86IElUb29sU2V0c1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElUb29sTWF0Y2hSZXN1bHQge1xyXG4gIHJlcXVpcmVkOiB7IFtrZXk6IHN0cmluZ106IElXb3JkIH0sXHJcbiAgbWlzc2luZzogeyBba2V5OiBzdHJpbmddOiBudW1iZXIgfSxcclxuICBvcHRpb25hbD86IHsgW2tleTogc3RyaW5nXTogSVdvcmQgfSxcclxuICBzcHVyaW91czogeyBba2V5OiBzdHJpbmddOiBudW1iZXIgfSxcclxuICB0b29sbWVudGlvbmVkOiBJV29yZFtdXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVByb21wdCB7XHJcbiAgdGV4dDogc3RyaW5nLFxyXG4gIGNhdGVnb3J5OiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJVG9vbE1hdGNoIHtcclxuICB0b29sbWF0Y2hyZXN1bHQ6IElUb29sTWF0Y2hSZXN1bHQsXHJcbiAgc2VudGVuY2U6IElTZW50ZW5jZSxcclxuICB0b29sOiBJVG9vbCxcclxuICByYW5rOiBudW1iZXJcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJV29yZCB7XHJcbiAgc3RyaW5nOiBzdHJpbmcsXHJcbiAgbWF0Y2hlZFN0cmluZzogc3RyaW5nLFxyXG4gIGNhdGVnb3J5OiBzdHJpbmcsXHJcbiAgX3Jhbmtpbmc/OiBudW1iZXIsXHJcbiAgbGV2ZW5tYXRjaD86IG51bWJlcixcclxuICByZWluZm9yY2U/OiBudW1iZXIsXHJcbiAgYml0aW5kZXg/IDogbnVtYmVyLFxyXG4gIHJ1bGU/IDogbVJ1bGVcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgSVNlbnRlbmNlID0gQXJyYXk8SVdvcmQ+O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUnVsZSB7XHJcbiAgdHlwZTogRW51bVJ1bGVUeXBlLFxyXG4gIGtleTogc3RyaW5nLFxyXG4gIHdvcmQ/OiBzdHJpbmcsXHJcbiAgcmVnZXhwPzogUmVnRXhwLFxyXG4gIGFyZ3NNYXA/OiB7IFtrZXk6IG51bWJlcl06IHN0cmluZyB9ICAvLyBhIG1hcCBvZiByZWdleHAgbWF0Y2ggZ3JvdXAgLT4gY29udGV4dCBrZXlcclxuICAvLyBlLmcuIC8oW2EtejAtOV17MywzfSlDTE5UKFtcXGR7MywzfV0pL1xyXG4gIC8vICAgICAgeyAxIDogXCJzeXN0ZW1JZFwiLCAyIDogXCJjbGllbnRcIiB9XHJcbiAgZm9sbG93czogY29udGV4dFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEludGVudFJ1bGUge1xyXG4gIHR5cGU6IEVudW1SdWxlVHlwZSxcclxuICByZWdleHA6IFJlZ0V4cCxcclxuICBhcmdzTWFwOiB7IFtrZXk6IHN0cmluZ106IG51bWJlciB9ICAvLyBhIG1hcCBvZiByZWdleHAgbWF0Y2ggZ3JvdXAgLT4gY29udGV4dCBrZXlcclxuICAvLyBlLmcuIC8oW2EtejAtOV17MywzfSlDTE5UKFtcXGR7MywzfV0pL1xyXG4gIC8vICAgICAgeyAxIDogXCJzeXN0ZW1JZFwiLCAyIDogXCJjbGllbnRcIiB9XHJcbiAgZm9sbG93cz86IGNvbnRleHRcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUmFuZ2Uge1xyXG4gIGxvdzogbnVtYmVyLCBoaWdoOiBudW1iZXIsXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElXb3JkUmFuZ2UgZXh0ZW5kcyBJUmFuZ2Vcclxue1xyXG4gIHJ1bGU/IDogbVJ1bGUgfTtcclxuLyoqXHJcbiAqIEEgcnVsZSBtYXRjaGluZyBhIHNpbmdsZSBzdHJpbmdcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgbVJ1bGUge1xyXG4gIHR5cGU6IEVudW1SdWxlVHlwZSxcclxuICB3b3JkPzogc3RyaW5nLFxyXG4gIGxvd2VyY2FzZXdvcmQ/IDogc3RyaW5nLFxyXG4gIHJlZ2V4cD86IFJlZ0V4cCxcclxuICBtYXRjaGVkU3RyaW5nPzogc3RyaW5nLFxyXG4gIG1hdGNoSW5kZXg/OiBudW1iZXIsXHJcbiAgY2F0ZWdvcnk6IHN0cmluZyxcclxuICBiaXRpbmRleCA6IG51bWJlcixcclxuICByYW5nZT8gOiAgSVdvcmRSYW5nZSxcclxuICAvKipcclxuICAgKiBvbmx5IHVzZSBhbiBleGFjdCBtYXRjaFxyXG4gICAqL1xyXG4gIGV4YWN0T25seT8gOiBib29sZWFuLFxyXG4gIF9yYW5raW5nPzogbnVtYmVyXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVdvcmRSdWxlcyB7XHJcbiAgcnVsZXMgOiBBcnJheTxtUnVsZT4sXHJcbiAgYml0aW5kZXg6IG51bWJlclxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNwbGl0UnVsZXMge1xyXG4gIGFsbFJ1bGVzOiBBcnJheTxtUnVsZT4sXHJcbiAgbm9uV29yZFJ1bGVzIDogQXJyYXk8bVJ1bGU+LFxyXG4gIHdvcmRNYXA6IHsgW2tleSA6IHN0cmluZ10gOiBJV29yZFJ1bGVzIH0sXHJcbiAgd29yZENhY2hlIDogIHsgW2tleTogc3RyaW5nXTogQXJyYXk8SUNhdGVnb3JpemVkU3RyaW5nPiB9XHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElDYXRlZ29yaXplZFN0cmluZyB7XHJcbiAgc3RyaW5nOiBzdHJpbmcsXHJcbiAgbWF0Y2hlZFN0cmluZzogc3RyaW5nLFxyXG4gIGNhdGVnb3J5OiBzdHJpbmcsXHJcbiAgYnJlYWtkb3duPzogQXJyYXk8YW55PlxyXG4gIHNjb3JlPzogbnVtYmVyLFxyXG4gIF9yYW5raW5nPzogbnVtYmVyLFxyXG4gIGxldmVubWF0Y2g/OiBudW1iZXIgIC8vIGEgZGlzdGFuY2UgcmFua2luZ1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCBleHRlbmRzIElDYXRlZ29yaXplZFN0cmluZ3tcclxuICBzdHJpbmc6IHN0cmluZyxcclxuICBtYXRjaGVkU3RyaW5nOiBzdHJpbmcsXHJcbiAgY2F0ZWdvcnk6IHN0cmluZyxcclxuICBicmVha2Rvd24/OiBBcnJheTxhbnk+XHJcbiAgLyoqXHJcbiAgICogTGVuZ3RoIG9mIHRoZSBlbnRyeSAoZm9yIHNraXBwaW5nIGZvbGxvd2luZyB3b3JkcylcclxuICAgKi9cclxuICBzY29yZT86IG51bWJlcixcclxuICBzcGFuPyA6IG51bWJlcixcclxuICBydWxlIDogbVJ1bGUsXHJcbiAgX3Jhbmtpbmc/OiBudW1iZXIsXHJcbiAgbGV2ZW5tYXRjaD86IG51bWJlciAgLy8gYSBkaXN0YW5jZSByYW5raW5nXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVByb2Nlc3NlZCB7XHJcbiAgdG9rZW5zIDogc3RyaW5nW10sXHJcbiAgZXJyb3JzPyA6IElFUkVycm9yW11cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUHJvY2Vzc2VkU2VudGVuY2VzIGV4dGVuZHMgSVByb2Nlc3NlZCB7XHJcbiAgdG9rZW5zIDogc3RyaW5nW10sXHJcbiAgZXJyb3JzPyA6IGFueSxcclxuICBzZW50ZW5jZXMgOiBJU2VudGVuY2VbXVxyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgSUNhdGVnb3J5RmlsdGVyID0geyBba2V5OiBzdHJpbmddOiBib29sZWFuIH07XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgSURvbWFpbkNhdGVnb3J5RmlsdGVyID0ge1xyXG4gIGRvbWFpbnMgOiBzdHJpbmdbXSxcclxuICBjYXRlZ29yeVNldCA6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9XHJcbn1cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElQcm9jZXNzZWRFeHRyYWN0ZWRDYXRlZ29yaWVzIGV4dGVuZHMgSVByb2Nlc3NlZCB7XHJcbiAgY2F0ZWdvcmllcyA6IHN0cmluZ1tdLFxyXG59O1xyXG5cclxuXHJcblxyXG5leHBvcnQgdHlwZSBjb250ZXh0ID0geyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcclxuXHJcbi8qKlxyXG4gKiBEZWZpbmVzIHRoZSBpbnRlcmZhY2UgZm9yIGFuIGFuYWx5c2lzXHJcbiAqIHJlcG9uc2VcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVJlc3BvbnNlIHtcclxuICByYXRpbmc6IG51bWJlcixcclxuICB0eXBlOiBFbnVtUmVzcG9uc2VDb2RlLFxyXG4gIHF1ZXJ5OiBzdHJpbmcsXHJcbiAgY29udGV4dDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSxcclxuICB0ZXh0OiBzdHJpbmcsXHJcbiAgYWN0aW9uOiBJQWN0aW9uLFxyXG4gIHByb21wdHM6IHtcclxuICAgIFtrZXk6IHN0cmluZ106IHtcclxuICAgICAgdGV4dDogc3RyaW5nLFxyXG4gICAgICAvKipcclxuICAgICAgICogRm9sbG93cyB0aGUgZmVhdHVyZXMgb2YgTlBNIHByb21wdHNcclxuICAgICAgICovXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBJUHJvbXB0RGVzY3JpcHRpb25cclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZW51bSBFbnVtQWN0aW9uVHlwZSB7XHJcbiAgU1RBUlRVUkwsXHJcbiAgU1RBUlRDTURMSU5FXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUFjdGlvbiB7XHJcbiAgZGF0YTogYW55LFxyXG4gIHR5cGU6IEVudW1BY3Rpb25UeXBlLFxyXG4gIHBhdHRlcm46IHN0cmluZyxcclxuICBjb25jcmV0ZTogc3RyaW5nXHJcbn1cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElDYXRlZ29yeURlc2Mge1xyXG4gIG5hbWU6IHN0cmluZyxcclxuICBpbXBvcnRhbmNlPyA6IG51bWJlcixcclxuICBkZXNjcmlwdGlvbj8gOiBzdHJpbmcsXHJcbiAgaXNrZXk/IDogYm9vbGVhblxyXG4gIGV4YWN0TWF0Y2g6IGJvb2xlYW4sXHJcbiAgc3lub255bXM/IDogc3RyaW5nW107XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJTW9kZWwge1xyXG4gICAgZG9tYWluOiBzdHJpbmcsXHJcbiAgICBiaXRpbmRleCA6IG51bWJlcixcclxuICAgIGRlc2NyaXB0aW9uPyA6IHN0cmluZyxcclxuICAgIHRvb2w6IElUb29sLFxyXG4gICAgdG9vbGhpZGRlbj86IGJvb2xlYW4sXHJcbiAgICBzeW5vbnltcz86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nW10gfSxcclxuICAgIGNhdGVnb3J5RGVzY3JpYmVkIDogIHsgbmFtZSA6IHN0cmluZyxcclxuICAgICAgICBkZXNjcmlwdGlvbj8gOiBzdHJpbmcsXHJcbiAgICAgICAga2V5PyA6IHN0cmluZyB9W10sXHJcbiAgICBjYXRlZ29yeTogc3RyaW5nW10sXHJcbiAgICBjb2x1bW5zPyA6IHN0cmluZ1tdLFxyXG4gICAgd29yZGluZGV4OiBzdHJpbmdbXSxcclxuICAgIGV4YWN0bWF0Y2g/IDogc3RyaW5nW10sXHJcbiAgICBoaWRkZW46IHN0cmluZ1tdXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElNb2RlbHMge1xyXG4gICAgZnVsbCA6IHtcclxuICAgICAgZG9tYWluIDogeyBba2V5IDogc3RyaW5nXSA6IHtcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXHJcbiAgICAgICAgICBiaXRpbmRleCA6IG51bWJlcixcclxuICAgICAgICAgIGNhdGVnb3JpZXMgOiB7IFtrZXkgOiBzdHJpbmddIDogSUNhdGVnb3J5RGVzYyB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmF3TW9kZWxzIDogeyBba2V5IDogc3RyaW5nXSA6IElNb2RlbH07XHJcbiAgICBkb21haW5zOiBzdHJpbmdbXSxcclxuICAgIHRvb2xzOiBJVG9vbFtdLFxyXG4gICAgY2F0ZWdvcnk6IHN0cmluZ1tdLFxyXG4gICAgb3BlcmF0b3JzIDogeyBba2V5OiBzdHJpbmddIDogSU9wZXJhdG9yIH0sXHJcbiAgICBtUnVsZXM6IG1SdWxlW10sXHJcbiAgICBydWxlcyA6IFNwbGl0UnVsZXMsXHJcbiAgICByZWNvcmRzOiBhbnlbXVxyXG4gICAgc2VlblJ1bGVzPzogeyBba2V5OiBzdHJpbmddOiBtUnVsZVtdIH0sXHJcbiAgICBtZXRhIDoge1xyXG4gICAgICAgIC8vIGVudGl0eSAtPiByZWxhdGlvbiAtPiB0YXJnZXRcclxuICAgICAgICB0MyA6IHsgW2tleTogc3RyaW5nXSA6IHsgW2tleSA6IHN0cmluZ10gOiBhbnkgfX1cclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
