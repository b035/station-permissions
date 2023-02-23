#! /usr/bin/env node

import * as SDK from "@the-stations-project/sdk";

/* MAIN */
async function main(subcommand: string, args: string[]) {
	switch (subcommand) {
		case "create": return await create(args[0]);
		case "remove": return await remove(args[0]);
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

	return result;
}

async function read(desc: string, file: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, "");

	/* get path */
	const path = SDK.Registry.join_paths("permissions", desc, file);

	/* read */
	(await SDK.Registry.read(path)).or_log_error()
		.ok((read_result) => result.finalize_with_value(read_result.value!))
		.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));

	return result;
}

SDK.start_module(main, (result) => console.log(result.to_string()));
