const PERSONALITY_EMOJI = {
  dramatic: '🌿',
  prickly: '🌵',
  chill: '🪴',
  needy: '🌸',
  stoic: '🌲',
}

const FALLBACK_EMOJI = '🌱'

export function getPersonalityEmoji(personality) {
  return PERSONALITY_EMOJI[personality] ?? FALLBACK_EMOJI
}
