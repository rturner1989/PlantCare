# frozen_string_literal: true

# Per-user broadcast stream for achievement unlocks. Achievement model
# fires AchievementsChannel.broadcast_to(user, payload) on
# after_create_commit; client subscribers translate broadcasts into
# toast notifications.
class AchievementsChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end
end
