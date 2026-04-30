# frozen_string_literal: true

# Drives the three derived-event notifiers — CareDue::WaterNotifier,
# CareDue::FeedNotifier, and MilestoneNotifier. Self-action notifiers
# (plant added, photo added) live in the Journal region, not the
# notifications inbox.
#
# Runs daily via sidekiq-cron. Idempotent — re-running within the dedup
# window produces no duplicate notifications.
class NotificationsSweeperJob < ApplicationJob
  queue_as :default

  MILESTONE_DAYS = [30, 100, 365].freeze
  CARE_DEDUP_WINDOW = 24.hours

  def perform
    User.joins(:plants).distinct.find_each do |user|
      user.plants.includes(:space, :species).find_each do |plant|
        sweep_water_due(user, plant) if plant.water_status.in?([:overdue, :due_today])
        sweep_feed_due(user, plant) if plant.feed_status.in?([:overdue, :due_today])
        sweep_milestone(user, plant)
      end
    end
  end

  private def sweep_water_due(user, plant)
    return if recent_event?(CareDue::WaterNotifier, plant, CARE_DEDUP_WINDOW)

    CareDue::WaterNotifier.with(
      record: plant,
      plant_id: plant.id,
      plant_nickname: plant.nickname,
      days_overdue: overdue_days(plant.days_until_water)
    ).deliver(user)
  end

  private def sweep_feed_due(user, plant)
    return if recent_event?(CareDue::FeedNotifier, plant, CARE_DEDUP_WINDOW)

    CareDue::FeedNotifier.with(
      record: plant,
      plant_id: plant.id,
      plant_nickname: plant.nickname,
      days_overdue: overdue_days(plant.days_until_feed)
    ).deliver(user)
  end

  private def sweep_milestone(user, plant)
    days_old = (Date.current - plant.created_at.to_date).to_i
    return unless MILESTONE_DAYS.include?(days_old)
    return if milestone_already_fired?(plant, days_old)

    MilestoneNotifier.with(
      record: plant,
      plant_id: plant.id,
      plant_nickname: plant.nickname,
      day_count: days_old
    ).deliver(user)
  end

  private def overdue_days(days_until)
    days_until.negative? ? -days_until : 0
  end

  private def recent_event?(notifier_class, plant, window)
    Noticed::Event.where(type: notifier_class.name, record: plant).exists?(created_at: window.ago..)
  end

  private def milestone_already_fired?(plant, day_count)
    Noticed::Event.where(type: 'MilestoneNotifier', record: plant).any? { |event| event.params[:day_count] == day_count }
  end
end
