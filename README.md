# Bip bop

Might become a programming language

# Notation
no keywords, only symbols.

## Variables

```cpp
int x = 0
bool y :: true --- Constant assignment ---
z = "Hello world" --- Type inferred ---
```

## Conditions WIP

```cpp
(y == 5) ? {
  output("y is five!")
}
```

## Functions

```cpp
greet :: string name -> {
  output("Hello " + name + "!")
}

sum :: int a, int b -> int {
  return(a + b)
}

assert :: bool assertion, string message -> {
  !assertion ? {
    output(message)
  }
}

assert(y == 5, "y should be five")
assert(y != 5, "never mind")

handleData :: func<<int>, <void>> callback -> {
  int data = getData()
  callback(data)
}

--- func<<int>, <void>> or int -> void ---

handleData(int data -> { output(data) })
```

## Structs WIP

```cpp
struct person {
  int age
  string name
}
```

## Notes

### Symbols

```
|
+ addition
\
¨
" strings
,
.
- subtraction
§
! negation
" strings
#
¤
% modulo
&
/ division
( expression
) expression
= assignment
? condition
`
^
*
 delimiter
:
_ matcher
@
£
$
€
{ block
[
]
} block
´
~
```
