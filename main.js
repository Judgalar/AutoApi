const fs = require('fs')
const { exec } = require('child_process')
const path = require('path')
const pc = require('picocolors')

const args = process.argv.slice(2)

const modelsDirectory = path.join(__dirname, 'src', 'api', 'models')
const routesDirectory = path.join(__dirname, 'src', 'api', 'routes')
const swaggerFile = path.join(__dirname, 'src', 'api', 'swagger.json')
const generateModelsFile = path.join(__dirname, 'src', 'generateModels.js')
const generateSwaggerFile = path.join(__dirname, 'src', 'swagger.js')
const generateRoutesFile = path.join(__dirname, 'src', 'generateRoutes.js')

function generateModels () {
  return new Promise((resolve, reject) => {
    exec(`node ${generateModelsFile}`, (error, stdout) => {
      if (error) {
        reject(new Error(`Error ejecutando generateModels.js: ${error.message}`))
      } else {
        console.log(`generateModels.js output: ${stdout}`)
        resolve(stdout)
      }
    })
  })
}

function generateRoutes () {
  return new Promise((resolve, reject) => {
    exec(`node ${generateRoutesFile}`, (error, stdout) => {
      if (error) {
        reject(new Error(`Error ejecutando generateRoutes.js: ${error.message}`))
      } else {
        console.log(`generateRoutes.js output: ${stdout}`)
        resolve(stdout)
      }
    })
  })
}

function generateSwagger () {
  return new Promise((resolve, reject) => {
    exec(`node ${generateSwaggerFile}`, (error, stdout) => {
      if (error) {
        reject(new Error(`Error ejecutando swagger.js: ${error.message}`))
      } else {
        console.log(`swagger.js output: ${stdout}`)
        resolve(stdout)
      }
    })
  })
}

async function startServer () {
  if (!fs.existsSync(modelsDirectory)) {
    console.log(pc.blue('Directorio models no encontrado. Generando modelos...'))
    try {
      await generateModels()
    } catch (error) {
      console.error(error)
      process.exit(1) // Cierra la aplicacion si la generacion de modelos falla.
    }
  }

  const swaggerPromise = !fs.existsSync(swaggerFile)
    ? (async () => {
        console.log(pc.blue('swagger.json no encontrado. Generando swagger...'))
        try {
          await generateSwagger()
        } catch (error) {
          console.error(error)
          process.exit(1)
        }
      })()
    : Promise.resolve()

  const routesPromise = !fs.existsSync(routesDirectory)
    ? (async () => {
        console.log(pc.blue('Directorio routes no encontrado. Generando routes...'))
        try {
          await generateRoutes()
        } catch (error) {
          console.error(error)
          process.exit(1)
        }
      })()
    : Promise.resolve()

  // Esperar a que las promesas de swagger y routes se resuelvan en paralelo
  await Promise.all([swaggerPromise, routesPromise])

  // Iniciar el servidor
  require('./src/api/server.js')
}

if (args.includes('--config') || args.includes('-c')) {
  const modifyConfig = require('./src/modifyConfig')

  modifyConfig(async () => {
    try {
      await generateModels()
      await generateSwagger()

      startServer()
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })
} else {
  startServer()
}
