#! /usr/bin/env node

import * as SDK from "@the-stations-project/sdk";

async function init() {
	const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);

	/* create directory */
	(await SDK.Registry.mkdir("permissions"))
		.err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));

	return result;
}

init().then((result) => console.log(result.to_string()));
