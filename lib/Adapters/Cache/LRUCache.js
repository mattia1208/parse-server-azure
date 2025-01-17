"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.LRUCache = void 0;
var _lruCache = require("lru-cache");
var _defaults = _interopRequireDefault(require("../../defaults"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class LRUCache {
  constructor({
    ttl = _defaults.default.cacheTTL,
    maxSize = _defaults.default.cacheMaxSize
  }) {
    this.cache = new _lruCache.LRUCache({
      max: maxSize,
      ttl
    });
  }
  get(key) {
    return this.cache.get(key) || null;
  }
  put(key, value, ttl = this.ttl) {
    this.cache.set(key, value, ttl);
  }
  del(key) {
    this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
}
exports.LRUCache = LRUCache;
var _default = LRUCache;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJMUlVDYWNoZSIsImNvbnN0cnVjdG9yIiwidHRsIiwiZGVmYXVsdHMiLCJjYWNoZVRUTCIsIm1heFNpemUiLCJjYWNoZU1heFNpemUiLCJjYWNoZSIsIkxSVSIsIm1heCIsImdldCIsImtleSIsInB1dCIsInZhbHVlIiwic2V0IiwiZGVsIiwiZGVsZXRlIiwiY2xlYXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQWRhcHRlcnMvQ2FjaGUvTFJVQ2FjaGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTFJVQ2FjaGUgYXMgTFJVIH0gZnJvbSAnbHJ1LWNhY2hlJztcbmltcG9ydCBkZWZhdWx0cyBmcm9tICcuLi8uLi9kZWZhdWx0cyc7XG5cbmV4cG9ydCBjbGFzcyBMUlVDYWNoZSB7XG4gIGNvbnN0cnVjdG9yKHsgdHRsID0gZGVmYXVsdHMuY2FjaGVUVEwsIG1heFNpemUgPSBkZWZhdWx0cy5jYWNoZU1heFNpemUgfSkge1xuICAgIHRoaXMuY2FjaGUgPSBuZXcgTFJVKHtcbiAgICAgIG1heDogbWF4U2l6ZSxcbiAgICAgIHR0bCxcbiAgICB9KTtcbiAgfVxuXG4gIGdldChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5jYWNoZS5nZXQoa2V5KSB8fCBudWxsO1xuICB9XG5cbiAgcHV0KGtleSwgdmFsdWUsIHR0bCA9IHRoaXMudHRsKSB7XG4gICAgdGhpcy5jYWNoZS5zZXQoa2V5LCB2YWx1ZSwgdHRsKTtcbiAgfVxuXG4gIGRlbChrZXkpIHtcbiAgICB0aGlzLmNhY2hlLmRlbGV0ZShrZXkpO1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5jYWNoZS5jbGVhcigpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExSVUNhY2hlO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTtBQUNBO0FBQXNDO0FBRS9CLE1BQU1BLFFBQVEsQ0FBQztFQUNwQkMsV0FBVyxDQUFDO0lBQUVDLEdBQUcsR0FBR0MsaUJBQVEsQ0FBQ0MsUUFBUTtJQUFFQyxPQUFPLEdBQUdGLGlCQUFRLENBQUNHO0VBQWEsQ0FBQyxFQUFFO0lBQ3hFLElBQUksQ0FBQ0MsS0FBSyxHQUFHLElBQUlDLGtCQUFHLENBQUM7TUFDbkJDLEdBQUcsRUFBRUosT0FBTztNQUNaSDtJQUNGLENBQUMsQ0FBQztFQUNKO0VBRUFRLEdBQUcsQ0FBQ0MsR0FBRyxFQUFFO0lBQ1AsT0FBTyxJQUFJLENBQUNKLEtBQUssQ0FBQ0csR0FBRyxDQUFDQyxHQUFHLENBQUMsSUFBSSxJQUFJO0VBQ3BDO0VBRUFDLEdBQUcsQ0FBQ0QsR0FBRyxFQUFFRSxLQUFLLEVBQUVYLEdBQUcsR0FBRyxJQUFJLENBQUNBLEdBQUcsRUFBRTtJQUM5QixJQUFJLENBQUNLLEtBQUssQ0FBQ08sR0FBRyxDQUFDSCxHQUFHLEVBQUVFLEtBQUssRUFBRVgsR0FBRyxDQUFDO0VBQ2pDO0VBRUFhLEdBQUcsQ0FBQ0osR0FBRyxFQUFFO0lBQ1AsSUFBSSxDQUFDSixLQUFLLENBQUNTLE1BQU0sQ0FBQ0wsR0FBRyxDQUFDO0VBQ3hCO0VBRUFNLEtBQUssR0FBRztJQUNOLElBQUksQ0FBQ1YsS0FBSyxDQUFDVSxLQUFLLEVBQUU7RUFDcEI7QUFDRjtBQUFDO0FBQUEsZUFFY2pCLFFBQVE7QUFBQSJ9