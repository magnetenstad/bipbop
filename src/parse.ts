import util from 'util'
import { Token, TokenType } from './token'
import {
  noWhiteSpaceRules,
  symbolRules,
  applyRules,
  stringAndCommentRules,
  whiteSpaceRules,
  wordRules,
  numberRules,
} from './rules.js'

export function lexAndParse(data: string) {
  const tokens = lex(data)
  return parseTokens(tokens)
}

export function objToString(obj: Token[] | Token) {
  return util.inspect(obj, { showHidden: false, depth: null, colors: true })
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
  tokens = tokens.filter((t) => !t.isOfType(TokenType.Comment))
  applyRules(whiteSpaceRules, tokens)
  tokens = tokens.filter((t) => !t.isOfType(TokenType.WhiteSpace))
  applyRules(noWhiteSpaceRules, tokens)
  return tokens
}
