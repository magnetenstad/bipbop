import { Token, TokenType } from './token'

const compileRules: any = {}

export class Context {
  words: Set<string> = new Set()
  constants: Set<string> = new Set()
}

export const compileTokenToJs = (
  token: Token,
  context: Context = new Context()
) => {
  if (!Object.keys(compileRules).includes(token.getType().toString())) {
    console.warn(`Could not compile ${token.getType()}`)
    return ''
  }
  return compileRules[token.getType()](token, context)
}

compileRules[TokenType.Assignment] = (token: Token, context: Context) => {
  const word = token.children[0].key
  if (context.constants.has(word)) {
    console.warn(`Constant '${word}' cannot be assigned to!`)
  }
  const result = `${
    context.words.has(word) ? '' : 'let '
  }${word} = ${compileTokenToJs(token.children[1], context)}`
  context.words.add(word)
  return result
}

compileRules[TokenType.BinaryOperation] = (token: Token, context: Context) => {
  return `${compileTokenToJs(token.children[0], context)} ${
    token.key
  } ${compileTokenToJs(token.children[1], context)}`
}

compileRules[TokenType.Comment] = (token: Token, _context: Context) => {
  return `// ${token.key}`
}

compileRules[TokenType.ConstantAssignment] = (
  token: Token,
  context: Context
) => {
  const word = token.children[0].key
  if (context.words.has(word)) {
    console.warn(`Constant '${word}' has already been defined!`)
  }
  const result = `const ${word} = ${compileTokenToJs(
    token.children[1],
    context
  )}`
  context.words.add(word)
  context.constants.add(word)
  return result
}

compileRules[TokenType.Tuple] = (token: Token, context: Context) => {
  return `(${token.children
    .map((child) => compileTokenToJs(child, context))
    .join(', ')})`
}

const toKey = (token: Token, _context: Context) => token.key

compileRules[TokenType.vBool] = toKey
compileRules[TokenType.vChar] = toKey
compileRules[TokenType.vFloat] = toKey
compileRules[TokenType.vInt] = toKey
compileRules[TokenType.vString] = (token: Token, _context: Context) =>
  `'${token.key}'`
