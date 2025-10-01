// Application constants to replace magic numbers

// Date and time calculations
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24,
  MILLISECONDS_PER_HOUR: 1000 * 60 * 60,
  MILLISECONDS_PER_MINUTE: 1000 * 60,
  DAYS_PER_MONTH: 31,
  MONTHS_PER_YEAR: 12,
  DAYS_IN_YEAR: 365,
  MAX_DAYS_FROM_TODAY_FALLBACK: 999, // For tasks without due dates
} as const

// Urgency thresholds (days)
export const URGENCY_THRESHOLDS = {
  SOON: 3,
  NEXT_7: 7,
  NEXT_30: 30,
} as const

// Smart priority scoring
export const PRIORITY_SCORES = {
  URGENCY: {
    OVERDUE: 100,
    SOON: 80,
    NEXT_7: 60,
    NEXT_30: 40,
    NORMAL: 20,
  },
  IMPORTANCE_MULTIPLIER: 8, // 1-5 importance → 0-40 points
  MAX_DAYS_BONUS: 30,
  DAYS_BONUS_DIVISOR: 2,
} as const

// UI and animation constants
export const UI_CONSTANTS = {
  // Swipe gesture thresholds
  SWIPE_THRESHOLD: 80,
  MAX_TRANSLATE: 120,
  SWIPE_ANIMATION_DELAY: 200,
  
  // Timeouts and delays
  AUTO_ROLLOVER_DELAY: 1000,
  SUCCESS_MESSAGE_DELAY: 1500,
  NOTIFICATION_DELAY: 3000,
  DATABASE_INIT_RETRY_DELAY: 100,
  
  // Z-index values
  MODAL_Z_INDEX: 1000,
  DIALOG_Z_INDEX: 50,
  
  // Percentage calculations
  PERCENTAGE_MULTIPLIER: 100,
} as const

// HTTP status codes
export const HTTP_STATUS = {
  INTERNAL_SERVER_ERROR: 500,
} as const

// Recurring task limits
export const RECURRING_LIMITS = {
  MAX_GENERATION_DAYS: 365, // Maximum days to generate recurring tasks
} as const

// Task form limits
export const FORM_LIMITS = {
  MAX_MONTH_DAYS: 31,
  MIN_IMPORTANCE: 1,
  MAX_IMPORTANCE: 5,
} as const

// Special date constants
export const SPECIAL_DATES = {
  NO_DUE_DATE: '2999-12-31', // Used for tasks without due date (idea box)
  FAR_FUTURE_DATE: '9999-12-31', // Used for archived/special tasks
} as const