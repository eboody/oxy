import { P } from "npm:ts-pattern";

export type JsonRpcSuccess<Data> = P.infer<typeof JsonRpcSuccessPattern> & {
	result: Data;
};

export type JsonRpcError<ErrorData> = P.infer<typeof JsonRpcErrorPattern> & {
	error: {
		code: number;
		message: string;
		data?: ErrorData;
	};
};

function isJsonRpcError<T>(obj: { jsonrpc?: unknown, result?: unknown, id?: unknown, error?: unknown }): obj is JsonRpcError<T> {
	return obj["jsonrpc"] && obj["result"] && obj["error"] ? true : false;
}
function isJsonRpcSuccess<T>(obj: { jsonrpc?: unknown, result?: unknown, id?: unknown, error?: unknown }): obj is JsonRpcSuccess<T> {
	return obj["jsonrpc"] && obj["id"] && obj["result"] ? true : false;
}

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


