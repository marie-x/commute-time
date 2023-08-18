const { Client } = require('@googlemaps/google-maps-services-js')
const parseDuration = require('parse-duration')
const fs = require('fs')

const client = new Client({})
const JS = JSON.stringify
const { error, log } = console

// log(JS(process.argv))
const [arg1, arg2] = process.argv.slice(2)
const durationRun = arg1 ? parseDuration(arg1) : 5 * 60 * 60 * 1000
const durationWait = arg2 ? parseDuration(arg2) : 5 * 60 * 1000
log('collecting every', toHHMMSS(durationWait), 'for', toHHMMSS(durationRun))

function toHHMMSS(ms) {
  const secs = Math.floor(ms / 1000) // in case of float
  // log('toHHMMSS', secs)
  const h = Math.floor(secs / (60 * 60))
  const m = Math.floor(secs / 60) % 60
  const s = secs % 60
  const ss = new String(s).padStart(2, '0')
  // TODO make nicer
  if (h) {
    const mm = new String(m).padStart(2, '0')
    return h + ':' + mm + ':' + ss
  }
  if (m) {
    return m + ':' + ss
  }
  return ':' + ss
}

const OUTFILE = env.OUTFILE ?? 'commute-data.csv'

const key = env.GOOGLE_MAPS_API_KEY
if (!key) {
  error('no GOOGLE_MAPS_API_KEY')
  exit(-1)
}

const HOME = env.HOME
if (!HOME) {
  error('no HOME')
  exit(-1)
}

const WORK = env.WORK
if (!WORK) {
  error('no WORK')
  exit(-1)
}

async function fetch() {
  const now = new Date()
  const morning = now.getHours() <= 12
  const origin = morning ? HOME : WORK
  const destination = morning ? WORK : HOME
  const travelMode = 'DRIVING'
  const trafficModel = 'pessimistic'
  const departureTime = new Date(Date.now() + 60 * 1000)
  const drivingOptions = { departureTime, trafficModel }
  const params = { origin, destination, travelMode, drivingOptions, key }
  const timeout = 10000
  const results = await client.directions({ params, timeout })
  const { text, value } = results.data.routes[0].legs[0].duration
  const when = now.getHours() + ':' + new String(now.getMinutes()).padStart(2, '0')
  const date = now.toLocaleDateString()
  const day = now.getDay()
  // date, day of week, minute of day, number of seconds
  const data = [date, day, when, value, text]

  fs.appendFileSync(OUTFILE, data.join(',') + '\n')

  const mmss = toHHMMSS(value * 1000)
  log(when, text, '(' + mmss + ')')
}

const startMs = Date.now()

async function main() {
  try {
    await fetch()
    if (Date.now() < startMs + durationRun) {
      // log('zzzz')
      setTimeout(main, durationWait)
    }
  } catch (e) {
    error('error', e.message)
  }
}

main()