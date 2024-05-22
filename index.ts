export * from "npm:ts-pattern@5.1.1";
export * from "./error_enum.ts";
export * from "./result.ts";
export * from "./option.ts";
export * from "./json_rpc.ts";

export function capitalize(s: string): string {
	let first_letter = s.slice(0, 1).toUpperCase();
	return s.replace(s.slice(0, 1), first_letter);
}
