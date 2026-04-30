# frozen_string_literal: true

require 'test_helper'

class ApplicationCable::ConnectionTest < ActionCable::Connection::TestCase
  test 'connects with a valid refresh token cookie' do
    user = users(:john)
    raw_token, = RefreshToken.generate(user)
    cookies[:refresh_token] = raw_token

    connect
    assert_equal user, connection.current_user
  end

  test 'rejects when no refresh token cookie is present' do
    assert_reject_connection { connect }
  end

  test 'rejects when the refresh token has been revoked' do
    user = users(:john)
    raw_token, refresh = RefreshToken.generate(user)
    refresh.revoke!
    cookies[:refresh_token] = raw_token

    assert_reject_connection { connect }
  end

  test 'rejects when the refresh token has expired' do
    user = users(:john)
    raw_token, refresh = RefreshToken.generate(user, expires_in: -1.hour)
    refresh.update!(expires_at: 1.hour.ago)
    cookies[:refresh_token] = raw_token

    assert_reject_connection { connect }
  end

  test 'rejects with an unknown token' do
    cookies[:refresh_token] = 'not-a-real-token'

    assert_reject_connection { connect }
  end
end
