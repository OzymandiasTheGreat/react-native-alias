import { writeFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import serialize from "serialize-javascript";
import { isNpm } from "is-npm";
import { prependHeader, unquoteKeys, normalizeWhiteSpace } from "./util";


export const BabelConfigPath = join(process.cwd(), "babel.config.js");
const PluginPrefix = "babel-plugin-";
const PluginName = "module-resolver";


type BabelConfig = {
	presets: string[];
	plugins: (string | [string, Record<string, Record<string, string>>])[];
}


function loadAndCheck(): [BabelConfig, number] {
	const babelConfig: BabelConfig = require(BabelConfigPath);
	if (!("plugins" in babelConfig)) {
		babelConfig.plugins = [];
	}
	let pluginIndex = babelConfig.plugins.findIndex((p) => p === PluginName || p[0] === PluginName);
	if (pluginIndex === -1) {
		const pm = isNpm ? "npm i" : "yarn add";
		const errcode = spawnSync(`${pm} -D ${PluginPrefix}${PluginName}`, { shell: true });
		if (errcode.status) {
			throw new Error(`Failed to install ${PluginPrefix}${PluginName}`);
		}
		pluginIndex = babelConfig.plugins.push([PluginName, { alias: {} }]) - 1;
	}
	if (typeof babelConfig.plugins[pluginIndex] === "string") {
		babelConfig.plugins[pluginIndex] = [PluginName, { alias: {} }];
	}
	return [babelConfig, pluginIndex];
}


function writeOut(babelConfig: BabelConfig): void {
	let babelString = serialize(babelConfig, { space: 2, unsafe: true });
	babelString = prependHeader(BabelConfigPath, babelString);
	babelString = unquoteKeys(babelString);
	babelString = normalizeWhiteSpace(babelString);
	writeFileSync(BabelConfigPath, babelString, "utf8");
}


export function addBabelAlias(modules: Record<string, string>): void {
	const [babelConfig, index] = loadAndCheck();
	const alias = (babelConfig.plugins[index][1] as Record<string, Record<string, string>>).alias;
	for (let [pkg, shim] of Object.entries(modules)) {
		alias[pkg] = shim;
	}
	writeOut(babelConfig);
}


export function removeBabelAlias(modules: string[]): void {
	const [babelConfig, index] = loadAndCheck();
	const alias = (babelConfig.plugins[index][1] as Record<string, Record<string, string>>).alias;
	for (let pkg of modules) {
		delete alias[pkg];
	}
	writeOut(babelConfig);
}
