import * as program from 'commander'
import { VideoModel } from '../server/models/video/video'
import { initDatabaseModels } from '../server/initializers'
import { JobQueue } from '../server/lib/job-queue'

program
  .option('-v, --video [videoUUID]', 'Video UUID')
  .option('-r, --resolution [resolution]', 'Video resolution (integer)')
  .option('--portrait', 'Video is in portrait mode')
  .option('--hls', 'Generate HLS playlist')
  .parse(process.argv)

if (program['video'] === undefined) {
  console.error('Video ID is mandatory.')
  process.exit(-1)
}

if (program.resolution !== undefined && Number.isNaN(+program.resolution)) {
  console.error('The resolution must be an integer (example: 1080).')
  process.exit(-1)
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })

async function run () {
  await initDatabaseModels(true)

  const video = await VideoModel.loadByUUIDWithFile(program['video'])
  if (!video) throw new Error('Video not found.')

  const dataInput = {
    videoUUID: video.uuid,
    isNewVideo: false,
    resolution: program.resolution,
    isPortraitMode: program.portrait,
    generateHlsPlaylist: program.hls
  }

  await JobQueue.Instance.init()
  await JobQueue.Instance.createJob({ type: 'video-transcoding', payload: dataInput })
  console.log('Transcoding job for video %s created.', video.uuid)
}
