# frozen_string_literal: true

require 'test_helper'

class RefreshTokenTest < ActiveSupport::TestCase
  setup do
    @user = users(:john)
  end

  test 'generate creates token and returns raw value' do
    raw_token, refresh_token = RefreshToken.generate(@user)

    assert raw_token.present?
    assert refresh_token.persisted?
    assert_equal @user, refresh_token.user
    assert refresh_token.expires_at > Time.current
  end

  test 'find_by_raw_token finds the correct record' do
    raw_token, _refresh_token = RefreshToken.generate(@user)

    found = RefreshToken.find_by_raw_token(raw_token)
    assert found.present?
    assert_equal @user, found.user
  end

  test 'find_by_raw_token returns nil for invalid token' do
    found = RefreshToken.find_by_raw_token('invalid_token')
    assert_nil found
  end

  test 'usable? returns false when revoked' do
    _raw_token, refresh_token = RefreshToken.generate(@user)
    refresh_token.update!(revoked_at: Time.current)

    assert_not refresh_token.usable?
  end

  test 'usable? returns false when expired' do
    _raw_token, refresh_token = RefreshToken.generate(@user)
    refresh_token.update!(expires_at: 1.day.ago)

    assert_not refresh_token.usable?
  end

  test 'revoke! sets revoked_at' do
    _raw_token, refresh_token = RefreshToken.generate(@user)
    refresh_token.revoke!

    assert refresh_token.revoked_at.present?
  end
end
