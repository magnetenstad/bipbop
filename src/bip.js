
const definitions = []
const delimiters = [';', '{', '}', '(', ')', '\'', '\"', ',']
const operators = ['=', '+', '-', '*', '/', '+=', '-=', '*=', '/=']

export function bipToJs(data) {
  const tokens = lex('{' + data + '}')
  const ast = parseTokens(tokens)
  return 'import * as std from \'./std.js\'\n' + transpile(ast)
}

export function runBip(data) {
  const tokens = lex('{' + data + '}')
  const ast = parseTokens(tokens)
  executeAst(ast)
}

function lex(data) {
  delimiters.forEach((d) => data = data.replaceAll(d, ` ${d} `))
  return data.split(' ').filter(e => !isWhiteSpace(e)).map((item) => {
    return tokenize(item.trim())
  })
}

function tokenize(item) {
  const token = {
    type: '',
    value: item,
    children: []
  }
  if (operators.includes(item)) {
    token.type = 'operator'
  }
  if (delimiters.includes(item)) {
    token.type = 'delimiter'
  }
  return token
}

function parseTokens(tokens) {
  // console.log('Parse', tokens)
  
  while (true) {
    let start = -1
    let end = -1
    for (const [i, token] of tokens.entries()) {  
      if (token.value === '{') start = i
      if (token.value === '}') {
        end = i
        const block = {
          type: 'block',
          value: ''
        }
        const blockContent = tokens.splice(start, end - start + 1, block)
        block.children = parseBlock(
            blockContent.slice(1, blockContent.length - 1))
        break
      }
    }
    if (end === -1) {
      break
    }
  }
  
  return tokens[0]
}

function parseBlock(tokens) {
  const children = []
  let start = 0
  let end = -1
  for (const [i, token] of tokens.entries()) {  
    if (token.type === 'block') {
      children.push(token)
      start = i + 1
      continue
    }
    if (token.value === ';' || i === tokens.length - 1) {
      end = i + 1
      children.push({
        type: 'statement',
        value: '',
        children: parseStatement(tokens.slice(start, end))
      })
      start = end + 1
      continue
    }
  }
  return children
}

function parseStatement(tokens) {
  return tokens
}

function executeAst(ast) {
  // console.log('Execute', ast)
  
  for (let child of ast.children) {
    if (child.type === 'block') {
      executeAst(child)
    }
    if (child.type === 'statement') {
      console.log(child.children)
    }
  }
}

function isWhiteSpace(str) {
  return ['', '\n'].includes(str.trim())
}
