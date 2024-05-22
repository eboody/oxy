
import { P } from "npm:ts-pattern@5.1.1";

/**
 * Represents a successful JSON-RPC response.
 * @template Data - The type of the result data.
 */
export type JsonRpcSuccess<Data> = P.infer<typeof JsonRpcSuccessPattern> & {
	result: Data;
};

/**
 * Represents an error JSON-RPC response.
 * @template ErrorData - The type of the error data.
 */
export type JsonRpcError<ErrorData> = P.infer<typeof JsonRpcErrorPattern> & {
	error: {
		code: number;
		message: string;
		data?: ErrorData;
	};
};

/**
 * Checks if the given object is a JSON-RPC error response.
 * @template T - The type of the error data.
 * @param {object} obj - The object to check.
 * @param {unknown} obj.jsonrpc - The JSON-RPC version.
 * @param {unknown} obj.result - The result of the JSON-RPC call.
 * @param {unknown} obj.id - The identifier of the JSON-RPC call.
 * @param {unknown} obj.error - The error object of the JSON-RPC call.
 * @returns {boolean} True if the object is a JSON-RPC error response, otherwise false.
 */
function isJsonRpcError<T>(obj: { jsonrpc?: unknown, result?: unknown, id?: unknown, error?: unknown }): obj is JsonRpcError<T> {
	return obj["jsonrpc"] && obj["result"] && obj["error"] ? true : false;
}

/**
 * Checks if the given object is a successful JSON-RPC response.
 * @template T - The type of the result data.
 * @param {object} obj - The object to check.
 * @param {unknown} obj.jsonrpc - The JSON-RPC version.
 * @param {unknown} obj.result - The result of the JSON-RPC call.
 * @param {unknown} obj.id - The identifier of the JSON-RPC call.
 * @param {unknown} obj.error - The error object of the JSON-RPC call.
 * @returns {boolean} True if the object is a successful JSON-RPC response, otherwise false.
 */
function isJsonRpcSuccess<T>(obj: { jsonrpc?: unknown, result?: unknown, id?: unknown, error?: unknown }): obj is JsonRpcSuccess<T> {
	return obj["jsonrpc"] && obj["id"] && obj["result"] ? true : false;
}

/**
 * Pattern for matching successful JSON-RPC responses.
 */
export const JsonRpcSuccessPattern: {
	readonly id: any;
	readonly jsonrpc: any;
	readonly result: {
		readonly data: any;
	};
} = {
	id: P.union(P.string, P.number, P.nullish),
	jsonrpc: P.optional("2.0"),
	result: { data: P.any }
} as const;

/**
 * Pattern for matching JSON-RPC error responses.
 */
export const JsonRpcErrorPattern: {
	readonly id: any;
	readonly jsonrpc: any;
	readonly error: {
		readonly message: any;
		readonly data: {
			readonly req_uuid: any;
			readonly detail: any;
		};
	};
} = {
	id: P.union(P.string, P.number, P.nullish),
	jsonrpc: P.optional("2.0"),
	error: {
		message: P.string,
		data: {
			req_uuid: P.string,
			detail: P.any
		},
	},
} as const;

