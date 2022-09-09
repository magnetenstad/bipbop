import { Token, TokenType } from './token'

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
  const argCount = rule.length // number of arguments of the rule function

  if (argCount === 0) {
    // indicates use of *all* tokens
    // the rule should handle insertion and splicing
    const token = rule(tokens)
    return !!token
  }

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
  const len = Math.min(keys.length, tokens.length)
  for (let i = 0; i < len; i++) {
    if (keys[i] !== tokens[i].key) {
      return
    }
  }
  if (len === 1 && tokens[0].isOfType(type)) return
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
  sPipe: doubleSymbolRule(TokenType.sPipe, '|>'),
}

// Number rules

export const numberRules = {
  // Int -> 0-9
  zeroNine(a: Token) {
    if (a.isOfType(TokenType.None) && a.key.match(/[0-9]/)) {
      return new Token(TokenType.vInt, a.key)
    }
  },
  // Int -> Int Int
  int(a: Token, b: Token) {
    if (a.isOfType(TokenType.vInt) && b.isOfType(TokenType.vInt)) {
      return new Token(TokenType.vInt, a.key + b.key)
    }
  },
  // Float -> Int.Int
  float(a: Token, b: Token, c: Token) {
    if (
      a.isOfType(TokenType.vInt) &&
      b.key === '.' &&
      c.isOfType(TokenType.vInt)
    ) {
      return new Token(TokenType.vFloat, a.key + '.' + c.key)
    }
  },
}

// WordRules

const keywordRule = (type: TokenType, keyWord: string) => (a: Token) => {
  if (a.isOfType(TokenType.Word) && a.key === keyWord) {
    return new Token(type, a.key)
  }
}

export const wordRules = {
  // Word -> A-Za-z
  aToZ(a: Token) {
    if (a.isOfType(TokenType.None) && a.key.match(/[A-Za-z]/)) {
      return new Token(TokenType.Word, a.key)
    }
  },
  // Word -> WordWord
  word(a: Token, b: Token) {
    if (a.isOfType(TokenType.Word) && b.isOfType(TokenType.Word)) {
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
    if (a.isOfType(TokenType.Word) && b.isOfType(TokenType.vInt)) {
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
        .splice(start, end - start + 1, token)
        .slice(1, end - start)
        .map((t) => t.key)
        .join('')
      return token
    }
  }
}

export const stringAndCommentRules = {
  // arguments[0] is a hack (denoting a request for the whole tokens array)
  string() {
    return betweenRule(arguments[0], TokenType.vString, (a: Token) =>
      a.isOfType(TokenType.sString)
    )
  },
  comment() {
    return betweenRule(arguments[0], TokenType.Comment, (a: Token) =>
      a.isOfType(TokenType.sComment)
    )
  },
}

// Rules that apply after white space has been removed

export const noWhiteSpaceRules = {
  functionRule(a: Token, b: Token) {
    if (
      a.isOfType(TokenType.FunctionInterface) &&
      b.isAnyOfTypes([
        TokenType.Statement,
        TokenType.StatementList,
        TokenType.Block,
      ])
    ) {
      return new Token(TokenType.Function, '', [a, b])
    }
  },
  emptyParenthesis(a: Token, b: Token) {
    if (a.key === '(' && b.key === ')') {
      return new Token(TokenType.Parenthesis)
    }
  },
  binaryOperatorExpressionRule(a: Token, b: Token, c: Token) {
    if (a.isExpression() && b.isBinaryOperator() && c.isExpression()) {
      return new Token(TokenType.BinaryOperation, b.key, [a, c])
    }
  },
  valueTypeRule(a: Token, b: Token) {
    if (a.isTypeKeyword() && b.isOfType(TokenType.Word)) {
      return new Token(TokenType.TypedWord, b.key, [a, b])
    }
  },
  functionCallRule(a: Token, b: Token) {
    if (a.isOfType(TokenType.Word) && b.isOfType(TokenType.Parenthesis)) {
      return new Token(TokenType.FunctionCall, '', [a, b])
    }
  },
  sequenceRule(a: Token, b: Token, c: Token) {
    if (a.isExpression() && b.key === ',' && c.isExpression()) {
      return new Token(TokenType.Sequence, '', [a, c])
    }
  },
  extendSequenceRule(a: Token, b: Token, c: Token) {
    if (a.isOfType(TokenType.Sequence) && b.key === ',' && c.isExpression()) {
      a.children.push(c)
      return a
    }
  },
  tuple(a: Token) {
    if (a.isOfType(TokenType.Sequence)) {
      return new Token(TokenType.Tuple, a.key, a.children)
    }
  },
  parenthesisExpressionRule(a: Token, b: Token, c: Token) {
    if (a.key === '(' && b.isExpression() && c.key === ')') {
      return new Token(TokenType.Parenthesis, '', [b])
    }
  },
  arrayRule(a: Token, b: Token, c: Token) {
    if (a.key === '[' && b.isOfType(TokenType.Tuple) && c.key === ']') {
      return new Token(TokenType.Array, '', [b])
    }
  },
  pipeRule(a: Token, b: Token, c: Token) {
    if (
      a.isExpression() &&
      b.isOfType(TokenType.sPipe) &&
      c.isOfType(TokenType.Word)
    ) {
      return new Token(TokenType.PipeExpression, '', [a, c])
    }
  },
  functionInterfaceRule(a: Token, b: Token, c: Token) {
    if (b.key !== '->') return
    if (
      !a.isAnyOfTypes([
        TokenType.Word,
        TokenType.TypedWord,
        TokenType.Tuple,
        TokenType.Parenthesis,
      ])
    )
      return
    if (
      !(
        c.isTypeKeyword() ||
        c.isAnyOfTypes([TokenType.Tuple, TokenType.Parenthesis])
      )
    )
      return
    return new Token(TokenType.FunctionInterface, '', [a, c])
  },
  functionInterfaceRuleNoOutput(a: Token, b: Token) {
    if (
      b.key !== '->' ||
      !a.isAnyOfTypes([
        TokenType.Word,
        TokenType.TypedWord,
        TokenType.Tuple,
        TokenType.Parenthesis,
      ])
    )
      return
    return new Token(TokenType.FunctionInterface, '', [a])
  },
  functionInterfaceRuleNoInputOrOutput(a: Token) {
    if (a.key === '->') return new Token(TokenType.FunctionInterface)
  },
  bracketsStatementRule(a: Token, b: Token, c: Token) {
    if (a.key === '{' && b.isOfType(TokenType.StatementList) && c.key === '}') {
      return new Token(TokenType.Block, '', [b])
    }
  },
  statementListRule(a: Token, b: Token) {
    if (
      a.isOfType(TokenType.StatementList) &&
      b.isOfType(TokenType.Statement)
    ) {
      a.children.push(b)
      return a
    }
  },
  doubleStatementListRule(a: Token, b: Token) {
    if (
      a.isOfType(TokenType.StatementList) &&
      b.isOfType(TokenType.StatementList)
    ) {
      a.children = a.children.concat(b.children)
      return a
    }
  },
  statementListBaseRule(a: Token) {
    if (a.isOfType(TokenType.Statement)) {
      return new Token(TokenType.StatementList, '', [a])
    }
  },
  statementRule(a: Token) {
    if (
      a.isAnyOfTypes([
        TokenType.FunctionCall,
        TokenType.ConstantAssignment,
        TokenType.Assignment,
        TokenType.PipeExpression,
      ])
    ) {
      return new Token(TokenType.Statement, '', [a])
    }
  },
  functionExpressionRule(a: Token, b: Token) {
    if (a.isOfType(TokenType.FunctionInterface) && b.isExpression()) {
      return new Token(TokenType.Function, '', [a, b])
    }
  },
  assignmentRule(a: Token, b: Token, c: Token) {
    if (
      a.isAnyOfTypes([TokenType.Word, TokenType.TypedWord]) &&
      b.key === '=' &&
      c.isExpression()
    ) {
      return new Token(TokenType.Assignment, '=', [a, c])
    }
  },
  constantAssignmentRule(a: Token, b: Token, c: Token) {
    if (
      a.isAnyOfTypes([TokenType.Word, TokenType.TypedWord]) &&
      b.isOfType(TokenType.sDoubleColon) &&
      c.isExpression()
    ) {
      return new Token(TokenType.ConstantAssignment, b.key, [a, c])
    }
  },
}
