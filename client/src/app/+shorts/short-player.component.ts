import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  LOCALE_ID,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  input,
  viewChild
} from '@angular/core'
import { AuthService, Notifier, PluginService, ServerService } from '@app/core'
import { getAPIUrl } from '@app/helpers'
import { VideoDetails } from '@app/shared/shared-main/video/video-details.model'
import { VideoFileTokenService } from '@app/shared/shared-main/video/video-file-token.service'
import { VideoService } from '@app/shared/shared-main/video/video.service'
import { HLSOptions, PeerTubePlayer, PeerTubePlayerConstructorOptions, PeerTubePlayerLoadOptions } from '@peertube/player'
import { PlayerMode, PlayerTheme } from '@peertube/peertube-models'
import { videoRequiresFileToken, videoRequiresUserAuth } from '@root-helpers/video'
import { firstValueFrom } from 'rxjs'

@Component({
  selector: 'my-short-player',
  template: '<video #playerElement class="video-js"></video>',
  styleUrls: [ './short-player.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class ShortPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  private authService = inject(AuthService)
  private notifier = inject(Notifier)
  private pluginService = inject(PluginService)
  private serverService = inject(ServerService)
  private videoService = inject(VideoService)
  private videoFileTokenService = inject(VideoFileTokenService)
  private localeId = inject(LOCALE_ID)

  readonly video = input.required<VideoDetails>()
  readonly active = input(false)

  readonly playerElement = viewChild<ElementRef<HTMLVideoElement>>('playerElement')

  private player: PeerTubePlayer

  ngAfterViewInit () {
    this.init()
      .catch(err => this.notifier.error(err.message))
  }

  ngOnChanges (changes: SimpleChanges) {
    if (changes['active'] && !changes['active'].firstChange) {
      this.applyPlaybackState()
    }
  }

  ngOnDestroy () {
    this.player?.destroy()
  }

  private async init () {
    const video = this.video()
    const serverConfig = this.serverService.getHTMLConfig()

    // Private/internal shorts need a file token to be read by the player
    const videoFileToken = videoRequiresFileToken(video)
      ? (await firstValueFrom(this.videoFileTokenService.getVideoFileToken({ videoUUID: video.uuid }))).token
      : undefined

    this.player = new PeerTubePlayer({
      playerElement: () => this.playerElement().nativeElement,

      controls: true,
      controlBar: true,

      muted: true,
      loop: true,

      peertubeLink: () => false,

      enableHotkeys: false,
      inactivityTimeout: 2500,

      videoViewIntervalMs: serverConfig.views.videos.watchingInterval.anonymous,

      instanceName: serverConfig.instance.name,

      theaterButton: false,
      mainContent: false,

      authorizationHeader: () => this.authService.getRequestHeaderValue(),

      metricsUrl: null,
      metricsInterval: 0,

      serverUrl: getAPIUrl(),

      errorNotifier: (message: string) => this.notifier.error(message),

      language: this.localeId,

      pluginsManager: this.pluginService.getPluginsManager(),

      stunServers: serverConfig.webrtc.stunServers
    })

    await this.player.load(this.buildLoadOptions(video, videoFileToken))

    this.applyPlaybackState()
  }

  private buildLoadOptions (video: VideoDetails, videoFileToken: string): PeerTubePlayerLoadOptions {
    const mode: PlayerMode = video.hasHlsPlaylist()
      ? 'p2p-media-loader'
      : 'web-video'
    const theme: PlayerTheme = 'lucide'

    let hls: HLSOptions
    if (video.hasHlsPlaylist()) {
      const hlsPlaylist = video.getHlsPlaylist()

      hls = {
        playlistUrl: hlsPlaylist.playlistUrl,
        segmentsSha256Url: hlsPlaylist.segmentsSha256Url,
        redundancyBaseUrls: hlsPlaylist.redundancies.map(r => r.baseUrl),
        trackerAnnounce: video.trackerUrls,
        videoFiles: hlsPlaylist.files
      }
    }

    return {
      mode,
      theme,

      autoplay: false,
      forceAutoplay: false,

      thumbnails: video.thumbnails,

      videoViewUrl: this.videoService.getVideoViewUrl(video.uuid),

      embedUrl: video.embedUrl,
      embedTitle: video.name,

      isLive: video.isLive,

      videoCaptions: [],
      videoChapters: [],
      storyboard: undefined,

      videoUUID: video.uuid,
      videoShortUUID: video.shortUUID,

      duration: video.duration,
      videoRatio: video.aspectRatio,

      requiresUserAuth: videoRequiresUserAuth(video),
      videoFileToken: () => videoFileToken,
      requiresPassword: false,
      videoPassword: () => undefined,

      nextVideo: {
        enabled: false,
        getVideoTitle: () => '',
        displayControlBarButton: false
      },
      previousVideo: {
        enabled: false,
        displayControlBarButton: false
      },

      p2pEnabled: false,

      hls,
      webVideo: {
        videoFiles: video.files
      }
    }
  }

  private applyPlaybackState () {
    const player = this.player?.getPlayer()
    if (!player) return

    if (this.active()) {
      const playPromise = player.play() as Promise<void> | undefined
      if (playPromise) playPromise.catch(() => { /* Autoplay may be blocked by the browser */ })
    } else {
      player.pause()
    }
  }
}
