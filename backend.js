var fs = require("fs"),
    sys = require("sys"),
    step = require("step"),
    _ = require("underscore")._,
    util = require("./util"),
    packageParser = require("./packageParser");

var pkgDir = __dirname + '/packages';

function pkgFile(name, type) {
    return pkgDir + '/' + name.replace(/\.\.+/g, '.') + "." + type;
};

/**
 * Load the contents and metadata of a package from the backing store.
 * @param {string} name The name of the package to load.
 * @param {Array.<number>} version The version of the package to load.
 * @param {string} type "el" for single-file elisp packages or "tar"
 *   for multi-file tar packages.
 * @param {function(Error=, Buffer=, Object=)} callback
 *   Passed a buffer containing the package contents and a metadata object
 *   of the sort returned by packageParser.parse*.
 */
exports.loadPackage = function(name, version, type, callback) {
    var data;
    step(
        function() {fs.readFile(pkgFile(name, type), this)},
        function(err, data_) {
            if (err) throw err;
            data = data_;
            packageParser.parsePackage(data, type, this);
        },
        function(err, pkg) {
            if (err) {
              callback(err);
              return;
            }

            if (_.isEqual(pkg.version, version)) {
                callback(null, data, pkg);
                return;
            }

            err = new Error("Don't have " + name + ".el version " +
                            version.join(".") + ", only version " +
                            pkg.version.join(".") + "\n");
            err.name = "WrongVersionError";
            callback(err);
        });
};

exports.savePackage = function(data, type, callback) {
    if (type === 'el') exports.saveElisp(data.toString('utf8'), callback);
    else if (type === 'tar') exports.saveTarball(data, callback);
    else callback(new Error("Unknown filetype: " + type));
};

exports.saveElispFile = function(file, callback) {
    step(
        function() {fs.readFile(file, "utf8", this)},
        function(err, elisp) {
            if (err) {
              callback(err);
              return;
            }
            exports.saveElisp(elisp, this);
        }, callback);
};

exports.saveElisp = function(elisp, callback) {
    var pkg;
    step(
        function() {pkg = packageParser.parseElisp(elisp)},
        function(err) {
            if (err) throw err;
            fs.writeFile(pkgFile(pkg.name, 'el'), elisp, "utf8", this);
        },
        function(err) {callback(err, pkg)});
};

exports.saveTarFile = function(file, callback) {
    var pkg;
    step(
        function() {packageParser.parseTarFile(file, this)},
        function(err, pkg_) {
            if (err) throw err;
            pkg = pkg_;
            util.run("mv", [file, pkgFile(pkg.name, 'tar')], this);
        },
        function(err) {callback(err, pkg)});
};

exports.saveTarball = function(tar, callback) {
    var pkg;
    step(
        function() {packageParser.parseTar(tar, this)},
        function(err, pkg_) {
            if (err) throw err;
            pkg = pkg_;
            fs.writeFile(pkgFile(pkg.name, "tar"), tar, this);
        },
        function(err) {callback(err, pkg)});
};

exports.getPackages = function(callback) {
    step(
        function() {fs.readdir('packages', this)},
        function(err, files) {
            if (err) throw err;

            var fileGroup = this.group();
            _(files).each(function(file) {
                var cb = fileGroup();
                fs.readFile(pkgDir + '/' + file, function(err, data) {
                    cb(null, [file, data]);
                });
            });
        },
        function(err, packages) {
            if (err) throw err;
            var pkgGroup = this.group();
            _(packages).each(function(pkg) {
                var file = pkg[0],
                    data = pkg[1];
                packageParser.parsePackage(
                    data, file.match(/\.([a-z]+)$/)[1], pkgGroup());
            });
        },
        callback);
};
