# frozen_string_literal: true

module Api
  module V1
    class AuthController < ApplicationController
      private def issue_tokens(user)
        access_token = JwtToken.encode({ user_id: user.id })
        raw_refresh, _refresh_token = RefreshToken.generate(user)
        set_refresh_token_cookie(raw_refresh)

        { access_token: access_token, user: user }
      end
    end
  end
end
