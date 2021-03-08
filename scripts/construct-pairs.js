const fetch = require('node-fetch')
const {writeFileSync} = require('fs')

const exchanges = ['kraken', 'binance']
const pairs = [] 

async function main () {
  for (const exchange of exchanges) {
    const response = await fetch(`https://api.cryptowat.ch/markets/${exchange}`)
    const result = (await response.json()).result
    pairs.push({
      exchange,
      pairs: result.map(a => a.pair)
    })
  }
  writeFileSync('src/pairs.json', JSON.stringify(pairs))
}

main()