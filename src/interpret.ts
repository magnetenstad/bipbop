import { Token, TokenType } from './token.js'

function interpret(
  node: Token,
  vars: Map<string, any> | null = null,
  scope = false
) {
  vars = vars === null ? new Map() : scope ? new Map(vars) : vars

  if (node.children && node.children.length) {
    if (node.children[0].name == '//') {
      return
    }

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      const value = vars.get(child.name)

      if (value === undefined) {
        const scope = child.hasType(TokenType.StatementList)
        interpret(child, vars, scope)
      } else {
        child.value = vars.get(child.name).value
      }
    }
  }

  if (
    node.hasAnyOfTypes([
      TokenType.StatementList,
      TokenType.Statement,
      TokenType.Expression,
    ])
  ) {
    if (node.children.length) {
      node.value = node.children[node.children.length - 1].value
    }
  }

  if (node.hasType(TokenType.FunctionCall)) {
    const func = vars.get(node.children[0].name)
    const args = node.children[1]
    if (func.type !== 'function') console.warn('Expected a function')
    interpret(args, vars)
    executeFunction(func, args.children, vars)
    node.value = func.value
  }

  if (node.hasType(TokenType.Statement)) {
    if (node.children.length > 1) {
      if (node.children[1].name === '=' || node.children[1].name === '::') {
        vars.set(node.children[0].name, node.children[2])
        return
      }
    }
    if (node.children.length > 0) {
      const first = node.children[0]
      if (first.name === '>_') {
        console.log(node.children.length > 1 ? node.children[1].value : '')
      }
      if (node.children[0].name === '>>') {
        return {
          message: 'return',
          value: node.children.length > 1 ? node.children[1] : null,
        }
      }
      // if (first.hasType(TokenType.Conditional)) {
      //   interpret(first.condition, vars)
      //   if (first.condition.value) {
      //     interpret(first.block, vars)
      //   }
      // }
    }
  }

  if (node.hasType(TokenType.Operation)) {
    if (node.name === '+') {
      node.value = node.children[0].value + node.children[1].value
    }
    if (node.name === '-') {
      node.value = node.children[0].value - node.children[1].value
    }
    if (node.name === '*') {
      node.value = node.children[0].value * node.children[1].value
    }
    if (node.name === '/') {
      node.value = node.children[0].value / node.children[1].value
    }
    if (node.name === '==') {
      node.value = node.children[0].value == node.children[1].value
    }
    if (node.name === '!=') {
      node.value = node.children[0].value != node.children[1].value
    }
    if (node.name === '!') {
      node.value = !node.children[0].value
    }
  }
}

function executeFunction(
  func: { from: Token; to: Token; value: any },
  args: Token[],
  vars: Map<string, any> | null = null
) {
  if (vars === null) {
    vars = new Map()
  } else {
    vars = new Map(vars)
  }

  for (let i = 0; i < func.from.children.length; i++) {
    const value =
      i >= args.length
        ? { type: 'null', value: null }
        : vars.get(args[i].name)
        ? vars.get(args[i].name)
        : args[i]

    vars.set(func.from.children[i].name, value)
  }

  for (let node of func.to.children) {
    const result = interpret(node, vars)
    if (result !== undefined && result.message === 'return') {
      func.value = result.value?.value
      return
    }
  }
}
