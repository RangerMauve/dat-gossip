const test = require('supertape')
const SDK = require('dat-sdk')
const RAM = require('random-access-memory')
const { once } = require('events')

const datGossip = require('./')

const DATA_ONE = Buffer.from('One')
const DATA_TWO = Buffer.from('Two')
const FULL_LIST = [DATA_ONE, DATA_TWO]

test('gossip between two peers', async (t) => {
  const sdk1 = await SDK({ storage: RAM })
  const sdk2 = await SDK({ storage: RAM })

  const core1 = sdk1.Hypercore('gossip')

  await core1.ready()

  t.comment(`Advertising on ${core1.key.toString('hex')}`)

  const core2 = sdk2.Hypercore(core1.key)

  const gossip1 = datGossip(core1)
  const gossip2 = datGossip(core2)

  gossip1.advertise(DATA_ONE)
  gossip2.advertise(DATA_TWO)

  const [[found1], [found2]] = await Promise.all([
    once(gossip1, 'found'),
    once(gossip2, 'found')
  ])

  t.deepEqual(found1, DATA_TWO, 'First gossip found data')
  t.deepEqual(found2, DATA_ONE, 'Second gossip found data')

  const list1 = gossip1.list()
  const list2 = gossip2.list()

  t.deepEqual(list1, FULL_LIST, 'First gossip has full list')
  t.deepEqual(list2, FULL_LIST, 'Second gossip has full list')

  t.end()

  sdk1.close()
  sdk2.close()
})
