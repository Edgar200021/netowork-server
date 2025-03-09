import type { SuccessResponseDto } from '../../../common/dto/base.js'
import type { UserResponseDto } from '../../users/user-response.dto.js'

export type LoginResponseDto = SuccessResponseDto<UserResponseDto>
