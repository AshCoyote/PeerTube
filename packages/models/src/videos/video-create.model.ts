import { VideoCreateUpdateCommon } from './video-create-update-common.model.js'
import { VideoPrivacyType } from './video-privacy.enum.js'

export interface VideoCreate extends VideoCreateUpdateCommon {
  name: string
  channelId: number
  privacy: VideoPrivacyType

  // Upload a vertical short video instead of a regular one
  isShort?: boolean

  // Default is true if the feature is enabled by the instance admin
  generateTranscription?: boolean
}
