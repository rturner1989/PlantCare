# frozen_string_literal: true

module AuthHelper
  def auth_headers(user)
    token = JwtToken.encode({ user_id: user.id })
    { 'Authorization' => "Bearer #{token}" }
  end
end
