import { Routes } from '@angular/router'
import { BlocklistService } from '@app/shared/shared-moderation/blocklist.service'
import { AbuseService } from '@app/shared/shared-moderation/abuse.service'
import { VideoBlockService } from '@app/shared/shared-moderation/video-block.service'
import { ShortsComponent } from './shorts.component'

export default [
  {
    path: '',
    component: ShortsComponent,
    providers: [
      BlocklistService,
      AbuseService,
      VideoBlockService
    ],
    data: {
      meta: {
        title: $localize`Shorts`
      }
    }
  }
] satisfies Routes
