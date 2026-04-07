# frozen_string_literal: true

require 'test_helper'

class JwtTokenTest < ActiveSupport::TestCase
  setup do
    @user = users(:john)
  end

  test 'encode and decode returns user_id' do
    token = JwtToken.encode({ user_id: @user.id })
    payload = JwtToken.decode(token)
    assert_equal @user.id, payload[:user_id]
  end

  test 'expired token returns nil' do
    token = JwtToken.encode({ user_id: @user.id }, expires_in: -1.minute)
    payload = JwtToken.decode(token)
    assert_nil payload
  end

  test 'invalid token returns nil' do
    payload = JwtToken.decode('garbage.token.here')
    assert_nil payload
  end
end
