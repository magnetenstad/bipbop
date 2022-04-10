
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
```
[x] assignment -> word =
[x] assignment.constant -> word ::
[x] expression -> string
[x] expression -> integer
[x] expression -> float
[x] expression -> word

[ ] expression -> expression * expression
[ ] operator.binary -> expression / expression
[ ] operator.binary -> expression + expression
[ ] operator.binary -> expression - expression

[ ] statement -> word = expression;
[ ] [statement] -> statement
[ ] [statement] -> [statement] statement

[ ] block -> { [statement] }
[ ] tuple -> expression , expression
[ ] tuple -> ( tuple )
[ ] expr -> ( expr )
```
 