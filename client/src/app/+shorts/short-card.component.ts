import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthService } from '@app/core'
import { GlobalIconComponent } from '@app/shared/shared-icons/global-icon.component'
import { LoaderComponent } from '@app/shared/shared-main/common/loader.component'
import { VideoDetails } from '@app/shared/shared-main/video/video-details.model'
import { Video } from '@app/shared/shared-main/video/video.model'
import { VideoService } from '@app/shared/shared-main/video/video.service'
import { VideoCommentsComponent } from '../+video-watch/shared/comment/video-comments.component'
import { VideoRateComponent } from '../+video-watch/shared/action-buttons/video-rate.component'
import { ShortPlayerComponent } from './short-player.component'

@Component({
  selector: 'my-short-card',
  templateUrl: './short-card.component.html',
  styleUrls: [ './short-card.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    GlobalIconComponent,
    LoaderComponent,
    ShortPlayerComponent,
    VideoRateComponent,
    VideoCommentsComponent
  ]
})
export class ShortCardComponent implements OnInit {
  private authService = inject(AuthService)
  private videoService = inject(VideoService)

  readonly video = input.required<Video>()
  readonly active = input(false)

  videoDetails: VideoDetails
  commentsOpened = false

  ngOnInit () {
    // The list endpoint returns a summary: likes, comments and the player need the full video
    this.videoService.getVideo({ videoId: this.video().uuid })
      .subscribe({
        next: videoDetails => this.videoDetails = videoDetails,
        error: () => this.videoDetails = undefined // Keep the card without a player
      })
  }

  isLoggedIn () {
    return this.authService.isLoggedIn()
  }

  getWatchUrl () {
    return [ '/w', this.video().shortUUID ]
  }

  toggleComments () {
    this.commentsOpened = !this.commentsOpened
  }
}
