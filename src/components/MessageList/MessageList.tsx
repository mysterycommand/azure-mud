import React, {
  FC,
  MutableRefObject,
  UIEventHandler,
  useCallback,
  useContext,
  useEffect,
  useRef
} from 'react'

import {
  ActivateAutoscrollAction,
  DeactivateAutoscrollAction
} from '../../Actions'
import { DispatchContext, MessagesContext } from '../../App'

import { Message } from '../../message'
import { MessageItem } from '../MessageItem'

import './MessageList.css'

interface MessageListProps {
  // messages: Message[];
  autoscroll: boolean;
}

const THREE_MINUTES = 1_000 * 60 * 3
const shouldHideTimestamp = (
  message: Message,
  previousMessage: Message | undefined
): boolean =>
  previousMessage &&
  'userId' in previousMessage &&
  'userId' in message &&
  previousMessage.userId === message.userId &&
  new Date(message.timestamp).getTime() -
    new Date(previousMessage.timestamp).getTime() <
    THREE_MINUTES

const useAutoscrollTo = (
  selector: string,
  autoscroll: boolean
): MutableRefObject<HTMLOListElement> => {
  const scrollContainerRef = useRef<HTMLOListElement>()

  const mutationCallback = useCallback(
    (mutations) => {
      if (!autoscroll) {
        return
      }

      mutations
        .find(
          (mutation) =>
            mutation.type === 'childList' &&
            mutation.addedNodes.length === 1 &&
            mutation.addedNodes[0] instanceof Element &&
            mutation.addedNodes[0].matches(selector)
        )
        ?.addedNodes[0].scrollIntoView({
          behavior: 'smooth'
        })
    },
    [selector, autoscroll]
  )

  useEffect(() => {
    if (!scrollContainerRef.current) {
      return
    }

    const mutationObserver = new MutationObserver(mutationCallback)
    mutationObserver.observe(scrollContainerRef.current, {
      childList: true
    })

    return () => mutationObserver.disconnect()
  }, [scrollContainerRef.current, mutationCallback])

  return scrollContainerRef
}

const useToggleAutoscroll = (
  autoscroll: boolean
): UIEventHandler<HTMLOListElement> => {
  const dispatch = useContext(DispatchContext)

  return useCallback<UIEventHandler<HTMLOListElement>>(
    ({ currentTarget }) => {
      const isScrolledToBottom =
        currentTarget.scrollHeight ===
        // not exactly sure why, but sometime's there's an extra half-pixel
        Math.floor(currentTarget.scrollTop + currentTarget.clientHeight + 1)

      if (isScrolledToBottom && !autoscroll) {
        dispatch(ActivateAutoscrollAction())
      } else if (!isScrolledToBottom && autoscroll) {
        dispatch(DeactivateAutoscrollAction())
      }
    },
    [autoscroll, dispatch]
  )
}

export const MessageList: FC<MessageListProps> = ({ autoscroll }) => {
  const messages = useContext(MessagesContext)

  const scrollContainerRef = useAutoscrollTo(
    '.message-list > :last-child',
    autoscroll
  )
  const toggleAutoscroll = useToggleAutoscroll(autoscroll)

  return (
    <ol
      className="message-list"
      ref={scrollContainerRef}
      onScroll={toggleAutoscroll}
    >
      {messages.ids.map((id, i, ids) => {
        const message = messages.entities[id]
        const prevMessage = messages.entities[ids[i - 1]]

        return (
          <MessageItem
            key={id}
            id={id}
            hideTimestamp={shouldHideTimestamp(message, prevMessage)}
            msgIndex={i}
          />
        )
      })}
    </ol>
  )
}
