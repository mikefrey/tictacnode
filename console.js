'use strict'

const Menace = require('./index')
const readline = require('readline')

const menace = new Menace()
let game

function color(val, i) {
  if (!val) return ''
  if (val == 'x') return '\u001b[31mX\u001b[39m'
  if (val == 'o') return '\u001b[32mO\u001b[39m'
  return `\u001b[90m${i}\u001b[39m`
}

function fill(strings, ...values) {
  let result = ''
  for (let i = 0; i < strings.length; i+=1) {
    result += strings[i] + color(values[i], i)
  }
  return result
}

function printState(state) {
  console.log(fill`
    ${state[0]} | ${state[1]} | ${state[2]}
    --+---+--
    ${state[3]} | ${state[4]} | ${state[5]}
    --+---+--
    ${state[6]} | ${state[7]} | ${state[8]}
  `)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function promptNewGame() {
  rl.question('Start new game? ', (answer) => {
    if (answer == 'n') {
      rl.close()
      process.exit()
    }

    game = menace.newGame()

    game.on('data', state => {
      console.log('DATA')
      printState(state)
      promptMove(game)
    })

    game.on('end', state => {
      console.log('\n\nGAME OVER')
      printState(state)
      promptNewGame()
    })

    game.start()
  })
}

function promptMove(game) {
  rl.question('What is your next move? ', (answer) => {

    if (answer == 'q') {
      rl.close()
      process.exit()
    }

    game.playerMove(answer)
  })
}

promptNewGame()
