# Rust-Like Data Structures in TypeScript

This TypeScript library provides Rust-like data structures, such as `Result` and `Option`, to facilitate error handling and value management in TypeScript projects.

## Features

- **Result**: A type that represents either a success (`Ok`) or a failure (`Err`).
- **Option**: A type that represents an optional value, either `Some` or `None`.
- **JSON-RPC**: Utilities for working with JSON-RPC, enabling remote procedure calls.

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) runtime.

### Installation

Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

### Running the Development Server

Use the following command to start the development server with Deno:

```bash
deno task dev
```

This command runs the `index.ts` file with the `--watch` flag, enabling live reloading during development.

## Usage

### Option

The `Option` type represents an optional value, either `Some` or `None`.

```typescript
import { Option, Some, None } from './option.ts';

const value: Option<number> = Some(5);
const empty: Option<number> = None;

console.log(value.isSome()); // true
console.log(empty.isNone()); // true
```

### Result

The `Result` type represents either a success (`Ok`) or a failure (`Err`).

```typescript
import { Result, Ok, Err } from './result.ts';

const success: Result<number, string> = Ok(10);
const failure: Result<number, string> = Err('An error occurred');

console.log(success.isOk()); // true
console.log(failure.isErr()); // true
```

### JSON-RPC

Utilities for working with JSON-RPC.

```typescript
import { JsonRpc } from './json_rpc.ts';

// Example usage of JSON-RPC utilities
```

## Project Structure

- `index.ts`: Entry point for the library.
- `option.ts`: Implementation of the `Option` type.
- `result.ts`: Implementation of the `Result` type.
- `json_rpc.ts`: Utilities for JSON-RPC.
- `error_enum.ts`: Error enumeration used across the library.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or additions.

## License

This project is licensed under the MIT License.

## Acknowledgements

Inspired by Rust's `Result` and `Option` types.
