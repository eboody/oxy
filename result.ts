import { P, match } from 'npm:ts-pattern';
import { JsonRpcSuccessPattern, JsonRpcErrorPattern } from './json_rpc.ts';

export type Result<Thing, Error> = Thing extends Ok<infer R>
	? Ok<R>
	: Ok<Thing> | (Error extends Err<infer R> ? Err<R> : Err<Error>);

export type Ok<Thing> = {
	readonly isOk: true;
	readonly data: Thing;
	readonly isError: false;
	map<U>(fn: (data: Thing) => U): Ok<U>;
};

export type Err<ErrorData> = {
	readonly isOk: false;
	readonly data: ErrorData;
	readonly isError: true;
	readonly timestamp: Date;
	map<U>(fn: (data: never) => U): Err<ErrorData>;
};

export const Ok = <Thing>(thing: Thing): Ok<Thing> => ({
	isOk: true,
	data: thing,
	isError: false,
	map<U>(fn: (data: Thing) => U): Ok<U> {
		const newData = fn(this.data);
		return Ok(newData);
	}
});

// Implement the Err factory function with map method
export const Err = <ErrorData>(errorData: ErrorData): Err<ErrorData> => ({
	isOk: false,
	data: errorData,
	isError: true,
	timestamp: new Date(),
	map<U>(fn: (data: never) => U): Err<ErrorData> {
		// Err's map simply returns itself, ignoring the map function.
		return this;
	}
});

// // Implement the map function for Ok and Err types
// Ok.map = function <T, U>(fn: (value: T) => U): Result<U, unknown> {
// 	return Ok(fn(this.data)) as Result<U, unknown>;
// };
//
// Err.map = function <T, E>(fn: (value: T) => any): Result<unknown, E> {
// 	return this;
// };

export type OkVariant<R extends Result<unknown, unknown>> = R extends Ok<unknown> ? R : never;
export type ErrorVariant<R extends Result<unknown, unknown>> = R extends Ok<unknown> ? never : R;

// export const isOk = <Thing, Error>(
//   result: Result<Thing, Error>
// ): result is Ok<Thing> => {
//   return result.isOk;
// };
// export const isErr = <Thing, Error>(
//   result: Ok<Thing> | Err<Error>
// ): result is Err<Error> => {
//   return !result.ok;
// };

export const ERROR: {
	readonly isOk: false;
	readonly isError: true;
	readonly data: any;
}
	= { isOk: false, isError: true, data: P.select() } as const;
export const OK: {
	readonly isOk: true;
	readonly isError: false;
	readonly data: any;
} = { isOk: true, isError: false, data: P.select() } as const;

const AxiosErrorPattern = {
	response: {
		headers: {
			'content-length': P.string,
			'content-type': P.string
		},
		data: P.select()
	}
} as const

const FetchResponsePattern = {
	ok: P.boolean,
	redirected: P.boolean,
	status: P.number,
	statusText: P.string,
} as const;

export async function Try<HappyPath extends (...args: any[]) => any, T>(
	happyPath: HappyPath,
	sadPath?: (...args: any[]) => T
): Promise<
	Result<
		Awaited<
			ReturnType<HappyPath> extends Ok<any>
			? OkVariant<ReturnType<HappyPath>>['data']
			: ReturnType<HappyPath>
		>,
		T extends Err<infer U> ? U : T
	>
> {
	const promise = new Promise((resolve) => {
		//first try to run the function as if it were async
		try {
			return happyPath()
				.then((valueWeWant: any) => {
					return resolve(
						match(valueWeWant)
							.with(FetchResponsePattern, async (res) => {
								//@ts-ignore
								const json = await res.json();
								return match(json)
									.with(JsonRpcSuccessPattern, (result) => Ok(result))
									.with(JsonRpcErrorPattern, (result) => (sadPath ? sadPath(result) : Err(result)))
									.otherwise((val) => Ok(val));
							}) // Match JSON-RPC success
							.with(OK, () => valueWeWant) // Existing OK match
							.otherwise(() => Ok(valueWeWant))
					);
				})
				.catch((error: any) => {
					return resolve(
						match(error)
							.with(JsonRpcErrorPattern, (errorData) => Err(errorData)) // Match JSON-RPC error
							.with(ERROR, () => error)
							.otherwise(() => (sadPath ? sadPath(error) : Err(error)))
					);
				});
		} catch {
			//if happypath doesnt return a promise well land here
			try {
				const valueWeWant = happyPath();
				return resolve(
					match(valueWeWant)
						.with(OK, () => valueWeWant) // Existing OK match
						.with(ERROR, () => valueWeWant) // Existing ERROR match
						.otherwise(() => Ok(valueWeWant)) // Handle other cases
				);
			} catch (error: any) {
				return resolve(
					match(error)
						.with(ERROR, () => error) // Existing ERROR match
						.otherwise(() => (sadPath ? sadPath(error) : Err(error))) // Handle other errors
				);
			}
		}
	});
	return promise as Promise<
		Result<
			Awaited<
				ReturnType<HappyPath> extends Ok<any>
				? OkVariant<ReturnType<HappyPath>>['data']
				: ReturnType<HappyPath>
			>,
			T extends Err<infer U> ? U : T
		>
	>;
}

const Result = {
	ok: Ok,
	err: Err,
	try: Try
};

export default Result;
//
// The Result type provides a way to represent the outcome of an operation that may either succeed or fail.
//
// The Result type can be used to wrap a value that represents the successful result of an operation, or it can be used to wrap an error value that represents the failure of an operation.
//
// This can be useful because it allows you to write code that clearly separates the handling of successful and failed operations, which can make your code easier to understand and maintain.
//
//
//
// Examples
//
// const getRevene = (jsonString: string) => {
//     try {
//         return ok(JSON.parse(jsonString));
//     } catch (e) {
//         return err("oopsie poopsie");
//     }
// };
