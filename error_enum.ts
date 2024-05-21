import type { Err } from './result';

export type ErrorObject = {
	[key: string]: (...args: any[]) => Err<{
		readonly type: string;
		readonly name: string;
		readonly message: string;
	}>;
};
export type ErrorObjWrapper<T> = Record<
	keyof T,
	T[keyof T] extends (...args: any[]) => Err<infer R> ? (...args: any[]) => Err<R> : never
>;
export type ErrorObjectNames<T> = keyof ErrorObjWrapper<T>;

export type ErrorType<T, U extends ErrorObject> = T extends keyof ErrorObjWrapper<U>
	? ReturnType<U[T]>
	: T extends undefined
	? ReturnType<ErrorObjWrapper<U>[keyof ErrorObjWrapper<U>]>
	: never;

// let one = { type: "one", name: "one", message: "one" } as const;
// import { err } from "./Result";
// const Blah = {
//   One: function () {
//     return err(one);
//   },
//   Two: function () {
//     return err({ type: "two", name: "two", message: "two" } as const);
//   },
// } satisfies ErrorObject;

// type Blah<T=undefined> = ErrorType<T, typeof Blah>;

// function fn1(): Blah<"One"> {
//   return Blah.One()
// }

// function fn2(): Blah<"Two"> {
//   return Blah.Two()
// }

// function fn3(maybe: boolean): Blah {
//   if (maybe){
//     return fn2();
//   } else {
//     return fn1();
//   }
// }
