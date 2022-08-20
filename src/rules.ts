import { Token, TokenType } from './token.js'

// Helper functions

export const applyRules = (rulesObject: object, tokens: Token[]) => {
  const rules = [...Object.values(rulesObject)]
  for (let i = 0; i < rules.length; i++) {
    if (applyRule(tokens, rules[i])) {
      i = -1
    }
  }
}

const applyRule = (tokens: Token[], rule: any): boolean => {
  const argCount = rule.length
  for (let i = 0; i < tokens.length - (argCount - 1); i++) {
    const argTokens = []
    for (let j = 0; j < argCount; j++) {
      argTokens.push(tokens[i + j])
    }
    const token = rule(...argTokens)
    if (token) {
      tokens.splice(i, argCount, token)
      return true
    }
  }
  return false
}

// Symbol rules

const symbolRule = (type: TokenType, keys: string, tokens: Token[]) => {
  if (keys.length !== tokens.length) throw new Error('Wrong use of symbolrule')
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] !== tokens[i].key) {
      return
    }
  }
  return new Token(type, keys)
}

const doubleSymbolRule =
  (type: TokenType, keys: string) => (a: Token, b: Token) =>
    symbolRule(type, keys, [a, b])

const tripleSymbolRule =
  (type: TokenType, keys: string) => (a: Token, b: Token, c: Token) =>
    symbolRule(type, keys, [a, b, c])

export const symbolRules = {
  sComment: tripleSymbolRule(TokenType.sComment, '---'),
  sDoubleColon: doubleSymbolRule(TokenType.sDoubleColon, '::'),
  sThinArrow: doubleSymbolRule(TokenType.sThinArrow, '->'),
}

// Number rules

export const numberRules = {
  // Int -> 0-9
  zeroNine(a: Token) {
    if (a.hasType(TokenType.None) && a.key.match(/[0-9]/)) {
      return new Token(TokenType.vInt, a.key)
    }
  },
  // Int -> Int Int
  int(a: Token, b: Token) {
    if (a.hasType(TokenType.vInt) && b.hasType(TokenType.vInt)) {
      return new Token(TokenType.vInt, a.key + b.key)
    }
  },
  // Float -> Int.Int
  float(a: Token, b: Token, c: Token) {
    if (
      a.hasType(TokenType.vInt) &&
      b.key === '.' &&
      c.hasType(TokenType.vInt)
    ) {
      return new Token(TokenType.vFloat, a.key + '.' + c.key)
    }
  },
}

// WordRules

const keywordRule = (type: TokenType, keyWord: string) => (a: Token) => {
  if (a.hasType(TokenType.Word) && a.key === keyWord) {
    return new Token(type)
  }
}

export const wordRules = {
  // Word -> A-Za-z
  aToZ(a: Token) {
    if (a.hasType(TokenType.None) && a.key.match(/[A-Za-z]/)) {
      return new Token(TokenType.Word, a.key)
    }
  },
  // Word -> WordWord
  word(a: Token, b: Token) {
    if (a.hasType(TokenType.Word) && b.hasType(TokenType.Word)) {
      return new Token(TokenType.Word, a.key + b.key)
    }
  },
  kInt: keywordRule(TokenType.kInt, 'int'),
  kFloat: keywordRule(TokenType.kFloat, 'float'),
  kString: keywordRule(TokenType.kString, 'string'),
  kBool: keywordRule(TokenType.kBool, 'bool'),
}

// Etc.

export function whitespaceRule(tokens: Token[]) {
  for (const [i, token] of tokens.entries()) {
    if (['\r', '\n', ' '].includes(token.key)) {
      tokens.splice(i, 1)
      return true
    }
  }
  return false
}

export function stringRule(tokens: Token[]) {
  let start = null
  for (const [i, token] of tokens.entries()) {
    if (token.key === '"' && (i === 0 || tokens[i - 1].key !== '\\')) {
      if (start === null) {
        start = i
      } else {
        let end = i
        const token = new Token(TokenType.kString)
        token.key = tokens
          .splice(start, end - start + 1, token)
          .slice(1, end - start)
          .map((t) => t.key)
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

export function commentRule(tokens: Token[]) {
  let start = null
  for (const [i, token] of tokens.entries()) {
    if (token.hasType(TokenType.sComment)) {
      if (start === null) {
        start = i
      } else {
        let end = i
        const token = new Token(TokenType.Comment)
        token.key = tokens
          .splice(start, end - start + 1)
          .slice(1, end - start)
          .map((t) => t.key)
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

// Rules that apply after white space has been removed

export const noWhiteSpaceRules = {
  binaryOperatorExpressionRule(a: Token, b: Token, c: Token) {
    if (a.isExpression() && b.hasType(TokenType.Operator) && c.isExpression()) {
      return new Token(TokenType.Operation, b.key, [a, c])
    }
  },
  valueTypeRule(a: Token, b: Token) {
    if (a.isTypeKeyword() && b.hasType(TokenType.Word)) {
      return new Token(TokenType.TypedWord, a.key, [a, b])
    }
  },
  assignmentRule(a: Token, b: Token, c: Token) {
    if (a.hasType(TokenType.Word) && b.key === '=' && c.isExpression()) {
      return new Token(TokenType.Assignment, '=', [a, c])
    }
  },
  constantAssignmentRule(a: Token, b: Token, c: Token) {
    if (
      a.hasType(TokenType.Word) &&
      b.hasType(TokenType.sDoubleColon) &&
      c.isExpression()
    ) {
      return new Token(TokenType.ConstantAssignment, b.key, [a, c])
    }
  },
  tupleBaseRule(a: Token, b: Token, c: Token) {
    if (a.isExpression() && b.key === ',' && c.isExpression()) {
      b.setType(TokenType.Tuple)
      b.children = [a, c]
      return b
    }
  },
  tupleRule(a: Token, b: Token, c: Token) {
    if (a.hasType(TokenType.Tuple) && b.key === ',' && c.isExpression()) {
      a.children.push(c)
      return a
    }
  },
  parenthesisExpressionRule(a: Token, b: Token, c: Token) {
    if (a.key === '(' && b.isExpression() && c.key === ')') {
      b.setType(TokenType.Parenthesis)
      return b
    }
  },
  functionCallRule(a: Token, b: Token) {
    if (a.hasType(TokenType.Word) && b.hasType(TokenType.Parenthesis)) {
      a.setType(TokenType.FunctionCall)
      a.children = [b]
      return a
    }
  },
  functionInterfaceRule(a: Token, b: Token, c: Token) {
    if (b.key === '->') {
      const token = new Token(TokenType.FunctionInterface)
      if (a.hasType(TokenType.Word) || a.hasType(TokenType.Tuple)) {
        token.children.push(a)
      }
      if (c.hasType(TokenType.Type) || c.hasType(TokenType.Tuple)) {
        token.children.push(c)
      }
      return token
    }
  },
  functionRule(a: Token, b: Token) {
    if (
      a.hasType(TokenType.FunctionInterface) &&
      b.hasType(TokenType.Statement)
    ) {
      const token = new Token(TokenType.Function)
      token.children = [a, b]
      return token
    }
  },
  bracketsStatementRule(a: Token, b: Token, c: Token) {
    if (
      a.key === '{' &&
      (b.hasType(TokenType.Statement) || b.hasType(TokenType.StatementList)) &&
      c.key === '}'
    ) {
      b.setType(TokenType.Statement)
      return b
    }
  },
  statementRule(a: Token) {
    if (!a.hasType(TokenType.Statement) && a.hasType(TokenType.FunctionCall)) {
      a.setType(TokenType.Statement)
      return a
    }
  },
  statementListBaseRule(a: Token, b: Token) {
    if (a.hasType(TokenType.Statement) && b.hasType(TokenType.Statement)) {
      const token = new Token(TokenType.StatementList)
      token.children = [a, b]
      return token
    }
  },
  statementListRule(a: Token, b: Token) {
    if (a.hasType(TokenType.StatementList) && b.hasType(TokenType.Statement)) {
      a.children.push(b)
      return a
    }
  },
  assignmentStatementRule(a: Token, b: Token) {
    if (
      (a.hasType(TokenType.Assignment) ||
        a.hasType(TokenType.ConstantAssignment)) &&
      b.isExpression()
    ) {
      const token = new Token(TokenType.Statement)
      token.children = [a, b]
      return token
    }
  },
}
