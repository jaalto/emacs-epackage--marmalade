/*!*
 * Marmalade: an Emacs Lisp package server.
 * Copyright (C) 2010 Google Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * This file handles converting JS objects into Elisp objects. This is necessary
 * for places where ELPA gives an sexp-valued response.
 */

var util = require("util"),
    _ = require("underscore")._;

/**
 * Converts a JS string to an Elisp string.
 * @param {string} str
 * @return {string}
 */
exports.string = function(str) {
    if (!str) return '""';
    return '"' + str.replace(/["\\]/g, '\\$&') + '"';
};

/**
 * Converts a JS string to an Elisp symbol.
 * @param {string} str
 * @return {string}
 */
exports.symbol = function(str) {
    return str.replace(/[#"'()\[\]\\`\s]|^[0-9.]/g, '\\$&')
};

/**
 * Converts a JS string to an Elisp keyword symbol.
 * @param {string} str
 * @return {string}
 */
exports.keyword = function(str) {
    return ":" + exports.symbol(str);
};

/**
 * Converts a JS array to a space-separated string of Elisp representations of
 * its values. This string can be used as the inside of a list or vector.
 * 
 * Values are converted via `sexp`.
 * @param {Array} arr
 * @return {string}
 */
function listLike(arr) {
    return _(arr).map(exports.sexp).join(" ");
};

/**
 * Converts a JS array to an Elisp list. Values are converted via `sexp`.
 * @param {Array} arr
 * @return {string}
 */
exports.list = function(arr) {
    return "(" + listLike(arr) + ")";
};

/**
 * Converts a JS array to an Elisp vector. Values are converted via `sexp`.
 * @param {Array} arr
 * @return {string}
 */
exports.vector = function(arr) {
    return "[" + listLike(arr) + "]";
};

/**
 * Converts a JS boolean to an Elisp boolean (t or nil).
 * @param {boolean} bool
 * @return {string}
 */
exports.bool = function(bool) {
    return bool ? "t" : "nil";
};

/**
 * Converts a JS number to an Elisp number.
 * @param {number} num
 * @return {string}
 */
exports.number = function(num) {
    return num.toString();
};

/**
 * Converts a JS object to an Elisp alist. The keys are all converted to
 * symbols.
 * @param {Object} obj
 * @return {string}
 */
exports.alist = function(obj) {
    return "(" + _.map(obj, function(val, key) {
        return "(" + exports.symbol(key) + " . " + exports.sexp(val) + ")";
    }).join("") + ")";
};

/**
 * Converts one of many sorts of JS objects to their (rough) Elisp equivalents.
 * null, undefined, and false are converted to nil; true is converted to t;
 * arrays are converted to lists; numbers and strings are converted to
 * themselves.
 *
 * It's also possible to force specialized Lisp representations. The lispType
 * property can be used for this; strings can have a lispType of "symbol" or
 * "keyword", and arrays can have a lispType of "vector". Objects can also have
 * a toSexp method, which takes no arguments and returns the sexp representation
 * as a string.
 *
 * @param {null|undefined|string|boolean|number|Array} obj The JS object to
 *   convert to a sexp.
 * @return {string}
 */
exports.sexp = function(obj) {
    if (_.isNull(obj) || _.isUndefined(obj)) {
        return 'nil';
    } else if (obj.toSexp) {
        return obj.toSexp();
    } else if (obj.lispType) {
        switch (obj.lispType) {
        case 'string': return exports.string(obj);
        case 'symbol': return exports.symbol(obj);
        case 'keyword': return exports.keyword(obj);
        case 'list': return exports.list(obj);
        case 'vector': return exports.vector(obj);
        } 
        throw new Error("Unrecognized lispType: " + util.inspect(obj.lispType));
    } else if (_.isString(obj)) {
        return exports.string(obj);
    } else if (_.isArray(obj))  {
        return exports.list(obj);
    } else if (_.isBoolean(obj)) {
        return exports.bool(obj);
    } else if (_.isNumber(obj)) {
        return exports.number(obj);
    } else {
        return exports.alist(obj);
    }
};
