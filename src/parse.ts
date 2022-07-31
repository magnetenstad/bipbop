import { Token, TokenType, ValueType } from './util.js'
import util from 'util'

export function runBip(data: string) {
  console.log('Start lex...')
  const tokens = lex(data)
  console.log('Start parse...')
  const ast = parseTokens(tokens)
  console.log('Log results..')
  console.log(
    util.inspect(ast, { showHidden: false, depth: null, colors: true })
  )
}

function lex(data: string) {
  return data.split('').map((e: string) => {
    return new Token(TokenType.None, e, e)
  })
}

function parseTokens(tokens: Token[]) {
  const rulesA = [
    tripleDashRule,
    commentRule,
    stringRule,
    characterRule,
    wordRule,
    booleanRule,
    zeroNineRule,
    intRule,
    floatRule,
    intWordRule,
    typeRule,
  ]
  for (let i = 0; i < rulesA.length; i++) {
    // console.log(`A-${i}`)
    if (rulesA[i](tokens)) {
      i = -1
    }
  }
  console.log('Finished A-rules')
  while (whitespaceRule(tokens));
  console.log('Finished Whitespace-rules')
  const rulesB = [
    valueTypeRule,
    tupleBaseRule,
    tupleRule,
    functionInterfaceRule,
    expressionRule,
    parenthesisExpressionRule,
    (tokens: Token[]) => binaryOperatorExpressionRule(tokens, '*'),
    (tokens: Token[]) => binaryOperatorExpressionRule(tokens, '/'),
    (tokens: Token[]) => binaryOperatorExpressionRule(tokens, '+'),
    (tokens: Token[]) => binaryOperatorExpressionRule(tokens, '-'),
    functionCallRule,
    functionRule,
    bracketsStatementRule,
    statementListRule,
    statementListBaseRule,
    statementRule,
    assignmentRule,
    doubleColorRule,
    constantAssignmentRule,
    assignmentStatementRule,
  ]
  for (let i = 0; i < rulesB.length; i++) {
    // console.log(`B-${i}`)
    if (rulesB[i](tokens)) {
      i = -1
    }
  }
  console.log('Finished B-rules')
  return tokens
}

function stringRule(tokens: Token[]) {
  let start = null
  for (const [i, token] of tokens.entries()) {
    if (token.value === '"' && (i === 0 || tokens[i - 1].value !== '\\')) {
      if (start === null) {
        start = i
      } else {
        let end = i
        const token = new Token(TokenType.String)
        token.value = tokens
          .splice(start, end - start + 1, token)
          .slice(1, end - start)
          .map((t) => t.value)
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

function tripleDashRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].value === '-' &&
      tokens[i + 1].value === '-' &&
      tokens[i + 2].value === '-'
    ) {
      tokens.splice(i, 3, new Token(TokenType.TripleDash))
      return true
    }
  }
  return false
}

function commentRule(tokens: Token[]) {
  let start = null
  for (const [i, token] of tokens.entries()) {
    if (token.hasType(TokenType.TripleDash)) {
      if (start === null) {
        start = i
      } else {
        let end = i
        const token = new Token(TokenType.Comment)
        token.value = tokens
          .splice(start, end - start + 1)
          .slice(1, end - start)
          .map((t) => t.value)
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

function zeroNineRule(tokens: Token[]) {
  for (let token of tokens) {
    if (token.hasType(TokenType.None) && token.value.match(/[0-9]/)) {
      token.setType(TokenType.Int)
      return true
    }
  }
  return false
}

function intRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      tokens[i].hasType(TokenType.Int) &&
      tokens[i + 1].hasType(TokenType.Int)
    ) {
      tokens[i].value += tokens[i + 1].value
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function floatRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].hasType(TokenType.Int) &&
      tokens[i + 1].value === '.' &&
      tokens[i + 2].hasType(TokenType.Int)
    ) {
      tokens[i].setType(TokenType.Float)
      tokens[i].value += '.' + tokens[i + 2].value
      tokens.splice(i + 1, 2)
      return true
    }
  }
  return false
}

function characterRule(tokens: Token[]) {
  for (let token of tokens) {
    if (token.hasType(TokenType.None) && token.value.match(/[A-Za-z]/)) {
      token.setType(TokenType.Word)
      return true
    }
  }
  return false
}

function wordRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].hasType(TokenType.Word) &&
      tokens[i + 1].hasType(TokenType.Word)
    ) {
      tokens[i].value += tokens[i + 1].value
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function booleanRule(tokens: Token[]) {
  for (let token of tokens) {
    if (
      token.hasType(TokenType.Word) &&
      ['true', 'false'].includes(token.value)
    ) {
      token.setType(TokenType.Bool)
      return true
    }
  }
  return false
}

function intWordRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].hasType(TokenType.Int) &&
      tokens[i + 1].hasType(TokenType.Int)
    ) {
      tokens[i].value += tokens[i + 1].value
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function whitespaceRule(tokens: Token[]) {
  for (const [i, token] of tokens.entries()) {
    if (['\r', '\n', ' '].includes(token.value)) {
      tokens.splice(i, 1)
      return true
    }
  }
  return false
}

function typeRule(tokens: Token[]) {
  for (let token of tokens) {
    if (
      token.hasType(TokenType.Word) &&
      !token.hasType(TokenType.Type) &&
      ['int', 'float', 'string', 'bool'].includes(token.value)
    ) {
      token.setType(TokenType.Type)
      return true
    }
  }
  return false
}

function valueTypeRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      tokens[i].hasType(TokenType.Type) &&
      tokens[i + 1].hasType(TokenType.Word)
    ) {
      tokens[i + 1].valueType =
        ValueType[<keyof typeof ValueType>tokens[i].value]
      tokens.splice(i, 1)
      return true
    }
  }
  return false
}

function assignmentRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].hasType(TokenType.Word) &&
      tokens[i + 1].value === '=' &&
      tokens[i + 2].hasType(TokenType.Expression)
    ) {
      tokens[i + 1].setType(TokenType.Assignment)
      tokens[i + 1].children = [tokens[i], tokens[i + 2]]
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function doubleColorRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].value === ':' && tokens[i + 1].value === ':') {
      tokens[i].setType(TokenType.DoubleColon)
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function constantAssignmentRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 3; i++) {
    if (
      tokens[i].hasType(TokenType.Word) &&
      tokens[i + 1].hasType(TokenType.DoubleColon) &&
      tokens[i + 2].hasType(TokenType.Expression)
    ) {
      tokens[i + 1].setType(TokenType.ConstantAssignment)
      tokens[i + 1].children = [tokens[i], tokens[i + 2]]
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function tupleBaseRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].hasType(TokenType.Expression) &&
      tokens[i + 1].value === ',' &&
      tokens[i + 2].hasType(TokenType.Expression)
    ) {
      tokens[i + 1].setType(TokenType.Tuple)
      tokens[i + 1].children = [tokens[i], tokens[i + 2]]
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function tupleRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].hasType(TokenType.Tuple) &&
      tokens[i + 1].value === ',' &&
      tokens[i + 2].hasType(TokenType.Expression)
    ) {
      tokens[i].children.push(tokens[i + 2])
      tokens.splice(i + 1, 2)
      return true
    }
  }
  return false
}

function expressionRule(tokens: Token[]) {
  for (let token of tokens) {
    if (
      !token.hasType(TokenType.Expression) &&
      token.hasAnyOfTypes([
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
      token.setType(TokenType.Expression)
      return true
    }
  }
  return false
}

function parenthesisExpressionRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].value === '(' &&
      tokens[i + 1].hasType(TokenType.Expression) &&
      tokens[i + 2].value === ')'
    ) {
      tokens[i + 1].setType(TokenType.Parenthesis)
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function binaryOperatorExpressionRule(tokens: Token[], operator: string) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].hasType(TokenType.Expression) &&
      tokens[i + 1].value === operator &&
      tokens[i + 2].hasType(TokenType.Expression)
    ) {
      tokens[i + 1].setType(TokenType.Expression)
      tokens[i + 1].children = [tokens[i], tokens[i + 2]]
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function functionCallRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      tokens[i].hasType(TokenType.Word) &&
      tokens[i + 1].hasType(TokenType.Parenthesis)
    ) {
      tokens[i].setType(TokenType.FunctionCall)
      tokens[i].children = [tokens[i + 1]]
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function functionInterfaceRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 3; i++) {
    if (tokens[i + 1].value === '-' && tokens[i + 2].value === '>') {
      const token = new Token(TokenType.FunctionInterface)
      let start = i + 1
      let end = i + 3
      if (
        tokens[i].hasType(TokenType.Word) ||
        tokens[i].hasType(TokenType.Tuple)
      ) {
        token.children.push(tokens[i])
        start -= 1
      }
      if (
        tokens[i + 3].hasType(TokenType.Type) ||
        tokens[i + 3].hasType(TokenType.Tuple)
      ) {
        token.children.push(tokens[i + 3])
        end += 1
      }
      tokens.splice(start, end - start, token)
      return true
    }
  }
  return false
}

function functionRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      tokens[i].hasType(TokenType.FunctionInterface) &&
      tokens[i + 1].hasType(TokenType.Statement)
    ) {
      const token = new Token(TokenType.Function)
      token.children = [tokens[i], tokens[i + 1]]
      tokens.splice(i, 2, token)
      return true
    }
  }
  return false
}

function bracketsStatementRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].value === '{' &&
      (tokens[i + 1].hasType(TokenType.Statement) ||
        tokens[i + 1].hasType(TokenType.StatementList)) &&
      tokens[i + 2].value === '}'
    ) {
      tokens[i + 1].setType(TokenType.Statement)
      tokens.splice(i, 3, tokens[i + 1])
      return true
    }
  }
  return false
}

function statementRule(tokens: Token[]) {
  for (let token of tokens) {
    if (
      !token.hasType(TokenType.Statement) &&
      token.hasType(TokenType.FunctionCall)
    ) {
      token.setType(TokenType.Statement)
      return true
    }
  }
  return false
}

function statementListBaseRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      tokens[i].hasType(TokenType.Statement) &&
      tokens[i + 1].hasType(TokenType.Statement)
    ) {
      const token = new Token(TokenType.StatementList)
      token.children = [tokens[i], tokens[i + 1]]
      tokens.splice(i, 3, token)
      return true
    }
  }
  return false
}

function statementListRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      tokens[i].hasType(TokenType.StatementList) &&
      tokens[i + 1].hasType(TokenType.Statement)
    ) {
      tokens[i].children.push(tokens[i + 1])
      tokens.splice(i + 1, 1)
      return true
    }
  }
  return false
}

function assignmentStatementRule(tokens: Token[]) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      (tokens[i].hasType(TokenType.Assignment) ||
        tokens[i].hasType(TokenType.ConstantAssignment)) &&
      tokens[i + 1].hasType(TokenType.Expression)
    ) {
      const token = new Token(TokenType.Statement)
      token.children = tokens.splice(i, 2, token)
      return true
    }
  }
  return false
}
