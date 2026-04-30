# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private def find_verified_user
      raw_token = cookies[:refresh_token]
      reject_unauthorized_connection if raw_token.blank?

      refresh_token = RefreshToken.find_by_raw_token(raw_token)
      reject_unauthorized_connection unless refresh_token&.usable?

      refresh_token.user
    end
  end
end
