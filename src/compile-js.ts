import { objToString } from './parse'
import { Token, TokenType } from './token'

const compRules: any = {}
const stdLib = new Set(['print', 'return', 'defer', 'delete', 'null'])

export class Context {
  words: Set<string> = new Set(stdLib)
  constants: Set<string> = new Set(stdLib)
  types: Map<String, TokenType> = new Map()

  copy() {
    const ctx = new Context()
    ctx.words = new Set(this.words)
    ctx.constants = new Set(this.constants)
    ctx.types = new Map(this.types)
    return ctx
  }
}

const warn = (warning: string) => {
  console.warn(warning)
  return `/*${warning}*/`
}

export const rootToJs = (ast: Token[], ctx: Context) => {
  return (
    'const print = console.log\n\n' +
    ast.map((token) => toJs(token, ctx)).join('\n')
  )
    .split('\n')
    .join(';\n')
}

const toJs = (token: Token, ctx: Context) => {
  if (!token) return ''
  if (!Object.keys(compRules).includes(token.getType().toString())) {
    return warn(`Could not compile ${objToString(token, { colors: false })}`)
  }
  return compRules[token.getType()](token, ctx)
}

const mapChildrenWithLineBreak = (token: Token, ctx: Context) =>
  token.children.map((child) => toJs(child, ctx)).join('\n')
const toKey = (token: Token, _ctx: Context) => token.key

compRules[TokenType.Assignment] = (token: Token, ctx: Context) => {
  let result = ''
  const word = token.children[0].children[0]
  const key = word.key
  if (ctx.constants.has(key)) {
    result += warn(`Constant '${key}' cannot be assigned to!`)
  }
  const isDefined = ctx.words.has(key)
  ctx.words.add(key)

  return (
    result +
    `${isDefined ? '' : 'let '}${toJs(word, ctx)} = ${toJs(
      token.children[1],
      ctx
    )}`
  )
}

compRules[TokenType.ConstantAssignment] = (token: Token, ctx: Context) => {
  let result = ''
  const word = token.children[0].children[0]
  const key = word.key
  if (ctx.words.has(key)) {
    result += warn(`Constant '${key}' has already been defined!`)
  }
  ctx.words.add(key)
  ctx.constants.add(key)

  return result + `const ${toJs(word, ctx)} = ${toJs(token.children[1], ctx)}`
}

compRules[TokenType.BinaryOperation] = (token: Token, ctx: Context) => {
  return `${toJs(token.children[0], ctx)} ${token.key} ${toJs(
    token.children[1],
    ctx
  )}`
}

compRules[TokenType.Comment] = (token: Token, _ctx: Context) => {
  return `// ${token.key}`
}

compRules[TokenType.PipeExpression] = (token: Token, ctx: Context) => {
  return `${toJs(token.children[1], ctx)}(${toJs(token.children[0], ctx)})`
}

compRules[TokenType.Tuple] = (token: Token, ctx: Context) => {
  return `${token.children.map((child) => toJs(child, ctx)).join(', ')}`
}

compRules[TokenType.Parenthesis] = (token: Token, ctx: Context) => {
  return `(${toJs(token.children[0], ctx)})`
}

compRules[TokenType.Array] = (token: Token, ctx: Context) => {
  return `[${toJs(token.children[0], ctx)}]`
}

compRules[TokenType.FunctionCall] = (token: Token, ctx: Context) => {
  return `${toJs(token.children[0], ctx)}${toJs(token.children[1], ctx)}`
}

compRules[TokenType.FunctionInterface] = (token: Token, ctx: Context) => {
  return `(${toJs(token.children[0], ctx)}) => `
}

compRules[TokenType.If] = (token: Token, ctx: Context) => {
  return `(${toJs(token.children[0].children[0], ctx)}) ? (${toJs(
    token.children[1],
    ctx
  )})`
}

compRules[TokenType.Else] = (token: Token, ctx: Context) => {
  return `${toJs(token.children[0], ctx)} : ${toJs(token.children[1], ctx)}`
}

const findWords = (token: Token) => {
  let words = token.isAnyOfTypes([TokenType.Word, TokenType.TypedWord])
    ? [token.key]
    : []
  token.children.forEach((child) => {
    words = words.concat(findWords(child))
  })
  return words
}

const findTypes = (token: Token) => {
  const types: Map<string, TokenType> = token.isOfType(TokenType.TypedWord)
    ? new Map([[token.children[1].key, token.children[0].getType()]])
    : new Map()
  token.children.forEach((child) => {
    findTypes(child).forEach((value, key) => types.set(key, value))
  })
  return types
}

compRules[TokenType.Function] = (token: Token, ctx: Context) => {
  const newCtx = ctx.copy()
  findWords(token.children[0]).forEach((word) => newCtx.words.add(word))
  findTypes(token.children[0]).forEach((value, key) =>
    newCtx.types.set(key, value)
  )
  return `${toJs(token.children[0], newCtx)}${toJs(token.children[1], newCtx)}`
}

compRules[TokenType.TypedWord] = (token: Token, ctx: Context) => {
  let result = ''
  const word = token.children[1].key
  const tokenType = token.children[0].getType()
  const tokenTypePrev = ctx.types.get(word)
  if (tokenTypePrev && tokenTypePrev !== tokenType) {
    result += warn(
      `Mismatch of types: was ${TokenType[tokenTypePrev]}, got ${TokenType[tokenType]}!`
    )
  }
  ctx.types.set(word, tokenType)
  return result + word
}

compRules[TokenType.Statement] = mapChildrenWithLineBreak
compRules[TokenType.StatementList] = mapChildrenWithLineBreak
compRules[TokenType.Block] = (token: Token, ctx: Context) => {
  if (token.children[0].isOfType(TokenType.StatementList)) {
    const copy = [...token.children[0].children]
    const last = copy.pop()
    return `(() => {\n${copy
      .map((child) => toJs(child, ctx))
      .join('\n')}\nreturn ${last ? toJs(last, ctx) : undefined}\n})()`
  }
  return `(() => { return ${toJs(token.children[0], ctx)} })()`
}

compRules[TokenType.vBool] = toKey
compRules[TokenType.vChar] = toKey
compRules[TokenType.vFloat] = toKey
compRules[TokenType.vInt] = toKey
compRules[TokenType.Word] = (token: Token, ctx: Context) => {
  let result = ''
  if (!ctx.words.has(token.key)) {
    result += warn(`Word '${token.key}' has not been defined!`)
  }
  return result + token.key
}
compRules[TokenType.vString] = (token: Token, _ctx: Context) => `'${token.key}'`
