#! /usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const SDK = __importStar(require("@the-stations-project/sdk"));
/* MAIN */
async function main(subcommand, args) {
    switch (subcommand) {
        case "create_simple": return await create_simple(args[0]);
        case "mod_simple": return await mod_simple(args[0], args[1], args[2]);
        case "create_approved": return await create_approved(args[0]);
        case "remove": return await remove(args[0]);
        default: return new SDK.Result(SDK.ExitCodes.ErrNoCommand, undefined);
    }
}
/* SUB-FUNCTIONS */
async function create_simple(desc) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
    /* get path */
    const path = SDK.Registry.join_paths("permissions", desc);
    /* create dir */
    (await SDK.Registry.mkdir(path)).or_log_error()
        .err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));
    return result;
}
async function create_approved(desc) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
    /* get path */
    const path = SDK.Registry.join_paths("permissions", desc);
    /* create dir */
    (await SDK.Registry.write(path, "")).or_log_error()
        .err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));
    return result;
}
async function remove(desc) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
    /* get path */
    const path = SDK.Registry.join_paths("permissions", desc);
    /* delete */
    (await SDK.Registry.delete(path)).or_log_error()
        .err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));
    return result;
}
async function mod_simple(action, desc, uname) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
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
