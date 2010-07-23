var fs = require("fs"),
    _ = require("underscore")._,
    packageParser = require("./packageParser");

exports.savePackage = function(elisp, callback) {
    var pkg = packageParser.parse(elisp);
    fs.open("packages/" + pkg.name + ".el", "w", 0600, function(err, fd) {
        if (err) return callback(err, pkg);
        fs.write(fd, elisp, null, "utf8", function(err, written) {
            callback(err, pkg)
        });
    });
};

exports.getPackages = function(callback) {
    fs.readdir('packages', function(err, files) {
        if (err) return callback(err, []);

        var packages = [];
        var errors = [];
        var filesToParse = 0;
        _(files).each(function(file) {
            file = 'packages/' + file;
            filesToParse += 1;
            fs.readFile(file, "utf8", function(err, data) {
                if (err) {
                    console.log("Error reading " + file + ": " + err);
                } else {
                    packages.push(packageParser.parse(data));
                }

                filesToParse -= 1;
                if (filesToParse === 0) callback(null, packages);
            });
        });
    });
};