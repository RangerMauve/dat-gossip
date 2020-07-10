const EventEmitter = require('events')

const HypercorePresence = require('hyper-presence')

module.exports = (core, opts) => new DatGossip(core, opts)

const DEFAULT_EXTENSION = 'dat-gossip@2'

class DatGossip extends EventEmitter {
  constructor (core, { extension = DEFAULT_EXTENSION, id } = {}) {
    super()
    this.presence = new HypercorePresence(core, { extension, id, data: {keys: []} })

    this.core = core

    this.keys = new Set()

    this._emitKeys = this._emitKeys.bind(this)

    this.presence.on('online', this._emitKeys)
    this.presence.on('peer-data', this._emitKeys)
  }

  _emitKeys () {
    const keys = this.list()
    this.emit('changed', keys)
  }

  _updateData () {
    const keys = [...this.keys].map((key) => key.toString('hex'))

    this.presence.setData({ keys })
  }

  advertise (key) {
    const stringKey = key.toString('hex')
    if (this.keys.has(stringKey)) return false

    this.keys.add(stringKey)

    this._updateData()
  }

  delete (key) {
    const stringKey = key.toString('hex')
    this.keys.delete(stringKey)

    this._updateData()
  }

  list () {
    const all = new Set(this.keys)

    for (const id of this.presence.online) {
      const data = this.presence.getPeerData(id)
      if (!data) continue

      const { keys } = data
      if (!keys || !keys.length) continue

      for (const key of keys) {
        all.add(key)
      }
    }

    return [...all].sort().map((key) => Buffer.from(key, 'hex'))
  }

  close () {
    this.extension.destroy()
    this.core.removeListener('peer-open', this._onPeerAdd)
  }
}
