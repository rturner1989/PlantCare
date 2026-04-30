# frozen_string_literal: true

# Drives the two derived-event notifiers — CareDueNotifier and
# MilestoneNotifier. Self-action notifiers (plant added, photo added) live
# in the Journal region, not the notifications inbox.
#
# Runs daily via sidekiq-cron. Idempotent — re-running within the dedup
# window produces no duplicate notifications.
class NotificationsSweeperJob < ApplicationJob
  queue_as :default

  MILESTONE_DAYS = [30, 100, 365].freeze
  CARE_DEDUP_WINDOW = 24.hours

  def perform
    Plant.includes(:space, :species).find_each do |plant|
      sweep_care_due(plant, :water) if plant.water_status.in?([:overdue, :due_today])
      sweep_care_due(plant, :feed) if plant.feed_status.in?([:overdue, :due_today])
      sweep_milestone(plant)
    end
  end

  private def sweep_care_due(plant, kind)
    return if recent_care_due?(plant, kind)

    days_until = kind == :water ? plant.days_until_water : plant.days_until_feed
    days_overdue = days_until.negative? ? -days_until : 0

    CareDueNotifier.with(
      record: plant,
      plant_id: plant.id,
      plant_nickname: plant.nickname,
      care_kind: kind.to_s,
      days_overdue: days_overdue
    ).deliver(plant.space.user)
  end

  private def recent_care_due?(plant, kind)
    Noticed::Event
      .where(type: 'CareDueNotifier', record: plant)
      .where(created_at: CARE_DEDUP_WINDOW.ago..)
      .any? { |event| event.params[:care_kind] == kind.to_s }
  end

  private def sweep_milestone(plant)
    days_old = (Date.current - plant.created_at.to_date).to_i
    return unless MILESTONE_DAYS.include?(days_old)
    return if milestone_already_fired?(plant, days_old)

    MilestoneNotifier.with(
      record: plant,
      plant_id: plant.id,
      plant_nickname: plant.nickname,
      day_count: days_old
    ).deliver(plant.space.user)
  end

  private def milestone_already_fired?(plant, day_count)
    Noticed::Event
      .where(type: 'MilestoneNotifier', record: plant)
      .any? { |event| event.params[:day_count] == day_count }
  end
end
