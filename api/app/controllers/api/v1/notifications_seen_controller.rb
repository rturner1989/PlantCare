# frozen_string_literal: true

module Api
  module V1
    class NotificationsSeenController < BaseController
      def create
        current_user.notifications.unseen.mark_as_seen

        render json: { unread_count: current_user.unread_notifications_count }
      end
    end
  end
end
