const EventEmitter = require('events')

module.exports = (core, opts) => new DatGossip(core, opts)

const DEFAULT_EXTENSION = 'dat-gossip@1'

class DatGossip extends EventEmitter {
  constructor (core, { extension = DEFAULT_EXTENSION } = {}) {
    super()
    this.core = core
    this.keys = new Set()

    this._onMessage = this._onMessage.bind(this)
    this._onPeerAdd = this._onPeerAdd.bind(this)

    this.extension = this.core.registerExtension(extension, {
      encoding: 'json',
      onmessage: this._onMessage
    })

    this.core.on('peer-open', this._onPeerAdd)
  }

  advertise (key, shouldBroadcast = false) {
    const stringKey = key.toString('hex')
    if (this.keys.has(stringKey)) return false

    this.keys.add(stringKey)
    this.emit('found', key)

    if (shouldBroadcast) this.broadcast()

    return true
  }

  delete (key) {
    const stringKey = key.toString('hex')
    this.keys.delete(stringKey)
  }

  list () {
    return [...this.keys].sort().map((key) => Buffer.from(key, 'hex'))
  }

  close () {
    this.extension.destroy()
    this.core.removeListener('peer-open', this._onPeerAdd)
  }

  broadcast () {
    this.extension.broadcast({ keys: [...this.keys] })
  }

  _onPeerAdd (peer) {
    this.extension.send({ keys: [...this.keys] }, peer)
  }

  _onMessage (message, peer) {
    const { keys } = message
    if (!keys) return

    let shouldBroadcast = false

    for (const key of this.keys) {
      // If this peer doesn't know about some of our keys
      // We should make sure everyone knows our keys
      if (!keys.includes(key)) shouldBroadcast = true
    }

    for (const key of keys) {
      // If this peer has kees we didn't know about
      // We should make sure everyone knows about them
      if (!this.keys.has(key)) {
        shouldBroadcast = true
        this.advertise(Buffer.from(key, 'hex'))
      }
    }

    if (shouldBroadcast) {
      this.broadcast()
    }
  }
}
