const test = require('supertape')
const SDK = require('dat-sdk')
const RAM = require('random-access-memory')
const { once } = require('events')

const datGossip = require('./')

const DATA_ONE = Buffer.from('0000', 'hex')
const DATA_TWO = Buffer.from('AAAA', 'hex')
const FULL_LIST = [DATA_ONE, DATA_TWO]

test('gossip between two peers', async (t) => {
  const sdk1 = await SDK({ storage: RAM })
  const sdk2 = await SDK({ storage: RAM })

  const core1 = sdk1.Hypercore('gossip')

  await core1.ready()

  t.comment(`Advertising on ${core1.key.toString('hex')}`)

  const core2 = sdk2.Hypercore(core1.key)

  const { publicKey: id1 } = await sdk1.getIdentity()
  const { publicKey: id2 } = await sdk2.getIdentity()

  const gossip1 = datGossip(core1, { id: id1 })
  const gossip2 = datGossip(core2, { id: id2 })

  gossip1.advertise(DATA_ONE)
  gossip2.advertise(DATA_TWO)

  let found1 = null
  let found2 = null
  while (true) {
    const [[_found1], [_found2]] = await Promise.all([
      once(gossip1, 'changed'),
      once(gossip2, 'changed')
    ])

    found1 = _found1
    found2 = _found2

    if ((found1.length === 2) && (found2.length === 2)) break
  }

  const list1 = gossip1.list()
  const list2 = gossip2.list()

  t.deepEqual(list1, FULL_LIST, 'First gossip has full list')
  t.deepEqual(list2, FULL_LIST, 'Second gossip has full list')

  t.end()

  sdk1.close()
  sdk2.close()
})
