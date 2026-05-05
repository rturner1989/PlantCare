# frozen_string_literal: true

# Source-of-truth registry for every achievement kind PlantCare knows
# about. Adding a new achievement: append one entry below. Removing:
# delete the entry (existing earned rows survive — kind validation is
# soft once the row exists).
#
# Each entry declares:
#   :emoji          — display glyph
#   :label          — string OR lambda(metadata) returning a string
#   :notifier       — symbol picking which Notifier (if any) fires on
#                     unlock; nil means silent (no notification)
#   :trigger_event  — symbol matching what callsites pass to
#                     Achievement.check_triggers(event:). Common ones:
#                     :plant_created, :care_logged, :daily_sweep
#   :condition      — lambda(user, source) → boolean. Decides whether
#                     unlock! fires for this user/source combo.
#   :source_for     — optional lambda(source) → ActiveRecord. When the
#                     achievement is per-source (e.g. plant_anniversary
#                     on a specific plant) this lifts the source from
#                     whatever the dispatcher passes. Defaults to nil
#                     (global achievement).
#   :metadata_for   — optional lambda(user, source) → Hash. Extra data
#                     baked into the Achievement row (e.g. day_count,
#                     plant_nickname snapshots).
#   :surface        — :toast (default) cable-broadcasts on unlock for
#                     live in-app feedback. :splash skips the broadcast
#                     and is rendered by the client on next mount via
#                     the unseen-splash queue (login achievements,
#                     where the cable subscription isn't ready yet).
#
# See docs/achievements.md for the human-readable catalogue + how-to.
module AchievementCatalogue
  PLANT_ANNIVERSARY_DAYS = [30, 100, 365].freeze

  KINDS = {
    'first_plant' => {
      emoji: '🌱',
      label: 'First plant added',
      notifier: :achievement,
      trigger_event: :plant_created,
      condition: ->(user, _source) { user.plants.exists? }
    },

    'plant_anniversary' => {
      emoji: '🏆',
      label: ->(metadata) {
        days = metadata['day_count'] || metadata[:day_count]
        nickname = metadata['plant_nickname'] || metadata[:plant_nickname]
        "#{days} days with #{nickname}"
      },
      notifier: :achievement,
      trigger_event: :daily_sweep,
      condition: ->(_user, plant) {
        next false unless plant

        days_old = (Date.current - plant.created_at.to_date).to_i
        PLANT_ANNIVERSARY_DAYS.include?(days_old)
      },
      source_for: ->(plant) { plant },
      metadata_for: ->(_user, plant) {
        days_old = (Date.current - plant.created_at.to_date).to_i
        { day_count: days_old, plant_nickname: plant.nickname }
      }
    },

    'first_care_log' => {
      emoji: '💧',
      label: 'First care logged',
      notifier: :achievement,
      trigger_event: :care_logged,
      condition: ->(user, _source) { user.care_logs_count >= 1 }
    },

    'care_streak_7' => {
      emoji: '🔥',
      label: '7-day care streak',
      notifier: :achievement,
      trigger_event: :care_logged,
      condition: ->(user, _source) { user.current_care_streak_days >= 7 }
    },

    'care_streak_30' => {
      emoji: '🔥',
      label: '30-day care streak',
      notifier: :achievement,
      trigger_event: :care_logged,
      condition: ->(user, _source) { user.current_care_streak_days >= 30 }
    },

    'login_streak_7' => {
      emoji: '⭐',
      label: '7-day visit streak',
      notifier: :achievement,
      surface: :splash,
      trigger_event: :user_logged_in,
      condition: ->(user, _source) { user.current_login_streak_days >= 7 }
    },

    'login_streak_30' => {
      emoji: '⭐',
      label: '30-day visit streak',
      notifier: :achievement,
      surface: :splash,
      trigger_event: :user_logged_in,
      condition: ->(user, _source) { user.current_login_streak_days >= 30 }
    }
  }.freeze

  def self.find(kind)
    KINDS[kind.to_s]
  end

  def self.kinds
    KINDS.keys
  end

  def self.with_event(event)
    KINDS.select { |_, definition| definition[:trigger_event] == event }
  end

  def self.with_surface(surface)
    KINDS.select { |_, definition| (definition[:surface] || :toast) == surface }
  end
end
