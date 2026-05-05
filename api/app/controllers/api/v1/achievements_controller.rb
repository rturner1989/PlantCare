# frozen_string_literal: true

module Api
  module V1
    class AchievementsController < BaseController
      RECENT_LIMIT = 20

      def index
        achievements = current_user.achievements.recent.limit(RECENT_LIMIT)
        render json: { achievements: achievements.as_json }
      end

      # PATCH /achievements/:id — body-less, always marks seen. Mirrors
      # NotificationsController#update mark-as-read shape.
      def update
        achievement = current_user.achievements.find(params[:id])
        achievement.mark_seen!
        render json: { achievement: achievement.as_json }
      end
    end
  end
end
