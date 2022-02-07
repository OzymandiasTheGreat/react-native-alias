const { readdirSync } = require("fs");
const { basename, extname } = require("path");


const files = readdirSync(__dirname);
module.exports = files.filter((f) => f.endsWith(".json")).map((f) => basename(f, extname(f)));
