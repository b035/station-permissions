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
        case "create": return await create(args[0]);
        case "remove": return await remove(args[0]);
        case "rename": return await rename(args[0], args[1]);
        case "read": return await read(args[0], args[1]);
        case "mod": return await mod(args[0], args[1], args[2], args[3]);
        case "check": return await check(args[0], args[1]);
        case "check_approval": return await check_approved_permissions(args[0], args[1]);
        case "list_conditions": return await list_conditions(args[0]);
        default: return new SDK.Result(SDK.ExitCodes.ErrNoCommand, undefined);
    }
}
/* SUB-FUNCTIONS */
async function create(desc) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
    /* get path */
    const path = SDK.Registry.join_paths("permissions", desc);
    /* create dir */
    (await SDK.Registry.mkdir(path)).or_log_error()
        .err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));
    /* write files */
    for (let dirname of [
        "sole",
        "approved",
    ]) {
        (await SDK.Registry.mkdir(SDK.Registry.join_paths(path, dirname))).or_log_error()
            .err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));
    }
    /* log */
    SDK.log(result.has_failed ? "ERROR" : "ACTIVITY", `Permissions: create "${desc}".`);
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
    /* log */
    SDK.log(result.has_failed ? "ERROR" : "ACTIVITY", `Permissions: remove "${desc}".`);
    return result;
}
async function rename(desc, new_desc) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
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
async function read(desc, file) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, []);
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
    /* get path */
    const path = SDK.Registry.join_paths("permissions", desc, file);
    /* read */
    (await SDK.Registry.ls(path)).or_log_error()
        .ok((read_result) => result.finalize_with_value(read_result.value))
        .err(() => result.finalize_with_code(SDK.ExitCodes.ErrUnknown));
    return result;
}
async function mod(desc, action, dir, value) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, undefined);
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
    /* get path */
    const path = SDK.Registry.join_paths("permissions", desc, dir, value);
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
        default: return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
    }
    /* log */
    SDK.log(result.has_failed ? "ERROR" : "ACTIVITY", `Permissions: write "${path}".`);
    return result;
}
async function check(action, uname) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, "none");
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
    /* get description */
    const desc_result = (await get_action_desc(action, {
        uname: uname,
    })).or_log_error();
    if (desc_result.has_failed)
        return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
    const desc = desc_result.value;
    /* reject if no description */
    if (desc == "")
        return result.finalize_with_value("none");
    /* get paths */
    const sole_path = SDK.Registry.join_paths("permissions", desc, "sole");
    const approved_path = SDK.Registry.join_paths("permissions", desc, "approved");
    /* check permissions */
    const sole_permission_result = (await check_sole_permissions(sole_path, uname)).or_log_error();
    if (!sole_permission_result.has_failed && sole_permission_result.value == true)
        return result.finalize_with_value("sole");
    const approved_permission_result = (await check_approved_permissions(approved_path, uname)).or_log_error();
    if (!approved_permission_result.has_failed && approved_permission_result.value == true)
        return result.finalize_with_value("approved");
    return result;
}
async function list_conditions(action) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, "");
    /* safety */
    if (SDK.contains_undefined_arguments(arguments))
        return result.finalize_with_code(SDK.ExitCodes.ErrMissingParameter);
    /* get description */
    const desc_result = (await get_action_desc(action, {
        uname: "",
    })).or_log_error();
    if (desc_result.has_failed)
        return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
    const desc = desc_result.value;
    /* get path */
    const file_path = SDK.Registry.join_paths(desc, "approved");
    /* read file */
    const read_result = (await SDK.Registry.ls(file_path)).or_log_error();
    if (read_result.has_failed)
        return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
    const conditions = read_result.value;
    return result.finalize_with_value(conditions.join("\n"));
}
/* HELPERS */
async function get_action_desc(action, flag_values) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, "");
    /* read directory */
    const read_result = (await SDK.Registry.ls("permissions")).or_log_error();
    if (read_result.has_failed)
        return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
    const descriptions = read_result.value
        .reverse(); //alphabetical z-a => most precise description first
    /* process action */
    const action_words = [];
    action = action
        .replace(/ +$/, "") //trailing whitespaces
        .replace(/^ +/, ""); //leading whitespaces
    //loop over characters
    let word_start = 0;
    let arg_with_quotation_marks = false;
    for (let i = 0; i < action.length; i++) {
        let char = action[i];
        let word_end = i;
        //look out for whitespace or quotation mark
        switch (char) {
            case " ": {
                if (arg_with_quotation_marks)
                    continue;
                //skip if previous character was whitespace or quotation mark
                if (/[ "]/.test(action[i - 1])) {
                    word_start++;
                    continue;
                }
                break;
            }
            case "\"": {
                if (arg_with_quotation_marks) {
                    arg_with_quotation_marks = false;
                }
                else {
                    arg_with_quotation_marks = true;
                    word_start += 1;
                    continue;
                }
                break;
            }
            default:
                {
                    //skip if not last character
                    if (i < action.length - 1)
                        continue;
                    //if last chacter include entire word
                    else
                        word_end = action.length;
                }
                ;
        }
        const word_before = action.substring(word_start, word_end);
        action_words.push(word_before);
        word_start = i + 1;
    }
    /* find matching description */
    descloop: for (let desc of descriptions) {
        const desc_words = desc.split(" ");
        for (let i in desc_words) {
            /* process flags */
            if (desc_words[i].substring(0, 2) == "--") {
                const [flag, ...flag_words] = desc_words[i].split("__");
                switch (flag) {
                    case "--any": {
                        break;
                    }
                    case "--get": {
                        const val = flag_values[flag_words[0]];
                        //skip if no match
                        if (action_words[i] != val)
                            continue descloop;
                        break;
                    }
                    case "--not": {
                        const illegal_words = flag_words
                            .join("|");
                        //skip if match
                        if (new RegExp(`^(${illegal_words})`).test(action_words[i]))
                            continue descloop;
                        break;
                    }
                    case "--of": {
                        const legal_words = flag_words
                            .join("|");
                        //skip if no match
                        if (!new RegExp(`^(${legal_words})`).test(action_words[i]))
                            continue descloop;
                        break;
                    }
                    default: continue descloop; //safety
                }
            }
            else {
                //skip if no match
                if (desc_words[i] != action_words[i])
                    continue descloop;
            }
        }
        //description matches
        return result.finalize_with_value(desc);
    }
    return result;
}
async function check_sole_permissions(file_path, uname) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, false);
    /* read dir */
    const read_result = (await SDK.Registry.ls(file_path)).or_log_error();
    if (read_result.has_failed)
        return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
    const groups = read_result.value;
    /* check permission */
    for (let group of groups) {
        /* check if user is in group */
        const shell_result = (await SDK.Shell.exec_sync(`groups mod_users ${group} check ${uname}`)).or_log_error();
        //safety
        if (shell_result.has_failed)
            continue;
        const [code, value] = shell_result.value.split("\n")[0].split("|");
        if (code == "0" && value == "true")
            return result.finalize_with_value(true);
    }
    return result;
}
async function check_approved_permissions(file_path, uname) {
    const result = new SDK.Result(SDK.ExitCodes.Ok, false);
    /* read file */
    const read_result = (await SDK.Registry.ls(file_path)).or_log_error();
    if (read_result.has_failed)
        return result.finalize_with_code(SDK.ExitCodes.ErrUnknown);
    const conditions = read_result.value;
    /* check permission */
    for (let condition of conditions) {
        /* check if user is in one of the groups */
        //extract groups
        const groups = condition.split(",")
            .map(x => x.split(/[\.%]/)[0]);
        for (let group of groups) {
            const shell_result = (await SDK.Shell.exec_sync(`groups mod_users ${group} check ${uname}`)).or_log_error();
            //safety
            if (shell_result.has_failed)
                continue;
            const [code, value] = shell_result.value.split("\n")[0].split("|");
            if (code == "0" && value == "true")
                return result.finalize_with_value(true);
        }
    }
    return result;
}
SDK.start_module(main, (result) => console.log(result.to_string()));
