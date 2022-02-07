import { readFileSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import findRoot from "find-root";
import serialize from "serialize-javascript";
import { normalizeWhiteSpace, prependHeader, unquoteKeys } from "./util";


export const MetroConfigPath = join(process.cwd(), "metro.config.js");
const MonorepoInserts = {
	"\"extraNodeModules\": {": "\n      ...monorepoMetroTools.extraNodeModules,",
};


function replace(body: string, tokens: Record<string, string>): string {
	for (let [needle, replacement] of Object.entries(tokens)) {
		body = body.replace(new RegExp("(?<=: )" + JSON.stringify(needle) + "(?=(?:,\n)|\n)", "g"), replacement);
	}
	return body;
}


function insert(body: string, inserts: Record<string, string>): string {
	for (let [needle, insert] of Object.entries(inserts)) {
		if (body.includes(needle)) {
			const index = body.indexOf(needle) + needle.length;
			body = body.slice(0, index) + insert + body.slice(index);
		}
	}
	return body;
}


function packageName(module: string): string | null {
	if (!module.includes("/node_modules/")) {
		return null;
	}
	const root = findRoot(dirname(module));
	if (!root) {
		return null;
	}
	return require(join(root, "package.json")).name;
}


function monorepoCleanAlias(alias: Record<string, string>): void {
	const { getMetroTools } = require("react-native-monorepo-tools");
	const monorepoAlias = getMetroTools().extraNodeModules;
	for (let key of Object.keys(monorepoAlias)) {
		delete alias[key];
	}
}


function getAliasTokens(alias: Record<string, string>): Record<string, string> {
	const tokens: Record<string, string> = {};
	for (let module of Object.values(alias)) {
		const pkg = packageName(module);
		if (pkg) {
			tokens[module] = `require.resolve("${pkg}")`;
		} else {
			const resolved = require.resolve(module);
			if (resolved === module) {
				tokens[module] = `require.resolve("${module}")`;
			} else {
				const rel = relative(process.cwd(), module);
				tokens[module] = `require.resolve("./${rel}")`;
			}
		}
	}
	return tokens;
}


function isMonorepo(): boolean {
	const body = readFileSync(MetroConfigPath, "utf8");
	return body.includes(`require("react-native-monorepo-tools")`) || body.includes(`require('react-native-monorepo-tools')`);
}


function monorepoRestoreVars(body: string, config: Record<string, any>): string {
	const publicPathRegEx = /"publicPath": ".*?",/;
	const watchFoldersRegEx = /"watchFolders": \[.*\],/s;
	const blockListRegExp = /"blockList": new RegExp\(.+?\)(?=,\n)/;

	const blockListString = `"blockList": exclusionList([
			...monorepoMetroTools.blockList,
		])`;
	const publicPathString = "publicPath: androidAssetsResolutionFix.publicPath,";
	const watchFoldersString = "watchFolders: monorepoMetroTools.watchFolders,";

	body = body.replace(publicPathRegEx, publicPathString);
	body = body.replace(watchFoldersRegEx, watchFoldersString);
	body = body.replace(blockListRegExp, blockListString);
	body = insert(body, MonorepoInserts);
	return body;
}


function stepOne(): [boolean, any] | null {
	const metroConfig = require(MetroConfigPath);
	if (typeof metroConfig === "function") {
		return null;
	}
	if (!("resolver" in metroConfig)) {
		metroConfig.resolver = {};
	}
	if (!("extraNodeModules" in metroConfig.resolver)) {
		metroConfig.resolver.extraNodeModules = {};
	}
	const monorepo = isMonorepo();
	if (monorepo) {
		monorepoCleanAlias(metroConfig.resolver.extraNodeModules);
	}
	return [monorepo, metroConfig];
}


function stepTwo(monorepo: boolean, metroConfig: any): void {
	const aliasTokens = getAliasTokens(metroConfig.resolver.extraNodeModules);
	let configString = serialize(metroConfig, { space: 2, unsafe: true });
	configString = replace(configString, aliasTokens);
	if (monorepo) {
		configString = monorepoRestoreVars(configString, metroConfig);
	}
	configString = prependHeader(MetroConfigPath, configString);

	configString = unquoteKeys(configString);
	configString = normalizeWhiteSpace(configString);

	writeFileSync(MetroConfigPath, configString, "utf8");
}


export function addMetroAlias(modules: Record<string, string>): void {
	const result = stepOne();
	if (result === null) {
		throw new Error("Functional Metro config is not supported");
	}
	const [monorepo, metroConfig] = result;
	for (let [pkg, shim] of Object.entries(modules)) {
		metroConfig.resolver.extraNodeModules[pkg] = require.resolve(shim, { paths: [process.cwd()] });
	}
	stepTwo(monorepo, metroConfig);
}


export function removeMetroAlias(modules: string[]): string[] {
	const result = stepOne();
	if (result === null) {
		throw new Error("Functional Metro config is not supported");
	}
	const [monorepo, metroConfig] = result;
	const shims: Set<string> = new Set();
	for (let pkg of modules) {
		if (metroConfig.resolver.extraNodeModules[pkg]) {
			const shim = packageName(metroConfig.resolver.extraNodeModules[pkg]);
			if (shim) {
				shims.add(shim);
			}
		}
		delete metroConfig.resolver.extraNodeModules[pkg];
	}
	stepTwo(monorepo, metroConfig);
	return [...shims];
}
