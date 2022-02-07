import { readFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { isNpm } from "is-npm";


export const PackageJSONPath = join(process.cwd(), "package.json");


export function prependHeader(path: string, body: string): string {
	const needle = "module.exports = ";
	const config = readFileSync(path, "utf8");
	const index  = config.indexOf(needle) + needle.length;
	const header = config.slice(0, index);
	return header + body + (body.endsWith("\n") ? "" : "\n");
}


export function unquoteKeys(body: string): string {
	return body.replaceAll(/"([a-zA-Z_]\w*?)":/g, "$1:");
}


export function normalizeWhiteSpace(body: string): string {
	return body.replaceAll("\t", "  ");
}


export function checkDependencies(modules: string[]): string[] {
	const pkg = require(PackageJSONPath);
	const deps = Object.keys(pkg.dependencies);
	const missing: Set<string> = new Set();
	for (let mod of modules) {
		if (!deps.includes(mod)) {
			missing.add(mod);
		}
	}
	return [...missing];
}


export function installMissing(modules: string[], flags = ""): void {
	const pm = isNpm ? "npm i" : "yarn add";
	modules = checkDependencies(modules);
	if (!modules.length) {
		return;
	}
	const status = spawnSync(`${pm} ${flags} ${modules.join(" ")}`, { shell: true });
	if (status.status) {
		throw new Error(`Command ${pm} failed`);
	}
}


export function uninstall(modules: string[]): void {
	const pkg = require(PackageJSONPath);
	const installed = Object.keys(pkg.dependencies).concat(Object.keys(pkg.devDependencies), Object.keys(pkg.peerDependencies || {}));
	const toRemove: Set<string> = new Set();
	for (let mod of modules) {
		if (installed.includes(mod)) {
			toRemove.add(mod);
		}
	}
	if (!toRemove.size) {
		return;
	}
	const pm = isNpm ? "npm rm" : "yarn remove";
	const status = spawnSync(`${pm} ${[...toRemove].join(" ")}`, { shell: true });
	if (status.status) {
		throw new Error(`Command ${pm} failed`);
	}
}
