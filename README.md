# Bip bop

Might become a programming language

# Notation
no keywords, only symbols.

## Variables

```cpp
x = 0;
y = 'Hello world';
```

## Conditions

```cpp
(y == 5) ? {
  >_ 'y is five!';
};
```

## Functions

```cpp
greet :: (name) -> {
  >_ ('Hello ' + name + '!');
};

sum :: (a, b) -> {
  >> (a + b);
};

assert :: (assertion, message) -> {
  (! assertion) ? {
    >_ message;
  };
}

assert((y == 5), 'y should be five');
assert((y != 5), 'never mind');
```

## Notes

### Symbols

```
|
+ addition
\
¨
' strings
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
; delimiter
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

#### Combinations

```
>_ print
<_ input

```