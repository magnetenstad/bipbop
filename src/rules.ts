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
    if (argCount === 0) {
      argTokens.push(tokens)
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
  const len = Math.min(keys.length, tokens.length)
  for (let i = 0; i < len; i++) {
    if (keys[i] !== tokens[i].key) {
      return
    }
  }
  if (len === 1 && tokens[0].hasType(type)) return
  return new Token(type, tokens.map((t) => t.key).join(''))
}

const singleSymbolRule = (type: TokenType, keys: string) => (a: Token) =>
  symbolRule(type, keys, [a])

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
  sTimes: singleSymbolRule(TokenType.sTimes, '*'),
  sSlash: singleSymbolRule(TokenType.sSlash, '/'),
  sPlus: singleSymbolRule(TokenType.sPlus, '+'),
  sMinus: singleSymbolRule(TokenType.sMinus, '-'),
  sEscaped: doubleSymbolRule(TokenType.sEscaped, '\\'),
  sString: singleSymbolRule(TokenType.sString, '"'),
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
    return new Token(type, a.key)
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
  vBoolTrue: keywordRule(TokenType.vBool, 'true'),
  vBoolFalse: keywordRule(TokenType.vBool, 'false'),
  // Word -> WordInt
  wordInt(a: Token, b: Token) {
    if (a.hasType(TokenType.Word) && b.hasType(TokenType.vInt)) {
      return new Token(TokenType.Word, a.key + b.key)
    }
  },
}

// Etc.

export const whiteSpaceRules = {
  ws(a: Token) {
    if (['\r', '\n', ' '].includes(a.key)) {
      return new Token(TokenType.WhiteSpace)
    }
  },
}

export const betweenRule = function (
  tokens: Token[],
  type: TokenType,
  startRule: (a: Token) => boolean,
  endRule = startRule
) {
  let start = null
  for (const [i, token] of tokens.entries()) {
    if (start === null && startRule(token)) {
      start = i
      continue
    }
    if (start !== null && endRule(token)) {
      let end = i
      const token = new Token(type)
      token.key = tokens
        .splice(start, end - start + 1)
        .slice(1, end - start)
        .map((t) => t.key)
        .join('')
      return token
    }
  }
}

export const stringAndCommentRules = {
  string() {
    return betweenRule(arguments[0], TokenType.vString, (a: Token) =>
      a.hasType(TokenType.sString)
    )
  },
  comment() {
    return betweenRule(arguments[0], TokenType.Comment, (a: Token) =>
      a.hasType(TokenType.sComment)
    )
  },
}

// Rules that apply after white space has been removed

export const noWhiteSpaceRules = {
  emptyTuple(a: Token, b: Token) {
    if (a.key === '(' && b.key === ')') {
      return new Token(TokenType.Tuple)
    }
  },
  binaryOperatorExpressionRule(a: Token, b: Token, c: Token) {
    if (a.isExpression() && b.isBinaryOperator() && c.isExpression()) {
      return new Token(TokenType.BinaryOperation, b.key, [a, c])
    }
  },
  valueTypeRule(a: Token, b: Token) {
    if (a.isTypeKeyword() && b.hasType(TokenType.Word)) {
      return new Token(TokenType.TypedWord, a.key, [a, b])
    }
  },
  functionCallRule(a: Token, b: Token) {
    if (a.hasType(TokenType.Word) && b.hasType(TokenType.Tuple)) {
      return new Token(TokenType.FunctionCall, '', [a, b])
    }
  },
  sequenceRule(a: Token, b: Token, c: Token) {
    if (a.isExpression() && b.key === ',' && c.isExpression()) {
      return new Token(TokenType.Sequence, '', [a, c])
    }
  },
  extendSequenceRule(a: Token, b: Token, c: Token) {
    if (a.hasType(TokenType.Sequence) && b.key === ',' && c.isExpression()) {
      a.children.push(c)
      return a
    }
  },
  tuple(a: Token) {
    if (a.hasType(TokenType.Sequence)) {
      return new Token(TokenType.Tuple, a.key, a.children)
    }
  },
  parenthesisExpressionRule(a: Token, b: Token, c: Token) {
    if (a.key === '(' && b.isExpression() && c.key === ')') {
      return new Token(TokenType.Tuple, '', [b])
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
}
