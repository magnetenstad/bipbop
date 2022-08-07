import { Token, TokenType, ValueType } from './token.js'

export function stringRule(tokens: Token[]) {
  let start = null
  for (const [i, token] of tokens.entries()) {
    if (token.name === '"' && (i === 0 || tokens[i - 1].name !== '\\')) {
      if (start === null) {
        start = i
      } else {
        let end = i
        const token = new Token(TokenType.String)
        token.name = tokens
          .splice(start, end - start + 1, token)
          .slice(1, end - start)
          .map((t) => t.name)
          .join('')
        return true
      }
    }
  }
  if (start !== null) {
    console.error('String is never terminated!')
  }
  return false
}

export function tripleDashRule(a: Token, b: Token, c: Token) {
  if (a.name === '-' && b.name === '-' && c.name === '-') {
    return new Token(TokenType.TripleDash)
  }
}

export function commentRule(tokens: Token[]) {
  let start = null
  for (const [i, token] of tokens.entries()) {
    if (token.hasType(TokenType.TripleDash)) {
      if (start === null) {
        start = i
      } else {
        let end = i
        const token = new Token(TokenType.Comment)
        token.name = tokens
          .splice(start, end - start + 1)
          .slice(1, end - start)
          .map((t) => t.name)
          .join('')
        return true
      }
    }
  }
  if (start !== null) {
    console.error('Comment is never terminated!')
  }
  return false
}

export function zeroNineRule(a: Token) {
  if (a.hasType(TokenType.None) && a.name.match(/[0-9]/)) {
    a.setType(TokenType.Int)
    return a
  }
}

export function intRule(a: Token, b: Token) {
  if (a.hasType(TokenType.Int) && b.hasType(TokenType.Int)) {
    a.name += b.name
    return a
  }
}

export function floatRule(a: Token, b: Token, c: Token) {
  if (a.hasType(TokenType.Int) && b.name === '.' && c.hasType(TokenType.Int)) {
    a.setType(TokenType.Float)
    a.name += '.' + c.name
    return a
  }
}

export function characterRule(a: Token) {
  if (a.hasType(TokenType.None) && a.name.match(/[A-Za-z]/)) {
    a.setType(TokenType.Word)
    return a
  }
}

export function wordRule(a: Token, b: Token) {
  if (a.hasType(TokenType.Word) && b.hasType(TokenType.Word)) {
    a.name += b.name
    return a
  }
}

export function booleanRule(a: Token) {
  if (
    a.hasType(TokenType.Word) &&
    !a.hasType(TokenType.Bool) &&
    ['true', 'false'].includes(a.name)
  ) {
    a.setType(TokenType.Bool)
    return a
  }
}

export function intWordRule(a: Token, b: Token) {
  if (a.hasType(TokenType.Int) && b.hasType(TokenType.Int)) {
    a.name += b.name
    return a
  }
}

export function whitespaceRule(tokens: Token[]) {
  for (const [i, token] of tokens.entries()) {
    if (['\r', '\n', ' '].includes(token.name)) {
      tokens.splice(i, 1)
      return true
    }
  }
  return false
}

export function typeRule(a: Token) {
  if (
    a.hasType(TokenType.Word) &&
    !a.hasType(TokenType.Type) &&
    ['int', 'float', 'string', 'bool'].includes(a.name)
  ) {
    a.setType(TokenType.Type)
    return a
  }
}

export function valueTypeRule(a: Token, b: Token) {
  if (a.hasType(TokenType.Type) && b.hasType(TokenType.Word)) {
    b.valueType = ValueType[<keyof typeof ValueType>a.name]
    return b
  }
}

export function assignmentRule(a: Token, b: Token, c: Token) {
  if (
    a.hasType(TokenType.Word) &&
    b.name === '=' &&
    c.hasType(TokenType.Expression)
  ) {
    b.setType(TokenType.Assignment)
    b.children = [a, c]
    return b
  }
}

export function doubleColonRule(a: Token, b: Token) {
  if (a.name === ':' && b.name === ':') {
    a.setType(TokenType.DoubleColon)
    return a
  }
}

export function constantAssignmentRule(a: Token, b: Token, c: Token) {
  if (
    a.hasType(TokenType.Word) &&
    b.hasType(TokenType.DoubleColon) &&
    c.hasType(TokenType.Expression)
  ) {
    b.setType(TokenType.ConstantAssignment)
    b.children = [a, c]
    return b
  }
}

export function tupleBaseRule(a: Token, b: Token, c: Token) {
  if (
    a.hasType(TokenType.Expression) &&
    b.name === ',' &&
    c.hasType(TokenType.Expression)
  ) {
    b.setType(TokenType.Tuple)
    b.children = [a, c]
    return b
  }
}

export function tupleRule(a: Token, b: Token, c: Token) {
  if (
    a.hasType(TokenType.Tuple) &&
    b.name === ',' &&
    c.hasType(TokenType.Expression)
  ) {
    a.children.push(c)
    return a
  }
}

export function expressionRule(a: Token) {
  if (
    !a.hasType(TokenType.Expression) &&
    a.hasAnyOfTypes([
      TokenType.String,
      TokenType.Int,
      TokenType.Float,
      TokenType.Bool,
      TokenType.Word,
      TokenType.FunctionCall,
      TokenType.Tuple,
      TokenType.FunctionInterface,
      TokenType.Function,
    ])
  ) {
    a.setType(TokenType.Expression)
    return a
  }
}

export function parenthesisExpressionRule(a: Token, b: Token, c: Token) {
  if (a.name === '(' && b.hasType(TokenType.Expression) && c.name === ')') {
    b.setType(TokenType.Parenthesis)
    return b
  }
}

export function binaryOperatorExpressionRule(
  a: Token,
  b: Token,
  c: Token,
  operator: string
) {
  if (
    a.hasType(TokenType.Expression) &&
    b.name === operator &&
    c.hasType(TokenType.Expression)
  ) {
    b.setType(TokenType.Expression)
    b.children = [a, c]
    return b
  }
}

export function functionCallRule(a: Token, b: Token) {
  if (a.hasType(TokenType.Word) && b.hasType(TokenType.Parenthesis)) {
    a.setType(TokenType.FunctionCall)
    a.children = [b]
    return a
  }
}

export function functionInterfaceRule(a: Token, b: Token, c: Token) {
  if (b.name === '->') {
    const token = new Token(TokenType.FunctionInterface)
    if (a.hasType(TokenType.Word) || a.hasType(TokenType.Tuple)) {
      token.children.push(a)
    }
    if (c.hasType(TokenType.Type) || c.hasType(TokenType.Tuple)) {
      token.children.push(c)
    }
    return token
  }
}

export function functionRule(a: Token, b: Token) {
  if (
    a.hasType(TokenType.FunctionInterface) &&
    b.hasType(TokenType.Statement)
  ) {
    const token = new Token(TokenType.Function)
    token.children = [a, b]
    return token
  }
}

export function bracketsStatementRule(a: Token, b: Token, c: Token) {
  if (
    a.name === '{' &&
    (b.hasType(TokenType.Statement) || b.hasType(TokenType.StatementList)) &&
    c.name === '}'
  ) {
    b.setType(TokenType.Statement)
    return b
  }
}

export function statementRule(a: Token) {
  if (!a.hasType(TokenType.Statement) && a.hasType(TokenType.FunctionCall)) {
    a.setType(TokenType.Statement)
    return a
  }
}

export function statementListBaseRule(a: Token, b: Token) {
  if (a.hasType(TokenType.Statement) && b.hasType(TokenType.Statement)) {
    const token = new Token(TokenType.StatementList)
    token.children = [a, b]
    return token
  }
}

export function statementListRule(a: Token, b: Token) {
  if (a.hasType(TokenType.StatementList) && b.hasType(TokenType.Statement)) {
    a.children.push(b)
    return a
  }
}

export function assignmentStatementRule(a: Token, b: Token) {
  if (
    (a.hasType(TokenType.Assignment) ||
      a.hasType(TokenType.ConstantAssignment)) &&
    b.hasType(TokenType.Expression)
  ) {
    const token = new Token(TokenType.Statement)
    token.children = [a, b]
    return token
  }
}
