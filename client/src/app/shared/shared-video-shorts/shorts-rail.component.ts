import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ComponentPaginationLight } from '@app/core'
import { maxBy } from '@peertube/peertube-core-utils'
import { Video } from '../shared-main/video/video.model'
import { VideoService } from '../shared-main/video/video.service'

@Component({
  selector: 'my-shorts-rail',
  templateUrl: './shorts-rail.component.html',
  styleUrls: [ './shorts-rail.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ RouterLink ]
})
export class ShortsRailComponent implements OnInit {
  private videoService = inject(VideoService)

  shorts: Video[] = []

  ngOnInit () {
    const videoPagination: ComponentPaginationLight = { currentPage: 1, itemsPerPage: 12 }

    this.videoService.listVideos({ videoPagination, sort: '-publishedAt', isShort: true, skipCount: true })
      .subscribe({
        next: result => this.shorts = result.data,
        error: () => this.shorts = []
      })
  }

  getThumbnailUrl (video: Video) {
    const thumbnail = maxBy(video.thumbnails || [], 'width')

    return thumbnail
      ? thumbnail.fileUrl
      : undefined
  }
}
