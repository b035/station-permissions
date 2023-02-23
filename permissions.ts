#! /usr/bin/env node

import * as SDK from "@the-stations-project/sdk";

/* MAIN */
async function main(subcommand: string, args: string[]) {
	switch (subcommand) {
		case "create": return await create(args[0]);
		case "remove": return await remove(args[0]);
		case "read": return await read(args[0], args[1]);
		case "write": return await write(args[0], args[1], args[2]);
		case "check": return await check(args[0], args[1]);
		default: return new SDK.Result(SDK.ExitCodes.ErrNoCommand, undefined);
	}
}

/* SUB-FUNCTIONS */
async function create(desc: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);

	/* safety */
	if (SDK.contains_undefined_arguments(arguments)) return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);

	/* get path */
	const path = SDK.Registry.join_paths("permissions", desc);

	/* create dir */
	(await SDK.Registry.mkdir(path)).or_log_error()
		.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));

	/* write files */
	for (let filename of [
		"sole",
		"approved",
	]) {
		(await SDK.Registry.write(SDK.Registry.join_paths(path, filename), "")).or_log_error()
			.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));
	}

	/* log */
	SDK.log(result.has_failed ? "ERROR" : "ACTIVITY", `Permissions: create "${desc}".`);

	return result;
}

async function remove(desc: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);

	/* safety */
	if (SDK.contains_undefined_arguments(arguments)) return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);

	/* get path */
	const path = SDK.Registry.join_paths("permissions", desc);

	/* delete */
	(await SDK.Registry.delete(path)).or_log_error()
		.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));

	/* log */
	SDK.log(result.has_failed ? "ERROR" : "ACTIVITY", `Permissions: remove "${desc}".`);

	return result;
}

async function read(desc: string, file: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, "");

	/* safety */
	if (SDK.contains_undefined_arguments(arguments)) return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);

	/* get path */
	const path = SDK.Registry.join_paths("permissions", desc, file);

	/* read */
	(await SDK.Registry.read(path)).or_log_error()
		.ok((read_result) => result.finalize_with_value(read_result.value!))
		.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));

	return result;
}

async function write(desc: string, file: string, value: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);

	/* safety */
	if (SDK.contains_undefined_arguments(arguments)) return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);

	/* get path */
	const path = SDK.Registry.join_paths("permissions", desc, file);

	/* write */
	(await SDK.Registry.write(path, value)).or_log_error()
		.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));

	/* log */
	SDK.log(result.has_failed ? "ERROR" : "ACTIVITY", `Permissions: write "${desc}/${file}".`);

	return result;
}

type CheckResult = "none" | "sole" | "approved"
async function check(action: string, uname: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, "none" as CheckResult);

	/* safety */
	if (SDK.contains_undefined_arguments(arguments)) return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);

	/* get paths */
	const sole_path = SDK.Registry.join_paths("permissions", action, "sole");
	const approved_path = SDK.Registry.join_paths("permissions", action, "approved");

	/* check permissions */
	const sole_permission_result = (await check_sole_permissions(sole_path, uname)).or_log_error();
	if (!sole_permission_result.has_failed && sole_permission_result.value! == true) return result.finalize_with_value("sole");

	const approved_permission_result = (await check_approved_permissions(approved_path, uname)).or_log_error();
	if (!approved_permission_result.has_failed && approved_permission_result.value! == true) return result.finalize_with_value("approved");

	return result;
}

/* HELPERS */
async function check_sole_permissions(file_path: string, uname: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, false);

	/* read file */
	const read_result = (await SDK.Registry.read(file_path)).or_log_error();
	if (read_result.has_failed) return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
	const text = read_result.value!;

	/* parse file */
	const groups = text.split("\n");

	/* check permission */
	for (let group of groups) {
		/* check if user is in group */
		const shell_result = (await SDK.Shell.exec_sync(`groups mod_users ${group} check ${uname}`)).or_log_error();
		//safety
		if (shell_result.has_failed) continue;

		const [code, value] = shell_result.value!.split("\n")[0].split("|");
		if (code == "0" && value == "true") return result.finalize_with_value(true);
	}

	return result;
}

async function check_approved_permissions(file_path: string, uname: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, false);

	/* read file */
	const read_result = (await SDK.Registry.read(file_path)).or_log_error();
	if (read_result.has_failed) return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
	const text = read_result.value!;

	/* parse file */
	const conditions = text.split("\n");

	/* check permission */
	for (let condition of conditions) {
		/* check if user is in one of the groups */
		//extract groups
		const groups = 
			condition.split(",")
			.map(x => x.split(/[\.%]/)[0]);

		for (let group of groups) {
		const shell_result = (await SDK.Shell.exec_sync(`groups mod_users ${group} check ${uname}`)).or_log_error();
		//safety
		if (shell_result.has_failed) continue;
			const [code, value] = shell_result.value!.split("\n")[0].split("|");
			if (code == "0" && value == "true") return result.finalize_with_value(true);
		}
	}

	return result;
}

SDK.start_module(main, (result) => console.log(result.to_string()));
