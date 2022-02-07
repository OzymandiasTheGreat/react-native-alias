import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
// @ts-ignore
import BUILTINS from "../node/modules";


export { BUILTINS };


const SHIM = `/*
  THIS FILE IS AUTO GENERATED AND MANAGED BY react-native-alias
**/
@HEAD@

global.__dirname = "/";
global.__filename = "";
@FOOT@
`;
const SHIMPATH = join(process.cwd(), "node_shim.js");
const SHIMIMPORT = `import "./node_shim.js";\n`;


type ModuleSpec = {
	module: string;
	depends: string[];
	alias: {
		metro: boolean;
		babel: boolean;
	}
	shim: false | {
		head: string;
		body: string;
	}
}


type ReturnType = {
	modules: string[];
	metro: Record<string, string> | false;
	babel: Record<string, string> | false;
	head: string;
	body: string;
	exports: string[];
}


function getSpec(module: string): ModuleSpec {
	return require(`../node/${module}`);
}


export function prepareNodeModules(modules: string[]): ReturnType {
	const shims: string[] = [];
	const metro: Record<string, string> = {};
	const babel: Record<string, string> = {};
	const heads: string[] = [];
	const bodies: string[] = [];
	for (let mod of modules) {
		const spec = getSpec(mod);
		shims.push(spec.module);
		spec.depends.forEach((d) => shims.push(d));
		if (spec.alias.metro) {
			metro[mod] = spec.module;
		}
		if (spec.alias.babel) {
			babel[mod] = spec.module;
		}
		if (spec.shim && spec.shim.head) {
			heads.push(spec.shim.head);
		}
		if (spec.shim && spec.shim.body) {
			bodies.push(spec.shim.body);
		}
	}
	let exports: string[];
	try {
		exports = require(SHIMPATH);
	} catch {
		exports = [];
	}
	exports = exports.concat(modules);
	exports = [...new Set(exports)];
	return {
		modules: shims,
		metro: Object.keys(metro).length ? metro : false,
		babel: Object.keys(babel).length ? babel : false,
		head: heads.join("\n"),
		body: bodies.join("\n"),
		exports,
	}
}


export function shimNode(spec: ReturnType): void {
	let shim = SHIM.replace("@HEAD@", spec.head).replace("@FOOT@", spec.body);
	shim = `${shim}\nconst modules = ${JSON.stringify(spec.exports)};\nexport default modules;`;
	writeFileSync(SHIMPATH, shim, "utf8");

	let index = readFileSync(join(process.cwd(), "index.js"), "utf8");
	if (!index.startsWith(SHIMIMPORT)) {
		index = SHIMIMPORT + index;
		writeFileSync(join(process.cwd(), "index.js"), index, "utf8");
	}
}
