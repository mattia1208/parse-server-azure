"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logLevels = exports.default = exports.LoggerController = exports.LogOrder = exports.LogLevel = void 0;
var _node = require("parse/node");
var _AdaptableController = _interopRequireDefault(require("./AdaptableController"));
var _LoggerAdapter = require("../Adapters/Logger/LoggerAdapter");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
const LOG_STRING_TRUNCATE_LENGTH = 1000;
const truncationMarker = '... (truncated)';
const LogLevel = {
  INFO: 'info',
  ERROR: 'error'
};
exports.LogLevel = LogLevel;
const LogOrder = {
  DESCENDING: 'desc',
  ASCENDING: 'asc'
};
exports.LogOrder = LogOrder;
const logLevels = ['error', 'warn', 'info', 'debug', 'verbose', 'silly'];
exports.logLevels = logLevels;
class LoggerController extends _AdaptableController.default {
  constructor(adapter, appId, options = {
    logLevel: 'info'
  }) {
    super(adapter, appId, options);
    let level = 'info';
    if (options.verbose) {
      level = 'verbose';
    }
    if (options.logLevel) {
      level = options.logLevel;
    }
    const index = logLevels.indexOf(level); // info by default
    logLevels.forEach((level, levelIndex) => {
      if (levelIndex > index) {
        // silence the levels that are > maxIndex
        this[level] = () => {};
      }
    });
  }
  maskSensitiveUrl(path) {
    const urlString = 'http://localhost' + path; // prepend dummy string to make a real URL
    const urlObj = new URL(urlString);
    const query = urlObj.searchParams;
    let sanitizedQuery = '?';
    for (const [key, value] of query) {
      if (key !== 'password') {
        // normal value
        sanitizedQuery += key + '=' + value + '&';
      } else {
        // password value, redact it
        sanitizedQuery += key + '=' + '********' + '&';
      }
    }

    // trim last character, ? or &
    sanitizedQuery = sanitizedQuery.slice(0, -1);

    // return original path name with sanitized params attached
    return urlObj.pathname + sanitizedQuery;
  }
  maskSensitive(argArray) {
    return argArray.map(e => {
      if (!e) {
        return e;
      }
      if (typeof e === 'string') {
        return e.replace(/(password".?:.?")[^"]*"/g, '$1********"');
      }
      // else it is an object...

      // check the url
      if (e.url) {
        // for strings
        if (typeof e.url === 'string') {
          e.url = this.maskSensitiveUrl(e.url);
        } else if (Array.isArray(e.url)) {
          // for strings in array
          e.url = e.url.map(item => {
            if (typeof item === 'string') {
              return this.maskSensitiveUrl(item);
            }
            return item;
          });
        }
      }
      if (e.body) {
        for (const key of Object.keys(e.body)) {
          if (key === 'password') {
            e.body[key] = '********';
            break;
          }
        }
      }
      if (e.params) {
        for (const key of Object.keys(e.params)) {
          if (key === 'password') {
            e.params[key] = '********';
            break;
          }
        }
      }
      return e;
    });
  }
  log(level, args) {
    // make the passed in arguments object an array with the spread operator
    args = this.maskSensitive([...args]);
    args = [].concat(level, args.map(arg => {
      if (typeof arg === 'function') {
        return arg();
      }
      return arg;
    }));
    this.adapter.log.apply(this.adapter, args);
  }
  info() {
    return this.log('info', arguments);
  }
  error() {
    return this.log('error', arguments);
  }
  warn() {
    return this.log('warn', arguments);
  }
  verbose() {
    return this.log('verbose', arguments);
  }
  debug() {
    return this.log('debug', arguments);
  }
  silly() {
    return this.log('silly', arguments);
  }
  logRequest({
    method,
    url,
    headers,
    body
  }) {
    this.verbose(() => {
      const stringifiedBody = JSON.stringify(body, null, 2);
      return `REQUEST for [${method}] ${url}: ${stringifiedBody}`;
    }, {
      method,
      url,
      headers,
      body
    });
  }
  logResponse({
    method,
    url,
    result
  }) {
    this.verbose(() => {
      const stringifiedResponse = JSON.stringify(result, null, 2);
      return `RESPONSE from [${method}] ${url}: ${stringifiedResponse}`;
    }, {
      result: result
    });
  }
  // check that date input is valid
  static validDateTime(date) {
    if (!date) {
      return null;
    }
    date = new Date(date);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  }
  truncateLogMessage(string) {
    if (string && string.length > LOG_STRING_TRUNCATE_LENGTH) {
      const truncated = string.substring(0, LOG_STRING_TRUNCATE_LENGTH) + truncationMarker;
      return truncated;
    }
    return string;
  }
  static parseOptions(options = {}) {
    const from = LoggerController.validDateTime(options.from) || new Date(Date.now() - 7 * MILLISECONDS_IN_A_DAY);
    const until = LoggerController.validDateTime(options.until) || new Date();
    const size = Number(options.size) || 10;
    const order = options.order || LogOrder.DESCENDING;
    const level = options.level || LogLevel.INFO;
    return {
      from,
      until,
      size,
      order,
      level
    };
  }

  // Returns a promise for a {response} object.
  // query params:
  // level (optional) Level of logging you want to query for (info || error)
  // from (optional) Start time for the search. Defaults to 1 week ago.
  // until (optional) End time for the search. Defaults to current time.
  // order (optional) Direction of results returned, either “asc” or “desc”. Defaults to “desc”.
  // size (optional) Number of rows returned by search. Defaults to 10
  getLogs(options = {}) {
    if (!this.adapter) {
      throw new _node.Parse.Error(_node.Parse.Error.PUSH_MISCONFIGURED, 'Logger adapter is not available');
    }
    if (typeof this.adapter.query !== 'function') {
      throw new _node.Parse.Error(_node.Parse.Error.PUSH_MISCONFIGURED, 'Querying logs is not supported with this adapter');
    }
    options = LoggerController.parseOptions(options);
    return this.adapter.query(options);
  }
  expectedAdapterType() {
    return _LoggerAdapter.LoggerAdapter;
  }
}
exports.LoggerController = LoggerController;
var _default = LoggerController;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNSUxMSVNFQ09ORFNfSU5fQV9EQVkiLCJMT0dfU1RSSU5HX1RSVU5DQVRFX0xFTkdUSCIsInRydW5jYXRpb25NYXJrZXIiLCJMb2dMZXZlbCIsIklORk8iLCJFUlJPUiIsIkxvZ09yZGVyIiwiREVTQ0VORElORyIsIkFTQ0VORElORyIsImxvZ0xldmVscyIsIkxvZ2dlckNvbnRyb2xsZXIiLCJBZGFwdGFibGVDb250cm9sbGVyIiwiY29uc3RydWN0b3IiLCJhZGFwdGVyIiwiYXBwSWQiLCJvcHRpb25zIiwibG9nTGV2ZWwiLCJsZXZlbCIsInZlcmJvc2UiLCJpbmRleCIsImluZGV4T2YiLCJmb3JFYWNoIiwibGV2ZWxJbmRleCIsIm1hc2tTZW5zaXRpdmVVcmwiLCJwYXRoIiwidXJsU3RyaW5nIiwidXJsT2JqIiwiVVJMIiwicXVlcnkiLCJzZWFyY2hQYXJhbXMiLCJzYW5pdGl6ZWRRdWVyeSIsImtleSIsInZhbHVlIiwic2xpY2UiLCJwYXRobmFtZSIsIm1hc2tTZW5zaXRpdmUiLCJhcmdBcnJheSIsIm1hcCIsImUiLCJyZXBsYWNlIiwidXJsIiwiQXJyYXkiLCJpc0FycmF5IiwiaXRlbSIsImJvZHkiLCJPYmplY3QiLCJrZXlzIiwicGFyYW1zIiwibG9nIiwiYXJncyIsImNvbmNhdCIsImFyZyIsImFwcGx5IiwiaW5mbyIsImFyZ3VtZW50cyIsImVycm9yIiwid2FybiIsImRlYnVnIiwic2lsbHkiLCJsb2dSZXF1ZXN0IiwibWV0aG9kIiwiaGVhZGVycyIsInN0cmluZ2lmaWVkQm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJsb2dSZXNwb25zZSIsInJlc3VsdCIsInN0cmluZ2lmaWVkUmVzcG9uc2UiLCJ2YWxpZERhdGVUaW1lIiwiZGF0ZSIsIkRhdGUiLCJpc05hTiIsImdldFRpbWUiLCJ0cnVuY2F0ZUxvZ01lc3NhZ2UiLCJzdHJpbmciLCJsZW5ndGgiLCJ0cnVuY2F0ZWQiLCJzdWJzdHJpbmciLCJwYXJzZU9wdGlvbnMiLCJmcm9tIiwibm93IiwidW50aWwiLCJzaXplIiwiTnVtYmVyIiwib3JkZXIiLCJnZXRMb2dzIiwiUGFyc2UiLCJFcnJvciIsIlBVU0hfTUlTQ09ORklHVVJFRCIsImV4cGVjdGVkQWRhcHRlclR5cGUiLCJMb2dnZXJBZGFwdGVyIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL0NvbnRyb2xsZXJzL0xvZ2dlckNvbnRyb2xsZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFyc2UgfSBmcm9tICdwYXJzZS9ub2RlJztcbmltcG9ydCBBZGFwdGFibGVDb250cm9sbGVyIGZyb20gJy4vQWRhcHRhYmxlQ29udHJvbGxlcic7XG5pbXBvcnQgeyBMb2dnZXJBZGFwdGVyIH0gZnJvbSAnLi4vQWRhcHRlcnMvTG9nZ2VyL0xvZ2dlckFkYXB0ZXInO1xuXG5jb25zdCBNSUxMSVNFQ09ORFNfSU5fQV9EQVkgPSAyNCAqIDYwICogNjAgKiAxMDAwO1xuY29uc3QgTE9HX1NUUklOR19UUlVOQ0FURV9MRU5HVEggPSAxMDAwO1xuY29uc3QgdHJ1bmNhdGlvbk1hcmtlciA9ICcuLi4gKHRydW5jYXRlZCknO1xuXG5leHBvcnQgY29uc3QgTG9nTGV2ZWwgPSB7XG4gIElORk86ICdpbmZvJyxcbiAgRVJST1I6ICdlcnJvcicsXG59O1xuXG5leHBvcnQgY29uc3QgTG9nT3JkZXIgPSB7XG4gIERFU0NFTkRJTkc6ICdkZXNjJyxcbiAgQVNDRU5ESU5HOiAnYXNjJyxcbn07XG5cbmV4cG9ydCBjb25zdCBsb2dMZXZlbHMgPSBbJ2Vycm9yJywgJ3dhcm4nLCAnaW5mbycsICdkZWJ1ZycsICd2ZXJib3NlJywgJ3NpbGx5J107XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXJDb250cm9sbGVyIGV4dGVuZHMgQWRhcHRhYmxlQ29udHJvbGxlciB7XG4gIGNvbnN0cnVjdG9yKGFkYXB0ZXIsIGFwcElkLCBvcHRpb25zID0geyBsb2dMZXZlbDogJ2luZm8nIH0pIHtcbiAgICBzdXBlcihhZGFwdGVyLCBhcHBJZCwgb3B0aW9ucyk7XG4gICAgbGV0IGxldmVsID0gJ2luZm8nO1xuICAgIGlmIChvcHRpb25zLnZlcmJvc2UpIHtcbiAgICAgIGxldmVsID0gJ3ZlcmJvc2UnO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5sb2dMZXZlbCkge1xuICAgICAgbGV2ZWwgPSBvcHRpb25zLmxvZ0xldmVsO1xuICAgIH1cbiAgICBjb25zdCBpbmRleCA9IGxvZ0xldmVscy5pbmRleE9mKGxldmVsKTsgLy8gaW5mbyBieSBkZWZhdWx0XG4gICAgbG9nTGV2ZWxzLmZvckVhY2goKGxldmVsLCBsZXZlbEluZGV4KSA9PiB7XG4gICAgICBpZiAobGV2ZWxJbmRleCA+IGluZGV4KSB7XG4gICAgICAgIC8vIHNpbGVuY2UgdGhlIGxldmVscyB0aGF0IGFyZSA+IG1heEluZGV4XG4gICAgICAgIHRoaXNbbGV2ZWxdID0gKCkgPT4ge307XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBtYXNrU2Vuc2l0aXZlVXJsKHBhdGgpIHtcbiAgICBjb25zdCB1cmxTdHJpbmcgPSAnaHR0cDovL2xvY2FsaG9zdCcgKyBwYXRoOyAvLyBwcmVwZW5kIGR1bW15IHN0cmluZyB0byBtYWtlIGEgcmVhbCBVUkxcbiAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHVybFN0cmluZyk7XG4gICAgY29uc3QgcXVlcnkgPSB1cmxPYmouc2VhcmNoUGFyYW1zO1xuICAgIGxldCBzYW5pdGl6ZWRRdWVyeSA9ICc/JztcblxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHF1ZXJ5KSB7XG4gICAgICBpZiAoa2V5ICE9PSAncGFzc3dvcmQnKSB7XG4gICAgICAgIC8vIG5vcm1hbCB2YWx1ZVxuICAgICAgICBzYW5pdGl6ZWRRdWVyeSArPSBrZXkgKyAnPScgKyB2YWx1ZSArICcmJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHBhc3N3b3JkIHZhbHVlLCByZWRhY3QgaXRcbiAgICAgICAgc2FuaXRpemVkUXVlcnkgKz0ga2V5ICsgJz0nICsgJyoqKioqKioqJyArICcmJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB0cmltIGxhc3QgY2hhcmFjdGVyLCA/IG9yICZcbiAgICBzYW5pdGl6ZWRRdWVyeSA9IHNhbml0aXplZFF1ZXJ5LnNsaWNlKDAsIC0xKTtcblxuICAgIC8vIHJldHVybiBvcmlnaW5hbCBwYXRoIG5hbWUgd2l0aCBzYW5pdGl6ZWQgcGFyYW1zIGF0dGFjaGVkXG4gICAgcmV0dXJuIHVybE9iai5wYXRobmFtZSArIHNhbml0aXplZFF1ZXJ5O1xuICB9XG5cbiAgbWFza1NlbnNpdGl2ZShhcmdBcnJheSkge1xuICAgIHJldHVybiBhcmdBcnJheS5tYXAoZSA9PiB7XG4gICAgICBpZiAoIWUpIHtcbiAgICAgICAgcmV0dXJuIGU7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGUucmVwbGFjZSgvKHBhc3N3b3JkXCIuPzouP1wiKVteXCJdKlwiL2csICckMSoqKioqKioqXCInKTtcbiAgICAgIH1cbiAgICAgIC8vIGVsc2UgaXQgaXMgYW4gb2JqZWN0Li4uXG5cbiAgICAgIC8vIGNoZWNrIHRoZSB1cmxcbiAgICAgIGlmIChlLnVybCkge1xuICAgICAgICAvLyBmb3Igc3RyaW5nc1xuICAgICAgICBpZiAodHlwZW9mIGUudXJsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGUudXJsID0gdGhpcy5tYXNrU2Vuc2l0aXZlVXJsKGUudXJsKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGUudXJsKSkge1xuICAgICAgICAgIC8vIGZvciBzdHJpbmdzIGluIGFycmF5XG4gICAgICAgICAgZS51cmwgPSBlLnVybC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLm1hc2tTZW5zaXRpdmVVcmwoaXRlbSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChlLmJvZHkpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoZS5ib2R5KSkge1xuICAgICAgICAgIGlmIChrZXkgPT09ICdwYXNzd29yZCcpIHtcbiAgICAgICAgICAgIGUuYm9keVtrZXldID0gJyoqKioqKioqJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZS5wYXJhbXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoZS5wYXJhbXMpKSB7XG4gICAgICAgICAgaWYgKGtleSA9PT0gJ3Bhc3N3b3JkJykge1xuICAgICAgICAgICAgZS5wYXJhbXNba2V5XSA9ICcqKioqKioqKic7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGU7XG4gICAgfSk7XG4gIH1cblxuICBsb2cobGV2ZWwsIGFyZ3MpIHtcbiAgICAvLyBtYWtlIHRoZSBwYXNzZWQgaW4gYXJndW1lbnRzIG9iamVjdCBhbiBhcnJheSB3aXRoIHRoZSBzcHJlYWQgb3BlcmF0b3JcbiAgICBhcmdzID0gdGhpcy5tYXNrU2Vuc2l0aXZlKFsuLi5hcmdzXSk7XG4gICAgYXJncyA9IFtdLmNvbmNhdChcbiAgICAgIGxldmVsLFxuICAgICAgYXJncy5tYXAoYXJnID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByZXR1cm4gYXJnKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFyZztcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLmFkYXB0ZXIubG9nLmFwcGx5KHRoaXMuYWRhcHRlciwgYXJncyk7XG4gIH1cblxuICBpbmZvKCkge1xuICAgIHJldHVybiB0aGlzLmxvZygnaW5mbycsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBlcnJvcigpIHtcbiAgICByZXR1cm4gdGhpcy5sb2coJ2Vycm9yJywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHdhcm4oKSB7XG4gICAgcmV0dXJuIHRoaXMubG9nKCd3YXJuJywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHZlcmJvc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9nKCd2ZXJib3NlJywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIGRlYnVnKCkge1xuICAgIHJldHVybiB0aGlzLmxvZygnZGVidWcnLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgc2lsbHkoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9nKCdzaWxseScsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBsb2dSZXF1ZXN0KHsgbWV0aG9kLCB1cmwsIGhlYWRlcnMsIGJvZHkgfSkge1xuICAgIHRoaXMudmVyYm9zZShcbiAgICAgICgpID0+IHtcbiAgICAgICAgY29uc3Qgc3RyaW5naWZpZWRCb2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keSwgbnVsbCwgMik7XG4gICAgICAgIHJldHVybiBgUkVRVUVTVCBmb3IgWyR7bWV0aG9kfV0gJHt1cmx9OiAke3N0cmluZ2lmaWVkQm9keX1gO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kLFxuICAgICAgICB1cmwsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHksXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGxvZ1Jlc3BvbnNlKHsgbWV0aG9kLCB1cmwsIHJlc3VsdCB9KSB7XG4gICAgdGhpcy52ZXJib3NlKFxuICAgICAgKCkgPT4ge1xuICAgICAgICBjb25zdCBzdHJpbmdpZmllZFJlc3BvbnNlID0gSlNPTi5zdHJpbmdpZnkocmVzdWx0LCBudWxsLCAyKTtcbiAgICAgICAgcmV0dXJuIGBSRVNQT05TRSBmcm9tIFske21ldGhvZH1dICR7dXJsfTogJHtzdHJpbmdpZmllZFJlc3BvbnNlfWA7XG4gICAgICB9LFxuICAgICAgeyByZXN1bHQ6IHJlc3VsdCB9XG4gICAgKTtcbiAgfVxuICAvLyBjaGVjayB0aGF0IGRhdGUgaW5wdXQgaXMgdmFsaWRcbiAgc3RhdGljIHZhbGlkRGF0ZVRpbWUoZGF0ZSkge1xuICAgIGlmICghZGF0ZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGRhdGUgPSBuZXcgRGF0ZShkYXRlKTtcblxuICAgIGlmICghaXNOYU4oZGF0ZS5nZXRUaW1lKCkpKSB7XG4gICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHRydW5jYXRlTG9nTWVzc2FnZShzdHJpbmcpIHtcbiAgICBpZiAoc3RyaW5nICYmIHN0cmluZy5sZW5ndGggPiBMT0dfU1RSSU5HX1RSVU5DQVRFX0xFTkdUSCkge1xuICAgICAgY29uc3QgdHJ1bmNhdGVkID0gc3RyaW5nLnN1YnN0cmluZygwLCBMT0dfU1RSSU5HX1RSVU5DQVRFX0xFTkdUSCkgKyB0cnVuY2F0aW9uTWFya2VyO1xuICAgICAgcmV0dXJuIHRydW5jYXRlZDtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nO1xuICB9XG5cbiAgc3RhdGljIHBhcnNlT3B0aW9ucyhvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBmcm9tID1cbiAgICAgIExvZ2dlckNvbnRyb2xsZXIudmFsaWREYXRlVGltZShvcHRpb25zLmZyb20pIHx8XG4gICAgICBuZXcgRGF0ZShEYXRlLm5vdygpIC0gNyAqIE1JTExJU0VDT05EU19JTl9BX0RBWSk7XG4gICAgY29uc3QgdW50aWwgPSBMb2dnZXJDb250cm9sbGVyLnZhbGlkRGF0ZVRpbWUob3B0aW9ucy51bnRpbCkgfHwgbmV3IERhdGUoKTtcbiAgICBjb25zdCBzaXplID0gTnVtYmVyKG9wdGlvbnMuc2l6ZSkgfHwgMTA7XG4gICAgY29uc3Qgb3JkZXIgPSBvcHRpb25zLm9yZGVyIHx8IExvZ09yZGVyLkRFU0NFTkRJTkc7XG4gICAgY29uc3QgbGV2ZWwgPSBvcHRpb25zLmxldmVsIHx8IExvZ0xldmVsLklORk87XG5cbiAgICByZXR1cm4ge1xuICAgICAgZnJvbSxcbiAgICAgIHVudGlsLFxuICAgICAgc2l6ZSxcbiAgICAgIG9yZGVyLFxuICAgICAgbGV2ZWwsXG4gICAgfTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBwcm9taXNlIGZvciBhIHtyZXNwb25zZX0gb2JqZWN0LlxuICAvLyBxdWVyeSBwYXJhbXM6XG4gIC8vIGxldmVsIChvcHRpb25hbCkgTGV2ZWwgb2YgbG9nZ2luZyB5b3Ugd2FudCB0byBxdWVyeSBmb3IgKGluZm8gfHwgZXJyb3IpXG4gIC8vIGZyb20gKG9wdGlvbmFsKSBTdGFydCB0aW1lIGZvciB0aGUgc2VhcmNoLiBEZWZhdWx0cyB0byAxIHdlZWsgYWdvLlxuICAvLyB1bnRpbCAob3B0aW9uYWwpIEVuZCB0aW1lIGZvciB0aGUgc2VhcmNoLiBEZWZhdWx0cyB0byBjdXJyZW50IHRpbWUuXG4gIC8vIG9yZGVyIChvcHRpb25hbCkgRGlyZWN0aW9uIG9mIHJlc3VsdHMgcmV0dXJuZWQsIGVpdGhlciDigJxhc2PigJ0gb3Ig4oCcZGVzY+KAnS4gRGVmYXVsdHMgdG8g4oCcZGVzY+KAnS5cbiAgLy8gc2l6ZSAob3B0aW9uYWwpIE51bWJlciBvZiByb3dzIHJldHVybmVkIGJ5IHNlYXJjaC4gRGVmYXVsdHMgdG8gMTBcbiAgZ2V0TG9ncyhvcHRpb25zID0ge30pIHtcbiAgICBpZiAoIXRoaXMuYWRhcHRlcikge1xuICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFBhcnNlLkVycm9yLlBVU0hfTUlTQ09ORklHVVJFRCwgJ0xvZ2dlciBhZGFwdGVyIGlzIG5vdCBhdmFpbGFibGUnKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzLmFkYXB0ZXIucXVlcnkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihcbiAgICAgICAgUGFyc2UuRXJyb3IuUFVTSF9NSVNDT05GSUdVUkVELFxuICAgICAgICAnUXVlcnlpbmcgbG9ncyBpcyBub3Qgc3VwcG9ydGVkIHdpdGggdGhpcyBhZGFwdGVyJ1xuICAgICAgKTtcbiAgICB9XG4gICAgb3B0aW9ucyA9IExvZ2dlckNvbnRyb2xsZXIucGFyc2VPcHRpb25zKG9wdGlvbnMpO1xuICAgIHJldHVybiB0aGlzLmFkYXB0ZXIucXVlcnkob3B0aW9ucyk7XG4gIH1cblxuICBleHBlY3RlZEFkYXB0ZXJUeXBlKCkge1xuICAgIHJldHVybiBMb2dnZXJBZGFwdGVyO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExvZ2dlckNvbnRyb2xsZXI7XG4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUFpRTtBQUVqRSxNQUFNQSxxQkFBcUIsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJO0FBQ2pELE1BQU1DLDBCQUEwQixHQUFHLElBQUk7QUFDdkMsTUFBTUMsZ0JBQWdCLEdBQUcsaUJBQWlCO0FBRW5DLE1BQU1DLFFBQVEsR0FBRztFQUN0QkMsSUFBSSxFQUFFLE1BQU07RUFDWkMsS0FBSyxFQUFFO0FBQ1QsQ0FBQztBQUFDO0FBRUssTUFBTUMsUUFBUSxHQUFHO0VBQ3RCQyxVQUFVLEVBQUUsTUFBTTtFQUNsQkMsU0FBUyxFQUFFO0FBQ2IsQ0FBQztBQUFDO0FBRUssTUFBTUMsU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUM7QUFBQztBQUV6RSxNQUFNQyxnQkFBZ0IsU0FBU0MsNEJBQW1CLENBQUM7RUFDeERDLFdBQVcsQ0FBQ0MsT0FBTyxFQUFFQyxLQUFLLEVBQUVDLE9BQU8sR0FBRztJQUFFQyxRQUFRLEVBQUU7RUFBTyxDQUFDLEVBQUU7SUFDMUQsS0FBSyxDQUFDSCxPQUFPLEVBQUVDLEtBQUssRUFBRUMsT0FBTyxDQUFDO0lBQzlCLElBQUlFLEtBQUssR0FBRyxNQUFNO0lBQ2xCLElBQUlGLE9BQU8sQ0FBQ0csT0FBTyxFQUFFO01BQ25CRCxLQUFLLEdBQUcsU0FBUztJQUNuQjtJ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