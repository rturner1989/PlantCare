export const TOTAL_STEPS = 8
export const FIRST_STEP = 0
export const LAST_STEP = TOTAL_STEPS - 1

export const SLUG_BY_STEP = ['', 'intent', 'spaces', 'species', 'environment', 'stakes', 'journal', 'done']

export const STEP_NAMES = ['Welcome', 'Intent', 'Spaces', 'Plants', 'Environment', 'Stakes', 'Journal', 'All set']
export const STEP_BY_SLUG = SLUG_BY_STEP.reduce((accumulator, slug, index) => {
  accumulator[slug] = index
  return accumulator
}, {})

export function stepFromSlug(slug) {
  if (slug === undefined) return 0
  return STEP_BY_SLUG[slug] ?? 0
}

export function pathForStep(step) {
  const slug = SLUG_BY_STEP[step]
  return slug ? `/welcome/${slug}` : '/welcome'
}

export const INTENT_CONFIG = {
  forgetful: {
    label: 'Forgetful',
    emoji: '🌵',
    description: 'Plants, yes. Watering them on time — not so much. Help me remember.',
    previewLine: "You'll see streaks + gentle daily rituals the moment you land.",
    previewIcon: '🔔',
    skipSteps: [],
    step2Mode: 'fast-presets',
    step3Variant: 'multi-add',
    step4Mode: 'batch',
    step5Mode: 'promoted',
    step6Mode: 'quick',
    completionRoute: '/',
    completionCta: 'Enter your greenhouse',
  },
  just_starting: {
    label: 'Just starting out',
    emoji: '🌱',
    description: 'New to plants. Walk me through it, one at a time.',
    previewLine: "We'll explain each step + start you with easy-care species.",
    previewIcon: '🌱',
    skipSteps: [],
    step2Mode: 'walkthrough',
    step3Variant: 'easy-care',
    step4Mode: 'walkthrough',
    step5Mode: 'soft',
    step6Mode: 'explanatory',
    completionRoute: '/',
    completionCta: 'Enter your greenhouse · take your time',
  },
  sick_plant: {
    label: "Something's wrong",
    emoji: '🤒',
    description: "One of mine isn't doing well. Help me figure out why.",
    previewLine: "We'll skip the tour and head straight to diagnosing.",
    previewIcon: '🩺',
    skipSteps: [4, 5],
    step2Mode: 'fast-presets',
    step3Variant: 'single-add',
    step4Mode: 'skip',
    step5Mode: 'skip',
    step6Mode: 'rescue',
    completionRoute: '/doctor',
    completionFallback: '/',
    completionCta: "Let's check on that plant",
  },
  browsing: {
    label: 'Browsing',
    emoji: '📚',
    description: 'Curious, not committing. Let me poke around first.',
    previewLine: "We'll surface the library so you can browse before committing.",
    previewIcon: '📚',
    skipSteps: [5],
    step2Mode: 'minimal',
    step3Variant: 'gallery-first',
    step4Mode: 'batch',
    step5Mode: 'skip',
    step6Mode: 'quick',
    completionRoute: '/encyclopedia',
    completionFallback: '/',
    completionCta: 'Explore the library',
  },
}

export const INTENT_KEYS = Object.keys(INTENT_CONFIG)

export function getIntentConfig(intent) {
  if (!intent) return null
  return INTENT_CONFIG[intent] ?? null
}

export function intentSkipsStep(intent, stepIndex) {
  const config = getIntentConfig(intent)
  if (!config) return false
  return config.skipSteps.includes(stepIndex)
}

export function nextVisibleStep(currentStep, intent) {
  let candidate = currentStep + 1
  while (candidate <= LAST_STEP && intentSkipsStep(intent, candidate)) {
    candidate += 1
  }
  return Math.min(candidate, LAST_STEP)
}

export function previousVisibleStep(currentStep, intent) {
  let candidate = currentStep - 1
  while (candidate >= FIRST_STEP && intentSkipsStep(intent, candidate)) {
    candidate -= 1
  }
  return Math.max(candidate, FIRST_STEP)
}
