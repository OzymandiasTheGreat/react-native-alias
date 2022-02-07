import { join, resolve } from "path";
import { spawnSync } from "child_process";
import { copySync, existsSync, mkdirpSync } from "fs-extra";


export const FIXTURES = resolve(__dirname, "fixtures");
export const ROOTDIR = resolve(__dirname, "../../tmp");
export const SHELL = "/usr/bin/bash";
export const CLI = resolve(__dirname, "../build/cli.js");


export function setup(monorepo: boolean): string | null {
	const dir = monorepo ? "monorepo" : "vanilla";
	const title = monorepo ? "Monorepo" : "Vanilla";
	mkdirpSync(ROOTDIR);
	let result = spawnSync(`npx --yes react-native init ${title} --directory ${dir}`, {
		cwd: ROOTDIR,
		shell: SHELL,
	});
	if (result.status !== 0) {
		return null;
	}
	const repo = join(ROOTDIR, dir);
	if (monorepo) {
		result = spawnSync(`yarn add --dev react-native-monorepo-tools`, {
			cwd: repo,
			shell: SHELL,
		});
		if (result.status !== 0) {
			return null;
		}
		copySync(join(FIXTURES, "monorepo"), repo);
	}
	return repo;
}


export function build(dir: string, name: string): boolean {
	const result = spawnSync(`npx --yes react-native bundle --entry-file ./index.js --bundle-output ./${name}.js --platform android`, {
		cwd: dir,
		shell: SHELL,
	});
	if (result.status !== 0 || !existsSync(join(dir, `${name}.js`))) {
		return false;
	}
	return true;
}


export function run(dir: string, opts: string): boolean {
	const result = spawnSync(`node ${CLI} ${opts}`, {
		cwd: dir,
		shell: SHELL,
	});
	return result.status === 0;
}
