import { P, match } from 'npm:ts-pattern@5.1.1';
import { JsonRpcSuccessPattern, JsonRpcErrorPattern } from './json_rpc.ts';

/**
 * Represents a result of an operation, which can either be `Ok` or `Err`.
 * @template Thing - The type of the successful result.
 * @template Error - The type of the error result.
 */
export type Result<Thing, Error> = Thing extends Ok<infer R>
	? Ok<R>
	: Ok<Thing> | (Error extends Err<infer R> ? Err<R> : Err<Error>);

/**
 * Represents a successful result.
 * @template Thing - The type of the contained value.
 */
export type Ok<Thing> = {
	readonly isOk: true;
	readonly data: Thing;
	readonly isError: false;
	/**
	 * Applies a function to the contained value.
	 * @template U - The type of the result of the function.
	 * @param {(data: Thing) => U} fn - The function to apply.
	 * @returns {Ok<U>} A new Ok instance with the mapped value.
	 */
	map<U>(fn: (data: Thing) => U): Ok<U>;
};

/**
 * Represents a failed result.
 * @template ErrorData - The type of the error data.
 */
export type Err<ErrorData> = {
	readonly isOk: false;
	readonly data: ErrorData;
	readonly isError: true;
	readonly timestamp: Date;
	/**
	 * Applies a function to the contained value (never called).
	 * @template U - The type of the result of the function.
	 * @param {(data: never) => U} fn - The function to apply.
	 * @returns {Err<ErrorData>} The same Err instance.
	 */
	map<U>(fn: (data: never) => U): Err<ErrorData>;
};

/**
 * Creates an Ok instance.
 * @template Thing - The type of the contained value.
 * @param {Thing} thing - The value to contain.
 * @returns {Ok<Thing>} An Ok instance containing the value.
 */
export const Ok = <Thing>(thing: Thing): Ok<Thing> => ({
	isOk: true,
	data: thing,
	isError: false,
	map<U>(fn: (data: Thing) => U): Ok<U> {
		const newData = fn(this.data);
		return Ok(newData);
	}
});

/**
 * Creates an Err instance.
 * @template ErrorData - The type of the error data.
 * @param {ErrorData} errorData - The error data to contain.
 * @returns {Err<ErrorData>} An Err instance containing the error data.
 */
export const Err = <ErrorData>(errorData: ErrorData): Err<ErrorData> => ({
	isOk: false,
	data: errorData,
	isError: true,
	timestamp: new Date(),
	map<U>(fn: (data: never) => U): Err<ErrorData> {
		return this;
	}
});

/**
 * Represents the Ok variant type.
 * @template R - The type of the result.
 */
export type OkVariant<R extends Result<unknown, unknown>> = R extends Ok<unknown> ? R : never;

/**
 * Represents the Err variant type.
 * @template R - The type of the result.
 */
export type ErrorVariant<R extends Result<unknown, unknown>> = R extends Ok<unknown> ? never : R;

/**
 * Represents a constant Err instance with any type of data.
 */
export const ERROR: {
	readonly isOk: false;
	readonly isError: true;
	readonly data: any;
} = { isOk: false, isError: true, data: P.select() } as const;

/**
 * Represents a constant Ok instance with any type of data.
 */
export const OK: {
	readonly isOk: true;
	readonly isError: false;
	readonly data: any;
} = { isOk: true, isError: false, data: P.select() } as const;

/**
 * Represents the Axios error pattern for matching error responses.
 */
const AxiosErrorPattern = {
	response: {
		headers: {
			'content-length': P.string,
			'content-type': P.string
		},
		data: P.select()
	}
} as const;

/**
 * Represents the fetch response pattern for matching fetch responses.
 */
const FetchResponsePattern = {
	ok: P.boolean,
	redirected: P.boolean,
	status: P.number,
	statusText: P.string,
} as const;

/**
 * Tries to execute a function and returns a Result.
 * @template HappyPath - The type of the happy path function.
 * @template T - The type of the sad path result.
 * @param {HappyPath} happyPath - The function to try.
 * @param {(...args: any[]) => T} [sadPath] - The optional sad path function.
 * @returns {Promise<Result<Awaited<ReturnType<HappyPath> extends Ok<any> ? OkVariant<ReturnType<HappyPath>>['data'] : ReturnType<HappyPath>>, T extends Err<infer U> ? U : T>>} A promise resolving to a Result.
 */
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
		// first try to run the function as if it were async
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
			// if happypath doesn't return a promise we'll land here
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

/**
 * Utility object for creating and managing Result types.
 */
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
