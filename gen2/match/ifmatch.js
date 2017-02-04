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
exports.aOperatorNames = ["starting with", "ending with", "containing", "excluding", "having", "being"];
;
var EnumRuleType;
(function (EnumRuleType) {
    EnumRuleType[EnumRuleType["WORD"] = 0] = "WORD";
    EnumRuleType[EnumRuleType["REGEXP"] = 1] = "REGEXP";
})(EnumRuleType = exports.EnumRuleType || (exports.EnumRuleType = {}));
;
;
var EnumActionType;
(function (EnumActionType) {
    EnumActionType[EnumActionType["STARTURL"] = 0] = "STARTURL";
    EnumActionType[EnumActionType["STARTCMDLINE"] = 1] = "STARTCMDLINE";
})(EnumActionType = exports.EnumActionType || (exports.EnumActionType = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoL2lmbWF0Y2guanMiLCIuLi9zcmMvbWF0Y2gvaWZtYXRjaC50cyJdLCJuYW1lcyI6WyJFbnVtUmVzcG9uc2VDb2RlIiwiZXhwb3J0cyIsIkNBVF9DQVRFR09SWSIsIkNBVF9GSUxMRVIiLCJDQVRfVE9PTCIsImFPcGVyYXRvck5hbWVzIiwiRW51bVJ1bGVUeXBlIiwiRW51bUFjdGlvblR5cGUiXSwibWFwcGluZ3MiOiJBQUFBOztBQ0VBLElBQWtCQSxnQkFBbEI7QUFBQSxDQUFBLFVBQWtCQSxnQkFBbEIsRUFBa0M7QUFDaENBLHFCQUFBQSxpQkFBQSxTQUFBLElBQUEsQ0FBQSxJQUFBLFNBQUE7QUFDQUEscUJBQUFBLGlCQUFBLE1BQUEsSUFBQSxDQUFBLElBQUEsTUFBQTtBQUNBQSxxQkFBQUEsaUJBQUEsT0FBQSxJQUFBLENBQUEsSUFBQSxPQUFBO0FBQ0QsQ0FKRCxFQUFrQkEsbUJBQUFDLFFBQUFELGdCQUFBLEtBQUFDLFFBQUFELGdCQUFBLEdBQWdCLEVBQWhCLENBQWxCO0FBT2FDLFFBQUFDLFlBQUEsR0FBZSxVQUFmO0FBQ0FELFFBQUFFLFVBQUEsR0FBYSxRQUFiO0FBQ0FGLFFBQUFHLFFBQUEsR0FBVyxNQUFYO0FBWUFILFFBQUFJLGNBQUEsR0FBaUIsQ0FBQyxlQUFELEVBQWtCLGFBQWxCLEVBQWlDLFlBQWpDLEVBQStDLFdBQS9DLEVBQTRELFFBQTVELEVBQXNFLE9BQXRFLENBQWpCO0FBa0NaO0FBT0QsSUFBbUJDLFlBQW5CO0FBQUEsQ0FBQSxVQUFtQkEsWUFBbkIsRUFBK0I7QUFDN0JBLGlCQUFBQSxhQUFBLE1BQUEsSUFBQSxDQUFBLElBQUEsTUFBQTtBQUNBQSxpQkFBQUEsYUFBQSxRQUFBLElBQUEsQ0FBQSxJQUFBLFFBQUE7QUFDRCxDQUhELEVBQW1CQSxlQUFBTCxRQUFBSyxZQUFBLEtBQUFMLFFBQUFLLFlBQUEsR0FBWSxFQUFaLENBQW5CO0FBUUs7QUFvR0o7QUFvQ0QsSUFBa0JDLGNBQWxCO0FBQUEsQ0FBQSxVQUFrQkEsY0FBbEIsRUFBZ0M7QUFDOUJBLG1CQUFBQSxlQUFBLFVBQUEsSUFBQSxDQUFBLElBQUEsVUFBQTtBQUNBQSxtQkFBQUEsZUFBQSxjQUFBLElBQUEsQ0FBQSxJQUFBLGNBQUE7QUFDRCxDQUhELEVBQWtCQSxpQkFBQU4sUUFBQU0sY0FBQSxLQUFBTixRQUFBTSxjQUFBLEdBQWMsRUFBZCxDQUFsQiIsImZpbGUiOiJtYXRjaC9pZm1hdGNoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgRW51bVJlc3BvbnNlQ29kZTtcbihmdW5jdGlvbiAoRW51bVJlc3BvbnNlQ29kZSkge1xuICAgIEVudW1SZXNwb25zZUNvZGVbRW51bVJlc3BvbnNlQ29kZVtcIk5PTUFUQ0hcIl0gPSAwXSA9IFwiTk9NQVRDSFwiO1xuICAgIEVudW1SZXNwb25zZUNvZGVbRW51bVJlc3BvbnNlQ29kZVtcIkVYRUNcIl0gPSAxXSA9IFwiRVhFQ1wiO1xuICAgIEVudW1SZXNwb25zZUNvZGVbRW51bVJlc3BvbnNlQ29kZVtcIlFVRVJZXCJdID0gMl0gPSBcIlFVRVJZXCI7XG59KShFbnVtUmVzcG9uc2VDb2RlID0gZXhwb3J0cy5FbnVtUmVzcG9uc2VDb2RlIHx8IChleHBvcnRzLkVudW1SZXNwb25zZUNvZGUgPSB7fSkpO1xuZXhwb3J0cy5DQVRfQ0FURUdPUlkgPSBcImNhdGVnb3J5XCI7XG5leHBvcnRzLkNBVF9GSUxMRVIgPSBcImZpbGxlclwiO1xuZXhwb3J0cy5DQVRfVE9PTCA9IFwidG9vbFwiO1xuZXhwb3J0cy5hT3BlcmF0b3JOYW1lcyA9IFtcInN0YXJ0aW5nIHdpdGhcIiwgXCJlbmRpbmcgd2l0aFwiLCBcImNvbnRhaW5pbmdcIiwgXCJleGNsdWRpbmdcIiwgXCJoYXZpbmdcIiwgXCJiZWluZ1wiXTtcbjtcbnZhciBFbnVtUnVsZVR5cGU7XG4oZnVuY3Rpb24gKEVudW1SdWxlVHlwZSkge1xuICAgIEVudW1SdWxlVHlwZVtFbnVtUnVsZVR5cGVbXCJXT1JEXCJdID0gMF0gPSBcIldPUkRcIjtcbiAgICBFbnVtUnVsZVR5cGVbRW51bVJ1bGVUeXBlW1wiUkVHRVhQXCJdID0gMV0gPSBcIlJFR0VYUFwiO1xufSkoRW51bVJ1bGVUeXBlID0gZXhwb3J0cy5FbnVtUnVsZVR5cGUgfHwgKGV4cG9ydHMuRW51bVJ1bGVUeXBlID0ge30pKTtcbjtcbjtcbnZhciBFbnVtQWN0aW9uVHlwZTtcbihmdW5jdGlvbiAoRW51bUFjdGlvblR5cGUpIHtcbiAgICBFbnVtQWN0aW9uVHlwZVtFbnVtQWN0aW9uVHlwZVtcIlNUQVJUVVJMXCJdID0gMF0gPSBcIlNUQVJUVVJMXCI7XG4gICAgRW51bUFjdGlvblR5cGVbRW51bUFjdGlvblR5cGVbXCJTVEFSVENNRExJTkVcIl0gPSAxXSA9IFwiU1RBUlRDTURMSU5FXCI7XG59KShFbnVtQWN0aW9uVHlwZSA9IGV4cG9ydHMuRW51bUFjdGlvblR5cGUgfHwgKGV4cG9ydHMuRW51bUFjdGlvblR5cGUgPSB7fSkpO1xuIiwiXHJcblxyXG5leHBvcnQgY29uc3QgZW51bSBFbnVtUmVzcG9uc2VDb2RlIHtcclxuICBOT01BVENIID0gMCxcclxuICBFWEVDLFxyXG4gIFFVRVJZXHJcbn1cclxuXHJcblxyXG5leHBvcnQgY29uc3QgQ0FUX0NBVEVHT1JZID0gXCJjYXRlZ29yeVwiO1xyXG5leHBvcnQgY29uc3QgQ0FUX0ZJTExFUiA9IFwiZmlsbGVyXCI7XHJcbmV4cG9ydCBjb25zdCBDQVRfVE9PTCA9IFwidG9vbFwiO1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVByb21wdERlc2NyaXB0aW9uIHtcclxuICBkZXNjcmlwdGlvbjogc3RyaW5nLFxyXG4gIHR5cGU6IHN0cmluZyxcclxuICBwYXR0ZXJuOiBSZWdFeHAsXHJcbiAgbWVzc2FnZTogc3RyaW5nLFxyXG4gIGRlZmF1bHQ6IHN0cmluZyxcclxuICByZXF1aXJlZDogYm9vbGVhblxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgYU9wZXJhdG9yTmFtZXMgPSBbXCJzdGFydGluZyB3aXRoXCIsIFwiZW5kaW5nIHdpdGhcIiwgXCJjb250YWluaW5nXCIsIFwiZXhjbHVkaW5nXCIsIFwiaGF2aW5nXCIsIFwiYmVpbmdcIl07XHJcbmV4cG9ydCB0eXBlIE9wZXJhdG9yTmFtZSA9IFwic3RhcnRpbmcgd2l0aFwiIHwgXCJlbmRpbmcgd2l0aFwiIHwgXCJjb250YWluaW5nXCIgfCBcImJlaW5nXCIgfCBcImV4Y2x1ZGluZ1wiIHwgXCJoYXZpbmdcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU9wZXJhdG9yIHtcclxuICBvcGVyYXRvciA6IE9wZXJhdG9yTmFtZSxcclxuICBjb2RlIDogc3RyaW5nLFxyXG4gIGFyaXR5IDogbnVtYmVyLFxyXG4gIGFyZ2NhdGVnb3J5IDogWyBzdHJpbmdbXSBdXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIElSZWNvcmQgPSB7IFtrZXkgOiBzdHJpbmddIDogc3RyaW5nXHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJV2hhdElzQW5zd2VyIHtcclxuICBzZW50ZW5jZTogSVNlbnRlbmNlLFxyXG4gIHJlY29yZCA6IElSZWNvcmQsXHJcbiAgY2F0ZWdvcnkgOiBzdHJpbmcsXHJcbiAgcmVzdWx0OiBzdHJpbmcsXHJcbiAgX3JhbmtpbmcgOiBudW1iZXJcclxufVxyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVdoYXRJc1R1cGVsQW5zd2VyIHtcclxuICBzZW50ZW5jZTogSVNlbnRlbmNlLFxyXG4gIHJlY29yZCA6IElSZWNvcmQsXHJcbiAgY2F0ZWdvcmllcyA6IHN0cmluZ1tdLFxyXG4gIHJlc3VsdDogc3RyaW5nW10sXHJcbiAgX3JhbmtpbmcgOiBudW1iZXJcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJTWF0Y2hlZFNldFJlY29yZCB7XHJcbiAgc2V0SWQgOiBzdHJpbmcsXHJcbiAgcmVjb3JkIDogSVJlY29yZFxyXG59O1xyXG5leHBvcnQgdHlwZSBJTWF0Y2hlZFNldFJlY29yZHMgPSBJTWF0Y2hlZFNldFJlY29yZFtdO1xyXG4vKipcclxuICogTWFwIGNhdGVnb3J5IC0+IHZhbHVlXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBJTWF0Y2hTZXQgPSB7IFtrZXkgOiBzdHJpbmddIDogc3RyaW5nfTtcclxuXHJcbmV4cG9ydCBjb25zdCAgZW51bSBFbnVtUnVsZVR5cGUge1xyXG4gIFdPUkQsXHJcbiAgUkVHRVhQXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVRvb2xTZXQge1xyXG4gICAgICBzZXQ6IHN0cmluZ1tdLFxyXG4gICAgICByZXNwb25zZTogc3RyaW5nXHJcbiAgICB9O1xyXG5cclxuZXhwb3J0IHR5cGUgSVRvb2xTZXRzID0ge1xyXG4gICAgW2tleTogc3RyaW5nXTogSVRvb2xTZXRcclxuICAgIH07XHJcbi8qKlxyXG4gKiBAaW50ZXJmYWNlIElUb29sXHJcbiAqXHJcbiAqIHZhciBvVG9vbCA9IHsgJ25hbWUnIDogJ0ZMUEQnLFxyXG4gKiAgICdyZXF1aXJlcycgOiB7ICdzeXN0ZW1JZCcgOiB7fSwgJ2NsaWVudCcgOnt9fSxcclxuICogICAnb3B0aW9uYWwnIDogeyAnY2F0YWxvZycgOiB7fSwgJ2dyb3VwJyA6e319XHJcbiAqIH07XHJcbiovXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVRvb2wge1xyXG4gIG5hbWU6IHN0cmluZyxcclxuICByZXF1aXJlczogeyBba2V5OiBzdHJpbmddOiBPYmplY3QgfSxcclxuICBvcHRpb25hbD86IHsgW2tleTogc3RyaW5nXTogT2JqZWN0IH0sXHJcbiAgc2V0cz86IElUb29sU2V0c1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElUb29sTWF0Y2hSZXN1bHQge1xyXG4gIHJlcXVpcmVkOiB7IFtrZXk6IHN0cmluZ106IElXb3JkIH0sXHJcbiAgbWlzc2luZzogeyBba2V5OiBzdHJpbmddOiBudW1iZXIgfSxcclxuICBvcHRpb25hbD86IHsgW2tleTogc3RyaW5nXTogSVdvcmQgfSxcclxuICBzcHVyaW91czogeyBba2V5OiBzdHJpbmddOiBudW1iZXIgfSxcclxuICB0b29sbWVudGlvbmVkOiBJV29yZFtdXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVByb21wdCB7XHJcbiAgdGV4dDogc3RyaW5nLFxyXG4gIGNhdGVnb3J5OiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJVG9vbE1hdGNoIHtcclxuICB0b29sbWF0Y2hyZXN1bHQ6IElUb29sTWF0Y2hSZXN1bHQsXHJcbiAgc2VudGVuY2U6IElTZW50ZW5jZSxcclxuICB0b29sOiBJVG9vbCxcclxuICByYW5rOiBudW1iZXJcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJV29yZCB7XHJcbiAgc3RyaW5nOiBzdHJpbmcsXHJcbiAgbWF0Y2hlZFN0cmluZzogc3RyaW5nLFxyXG4gIGNhdGVnb3J5Pzogc3RyaW5nLFxyXG4gIF9yYW5raW5nPzogbnVtYmVyLFxyXG4gIGxldmVubWF0Y2g/OiBudW1iZXIsXHJcbiAgcmVpbmZvcmNlPzogbnVtYmVyXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIElTZW50ZW5jZSA9IEFycmF5PElXb3JkPjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVJ1bGUge1xyXG4gIHR5cGU6IEVudW1SdWxlVHlwZSxcclxuICBrZXk6IHN0cmluZyxcclxuICB3b3JkPzogc3RyaW5nLFxyXG4gIHJlZ2V4cD86IFJlZ0V4cCxcclxuICBhcmdzTWFwPzogeyBba2V5OiBudW1iZXJdOiBzdHJpbmcgfSAgLy8gYSBtYXAgb2YgcmVnZXhwIG1hdGNoIGdyb3VwIC0+IGNvbnRleHQga2V5XHJcbiAgLy8gZS5nLiAvKFthLXowLTldezMsM30pQ0xOVChbXFxkezMsM31dKS9cclxuICAvLyAgICAgIHsgMSA6IFwic3lzdGVtSWRcIiwgMiA6IFwiY2xpZW50XCIgfVxyXG4gIGZvbGxvd3M6IGNvbnRleHRcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJbnRlbnRSdWxlIHtcclxuICB0eXBlOiBFbnVtUnVsZVR5cGUsXHJcbiAgcmVnZXhwOiBSZWdFeHAsXHJcbiAgYXJnc01hcDogeyBba2V5OiBzdHJpbmddOiBudW1iZXIgfSAgLy8gYSBtYXAgb2YgcmVnZXhwIG1hdGNoIGdyb3VwIC0+IGNvbnRleHQga2V5XHJcbiAgLy8gZS5nLiAvKFthLXowLTldezMsM30pQ0xOVChbXFxkezMsM31dKS9cclxuICAvLyAgICAgIHsgMSA6IFwic3lzdGVtSWRcIiwgMiA6IFwiY2xpZW50XCIgfVxyXG4gIGZvbGxvd3M/OiBjb250ZXh0XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIHJ1bGUgbWF0Y2hpbmcgYSBzaW5nbGUgc3RyaW5nXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIG1SdWxlIHtcclxuICB0eXBlOiBFbnVtUnVsZVR5cGUsXHJcbiAgd29yZD86IHN0cmluZyxcclxuICBsb3dlcmNhc2V3b3JkPyA6IHN0cmluZyxcclxuICByZWdleHA/OiBSZWdFeHAsXHJcbiAgbWF0Y2hlZFN0cmluZz86IHN0cmluZyxcclxuICBtYXRjaEluZGV4PzogbnVtYmVyLFxyXG4gIGNhdGVnb3J5OiBzdHJpbmcsXHJcbiAgYml0aW5kZXggOiBudW1iZXIsXHJcbiAgcmFuZ2U/IDogeyBsb3c6IG51bWJlciwgaGlnaDogbnVtYmVyfSxcclxuICAvKipcclxuICAgKiBvbmx5IHVzZSBhbiBleGFjdCBtYXRjaFxyXG4gICAqL1xyXG4gIGV4YWN0T25seT8gOiBib29sZWFuLFxyXG4gIF9yYW5raW5nPzogbnVtYmVyXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVdvcmRSdWxlcyB7XHJcbiAgcnVsZXMgOiBBcnJheTxtUnVsZT4sXHJcbiAgYml0aW5kZXg6IG51bWJlclxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNwbGl0UnVsZXMge1xyXG4gIGFsbFJ1bGVzOiBBcnJheTxtUnVsZT4sXHJcbiAgbm9uV29yZFJ1bGVzIDogQXJyYXk8bVJ1bGU+LFxyXG4gIHdvcmRNYXA6IHsgW2tleSA6IHN0cmluZ10gOiBJV29yZFJ1bGVzIH1cclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUNhdGVnb3JpemVkU3RyaW5nIHtcclxuICBzdHJpbmc6IHN0cmluZyxcclxuICBtYXRjaGVkU3RyaW5nOiBzdHJpbmcsXHJcbiAgY2F0ZWdvcnk6IHN0cmluZyxcclxuICBicmVha2Rvd24/OiBBcnJheTxhbnk+XHJcbiAgc2NvcmU/OiBudW1iZXIsXHJcbiAgX3Jhbmtpbmc/OiBudW1iZXIsXHJcbiAgbGV2ZW5tYXRjaD86IG51bWJlciAgLy8gYSBkaXN0YW5jZSByYW5raW5nXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIGNvbnRleHQgPSB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xyXG5cclxuLyoqXHJcbiAqIERlZmluZXMgdGhlIGludGVyZmFjZSBmb3IgYW4gYW5hbHlzaXNcclxuICogcmVwb25zZVxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBJUmVzcG9uc2Uge1xyXG4gIHJhdGluZzogbnVtYmVyLFxyXG4gIHR5cGU6IEVudW1SZXNwb25zZUNvZGUsXHJcbiAgcXVlcnk6IHN0cmluZyxcclxuICBjb250ZXh0OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9LFxyXG4gIHRleHQ6IHN0cmluZyxcclxuICBhY3Rpb246IElBY3Rpb24sXHJcbiAgcHJvbXB0czoge1xyXG4gICAgW2tleTogc3RyaW5nXToge1xyXG4gICAgICB0ZXh0OiBzdHJpbmcsXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBGb2xsb3dzIHRoZSBmZWF0dXJlcyBvZiBOUE0gcHJvbXB0c1xyXG4gICAgICAgKi9cclxuICAgICAgZGVzY3JpcHRpb246IElQcm9tcHREZXNjcmlwdGlvblxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBlbnVtIEVudW1BY3Rpb25UeXBlIHtcclxuICBTVEFSVFVSTCxcclxuICBTVEFSVENNRExJTkVcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQWN0aW9uIHtcclxuICBkYXRhOiBhbnksXHJcbiAgdHlwZTogRW51bUFjdGlvblR5cGUsXHJcbiAgcGF0dGVybjogc3RyaW5nLFxyXG4gIGNvbmNyZXRlOiBzdHJpbmdcclxufVxyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUNhdGVnb3J5RGVzYyB7XHJcbiAgbmFtZTogc3RyaW5nLFxyXG4gIGltcG9ydGFuY2U/IDogbnVtYmVyLFxyXG4gIGRlc2NyaXB0aW9uPyA6IHN0cmluZyxcclxuICBpc2tleT8gOiBib29sZWFuXHJcbiAgZXhhY3RNYXRjaDogYm9vbGVhbixcclxuICBzeW5vbnltcz8gOiBzdHJpbmdbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJTW9kZWxzIHtcclxuICAgIGZ1bGwgOiB7XHJcbiAgICAgIGRvbWFpbiA6IHsgW2tleSA6IHN0cmluZ10gOiB7XHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxyXG4gICAgICAgICAgYml0aW5kZXggOiBudW1iZXIsXHJcbiAgICAgICAgICBjYXRlZ29yaWVzIDogeyBba2V5IDogc3RyaW5nXSA6IElDYXRlZ29yeURlc2MgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGRvbWFpbnM6IHN0cmluZ1tdLFxyXG4gICAgdG9vbHM6IElUb29sW10sXHJcbiAgICBjYXRlZ29yeTogc3RyaW5nW10sXHJcbiAgICBvcGVyYXRvcnMgOiB7IFtrZXk6IHN0cmluZ10gOiBJT3BlcmF0b3IgfSxcclxuICAgIG1SdWxlczogbVJ1bGVbXSxcclxuICAgIHJ1bGVzIDogU3BsaXRSdWxlcyxcclxuICAgIHJlY29yZHM6IGFueVtdXHJcbiAgICBzZWVuUnVsZXM/OiB7IFtrZXk6IHN0cmluZ106IG1SdWxlW10gfSxcclxuICAgIG1ldGEgOiB7XHJcbiAgICAgICAgLy8gZW50aXR5IC0+IHJlbGF0aW9uIC0+IHRhcmdldFxyXG4gICAgICAgIHQzIDogeyBba2V5OiBzdHJpbmddIDogeyBba2V5IDogc3RyaW5nXSA6IGFueSB9fVxyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
