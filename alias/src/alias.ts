import { addMetroAlias, removeMetroAlias } from "./metro";
import { addBabelAlias, removeBabelAlias } from "./babel";
import { prepareNodeModules, shimNode, BUILTINS } from "./node";
import { installMissing, uninstall } from "./util";


interface AliasOptions {
	babel: boolean;
}


interface NodeOptions {
	all: boolean;
	shim: boolean;
}


export function handleAlias(pairs: string[], options: AliasOptions): void {
	const modules: Record<string, string> = {};
	const shims: string[] = [];
	pairs.forEach((pair) => {
		const [module, shim] = pair.split(":");
		if (!shim) {
			console.error(`No shim provided for module ${module}`);
			process.exit(1);
		}
		modules[module] = shim;
		shims.push(shim);
	});
	try {
		installMissing(shims);
	} catch (err) {
		console.error(`Failed to install shims. ${(err as Error).message}`);
		process.exit(1);
	}
	try {
		addMetroAlias(modules);
	} catch (err) {
		console.error((err as Error).message);
		process.exit(1);
	}
	console.log(`Added metro alias for ${Object.keys(modules).join(", ")}`);
	if (options.babel) {
		try {
			addBabelAlias(modules);
		} catch (err) {
			console.error((err as Error).message);
			process.exit(1);
		}
		console.log(`Added babel alias for ${Object.keys(modules).join(", ")}`);
	}
}


export function handleUnalias(modules: string[], options: AliasOptions): void {
	let shims: string[];
	try {
		shims = removeMetroAlias(modules);
	} catch (err) {
		console.error((err as Error).message);
		process.exit(1);
	}
	console.log(`Removed alias for ${modules.join(", ")}`);
	try {
		uninstall(shims);
	} catch (err) {
		console.error((err as Error).message);
		process.exit(1);
	}
	console.log(`Removed shims for ${modules.join(", ")}`);
	if (options.babel) {
		try {
			removeBabelAlias(modules);
		} catch (err) {
			console.error((err as Error).message);
			process.exit(1);
		}
		console.log(`Removed babel alias for ${modules.join(", ")}`);
	}
}


export function handleNode(modules: string[], options: NodeOptions): void {
	if (!modules.length && !options.all) {
		console.error("No modules supplied");
		process.exit(1);
	}
	if (modules.length && options.all) {
		console.error("Too many arguments");
		process.exit(1);
	}
	const unknown = modules.filter((m) => !BUILTINS.includes(m));
	if (unknown.length) {
		console.error(`No known shims for module(s): ${unknown.join(", ")}`);
		process.exit(1);
	}
	const spec = prepareNodeModules(options.all ? BUILTINS : modules);
	try {
		installMissing(spec.modules);
	} catch (err) {
		console.error((err as Error).message);
		process.exit(1);
	}
	console.log("Installed shims");
	if (spec.metro) {
		try {
			addMetroAlias(spec.metro);
		} catch (err) {
			console.error((err as Error).message);
			process.exit(1);
		}
		console.log("Added metro alias");
	}
	if (spec.babel) {
		try {
			addBabelAlias(spec.babel);
		} catch (err) {
			console.error((err as Error).message);
			process.exit(1);
		}
		console.log("Added babel alias");
	}
	if (options.shim) {
		console.log("Writing node_shim.js");
		try {
			shimNode(spec);
		} catch (err) {
			console.error((err as Error).message);
			process.exit(1);
		}
		console.log("Done");
	}
}
