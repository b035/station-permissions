#! /usr/bin/env node

import * as SDK from "@the-stations-project/sdk";

/* MAIN */
async function main(subcommand: string, args: string[]) {
	switch (subcommand) {
		case "create": return await create(args[0]);
		case "remove": return await remove(args[0]);
		case "rename": return await rename(args[0], args[1]);
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

async function rename(desc: string, new_desc: string) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);

	/* safety */
	if (SDK.contains_undefined_arguments(arguments)) return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);

	/* get path */
	const path = SDK.Registry.join_paths("permissions", desc);
	const new_path = SDK.Registry.join_paths("permissions", new_desc);

	/* delete */
	(await SDK.Registry.move(path, new_path)).or_log_error()
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

	/* get description */
	const desc_result = (await get_action_desc(action, {
		uname: uname,
	})).or_log_error();
	if (desc_result.has_failed) return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
	const desc = desc_result.value!;

	/* reject if no description */
	if (desc == "") return result.finalize_with_value("none");

	/* get paths */
	const sole_path = SDK.Registry.join_paths("permissions", desc, "sole");
	const approved_path = SDK.Registry.join_paths("permissions", desc, "approved");

	/* check permissions */
	const sole_permission_result = (await check_sole_permissions(sole_path, uname)).or_log_error();
	if (!sole_permission_result.has_failed && sole_permission_result.value! == true) return result.finalize_with_value("sole");

	const approved_permission_result = (await check_approved_permissions(approved_path, uname)).or_log_error();
	if (!approved_permission_result.has_failed && approved_permission_result.value! == true) return result.finalize_with_value("approved");

	return result;
}

/* HELPERS */
async function get_action_desc(action: string, flag_values: {[key: string]: string}) {
	const result = new SDK.Result(SDK.ExitCodes.Ok, "");

	/* read directory */
	const read_result = (await SDK.Registry.ls("permissions")).or_log_error();
	if (read_result.has_failed) return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
	const descriptions = read_result.value!
		.reverse(); //alphabetical z-a => most precise description first

	/* process action */
	const action_words = action
		.replace(/["']/g, "")
		.split(" ");

	/* find matching description */
	descloop: for (let desc of descriptions) {
		const desc_words = desc.split(" ");

		for (let i in desc_words) {
			/* process flags */
			if (desc_words[i][0] == "@") {
				const [flag, ...flag_words] = desc_words[i].split("_");

				switch (flag) {
					case "@any": {
						break;
					}
					case "@get": {
						const val = flag_values[flag_words[0]];

						//skip if no match
						if (action_words[i] != val) continue descloop;
						break;
					}
					case "@not": {
						const illegal_words = flag_words 
							.join("|");

						//skip if match
						if (new RegExp(`^(${illegal_words})`).test(action_words[i])) continue descloop;
						break;
					}
					case "@of": {
						const legal_words = flag_words 
							.join("|");

						//skip if no match
						if (!new RegExp(`^(${legal_words})`).test(action_words[i])) continue descloop;
						break;
					}
					default: continue descloop; //safety
				}


			} else {
				//skip if no match
				if (desc_words[i] != action_words[i]) continue descloop;
			}
		}

		//description matches
		return result.finalize_with_value(desc);
	}

	return result;
}

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
