# Bip bop

A proof-of-concept programming language that compiles to Javascript.

> Will be coming to NPM soon.

## Getting started

Clone the repo, write some bip in `bip-src`, then

```
npm start <filename>
```

This will print the abstract syntax tree, compile your bip file to a javascript file in `bip-lib`, and finally run the javascript.

## Examples

### Hello world

The following Bip

```cpp
print("Hello world!")
```

compiles to the following Javascript

```js
console.log('Hello world!')
```

### Variable Assignment

The following Bip

```cpp
int a = 0
float b = 1.0
string c = "Hello"
d :: "a constant"
```

compiles to the following Javascript

```js
let a = 0
let b = 1.0
let c = 'Hello'
const d = 'a constant'
```

### Functions

The following Bip

```cpp
doStuff :: a, b -> {
  doThis(a)
  doThat(b)
}

greet :: greeting -> print(greeting)
greet_hello :: -> greet("hello")

greet_hello()
```

compiles to the following Javascript

```js
const doStuff = (a, b) => {
  doThis(a)
  doThat(b)
}

const greet = (greeting) => console.log(greeting)
const greet_hello = () => greet('hello')

greet_hello()
```

### Conditions

The following Bip

```cpp
x > 0 ? {
  print("x is positive")
} : {
  print("x is not positive")
}
```

compiles to the following Javascript

```js
x > 0
  ? (() => {
      return console.log('x is positive')
    })()
  : (() => {
      return console.log('x is not positive')
    })()
```

> Note that the last statement of a block is returned.

The following Bip

```cpp
x > 0 ? {
  print("x is positive") (100)
} : {
  print("x is not positive") (0-100)
} |> print
```

compiles to the following Javascript

```js
console.log(
  x > 0
    ? (() => {
        console.log('x is positive')
        return 100
      })()
    : (() => {
        console.log('x is not positive')
        return 0 - 100
      })()
)
```

### Pipes

The following Bip

```cpp
half :: x -> x / 2
sum :: a, b -> a + b
4, 8 |> sum |> half |> print
```

compiles to the following Javascript

```js
const half = (x) => x / 2
const sum = (a, b) => a + b
console.log(half(sum(4, 8)))
```
