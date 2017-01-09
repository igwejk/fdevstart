/**
 * Functionality managing the match models
 *
 * @file
 */
"use strict";

var debug = require('debug');
var debuglog = debug('meta');
var logger = require('../utils/logger');
var loadlog = logger.logger('modelload', '');
/**
 * the model path, may be controlled via environment variable
 */
var modelPath = process.env["ABOT_MODELPATH"] || "testmodel";
var separator = " -:- ";
var validTypes = ["relation", "category", "domain"];
var AMeta = function () {
    function AMeta(type, name) {
        if (validTypes.indexOf(type) < 0) {
            throw new Error("Illegal Type " + type);
        }
        this.name = name;
        this.type = type;
    }
    AMeta.prototype.toName = function () {
        return this.name;
    };
    AMeta.prototype.toFullString = function () {
        return this.type + separator + this.name;
    };
    AMeta.prototype.toType = function () {
        return this.type;
    };
    return AMeta;
}();
exports.AMeta = AMeta;
function getStringArray(arr) {
    return arr.map(function (oMeta) {
        return oMeta.toName();
    });
}
exports.getStringArray = getStringArray;
exports.RELATION_hasCategory = "hasCategory";
exports.RELATION_isCategoryOf = "isCategoryOf";
function parseAMeta(a) {
    var r = a.split(separator);
    if (!r || r.length !== 2) {
        throw new Error("cannot parse " + a + " as Meta");
    }
    switch (r[0]) {
        case "category":
            return getMetaFactory().Category(r[1]);
        case "relation":
            return getMetaFactory().Relation(r[1]);
        case "domain":
            return getMetaFactory().Domain(r[1]);
        default:
            throw new Error("unknown meta type" + r[0]);
    }
}
function getMetaFactory() {
    return {
        Domain: function Domain(a) {
            return new AMeta("domain", a);
        },
        Category: function Category(a) {
            return new AMeta("category", a);
        },
        Relation: function Relation(a) {
            return new AMeta("relation", a);
        },
        parseIMeta: parseAMeta
    };
}
exports.getMetaFactory = getMetaFactory;
/*
export function getCategoriesForDomain(theModel : IModels, domain : string) : string[] {
    if(theModel.domains.indexOf(domain) < 0) {
        throw new Error("Domain " + domain + " not part of model");
    }
    theModel.meta.get(Meta.Domain(domain), Meta.Relation("hasCategory"));
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbC9tZXRhLnRzIiwibW9kZWwvbWV0YS5qcyJdLCJuYW1lcyI6WyJkZWJ1ZyIsInJlcXVpcmUiLCJkZWJ1Z2xvZyIsImxvZ2dlciIsImxvYWRsb2ciLCJtb2RlbFBhdGgiLCJwcm9jZXNzIiwiZW52Iiwic2VwYXJhdG9yIiwidmFsaWRUeXBlcyIsIkFNZXRhIiwidHlwZSIsIm5hbWUiLCJpbmRleE9mIiwiRXJyb3IiLCJwcm90b3R5cGUiLCJ0b05hbWUiLCJ0b0Z1bGxTdHJpbmciLCJ0b1R5cGUiLCJleHBvcnRzIiwiZ2V0U3RyaW5nQXJyYXkiLCJhcnIiLCJtYXAiLCJvTWV0YSIsIlJFTEFUSU9OX2hhc0NhdGVnb3J5IiwiUkVMQVRJT05faXNDYXRlZ29yeU9mIiwicGFyc2VBTWV0YSIsImEiLCJyIiwic3BsaXQiLCJsZW5ndGgiLCJnZXRNZXRhRmFjdG9yeSIsIkNhdGVnb3J5IiwiUmVsYXRpb24iLCJEb21haW4iLCJwYXJzZUlNZXRhIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNLQTs7QURHQSxJQUFZQSxRQUFLQyxRQUFNLE9BQU4sQ0FBakI7QUFFQSxJQUFJQyxXQUFXRixNQUFNLE1BQU4sQ0FBZjtBQUdBLElBQVlHLFNBQU1GLFFBQU0saUJBQU4sQ0FBbEI7QUFDQSxJQUFNRyxVQUFVRCxPQUFPQSxNQUFQLENBQWMsV0FBZCxFQUEyQixFQUEzQixDQUFoQjtBQU1BOzs7QUFHQSxJQUFJRSxZQUFZQyxRQUFRQyxHQUFSLENBQVksZ0JBQVosS0FBaUMsV0FBakQ7QUFTQSxJQUFNQyxZQUFZLE9BQWxCO0FBQ0EsSUFBTUMsYUFBYSxDQUFDLFVBQUQsRUFBYSxVQUFiLEVBQXlCLFFBQXpCLENBQW5CO0FBRUEsSUFBQUMsUUFBQSxZQUFBO0FBR0ksYUFBQUEsS0FBQSxDQUFZQyxJQUFaLEVBQTJCQyxJQUEzQixFQUF3QztBQUNwQyxZQUFHSCxXQUFXSSxPQUFYLENBQW1CRixJQUFuQixJQUEyQixDQUE5QixFQUFpQztBQUM3QixrQkFBTSxJQUFJRyxLQUFKLENBQVUsa0JBQWtCSCxJQUE1QixDQUFOO0FBQ0g7QUFDRCxhQUFLQyxJQUFMLEdBQVlBLElBQVo7QUFDQSxhQUFLRCxJQUFMLEdBQVlBLElBQVo7QUFDSDtBQUNERCxVQUFBSyxTQUFBLENBQUFDLE1BQUEsR0FBQSxZQUFBO0FBQ0ksZUFBTyxLQUFLSixJQUFaO0FBQ0gsS0FGRDtBQUdBRixVQUFBSyxTQUFBLENBQUFFLFlBQUEsR0FBQSxZQUFBO0FBQ0ksZUFBTyxLQUFLTixJQUFMLEdBQVlILFNBQVosR0FBd0IsS0FBS0ksSUFBcEM7QUFDSCxLQUZEO0FBR0FGLFVBQUFLLFNBQUEsQ0FBQUcsTUFBQSxHQUFBLFlBQUE7QUFDSSxlQUFPLEtBQUtQLElBQVo7QUFDSCxLQUZEO0FBR0osV0FBQUQsS0FBQTtBQW5CQSxDQUFBLEVBQUE7QUFBYVMsUUFBQVQsS0FBQSxHQUFLQSxLQUFMO0FBOEJiLFNBQUFVLGNBQUEsQ0FBK0JDLEdBQS9CLEVBQTRDO0FBQ3hDLFdBQU9BLElBQUlDLEdBQUosQ0FBUSxVQUFTQyxLQUFULEVBQXNCO0FBQ2pDLGVBQU9BLE1BQU1QLE1BQU4sRUFBUDtBQUNILEtBRk0sQ0FBUDtBQUdIO0FBSmVHLFFBQUFDLGNBQUEsR0FBY0EsY0FBZDtBQU1IRCxRQUFBSyxvQkFBQSxHQUF1QixhQUF2QjtBQUNBTCxRQUFBTSxxQkFBQSxHQUF3QixjQUF4QjtBQUViLFNBQUFDLFVBQUEsQ0FBb0JDLENBQXBCLEVBQThCO0FBQ2xCLFFBQUlDLElBQUlELEVBQUVFLEtBQUYsQ0FBUXJCLFNBQVIsQ0FBUjtBQUNBLFFBQUcsQ0FBQ29CLENBQUQsSUFBTUEsRUFBRUUsTUFBRixLQUFhLENBQXRCLEVBQXlCO0FBQ3JCLGNBQU0sSUFBSWhCLEtBQUosQ0FBVSxrQkFBa0JhLENBQWxCLEdBQXNCLFVBQWhDLENBQU47QUFDSDtBQUNELFlBQU9DLEVBQUUsQ0FBRixDQUFQO0FBQ0ksYUFBSyxVQUFMO0FBQ0ksbUJBQU9HLGlCQUFpQkMsUUFBakIsQ0FBMEJKLEVBQUUsQ0FBRixDQUExQixDQUFQO0FBQ0osYUFBSyxVQUFMO0FBQ0ksbUJBQU9HLGlCQUFpQkUsUUFBakIsQ0FBMEJMLEVBQUUsQ0FBRixDQUExQixDQUFQO0FBQ0osYUFBSyxRQUFMO0FBQ0ksbUJBQU9HLGlCQUFpQkcsTUFBakIsQ0FBd0JOLEVBQUUsQ0FBRixDQUF4QixDQUFQO0FBQ0o7QUFDSSxrQkFBTSxJQUFJZCxLQUFKLENBQVUsc0JBQXNCYyxFQUFFLENBQUYsQ0FBaEMsQ0FBTjtBQVJSO0FBVVg7QUFFRCxTQUFBRyxjQUFBLEdBQUE7QUFDRSxXQUFPO0FBQ0RHLGdCQUFTLGdCQUFTUCxDQUFULEVBQW1CO0FBQ3hCLG1CQUFPLElBQUlqQixLQUFKLENBQVUsUUFBVixFQUFvQmlCLENBQXBCLENBQVA7QUFDSCxTQUhBO0FBSURLLGtCQUFXLGtCQUFTTCxDQUFULEVBQW1CO0FBQzFCLG1CQUFPLElBQUlqQixLQUFKLENBQVUsVUFBVixFQUFxQmlCLENBQXJCLENBQVA7QUFDSCxTQU5BO0FBT0RNLGtCQUFXLGtCQUFTTixDQUFULEVBQW1CO0FBQzFCLG1CQUFPLElBQUlqQixLQUFKLENBQVUsVUFBVixFQUFxQmlCLENBQXJCLENBQVA7QUFDSCxTQVRBO0FBVURRLG9CQUFhVDtBQVZaLEtBQVA7QUFZRDtBQWJlUCxRQUFBWSxjQUFBLEdBQWNBLGNBQWQ7QUFlaEIiLCJmaWxlIjoibW9kZWwvbWV0YS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBGdW5jdGlvbmFsaXR5IG1hbmFnaW5nIHRoZSBtYXRjaCBtb2RlbHNcclxuICpcclxuICogQGZpbGVcclxuICovXHJcblxyXG5pbXBvcnQgKiBhcyBpbnRmIGZyb20gJ2NvbnN0YW50cyc7XHJcblxyXG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XHJcblxyXG52YXIgZGVidWdsb2cgPSBkZWJ1ZygnbWV0YScpO1xyXG5cclxuXHJcbmltcG9ydCAqIGFzIGxvZ2dlciBmcm9tICcuLi91dGlscy9sb2dnZXInO1xyXG5jb25zdCBsb2FkbG9nID0gbG9nZ2VyLmxvZ2dlcignbW9kZWxsb2FkJywgJycpO1xyXG5pbXBvcnQgKiAgYXMgSU1hdGNoIGZyb20gJy4uL21hdGNoL2lmbWF0Y2gnO1xyXG5pbXBvcnQgKiBhcyBUb29scyBmcm9tICcuLi9tYXRjaC90b29scyc7XHJcbmltcG9ydCAqIGFzIE1vZGVsIGZyb20gJy4vbW9kZWwnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiB0aGUgbW9kZWwgcGF0aCwgbWF5IGJlIGNvbnRyb2xsZWQgdmlhIGVudmlyb25tZW50IHZhcmlhYmxlXHJcbiAqL1xyXG52YXIgbW9kZWxQYXRoID0gcHJvY2Vzcy5lbnZbXCJBQk9UX01PREVMUEFUSFwiXSB8fCBcInRlc3Rtb2RlbFwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJTWV0YSB7XHJcbiAgICB0b05hbWUoKSAgOiBzdHJpbmcsXHJcbiAgICB0b1R5cGUoKSAgOiBzdHJpbmcsXHJcbiAgICB0b0Z1bGxTdHJpbmcoKSA6IHN0cmluZ1xyXG59XHJcblxyXG5cclxuY29uc3Qgc2VwYXJhdG9yID0gXCIgLTotIFwiO1xyXG5jb25zdCB2YWxpZFR5cGVzID0gW1wicmVsYXRpb25cIiwgXCJjYXRlZ29yeVwiLCBcImRvbWFpblwiXTtcclxuXHJcbmV4cG9ydCBjbGFzcyBBTWV0YSBpbXBsZW1lbnRzIElNZXRhIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHR5cGUgOiBzdHJpbmc7XHJcbiAgICBjb25zdHJ1Y3Rvcih0eXBlIDogc3RyaW5nLCBuYW1lIDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYodmFsaWRUeXBlcy5pbmRleE9mKHR5cGUpIDwgMCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIFR5cGUgXCIgKyB0eXBlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xyXG4gICAgfVxyXG4gICAgdG9OYW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5hbWU7XHJcbiAgICB9XHJcbiAgICB0b0Z1bGxTdHJpbmcoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZSArIHNlcGFyYXRvciArIHRoaXMubmFtZTtcclxuICAgIH1cclxuICAgIHRvVHlwZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuaW50ZXJmYWNlIE1ldGEge1xyXG4gICAgcGFyc2VJTWV0YSA6IChzdHJpbmcpID0+IElNZXRhLFxyXG4gICAgLy8gY29uc3RydWN0b3JzXHJcbiAgICBEb21haW4gOiAoc3RyaW5nKSA9PiBJTWV0YSxcclxuICAgIENhdGVnb3J5IDogKHN0cmluZykgPT4gSU1ldGEsXHJcbiAgICBSZWxhdGlvbiA6IChzdHJpbmcpID0+IElNZXRhXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHJpbmdBcnJheShhcnIgOiBJTWV0YVtdKSB7XHJcbiAgICByZXR1cm4gYXJyLm1hcChmdW5jdGlvbihvTWV0YSA6IElNZXRhKSB7XHJcbiAgICAgICAgcmV0dXJuIG9NZXRhLnRvTmFtZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBSRUxBVElPTl9oYXNDYXRlZ29yeSA9IFwiaGFzQ2F0ZWdvcnlcIjtcclxuZXhwb3J0IGNvbnN0IFJFTEFUSU9OX2lzQ2F0ZWdvcnlPZiA9IFwiaXNDYXRlZ29yeU9mXCI7XHJcblxyXG5mdW5jdGlvbiBwYXJzZUFNZXRhKGEgOiBzdHJpbmcpIDogSU1ldGEge1xyXG4gICAgICAgICAgICB2YXIgciA9IGEuc3BsaXQoc2VwYXJhdG9yKTtcclxuICAgICAgICAgICAgaWYoIXIgfHwgci5sZW5ndGggIT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbm5vdCBwYXJzZSBcIiArIGEgKyBcIiBhcyBNZXRhXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN3aXRjaChyWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY2F0ZWdvcnlcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0TWV0YUZhY3RvcnkoKS5DYXRlZ29yeShyWzFdKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJyZWxhdGlvblwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRNZXRhRmFjdG9yeSgpLlJlbGF0aW9uKHJbMV0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRvbWFpblwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRNZXRhRmFjdG9yeSgpLkRvbWFpbihyWzFdKTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBtZXRhIHR5cGVcIiArIHJbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXRhRmFjdG9yeSgpIDogTWV0YSB7XHJcbiAgcmV0dXJuIHtcclxuICAgICAgICBEb21haW4gOiBmdW5jdGlvbihhIDogc3RyaW5nKSA6IElNZXRhIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBBTWV0YShcImRvbWFpblwiLCBhKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIENhdGVnb3J5IDogZnVuY3Rpb24oYSA6IHN0cmluZykgOiBJTWV0YSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQU1ldGEoXCJjYXRlZ29yeVwiLGEpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVsYXRpb24gOiBmdW5jdGlvbihhIDogc3RyaW5nKSA6IElNZXRhIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBBTWV0YShcInJlbGF0aW9uXCIsYSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwYXJzZUlNZXRhIDogcGFyc2VBTWV0YVxyXG4gICB9O1xyXG59XHJcblxyXG4vKlxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCA6IElNb2RlbHMsIGRvbWFpbiA6IHN0cmluZykgOiBzdHJpbmdbXSB7XHJcbiAgICBpZih0aGVNb2RlbC5kb21haW5zLmluZGV4T2YoZG9tYWluKSA8IDApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEb21haW4gXCIgKyBkb21haW4gKyBcIiBub3QgcGFydCBvZiBtb2RlbFwiKTtcclxuICAgIH1cclxuICAgIHRoZU1vZGVsLm1ldGEuZ2V0KE1ldGEuRG9tYWluKGRvbWFpbiksIE1ldGEuUmVsYXRpb24oXCJoYXNDYXRlZ29yeVwiKSk7XHJcbn1cclxuKi8iLCIvKipcbiAqIEZ1bmN0aW9uYWxpdHkgbWFuYWdpbmcgdGhlIG1hdGNoIG1vZGVsc1xuICpcbiAqIEBmaWxlXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKTtcbnZhciBkZWJ1Z2xvZyA9IGRlYnVnKCdtZXRhJyk7XG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi4vdXRpbHMvbG9nZ2VyJyk7XG52YXIgbG9hZGxvZyA9IGxvZ2dlci5sb2dnZXIoJ21vZGVsbG9hZCcsICcnKTtcbi8qKlxuICogdGhlIG1vZGVsIHBhdGgsIG1heSBiZSBjb250cm9sbGVkIHZpYSBlbnZpcm9ubWVudCB2YXJpYWJsZVxuICovXG52YXIgbW9kZWxQYXRoID0gcHJvY2Vzcy5lbnZbXCJBQk9UX01PREVMUEFUSFwiXSB8fCBcInRlc3Rtb2RlbFwiO1xudmFyIHNlcGFyYXRvciA9IFwiIC06LSBcIjtcbnZhciB2YWxpZFR5cGVzID0gW1wicmVsYXRpb25cIiwgXCJjYXRlZ29yeVwiLCBcImRvbWFpblwiXTtcbnZhciBBTWV0YSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQU1ldGEodHlwZSwgbmFtZSkge1xuICAgICAgICBpZiAodmFsaWRUeXBlcy5pbmRleE9mKHR5cGUpIDwgMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSWxsZWdhbCBUeXBlIFwiICsgdHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB9XG4gICAgQU1ldGEucHJvdG90eXBlLnRvTmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgICB9O1xuICAgIEFNZXRhLnByb3RvdHlwZS50b0Z1bGxTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUgKyBzZXBhcmF0b3IgKyB0aGlzLm5hbWU7XG4gICAgfTtcbiAgICBBTWV0YS5wcm90b3R5cGUudG9UeXBlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlO1xuICAgIH07XG4gICAgcmV0dXJuIEFNZXRhO1xufSgpKTtcbmV4cG9ydHMuQU1ldGEgPSBBTWV0YTtcbmZ1bmN0aW9uIGdldFN0cmluZ0FycmF5KGFycikge1xuICAgIHJldHVybiBhcnIubWFwKGZ1bmN0aW9uIChvTWV0YSkge1xuICAgICAgICByZXR1cm4gb01ldGEudG9OYW1lKCk7XG4gICAgfSk7XG59XG5leHBvcnRzLmdldFN0cmluZ0FycmF5ID0gZ2V0U3RyaW5nQXJyYXk7XG5leHBvcnRzLlJFTEFUSU9OX2hhc0NhdGVnb3J5ID0gXCJoYXNDYXRlZ29yeVwiO1xuZXhwb3J0cy5SRUxBVElPTl9pc0NhdGVnb3J5T2YgPSBcImlzQ2F0ZWdvcnlPZlwiO1xuZnVuY3Rpb24gcGFyc2VBTWV0YShhKSB7XG4gICAgdmFyIHIgPSBhLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgaWYgKCFyIHx8IHIubGVuZ3RoICE9PSAyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbm5vdCBwYXJzZSBcIiArIGEgKyBcIiBhcyBNZXRhXCIpO1xuICAgIH1cbiAgICBzd2l0Y2ggKHJbMF0pIHtcbiAgICAgICAgY2FzZSBcImNhdGVnb3J5XCI6XG4gICAgICAgICAgICByZXR1cm4gZ2V0TWV0YUZhY3RvcnkoKS5DYXRlZ29yeShyWzFdKTtcbiAgICAgICAgY2FzZSBcInJlbGF0aW9uXCI6XG4gICAgICAgICAgICByZXR1cm4gZ2V0TWV0YUZhY3RvcnkoKS5SZWxhdGlvbihyWzFdKTtcbiAgICAgICAgY2FzZSBcImRvbWFpblwiOlxuICAgICAgICAgICAgcmV0dXJuIGdldE1ldGFGYWN0b3J5KCkuRG9tYWluKHJbMV0pO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBtZXRhIHR5cGVcIiArIHJbMF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldE1ldGFGYWN0b3J5KCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIERvbWFpbjogZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQU1ldGEoXCJkb21haW5cIiwgYSk7XG4gICAgICAgIH0sXG4gICAgICAgIENhdGVnb3J5OiBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBTWV0YShcImNhdGVnb3J5XCIsIGEpO1xuICAgICAgICB9LFxuICAgICAgICBSZWxhdGlvbjogZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQU1ldGEoXCJyZWxhdGlvblwiLCBhKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2VJTWV0YTogcGFyc2VBTWV0YVxuICAgIH07XG59XG5leHBvcnRzLmdldE1ldGFGYWN0b3J5ID0gZ2V0TWV0YUZhY3Rvcnk7XG4vKlxuZXhwb3J0IGZ1bmN0aW9uIGdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwgOiBJTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogc3RyaW5nW10ge1xuICAgIGlmKHRoZU1vZGVsLmRvbWFpbnMuaW5kZXhPZihkb21haW4pIDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEb21haW4gXCIgKyBkb21haW4gKyBcIiBub3QgcGFydCBvZiBtb2RlbFwiKTtcbiAgICB9XG4gICAgdGhlTW9kZWwubWV0YS5nZXQoTWV0YS5Eb21haW4oZG9tYWluKSwgTWV0YS5SZWxhdGlvbihcImhhc0NhdGVnb3J5XCIpKTtcbn1cbiovIFxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9