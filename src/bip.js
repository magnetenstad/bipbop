
const delimiters = [';', '{', '}', '(', ')', '\'', '\"', ',']
const operators = ['=', '+', '-', '*', '/', '+=', '-=', '*=', '/=', '>_']

export function runBip(data) {
  const tokens = lex('{' + data + '}')
  const ast = parseTokens(tokens)
  console.log(JSON.stringify(ast, null, 2))
  executeAst(ast)
}

function lex(data) {
  delimiters.forEach((d) => data = data.replaceAll(d, ` ${d} `))
  return data.split(' ').map((item) => {
    return tokenize(item.trim())
  })
}

function tokenize(item) {
  const token = {
    type: '',
    name: item,
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
  
  let startString = -1
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.name === '\'' || token.name === '\"') {
      if (startString === -1) {
        startString = i
      } else {
        const str = {
          type: 'string',
        }
        const strContent = tokens.splice(startString, i + 1 - startString, str)
        str.value = strContent.slice(1, strContent.length - 1)
          .map(t => t.name).join(' ')
        i = startString + 1
        startString = -1
      }
    }
  }

  tokens = tokens.filter(t => !isEmptyToken(t))

  while (true) {
    let curlyStart = -1
    let curlyEnd = -1
    let roundStart = -1
    let roundEnd = -1
    for (const [i, token] of tokens.entries()) {  
      if (token.name === '{') curlyStart = i
      if (token.name === '(') roundStart = i

      if (token.name === '}') {
        curlyEnd = i
        const block = {
          type: 'block',
        }
        const blockContent = tokens.splice(
            curlyStart, curlyEnd - curlyStart + 1, block)
        block.children = parseBlock(
            blockContent.slice(1, blockContent.length - 1))
        break
      }

      if (token.name === ')') {
        roundEnd = i
        const block = {
          type: 'expression',
        }
        const blockContent = tokens.splice(
            roundStart, roundEnd - roundStart + 1, block)
        block.children = blockContent.slice(1, blockContent.length - 1)
        break
      }
    }
    if (curlyEnd + roundEnd === -2) {
      break
    }
  }
  
  return tokens[0]
}

function parseBlock(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]  
    if (token.name === '->') {
      const func = {
        type: 'function',
        from: tokens[i - 1],
        to: tokens[i + 1]
      }
      tokens.splice(i - 1, 3, func)
    }
  }

  const children = []
  let start = 0
  for (const [i, token] of tokens.entries()) {  
    if (token.type === 'block') {
      children.push(token)
      start = i + 1
      continue
    }
    if (token.name === ';' || i === tokens.length - 1) {
      children.push({
        type: 'statement',
        children: parseStatement(
            tokens.slice(start, i + (token.name === ';' ? 0 : 1)))
      })
      start = i + 1
      continue
    }
  }
  return children
}

function parseStatement(tokens) {

  for (let token of tokens) {
    if (token.type === 'expression') {
      token.children = parseExpression(token.children)
    }
  }

  return tokens
}

function parseExpression(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]  
    if (token.name === '+') {
      const binop = {
        type: 'binop_plus',
        children: [tokens[i - 1], tokens[i + 1]]
      }
      tokens.splice(i - 1, 3, binop)
      i -= 1
    }
  }
  return tokens
}

function executeAst(ast, vars=null) {
  if (vars === null) {
    vars = new Map()
  } else {
    vars = new Map(vars)
  }
  
  for (let child of ast.children) {
    if (child.type === 'block') {
      executeAst(child, vars)
    }
    if (child.type === 'statement') {
      executeStatement(child, vars)
    }
  }
}

function executeStatement(stmt, vars=null) {
  if (vars === null) {
    vars = new Map()
  }

  for (let child of stmt.children) {
    if (child.type === 'expression') {
      executeExpression(child, vars)
    }
  }

  if (stmt.children[1].name === '=') {
    vars.set(stmt.children[0].name, stmt.children[2])
    return
  }

  if (stmt.children[0].name === '>_') {
    console.log(stmt.children[1].value)
  }

  const first = vars.get(stmt.children[0].name)
  if (first && first.type === 'function') {
    executeFunction(first, stmt.children[1].children, vars)
  }
}

function executeFunction(func, args, vars=null) {
  if (vars === null) {
    vars = new Map()
  } else {
    vars = new Map(vars)
  }

  for (let i = 0; i < args.length; i++) {
    if (vars.get(args[i].name)) {
      vars.set(func.from.children[i].name, vars.get(args[i].name))
    } else {
      vars.set(func.from.children[i].name, args[i].name)
    }
  }

  for (let stmt of func.to.children) {
    executeStatement(stmt, vars)
  }
}

function executeExpression(expression, vars=null) {
  if (vars === null) {
    vars = new Map()
  }

  for (let child of expression.children) {

    if (vars.get(child.name)) {
      child.value = vars.get(child.name).value
    }

    if (child.type === 'expression' || child.type === 'binop_plus') {
      executeExpression(child, vars)
    }
  }
  
  if (expression.type === 'binop_plus') {
    expression.value = 
      expression.children[0].value + 
      expression.children[1].value
  } else {
    expression.value = expression.children[0].value
  }
}

function isWhiteSpace(str) {
  return ['', '\n'].includes(str.trim())
}

function isEmptyToken(token) {
  if (token.type && !isWhiteSpace(token.type)) {
    return false
  }
  if (token.name && !isWhiteSpace(token.name)) {
    return false
  }
  if (token.value && !isWhiteSpace(token.value)) {
    return false
  }
  return true
}
