# frozen_string_literal: true

module Api
  module V1
    class TokensController < ApplicationController
      def create
        raw_token = cookies[:refresh_token]
        refresh = RefreshToken.find_by_raw_token(raw_token)

        if refresh&.usable?
          access_token = JwtToken.encode({ user_id: refresh.user_id })
          render json: { access_token: access_token }
        else
          render json: { error: 'Invalid or expired refresh token' }, status: :unauthorized
        end
      end
    end
  end
end
