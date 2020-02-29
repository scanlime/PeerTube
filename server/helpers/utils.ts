import { ResultList } from '../../shared'
import { ApplicationModel } from '../models/application/application'
import { execPromise, execPromise2, randomBytesPromise, sha256 } from './core-utils'
import { logger } from './logger'
import { join } from 'path'
import { Instance as ParseTorrent } from 'parse-torrent'
import { remove } from 'fs-extra'
import * as memoizee from 'memoizee'
import { CONFIG } from '../initializers/config'

function deleteFileAsync (path: string) {
  remove(path)
    .catch(err => logger.error('Cannot delete the file %s asynchronously.', path, { err }))
}

async function generateRandomString (size: number) {
  const raw = await randomBytesPromise(size)

  return raw.toString('hex')
}

interface FormattableToJSON<U, V> {
  toFormattedJSON (args?: U): V
}

function getFormattedObjects<U, V, T extends FormattableToJSON<U, V>> (objects: T[], objectsTotal: number, formattedArg?: U) {
  const formattedObjects = objects.map(o => o.toFormattedJSON(formattedArg))

  return {
    total: objectsTotal,
    data: formattedObjects
  } as ResultList<V>
}

const getServerActor = memoizee(async function () {
  const application = await ApplicationModel.load()
  if (!application) throw Error('Could not load Application from database.')

  const actor = application.Account.Actor
  actor.Account = application.Account

  return actor
}, { promise: true })

function generateVideoImportTmpPath (target: string | ParseTorrent) {
  const id = typeof target === 'string' ? target : target.infoHash

  const hash = sha256(id)
  return join(CONFIG.STORAGE.TMP_DIR, hash + '-import.mp4')
}

function getSecureTorrentName (originalName: string) {
  return sha256(originalName) + '.torrent'
}

async function getServerCommit () {
  try {
    const tag = await execPromise2(
      '[ ! -d .git ] || git name-rev --name-only --tags --no-undefined HEAD 2>/dev/null || true',
      { stdio: [ 0, 1, 2 ] }
    )

    if (tag) return tag.replace(/^v/, '')
  } catch (err) {
    logger.debug('Cannot get version from git tags.', { err })
  }

  try {
    const version = await execPromise('[ ! -d .git ] || git rev-parse --short HEAD')

    if (version) return version.toString().trim()
  } catch (err) {
    logger.debug('Cannot get version from git HEAD.', { err })
  }

  return ''
}

/**
 * From a filename like "ede4cba5-742b-46fa-a388-9a6eb3a3aeb3.mp4", returns
 * only the "ede4cba5-742b-46fa-a388-9a6eb3a3aeb3" part. If the filename does
 * not contain a UUID, returns null.
 */
function getUUIDFromFilename (filename: string) {
  const regex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  const result = filename.match(regex)

  if (!result || Array.isArray(result) === false) return null

  return result[0]
}

// ---------------------------------------------------------------------------

export {
  deleteFileAsync,
  generateRandomString,
  getFormattedObjects,
  getSecureTorrentName,
  getServerActor,
  getServerCommit,
  generateVideoImportTmpPath,
  getUUIDFromFilename
}
