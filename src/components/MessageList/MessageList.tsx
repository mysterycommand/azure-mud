import React, {
  FC,
  forwardRef,
  useRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useContext,
  UIEventHandler
} from 'react'
import {
  ActivateAutoscrollAction,
  DeactivateAutoscrollAction
} from '../../Actions'
import { DispatchContext } from '../../App'

import { Message, MessageType } from '../../message'
import MessageView from '../MessageView'

import './MessageList.css'

interface MessageListProps {
  messages: Message[];
  autoscroll: boolean;
}

const messageId = (message: Message): string =>
  `${message.type}-${message.timestamp}`

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

const useAutoscroll = (
  autoscroll: boolean
): MutableRefObject<HTMLOListElement> => {
  const olRef = useRef<HTMLOListElement>()

  const mutationCallback = useCallback(
    (mutations) => {
      if (!autoscroll) {
        return
      }

      for (const mutation of mutations) {
        if (
          !(
            mutation.type === 'childList' &&
            mutation.addedNodes.length === 1 &&
            mutation.addedNodes[0] instanceof Element &&
            mutation.addedNodes[0].matches('.message-list > :last-child')
          )
        ) {
          continue
        }

        mutation.addedNodes[0].scrollIntoView({
          behavior: 'smooth'
        })
      }
    },
    [autoscroll]
  )

  useEffect(() => {
    if (!olRef.current) {
      return
    }

    const mutationObserver = new MutationObserver(mutationCallback)
    mutationObserver.observe(olRef.current, {
      childList: true
    })

    return () => mutationObserver.disconnect()
  }, [olRef.current, mutationCallback])

  return olRef
}

const useToggleAutoscroll = (autoscroll: boolean): UIEventHandler<HTMLOListElement> => {
  const dispatch = useContext(DispatchContext)

  return useCallback<UIEventHandler<HTMLOListElement>>(
    ({ currentTarget }) => {
      const isScrolledToBottom =
        currentTarget.scrollHeight ===
        // not exactly sure why, but sometime's there's a half-pixel difference
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

export const MessageList = ({ messages, autoscroll }) => {
  const olRef = useAutoscroll(autoscroll)
  const handleScroll = useToggleAutoscroll(autoscroll)

  return (
    <ol className="message-list" ref={olRef} onScroll={handleScroll}>
      {messages.map((message, i) => (
        <li key={messageId(message)}>
          {message.type === MessageType.MovedRoom && <hr />}
          <MessageView
            message={message}
            id={messageId(message)}
            hideTimestamp={shouldHideTimestamp(message, messages[i - 1])}
            msgIndex={i}
          />
        </li>
      ))}
    </ol>
  )
}
