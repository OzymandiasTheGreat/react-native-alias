#!/usr/bin/env node
import { existsSync } from "fs";
import { program } from "commander";
import { MetroConfigPath } from "./metro";
import { BabelConfigPath } from "./babel";
import { PackageJSONPath } from "./util";
import { handleAlias, handleUnalias, handleNode } from "./alias";


if (!existsSync(MetroConfigPath) || !existsSync(BabelConfigPath) || !existsSync(PackageJSONPath)) {
	console.error("No React Native project detected.")
	process.exit(1);
}


program
	.command("alias", { isDefault: true })
	.description("Add alias for given module:shim pairs")
	.argument("<module:shim...>", "module to alias/shim and shim to resolve when importing module")
	.option("-b, --babel", "Also add babel alias", false)
	.action(handleAlias);
program
	.command("unalias")
	.description("Remove previously added alias")
	.argument("<modules...>", "modules for which to remove alias")
	.option("-b, --babel", "Also remove babel alias")
	.action(handleUnalias);
program
	.command("node")
	.description("Use a well known shim to shim builtin node modules")
	.argument("[modules...]", "builtin node modules to shim")
	.option("-a, --all", "Install shims for all builtin node modules", false)
	.option("-n, --no-shim", "Don't generate node-shim.js in the project root", true)
	.action(handleNode);


program.parse();
