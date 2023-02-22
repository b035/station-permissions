#! /usr/bin/env node

import * as SDK from "@the-stations-project/sdk";

/* MAIN */
async function main(subcommand: string, args: string[]) {
	switch (subcommand) {
		case "create_simple": return await create_simple(args[0]);
		case "mod_simple": return await mod_simple(args[0], args[1], args[2]);
		case "create_approved": return await create_approved(args[0]);
		case "remove": return await remove(args[0]);
		default: return new SDK.Result(SDK.ExitCodes.ErrNoCommand, undefined);
	}
}

/* SUB-FUNCTIONS */
async function create_simple(desc: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);

	/* safety */
	if (SDK.contains_undefined_arguments(arguments)) return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);

	/* get path */
	const path = SDK.Registry.join_paths("permissions", desc);

	/* create dir */
	(await SDK.Registry.mkdir(path)).or_log_error()
		.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));

	return result;
}

async function create_approved(desc: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);

	/* safety */
	if (SDK.contains_undefined_arguments(arguments)) return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);

	/* get path */
	const path = SDK.Registry.join_paths("permissions", desc);

	/* create dir */
	(await SDK.Registry.write(path, "")).or_log_error()
		.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));

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

async function mod_simple(action: string, desc: string, uname: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);

	/* safety */
	if (SDK.contains_undefined_arguments(arguments)) return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);

	/* get path */
	const path = SDK.Registry.join_paths("permissions", desc, uname);

	/* execute */
	switch (action) {
		case "add": {
			(await SDK.Registry.write(path, "")).or_log_error()
				.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));
			break;
		}
		case "remove": {
			(await SDK.Registry.delete(path)).or_log_error()
				.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));
			break;
		}
		default: return result.finalize_with_code(SDK.ExitCodes.ErrNoCommand);
	}

	return result;
}

SDK.start_module(main, (result) => console.log(result.to_string()));
