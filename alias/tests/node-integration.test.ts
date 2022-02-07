import { join } from "path";
import { copySync, removeSync } from "fs-extra";
import { ROOTDIR, FIXTURES, setup, build, run } from "./common";


afterAll(() => removeSync(ROOTDIR));


test("Vanilla project node integration", () => {
	const dir = setup(false);
	expect(dir).not.toBeNull();
	let buildres = build(dir as string, "init");
	expect(buildres).toBeTruthy();
	copySync(join(FIXTURES, "node"), dir as string);
	buildres = build(dir as string, "intermediate");
	expect(buildres).toBeFalsy();
	let runres = run(dir as string, "node --all");
	expect(runres).toBeTruthy();
	buildres = build(dir as string, "final");
	expect(buildres).toBeTruthy();
	removeSync(dir as string);
});


test("Monorepo project node integration", () => {
	const dir = setup(true);
	expect(dir).not.toBeNull();
	let buildres = build(dir as string, "init");
	expect(buildres).toBeTruthy();
	copySync(join(FIXTURES, "node"), dir as string);
	buildres = build(dir as string, "intermediate");
	expect(buildres).toBeFalsy();
	let runres = run(dir as string, "node --all");
	expect(runres).toBeTruthy();
	buildres = build(dir as string, "final");
	expect(buildres).toBeTruthy();
	removeSync(dir as string);
});
