import util from 'util'
import { Token, TokenType } from './token.js'
import * as R from './rules.js'

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
    return new Token(TokenType.None, e)
  })
}

function parseTokens(tokens: Token[]) {
  const aRules: Map<any, (tokens: Token[], rule: any) => boolean> = new Map([
    [R.tripleDashRule, tripleTokenRule],
  ])

  applyRules(aRules, tokens)
  R.commentRule(tokens)
  R.stringRule(tokens)

  console.log('Finished A-rules')

  const bRules: Map<any, (tokens: Token[], rule: any) => boolean> = new Map([
    [R.characterRule, singleTokenRule],
    [R.wordRule, doubleTokenRule],
    [R.booleanRule, singleTokenRule],
    [R.zeroNineRule, singleTokenRule],
    [R.intRule, doubleTokenRule],
    [R.floatRule, tripleTokenRule],
    [R.intWordRule, doubleTokenRule],
    [R.typeRule, singleTokenRule],
  ])

  applyRules(bRules, tokens)
  console.log('Finished B-rules')

  while (R.whitespaceRule(tokens));
  console.log('Finished Whitespace-rules')

  const cRules: Map<any, (tokens: Token[], rule: any) => boolean> = new Map([
    [R.valueTypeRule, doubleTokenRule],
    [R.tupleBaseRule, tripleTokenRule],
    [R.tupleRule, tripleTokenRule],
    [R.functionInterfaceRule, tripleTokenRule],
    [R.expressionRule, singleTokenRule],
    [R.parenthesisExpressionRule, tripleTokenRule],
    [
      (a: Token, b: Token, c: Token) =>
        R.binaryOperatorExpressionRule(a, b, c, '*'),
      tripleTokenRule,
    ],
    [
      (a: Token, b: Token, c: Token) =>
        R.binaryOperatorExpressionRule(a, b, c, '/'),
      tripleTokenRule,
    ],
    [
      (a: Token, b: Token, c: Token) =>
        R.binaryOperatorExpressionRule(a, b, c, '+'),
      tripleTokenRule,
    ],
    [
      (a: Token, b: Token, c: Token) =>
        R.binaryOperatorExpressionRule(a, b, c, '-'),
      tripleTokenRule,
    ],
    [R.functionCallRule, doubleTokenRule],
    [R.functionRule, doubleTokenRule],
    [R.bracketsStatementRule, tripleTokenRule],
    [R.statementListRule, doubleTokenRule],
    [R.statementListBaseRule, doubleTokenRule],
    [R.statementRule, singleTokenRule],
    [R.assignmentRule, tripleTokenRule],
    [R.doubleColonRule, doubleTokenRule],
    [R.constantAssignmentRule, tripleTokenRule],
    [R.assignmentStatementRule, doubleTokenRule],
  ])

  applyRules(cRules, tokens)
  console.log('Finished C-rules')
  return tokens
}

const applyRules = (
  rules: Map<(tokens: Token[], rule: any) => boolean, any>,
  tokens: Token[]
) => {
  const entries = [...rules.entries()]
  for (let i = 0; i < entries.length; i++) {
    const [rule, wrapper] = entries[i]
    if (wrapper(tokens, rule)) {
      i = -1
    }
  }
}

const singleTokenRule = (
  tokens: Token[],
  rule: (a: Token) => Token | undefined
): boolean => {
  for (let i = 0; i < tokens.length; i++) {
    const token = rule(tokens[i])
    if (token) {
      tokens.splice(i, 1, token)
      return true
    }
  }
  return false
}

const doubleTokenRule = (
  tokens: Token[],
  rule: (a: Token, b: Token) => Token | undefined
): boolean => {
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = rule(tokens[i], tokens[i + 1])
    if (token) {
      tokens.splice(i, 2, token)
      return true
    }
  }
  return false
}

const tripleTokenRule = (
  tokens: Token[],
  rule: (a: Token, b: Token, c: Token) => Token | undefined
): boolean => {
  for (let i = 0; i < tokens.length - 2; i++) {
    const token = rule(tokens[i], tokens[i + 1], tokens[i + 2])
    if (token) {
      tokens.splice(i, 3, token)
      return true
    }
  }
  return false
}
