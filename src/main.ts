// @ts-ignore
import { Directory, File } from 'virtual-file-system'
import { objToString, lexAndParse } from './parse'
import { argv } from 'process'
import { rootToJs, Context } from './compile-js'
import { exec } from 'child_process'

const dir = Directory.read('bip-src')

if (dir) {
  dir.filter(
    (file) =>
      file.name.includes('.bip') &&
      (file.location + file.name).match(argv[2]) != null
  )
  dir.apply((file: File) => {
    const ast = lexAndParse(file.data)
    // console.log(objToString(ast))
    file.data = rootToJs(ast, new Context())
    file.name = file.name.replace('.bip', '.js')
  })

  dir.name = 'bip-lib'
  dir.write()

  dir.apply((file) => {
    exec(
      `node ${file.location.replace('bip-src', 'bip-lib')}${file.name}`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`)
          return
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`)
          return
        }
        console.log(`stdout: ${stdout}`)
      }
    )
  })
}
