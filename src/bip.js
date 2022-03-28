
const definitions = []
const delimiters = [';', '{', '}', '(', ')', '\'', '\"']
const operators = ['=', '+', '-', '*', '/', '+=', '-=', '*=', '/=']

export function bipToJs(data) {
  const tokens = lexer(data)
  const ast = parser(tokens)
  return 'import * as std from \'./std.js\'\n' + transpile(ast)
}

function lexer(data) {
  delimiters.forEach((d) => data = data.replaceAll(d, ` ${d} `))
  return data.split(' ').map((item) => {
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
  let data = ''
  if (ast.type === 'statement') {
    ast.children.forEach((token) => {
      data += token.value + ' '
    })
    return data + ';\n'
  }
  ast.children.forEach((child) => {
    data += transpile(child)
  })
  return data
}
