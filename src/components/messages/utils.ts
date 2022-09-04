import { Message } from '../../message'

export const messageId = (message: Message): string =>
  `${message.type}-${message.timestamp}`
