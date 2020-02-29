import videojs, { VideoJsPlayer } from 'video.js'
import './pause-bezel'

const Plugin = videojs.getPlugin('plugin')

class BezelsPlugin extends Plugin {

  constructor (player: VideoJsPlayer, options?: videojs.ComponentOptions) {
    super(player)

    this.player.ready(() => {
      player.addClass('vjs-bezels')
    })

    player.addChild('PauseBezel', options)
  }
}

videojs.registerPlugin('bezels', BezelsPlugin)

export { BezelsPlugin }
