import util from 'util'
import { Token, TokenType } from './token.js'
import {
  noWhiteSpaceRules,
  symbolRules,
  applyRules,
  stringAndCommentRules,
  whiteSpaceRules,
  wordRules,
  numberRules,
} from './rules.js'

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
  applyRules(symbolRules, tokens)
  applyRules(numberRules, tokens)
  applyRules(wordRules, tokens)
  applyRules(stringAndCommentRules, tokens)
  tokens = tokens.filter((t) => !t.hasType(TokenType.Comment))
  applyRules(whiteSpaceRules, tokens)
  tokens = tokens.filter((t) => !t.hasType(TokenType.WhiteSpace))
  applyRules(noWhiteSpaceRules, tokens)
  return tokens
}
