;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.GeoJSONX = factory()
}(this, (function () { 'use strict';

/** Feature format for reading and writing data in the GeoJSONX format.
 * @constructor 
 * @param {*} options options.
 *  @param {number} options.decimals number of decimals to save, default 7
 *  @param {boolean|Array<*>} options.deleteNullProperties An array of property values to remove, if false, keep all properties, default [null,undefined,""]
 *  @param {boolean|Array<*>} options.extended Decode/encode extended GeoJSON with foreign members (id, bbox, title, etc.), default true
 *  @param {Array<string>|function} options.whiteList A list of properties to keep on features when encoding or a function that takes a property name and retrun true if the property is whitelisted
 *  @param {Array<string>|function} options.blackList A list of properties to remove from features when encoding or a function that takes a property name and retrun true if the property is blacklisted
 */
var GeoJSONX = function(options) {
  options = options || {};
  
  this._hash = {};
  this._count = 0;
  this._extended = (options.extended !== false);
  if (typeof(options.whiteList)==='function') {
    this._whiteList = options.whiteList;
  } else if (options.whiteList && options.whiteList.indexOf) {
    this._whiteList = function (k) { return options.whiteList.indexOf(k) > -1 };
  } else {
    this._whiteList = function() { return true };
  } 
  if (typeof(options.blackList)==='function') {
    this._blackList = options.blackList;
  } else if (options.blackList && options.blackList.indexOf) {
    this._blackList = function (k) { return options.blackList.indexOf(k) > -1 };
  } else {
    this._blackList = function() { return false };
  } 
  this._deleteNull = options.deleteNullProperties===false ? false : [null,undefined,""];
  this._decimals = (typeof(options.decimals) === 'number') ? options.decimals : 7;
};

/** Radix */
GeoJSONX.prototype._radix = 
'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/ !#$%&\'()*-.:<=>?@[]^_`{|}~';

/** Radix size */
GeoJSONX.prototype._size = GeoJSONX.prototype._radix.length;

/** Set number of decimals
 * @param {number} options.decimals number of decimals to save, default 7
 */
GeoJSONX.prototype.setDecimals = function(decimals) {
  this._decimals = (typeof(options.decimals) === 'number') ? decimals : 7;
};

/** Get number of decimals
 * @return {number} options.decimals number of decimals to save, default 7
 */
GeoJSONX.prototype.getDecimals = function() {
  return this._decimals;
};

/** GeoSJON types */
GeoJSONX.prototype._type = {
  "Point": "p",
  "LineString": "L",
  "Polygon": "P",
  "MultiPoint": "Mp",
  "MultiLineString": "ML",
  "MultiPolygon": "MP",
  "GeometryCollection": "" // Not supported
};

/** GeoSJONX types */
GeoJSONX.prototype._toType = {
  "p": "Point",
  "L": "LineString",
  "P": "Polygon",
  "Mp": "MultiPoint",
  "ML": "MultiLineString",
  "MP": "MultiPolygon",
  "": "GeometryCollection" // Not supported
};

/** Encode a number
 * @param {number} number Number to encode
 * @private {number} decimals Number of decimals
 * @param {string}
 */
GeoJSONX.prototype.encodeNumber = function(number, decimals) {
  if (isNaN(Number(number)) || number === null || !isFinite(number)) {
    number = 0;
  }
  if (!decimals && decimals!==0) decimals = this._decimals;
  // Round number
  number = Math.round(number * Math.pow(10, decimals));
  // Zigzag encoding (get positive number)
  if (number<0) number = -2*number - 1;
  else number = 2*number;
  // Encode
  var result = '';
  var modulo, residual = number;
  while (true) {
    modulo = residual % this._size
    result = this._radix.charAt(modulo) + result;
    residual = Math.floor(residual / this._size);
    if (residual == 0) break;
  }
  return result;
};

/** Decode a number
 * @param {string} s 
 * @private {number} decimals Number of decimals
 * @return {number}
 */
GeoJSONX.prototype.decodeNumber = function(s, decimals) {
  if (!decimals && decimals!==0) decimals = this._decimals;
  var decode = 0;
  s.split('').forEach(function (c) {
    decode = (decode * this._size) + this._radix.indexOf(c);
  }.bind(this));
  // Zigzag encoding
  var result = Math.floor(decode/2)
  if (result !== decode/2) result = -1-result;
  return result / Math.pow(10, decimals);
};

/** Encode coordinates
 * @param {ol.coordinate|Array<ol.coordinate>} v
 * @param {number} decimal
 * @return {string|Array<string>}
 * @api
 */
GeoJSONX.prototype.encodeCoordinates = function(v, decimal) {
  var i;
  if (typeof(v[0]) === 'number') {
    return this.encodeNumber(v[0], decimal) +','+ this.encodeNumber(v[1], decimal);
  } else if (v.length && v[0]) {
    if (typeof(v[0][0]) === 'number') {
      var dxy=[0,0];
      var xy = [];
      for (i=0; i<v.length; i++) {
        v[i] = [
          Math.round( v[i][0] * Math.pow(10, decimal)),
          Math.round( v[i][1] * Math.pow(10, decimal))
        ];
        var dx = v[i][0]-dxy[0];
        var dy = v[i][1]-dxy[1];
        if (i==0 || (dx!==0 || dy!==0)) {
          xy.push(this.encodeNumber(dx, 0) +','+ this.encodeNumber(dy, 0));
          dxy = v[i];
        }
      }
      // Almost 2 points...
      if (xy.length<2) xy.push('A,A');
      return xy.join(';');
    } else {
      for (i=0; i<v.length; i++) {
        v[i] = this.encodeCoordinates(v[i], decimal);
      }
      return v;
    }
  } else {
    return this.encodeCoordinates([0,0], decimal);
  }
};

/** Decode coordinates
 * @param {string|Array<string>}
 * @param {number} decimal Number of decimals
 * @return {ol.coordinate|Array<ol.coordinate>} v
 * @api
 */
GeoJSONX.prototype.decodeCoordinates = function(v, decimals) {
  var i;
  if (typeof(v) === 'string') {
    v = v.split(';');
    if (v.length>1) {
      var dxy=[0,0];
      v.forEach(function(vi, i) {
        v[i] = vi.split(',');
        v[i][0] = this.decodeNumber(v[i][0], decimals) + dxy[0];
        v[i][1] = this.decodeNumber(v[i][1], decimals) + dxy[1];
        dxy = v[i];
      }.bind(this));
      return v;
    } else {
      v = v[0].split(',');
      return [ this.decodeNumber(v[0], decimals), this.decodeNumber(v[1], decimals) ];
    }
  } else if (v.length) {
    var r = [];
    for (i=0; i<v.length; i++) {
      r[i] = this.decodeCoordinates(v[i], decimals);
    }
    return r;
  } else {
    return [0,0];
  }
};

/** Compress a GeoJSON object to GeoJSONX.
 * @param {Array<ol.Feature>} features Features.
 * @param {*} options Write options.
 * @return {*} GeoJSONX Object.
 * @override
 * @api
 */
GeoJSONX.prototype.fromGeoJSON = function (object, options) {
  this._count = 0;
  this._hash = {};
  var geojson = { type: 'FeatureCollection' };
  var features = [];
  object.features.forEach(function(f) {
    features.push(this.writeFeatureObject(f));
  }.bind(this));
  geojson.decimals = this._decimals;
  geojson.hashProperties = {};
  Object.keys(this._hash).forEach(function(k) {
    geojson.hashProperties[this._hash[k]] = k;
  }.bind(this));
  geojson.features = features;
  this._count = 0;
  this._hash = {};
  return geojson;
};

/** Encode a set of features as a GeoJSONX object.
 * @param {ol.Feature} feature Feature
 * @param {*} options Write options.
 * @return {*} GeoJSONX Object.
 * @override
 * @api
 */
GeoJSONX.prototype.writeFeatureObject = function(f0, options) {
  // Only features supported yet
  if (f0.type !== 'Feature') throw 'GeoJSONX doesn\'t support '+f0.type+'.';
  var f = [];
  // Encode geometry
  if (f0.geometry.type==='GeometryCollection') {
    throw 'GeoJSONX doesn\'t support '+f0.geometry.type+'.';
  } 
  if (f0.geometry.type==='Point') {
    f.push(this.encodeCoordinates(f0.geometry.coordinates, this._decimals));
  } else {
    f.push ([
      this._type[f0.geometry.type],
      this.encodeCoordinates(f0.geometry.coordinates, this._decimals)
    ]);
  }
  // Encode properties
  var k;
  var prop = [];
  var keys = [];
  for (k in f0.properties) {
    if (!this._whiteList(k) || this._blackList(k)) continue;
    if (!this._hash[k]) {
      this._hash[k] = this._count.toString(32);
      this._count++;
    }
    if (!this._deleteNull || this._deleteNull.indexOf(f0.properties[k])<0) {
      prop.push (f0.properties[k]);
      keys.push(this._hash[k]);
    }
  }
  if (prop.length || this._extended) {
    prop.unshift(keys.join(','));
    f.push(prop);
  }
  // Other properties (id, title, bbox, centerline...
  if (this._extended) {
    var found = false;
    prop = {};
    for (k in f0) {
      if (!/^type$|^geometry$|^properties$/.test(k)) {
        prop[k] = f0[k];
        found = true;
      }
    }
    if (found) f.push(prop);
  }
  return f;
};

/** Decode a GeoJSONX object.
 * @param {*} object GeoJSONX
 * @param {*} options Read options.
 * @return {Array<ol.Feature>}
 * @override
 * @api
 */
GeoJSONX.prototype.toGeoJSON = function (object, options) {
  this._hashProperties = object.hashProperties || {};
  options = options || {};
  options.decimals = parseInt(object.decimals);
  if (!options.decimals) throw 'Bad file format...';
  // Result
  var geojson = {};
  for (var k in object) geojson[k] = object[k];
  delete geojson.features;
  geojson.features = [];
  object.features.forEach(function (f) {
    geojson.features.push(this.readFeatureFromObject(f, options));
  }.bind(this));
  delete geojson.hashProperties;
  delete geojson.decimals;
  return geojson;
};

/** Decode GeoJSONX Feature object.
 * @param {*} object GeoJSONX
 * @param {*} options Read options.
 * @return {ol.Feature}
 */
GeoJSONX.prototype.readFeatureFromObject = function (f0, options) {
  var f = {
    type: 'Feature'
  }
  if (typeof(f0[0]) === 'string') {
    f.geometry = {
      type: 'Point',
      coordinates: this.decodeCoordinates(f0[0], options.decimals || this.decimals)
    }  
  } else {
    f.geometry = {
      type: this._toType[f0[0][0]],
      coordinates: this.decodeCoordinates(f0[0][1], options.decimals || this.decimals)
    }
  }
  if (this._hashProperties && f0[1]) {
    f.properties = {};
    var keys;
    f0[1].forEach(function(p, i) {
      if (i===0) keys = p.split(',');
      else f.properties[this._hashProperties[keys[i-1]]] = p;
    }.bind(this));
  } else {
    f.properties = f0[1];
  }
  // Extended properties
  if (f0[2]) {
    for (var k in f0[2]) {
      f[k] = f0[2][k];
    }
  }
  return f;
};

/** Static function to parse GeoJSON back and forth to GeoJSONX
 * @param {*} json JSON object
 * @param {*} options options.
 *  @param {number} options.decimals number of decimals to save, default 7
 *  @param {boolean|Array<*>} options.deleteNullProperties An array of property values to remove, if false, keep all properties, default [null,undefined,""]
 * @return {*|boolean} return false if an error occured, a JSON object otherwise
 */
GeoJSONX.parse = function(json, options) {
  var parser = new GeoJSONX(options);
  try {
    if (json.features && json.features[0].geometry) {
      return parser.fromGeoJSON(json);
    } else {
      return parser.toGeoJSON(json);
    }
  } catch(e) { /* error */ };
  return false;
};

return GeoJSONX

// The end
})));