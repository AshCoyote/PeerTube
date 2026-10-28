import { ChangeDetectionStrategy, Component, ElementRef, OnInit, inject, viewChild } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { ComponentPaginationLight, MetaService } from '@app/core'
import { GlobalIconComponent } from '@app/shared/shared-icons/global-icon.component'
import { LoaderComponent } from '@app/shared/shared-main/common/loader.component'
import { Video } from '@app/shared/shared-main/video/video.model'
import { VideoService } from '@app/shared/shared-main/video/video.service'
import { ShortCardComponent } from './short-card.component'

@Component({
  selector: 'my-shorts',
  templateUrl: './shorts.component.html',
  styleUrls: [ './shorts.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ ShortCardComponent, LoaderComponent, GlobalIconComponent, RouterLink ]
})
export class ShortsComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private videoService = inject(VideoService)
  private metaService = inject(MetaService)

  readonly container = viewChild<ElementRef<HTMLElement>>('container')

  shorts: Video[] = []
  activeIndex = 0
  loading = true

  ngOnInit () {
    this.metaService.setTitle($localize`Shorts`)

    const start = this.route.snapshot.queryParamMap.get('start')
    const videoPagination: ComponentPaginationLight = { currentPage: 1, itemsPerPage: 20 }

    this.videoService.listVideos({ videoPagination, sort: '-publishedAt', isShort: true })
      .subscribe({
        next: result => {
          this.shorts = result.data
          this.loading = false

          if (start) {
            const index = this.shorts.findIndex(s => s.uuid === start || s.shortUUID === start)
            this.activeIndex = Math.max(0, index)
          }

          setTimeout(() => this.scrollToActive(), 0)
        },
        error: () => this.loading = false
      })
  }

  onScroll () {
    const container = this.container()?.nativeElement
    if (!container) return

    const itemHeight = container.clientHeight
    if (!itemHeight) return

    this.activeIndex = Math.round(container.scrollTop / itemHeight)
  }

  private scrollToActive () {
    const container = this.container()?.nativeElement
    if (!container || this.activeIndex === 0) return

    container.scrollTop = this.activeIndex * container.clientHeight
  }
}
