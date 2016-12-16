"use strict";

exports.EXEC_URL = 'all';
exports.EXEC_SHORTCUT = 'shortcut';
/**
 * Responses of a dispatcher
 */
(function (ResponseCode) {
    ResponseCode[ResponseCode["NOMATCH"] = 0] = "NOMATCH";
    ResponseCode[ResponseCode["EXEC"] = 1] = "EXEC";
    ResponseCode[ResponseCode["QUERY"] = 2] = "QUERY";
})(exports.ResponseCode || (exports.ResponseCode = {}));
var ResponseCode = exports.ResponseCode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnN0YW50cy5qcyIsIi4uL3NyYy9jb25zdGFudHMudHMiXSwibmFtZXMiOlsiZXhwb3J0cyIsIkVYRUNfVVJMIiwiRVhFQ19TSE9SVENVVCIsIlJlc3BvbnNlQ29kZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQ2FBLFFBQUFDLFFBQUEsR0FBVyxLQUFYO0FBQ0FELFFBQUFFLGFBQUEsR0FBZ0IsVUFBaEI7QUFFYjs7O0FBR0EsQ0FBQSxVQUFrQkMsWUFBbEIsRUFBOEI7QUFDNUJBLGlCQUFBQSxhQUFBLFNBQUEsSUFBQSxDQUFBLElBQUEsU0FBQTtBQUNBQSxpQkFBQUEsYUFBQSxNQUFBLElBQUEsQ0FBQSxJQUFBLE1BQUE7QUFDQUEsaUJBQUFBLGFBQUEsT0FBQSxJQUFBLENBQUEsSUFBQSxPQUFBO0FBQ0QsQ0FKRCxFQUFrQkgsUUFBQUcsWUFBQSxLQUFBSCxRQUFBRyxZQUFBLEdBQVksRUFBWixDQUFsQjtBQUFBLElBQWtCQSxlQUFBSCxRQUFBRyxZQUFsQiIsImZpbGUiOiJjb25zdGFudHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbmV4cG9ydHMuRVhFQ19VUkwgPSAnYWxsJztcbmV4cG9ydHMuRVhFQ19TSE9SVENVVCA9ICdzaG9ydGN1dCc7XG4vKipcbiAqIFJlc3BvbnNlcyBvZiBhIGRpc3BhdGNoZXJcbiAqL1xuKGZ1bmN0aW9uIChSZXNwb25zZUNvZGUpIHtcbiAgICBSZXNwb25zZUNvZGVbUmVzcG9uc2VDb2RlW1wiTk9NQVRDSFwiXSA9IDBdID0gXCJOT01BVENIXCI7XG4gICAgUmVzcG9uc2VDb2RlW1Jlc3BvbnNlQ29kZVtcIkVYRUNcIl0gPSAxXSA9IFwiRVhFQ1wiO1xuICAgIFJlc3BvbnNlQ29kZVtSZXNwb25zZUNvZGVbXCJRVUVSWVwiXSA9IDJdID0gXCJRVUVSWVwiO1xufSkoZXhwb3J0cy5SZXNwb25zZUNvZGUgfHwgKGV4cG9ydHMuUmVzcG9uc2VDb2RlID0ge30pKTtcbnZhciBSZXNwb25zZUNvZGUgPSBleHBvcnRzLlJlc3BvbnNlQ29kZTtcbiIsIlxuICBleHBvcnQgdmFyIEVYRUNfVVJMID0gJ2FsbCc7XG4gIGV4cG9ydCB2YXIgRVhFQ19TSE9SVENVVCA9ICdzaG9ydGN1dCc7XG5cbi8qKlxuICogUmVzcG9uc2VzIG9mIGEgZGlzcGF0Y2hlclxuICovXG5leHBvcnQgY29uc3QgZW51bSBSZXNwb25zZUNvZGUge1xuICBOT01BVENIID0gMCxcbiAgRVhFQyxcbiAgUVVFUllcbn1cblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
