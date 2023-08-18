const { Client } = require('@googlemaps/google-maps-services-js')
const parseDuration = require('parse-duration')
const { pad0, toDuration } = require('./utils')
const fs = require('fs')

const { error, log } = console
const JS = JSON.stringify

const { env } = process
const [arg1, arg2] = process.argv.slice(2)
const durationRun = arg1 ? parseDuration(arg1) : 5 * 60 * 60 * 1000
const durationWait = arg2 ? parseDuration(arg2) : 5 * 60 * 1000
log('collecting every', toDuration(durationWait), 'for', toDuration(durationRun))

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

const client = new Client({})

async function fetch() {
  const now = new Date()
  const morning = now.getHours() <= 11
  const origins = morning ? [HOME] : [WORK]
  const destinations = morning ? [WORK] : [HOME]
  const mode = 'driving'
  const units = 'imperial'
  const traffic_model = 'best_guess'
  const departure_time = now
  const params = { origins, destinations, mode, traffic_model, departure_time, units, key }
  const timeout = 10000

  const results = await client.distancematrix({ params, timeout })

  if (results.status !== 200 || results.data.status !== 'OK') {
    error('result status is', results.status, results.data.status)
    return undefined
  }
  const element0 = results.data.rows[0].elements[0]
  // log(JS(element0))
  // log(JS(results.data))
  const { text: durationText, value: durationValue } = element0.duration_in_traffic
  const { text: distanceText, value: distanceValue } = element0.distance
  const when = now.getHours() + ':' + pad0(now.getMinutes())
  const date = now.toLocaleDateString()
  const day = now.getDay()
  return [date, day, when, durationValue, durationText, distanceText]
}

const startMs = Date.now()

async function main() {
  try {
    const row = await fetch()
    if (row) {
      fs.appendFileSync(OUTFILE, row.join(',') + '\n')
      // console output
      const [, , when, value, text, dist] = row
      log(when, text, '(' + toDuration(value * 1000) + ', ' + dist + ')')
    }
    if (Date.now() < startMs + durationRun) {
      // log('zzzz')
      setTimeout(main, durationWait)
    }
  } catch (e) {
    error('error', e.message, e.stack)
  }
}

main()
