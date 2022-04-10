
# Bipbop Grammar

A context-free grammar can be described by a four-element tuple $(V, \Sigma, R, S)$ where

- $V$ is a finite set of variables (which are non-terminal);
- $\Sigma$ is a finite set (disjoint from $V$) of terminal symbols;
- $R$ is a set of production rules where each production rule maps a variable to a string $s \in (V \cup \Sigma)*$;
- $S$ (which is in $V$) which is a start symbol.

[Source](https://en.wikipedia.org/wiki/Context-free_grammar)

## 

## Terminal symbols, $\Sigma$

```
0-9 digit
A-Za-z char
  space
```

## Production rules, $R$

### A rules
Almost just lexing
```
[x] [raw] -> raw
[x] [raw] -> [raw] raw

[x] symbol.comment -> ---
[x] comment -> symbol.comment [raw] symbol.comment
[x] string -> " [raw] "

[x] word -> A-Za-z
[x] word -> word word
[x] integer -> 0-9
[x] integer -> integer integer
[x] float -> integer.integer
[x] word -> word integer
```

### White space
```
[x] ws ->  
[x] ws -> \r
[x] ws -> \n
[x] ws -> ws ws
[x] -> ws
```

### B rules
Truly parsing
```
[x] assignment -> word =
[x] assignment.constant -> word ::
[x] expression -> string
[x] expression -> integer
[x] expression -> float
[x] expression -> word
[x] expression -> ( expression )
[x] parenthesis -> ( expression )

[x] expression -> expression * expression
[x] expression -> expression / expression
[x] expression -> expression + expression
[x] expression -> expression - expression

[x] tuple -> expression , expression
[x] tuple -> tuple , expression
[x] tuple -> ( tuple )
[x] parenthesis -> ( tuple )

[x] function.call -> word parenthesis
[x] expression -> function.call

[ ] array -> [ tuple ]
[ ] assignment.tuple -> tuple = ---legal?---
[ ] assignment.tuple.constant -> tuple :: ---legal?---

[ ] statement -> assignment expression ;
[ ] statement -> assignment.constant expression ;

[ ] [statement] -> statement
[ ] [statement] -> [statement] statement
[ ] statement -> { [statement] }

```
