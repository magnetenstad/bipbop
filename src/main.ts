// @ts-ignore
import { Directory, File } from 'virtual-file-system'
import { printAst, runBip } from './parse'
import { argv } from 'process'
import { compileTokenToJs, Context } from './compile-js'

const dir = Directory.read('bip-src')
console.log(`Filtered by ${argv[2]}`)

if (dir) {
  dir.filter(
    (file) =>
      file.name.includes('.bip') &&
      (file.location + file.name).match(argv[2]) != null
  )
  dir.apply((file: File) => {
    console.log(`Running ${file.name}\n`)
    const ast = runBip(file.data)
    console.log(`\nFinished running ${file.name}\n`)
    printAst(ast)
    const context = new Context()
    file.data = ast.map((token) => compileTokenToJs(token, context)).join('\n')
    file.name = file.name.replace('.bip', '.js')
  })

  dir.name = 'bip-lib'
  dir.write()
}
console.log(`Filtered by ${argv[2]}`)
