# frozen_string_literal: true

# Async dispatcher — model callbacks enqueue this job rather than
# running Achievement.check_triggers synchronously. Keeps user-facing
# requests fast (CareLog#create returns in milliseconds; achievement
# evaluation happens shortly after in the background).
#
# The job loads the user's already-earned achievements once, then loops
# the catalogue's matching kinds, skipping anything already earned and
# evaluating the rest against cached User aggregates (plants_count,
# care_logs_count, current_streak_days etc.) — no table scans.
class CheckAchievementsJob < ApplicationJob
  queue_as :default

  def perform(event:, user_id:, source_type: nil, source_id: nil)
    user = User.find_by(id: user_id)
    return unless user

    source = source_type && source_id ? source_type.constantize.find_by(id: source_id) : nil
    earned = earned_keys(user)

    AchievementCatalogue.with_event(event.to_sym).each do |kind, definition|
      kind_source = definition[:source_for]&.call(source)
      kind_source_type = kind_source ? kind_source.class.base_class.name : nil
      key = [kind, kind_source_type, kind_source&.id]
      next if earned.include?(key)
      next unless definition[:condition].call(user, source)

      Achievement.unlock!(
        user: user,
        kind: kind,
        source: kind_source,
        metadata: definition[:metadata_for]&.call(user, source) || {}
      )
    end
  end

  private def earned_keys(user)
    user.achievements.pluck(:kind, :source_type, :source_id).to_set
  end
end
