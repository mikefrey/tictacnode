const util = require('util')
const EventEmitter = require('events')

const sum = a => a.reduce((s, n) => s+n, 0)
const grab = (a, i) => a.findIndex(n => (i -= n) <= 0)
const random = n => Math.ceil(Math.random() * n)
const initialOptions = s => s.split('').map(c => c == '_' ? 50 : 0)

const transforms = [
  [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ], // normal
  [ 2, 1, 0, 5, 4, 3, 8, 7, 6 ], // horiz
  [ 6, 7, 8, 3, 4, 5, 0, 1, 2 ], // vert
  [ 8, 7, 6, 5, 4, 3, 2, 1, 0 ], // horiz + vert
  [ 6, 3, 0, 7, 4, 1, 8, 5, 2 ], // rotate cw
  [ 0, 3, 6, 1, 4, 7, 2, 5, 8 ], // rotate cw + horiz
  [ 8, 5, 2, 7, 4, 1, 6, 3, 0 ], // rotate cw + vert
  [ 2, 5, 8, 1, 4, 7, 0, 3, 6 ]  // rotate cw + horiz + vert
]

const board = (b, state) => {
  const t = transforms[b]
  return state.map((v, i) => state[t[i]])
}



class Game {

  constructor(menace) {

    EventEmitter.call(this)

    this.menace = menace
    this.state = ['_', '_', '_', '_', '_', '_', '_', '_', '_']
    this.moves = {}
    this.gameCount = 0
    this.winCount = 0
    this.lossCount = 0
    this.drawCount = 0
    this.firstWin = Infinity
  }

  start() {
    this._move()
  }

  playerMove(pos) {
    if (typeof pos == 'string') pos = parseInt(pos, 10)
    if (pos < 0 || 8 < pos) return false
    if (this.state[pos] !== '_') return false
    this.state[pos] = 'o'

    if (this._isGameOver()) return true

    setImmediate(() => this._move())
    return true
  }

  _isGameOver() {
    const state = this.state

    const check = (a, b, c) => state[a] == state[b] && state[a] == state[c] && state[a] != '_'

    let winner

    if (check(0, 3, 6)) winner = state[0]
    if (check(1, 4, 5)) winner = state[1]
    if (check(2, 5, 8)) winner = state[2]
    if (check(0, 1, 2)) winner = state[0]
    if (check(3, 4, 5)) winner = state[3]
    if (check(6, 7, 8)) winner = state[6]
    if (check(0, 4, 8)) winner = state[0]
    if (check(2, 4, 6)) winner = state[2]
    if (!state.includes('_')) winner = 'c'

    if (winner) {
      this.menace.saveResult(this, winner)
      this.emit('end', this.state)
      return winner
    }
    return false
  }

  _move() {
    const key = this.state.join('')
    const [rotation, state] = this._findRotatedStates(key)
    const options = this.menace.states[state]
    const pick = random(sum(options))
    const pos = transforms[rotation].indexOf(grab(options, pick))
    console.log(options)

    this.moves[state] = pos
    this.state[pos] = 'x'

    if(this._isGameOver()) return

    this.emit('data', this.state)
  }

  _findRotatedStates(state) {
    if (this.menace.states[state])
      return [0, state]

    const stateArr = state.split('')
    for (let i = 0; i < transforms.length; i+=1) {
      let altState = board(i, stateArr).join('')
      if (this.menace.states[altState])
        return [i, altState]
    }

    this.menace.states[state] = initialOptions(state)
    return [0, state]
  }

}

util.inherits(Game, EventEmitter)



class Menace {

  constructor() {

    this.states = {
      _________: [ 50, 50, 50, 50, 50, 50, 50, 50, 50 ]
    }
  }

  newGame() {
    return new Game(this)
  }

  saveResult(game, result) {

    this.gameCount += 1

    switch(result) {
      case 'o':
        this.lossCount += 1
        this.increment(-1, game.moves)
        break

      case 'c':
        this.drawCount += 1
        this.increment(1, game.moves)
        break

      case 'x':
        if (this.winCount == 0) {
          this.firstWin = this.gameCount
        }
        this.winCount += 1
        this.increment(3, game.moves)
        break
    }
  }

  increment(num, moves) {
    Object.keys(moves).forEach(m => {
      var count = this.states[m][moves[m]] + num
      this.states[m][moves[m]] = Math.max(count, 0)
    })
  }
}

module.exports = Menace
