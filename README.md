# dat-gossip
Gossip a set of keys via extension messages on a Hypercore

```shell
npm install --save dat-gossip
```

```js
const datGossip = require('dat-gossip')

// Get a hypercore from _somewhere_ which all your peers are swarming on
const discoveryCore = getHypercore()

// Start gossiping on it
const gossip = datGossip(discoveryCore)

// Add some more data to advertise in the swarm
gossip.advertise(Buffer.from('Something'), true)

// Listen for when new data has been discovered
gossip.on('found', (data) => {
	console.log('Found some new data', data)
})

// Get an array of buffers for all known data
// Sorted alphanumerically
const allKnown = gossip.list()
```

## Credits

Ce logiciel a été créé dans le cadre du projet de plateforme virtuelle de création autochtone P2P Natakanu. Une réalisation de Wapikoni Mobile, Uhu Labos Nomades et du Bureau de l'engagement communautaire de l'université Concordia. Projet financé dans le cadre de l'Entente sur le développement culturel de Montréal conclue entre la Ville de Montréal et gouvernement du Québec.

---

This software was created as part of Natakanu, a P2P indigenous  platform produced by Wapikoni Mobile, Uhu Labos Nomades and the Office of Community Engagement at Concordia University. Project funded under the Montreal cultural development agreement between the city of Montreal and the government of Quebec.

<img src="quebec.png" width="395" alt="Quebec Province Logo" />
<img src="montreal.jpg" width="395" alt="Montreal City Logo" />

## How it works

- Hold a set of all data seen before
- When you get a new peer, send them your set
- When a peer sends you data
	- See if they're missing any data you have (broadcast to all if you do)
	- See if they have data you're missing (track it, broadcast to all)

This results in an eventually consistant system based on the principles of the [Grow-only Set](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type#G-Set_(Grow-only_Set)) conflict-free replicated data type.

Simply put, as new data gets advertised, everyone will eventually know about it.

## API

### `const gossip = datGossip(core, {extension='dat-gossip@1'})`

Creates a new instance of dat-gossip and starts gossiping over the core's replication streams.

- `core` is a mandatory [hypercore](https://github.com/mafintosh/hypercore) instance which will be used for gossiping with peers
- `extension` is an option you can add if you wish you use a custom extension message name. You probably don't need to touch this.

### `gossip.on('found', (data))`

Event emitted whenever some new data has been found. You can use this to react to newly gossiped Dat archives and load them up.

- `data` is a Buffer containing the newly found data.

#### `const isNew = gossip.advertise(data, shouldBroadcast=false)`

Adds some more data to be tracked by the gossip.

- `isNew` is a boolean representing whether this data has never been encoutered before
- `data` should be a Buffer instance to start gossiping with other peers. This could be your Dat archive's key
- `shouldBroadcast` controls whether you wish to broadcast your data to every peer. You might want to set this to `false` if you're planning on adding a bunch of items to advertise in a row.

#### `gossip.delete(data)`

Removes some data from the internal set. This doesn't mean it won't be found again later through gossip

#### `gossip.broadcast()`

Sends out a broadcast of your current set of data to all connected peers.

#### `const list = gossip.list()`

Lists all the known bits of data that have been gossiped so far.

#### `gossip.close()`

Unregister all listeners from the hypercore and stop sending messages.
The gossip instance should not be used after this point.
You will still need to call `close` on your hypercore instance to clean it up.
