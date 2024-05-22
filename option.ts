import { isMatching, P } from "npm:ts-pattern@5.1.1";

/**
 * Represents an optional value, either `Some` containing a value or `None`.
 */
export type Option<Thing> = Some<Thing> | None;

/**
 * Represents an optional value that contains a value.
 */
export type None = {
	readonly isSome: false;
	readonly data: undefined;
	readonly isNone: true;
};

export const some = <Thing>(data: Thing): Some<Thing> => {
	return { isSome: true, data, isNone: false } as Some<Thing>;
};
export type Some<Thing> = {
	readonly isSome: true;
	readonly data: Thing;
	readonly isNone: false;
};

export const SOMETHING: {
	readonly isSome: true;
	readonly isNone: false;
	readonly data: any;
} = {
	isSome: true,
	isNone: false,
	data: P.select(),
} as const;
export const NOTHING: None = { isSome: false, isNone: true } as None;

// export const isSome = <Thing>(option: Option<Thing>): option is Some<Thing> => {
//   return option.isSome;
// };
// export const isNone = <Thing>(option: Option<Thing>): option is Nothing => {
//   return option.isNone;
// };

export function OptionOf<F extends (...args: any[]) => any>(
	someFunction: F
): Promise<Option<NonNullable<Awaited<ReturnType<F>>>>> {
	return new Promise((resolve) => {
		try {
			return someFunction()
				.then((res: any) => resolve(optionOfThing(res)))
				.catch(() => resolve(NOTHING));
		} catch (e: unknown) {
			try {
				const thing = someFunction();
				return resolve(optionOfThing(thing));
			} catch (e) {
				return resolve(NOTHING);
			}
		}
	});
}

export type SomeVariant<R extends Option<unknown>> = R extends Some<unknown>
	? R
	: never;
export const Option = {
	some,
	SOMETHING,
	NOTHING,
	OptionOf,
};

const optionOfThing = <T>(data: T): Option<T> => {
	const thingIsNullish = data === null || data === undefined;

	const thingIsEmptyArray = Array.isArray(data) && !data.length;

	const thingIsEmptyString = data === "";

	const thingIsNothing = isMatching(NOTHING, data);

	if (
		thingIsNullish ||
		thingIsEmptyArray ||
		thingIsNothing ||
		thingIsEmptyString
	) {
		return NOTHING;
	}

	const thingIsOption = isMatching(SOMETHING, data);

	if (thingIsOption) {
		return data as unknown as Some<T>;
	} else {
		return some(data);
	}
	//
	// I dont consider this kind of thing clean code despite its conciseness:
	//
	// const optionOfRes = (data: any) =>
	//     null || undefined ||
	//     !thing.length ||
	//     thing.is === "nothing" ||
	//     (typeof thing === "object" ? JSON.stringify(thing) === "{}" : true)
	//         ? Nothing
	//         : some(thing.is ? thing["thing"] : thing);
	//
};

// This library provides a way to represent values that may or may not exist. It does this by introducing the Option type, which can be either a Some variant, representing a value that is present, or a Nothing variant, representing a value that is not present.
//
// Why this is useful?
//
// By using Option and its variants, you can more clearly express the intent of your code and ensure that your program is handling the presence or absence of a value correctly.
//
//
//
// Examples
//
// const getName = (foo: string): Option<string> => {
//     const match = foo.match(/bar/g);
//     if (!match) {
//         return NOTHING;
//     } else {
//         return some(match[0]);
//     }
// };
// By doing this you explicitly communicate to the callers of this function that it might return nothing.
// This, of course, means that we must know that when we use the `match` String method that we may get nothing back. This is an example of what it looks like to manifest the discipline needed to write robust, safe code.
//
// // Here we see an example of how we gain access to the value we want;
// const printName = (maybeName: Option<string>) => {
//     if (isSome(maybeName)) {
//         const { data: name } = maybeName;
//         printString(name);
//     } else {
//         printString("oopsie poopsie");
//     }
// };
//
// We can rewrite this to be both more explicit and more concise by using the ts-pattern library to pattern match against Option variants Some<Thing> (with the pre-defined pattern SOMETHING) and/or Nothing (with the pre-defined pattern NOTHING).
//
// const printName = (maybeName: Option<string>) =>
//     printString(
//         match(maybeName)
//             .with(SOMETHING, (name) => name)
//             .otherwise(() => "oopsie poopsie")
//     );
//
// But we can talk about that later.
//
// const printString = (name: string) => {
//     console.log(name);
// };
//
// const maybeName = await getName();
//
// printString(maybeName); //typescript: Argument of type 'Option<QueryResult>' is not assignable to parameter of type 'string'.
//
// printName(maybeName);
//
//
//
//
//
//
// The OptionOf function is a convenience function that allows you to wrap a function call in a promise that will resolve to an Option, making it easier to handle the case where the function may return an nullish value;

// Note: In the case where you want to check if something is null, undefined, an empty array, or an empty object you can use the convenince function OptionOf and wrap the value in a closure as the parameter to the convenience function. This will return a promise so that it can handle both async and sync functions. This means youll always have to include `await` and this also means its enclosing function will need to be async. A lopsided exchange in convenience in my view.
//
// const getName = await OptionOf(() => ["foo"].find((el) => el === "bar"));
//
//
//
// In the scenario where you have a high level function utilizing multiple lower level functions that may return nullish values, writing those functions to take Options of type T as their parameters instead of type T directly allows you to hide nullish checks in those functions to reduce the length of high level functions.
//
// More importantly though, it allows us to reduce the breadth of abstractions by allowing us to write these high level functions that "do a lot" in a clear and concise way such that we dont have to break that high level function up into multiple medium-level abstractions that are less intuitive to name, let alone understand. Observe:
//
// // Instead of having to think about breaking this monstrosity up into multiple abstract functions:
//
// function longHighLevelFunction() {
//     const foo = getFoo();
//     if (foo) {
//         const bar = getBar(foo);
//         if (bar) {
//             const baz = getBaz(bar);
//             if (baz) {
//                 // ...
//             } else {
//                 //...
//             }
//         } else {
//             //...
//         }
//     } else {
//         //...
//     }
// }
//
// // Or even this:
//
// function longHighLevelFunction() {
//     const foo = getFoo();
//     if (!foo) {
//         //...
//     }
//     const bar = getBar(foo);
//     if (!bar) {
//         //...
//     }
//     const baz = getBaz(bar);
//     if (!baz) {
//         //...
//     }
//     //...
// }
//
// // We can simply write this:
// function highLevelFunction() {
//     const maybeFoo = getFoo();
//     const maybeBar = getBar(maybeFoo);
//     const maybeBaz = getBar(maybeBar);
//     //...
// }
