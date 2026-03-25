export const SOURCE_MESSAGE_BUFFER_CAP = 500;

export const capMessageBuffer = <T>(messages: T[]): T[] =>
  messages.length > SOURCE_MESSAGE_BUFFER_CAP
    ? messages.slice(-SOURCE_MESSAGE_BUFFER_CAP)
    : messages;
