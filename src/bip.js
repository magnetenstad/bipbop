
const definitions = []
const delimiters = [';', '{', '}', '(', ')', '\'', '\"', ',']
const operators = ['=', '+', '-', '*', '/', '+=', '-=', '*=', '/=']

export function bipToJs(data) {
  const tokens = lexer(data)
  const ast = parser(tokens)
  return 'import * as std from \'./std.js\'\n' + transpile(ast)
}

function lexer(data) {
  data = data.replaceAll('{', ';{')
  data = data.replaceAll('}', '};')
  delimiters.forEach((d) => data = data.replaceAll(d, ` ${d} `))
  return data.split(' ').filter(e => e !== '').map((item) => {
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

function parser(tokens) {
  console.log('Parse', tokens)
  const root = {
    type: 'root',
    value: '',
    children: []
  }
  let depth = 0
  let prev = -1
  for (const [i, token] of tokens.entries() ) {  
    if (token.value === '{') depth++
    if (token.value === '}') depth--
    if (depth == 0 && token.value === ';') {
      root.children.push(parser(tokens.slice(prev + 1, i)))
      prev = i
    }
  }
  if (!root.children.length) {
    root.type = 'statement'
    root.children = tokens
  }

  return root
}

function transpile(ast) {
  console.log('Transpile', ast)
  
  if (ast.children.length && ast.type === 'statement') {
    
    if (ast.children.length === 1 && ast.children[0].value === ':') {
      return 'else '
    }

    if (ast.children.length > 1 
        && ast.children[1].value === '='
        && !definitions.includes(ast.children[0])) {
      return 'let ' + joinTokens(ast.children) + ';\n'
    }

    const last = ast.children[ast.children.length - 1]
    if (last.value === '?') {

      if (ast.children[0].value === ':') {
        return 'else if (' 
        + joinTokens(ast.children.slice(1, ast.children.length - 1))
        + ') '
      }

      return 'if (' 
          + joinTokens(ast.children.slice(0, ast.children.length - 1))
          + ') '
    }

    return joinTokens(ast.children) + (last.value == '}' ? '\n' : ';\n')
  }
  
  let data = ''
  ast.children.forEach((child) => {
    data += transpile(child)
  })

  return data
}

function joinTokens(tokens) {
  let data = ''
  let delimiterPrev = true
  tokens.forEach((token) => {
    const delimiter = token.type === 'delimiter'
    data += (!(delimiterPrev || delimiter) ? ' ' : '') + token.value
    delimiterPrev = delimiter
  })
  return data
}
